import { test, describe, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/app.js";
import UserModel from "../src/models/user.model.js";
import StoryModel from "../src/models/story.model.js";
import ReelModel from "../src/models/reels.model.js";
import { connectTestDB, clearTestDB, disconnectTestDB } from "./setup.js";

describe("Stories & Reels API Tests", () => {
  let user1Token, user1, user2Token, user2;

  before(async () => {
    process.env.NODE_ENV = "test";
    await connectTestDB();
  });

  after(async () => {
    await disconnectTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();

    const u1Res = await request(app)
      .post("/api/auth/register")
      .send({
        username: "storycreator",
        fullName: "Story Creator",
        email: "story@example.com",
        password: "password123",
      });
    user1 = u1Res.body.data;
    user1Token = u1Res.headers["set-cookie"].find((c) => c.startsWith("accessToken="));

    const u2Res = await request(app)
      .post("/api/auth/register")
      .send({
        username: "storyviewer",
        fullName: "Story Viewer",
        email: "viewer@example.com",
        password: "password123",
      });
    user2 = u2Res.body.data;
    user2Token = u2Res.headers["set-cookie"].find((c) => c.startsWith("accessToken="));

    // Viewer follows Creator so Creator's stories appear in active stories feed
    await request(app)
      .patch(`/api/users/follow/${user1._id}`)
      .set("Cookie", [user2Token]);
  });

  test("Story creation (image and video) and strict 24-hour server-side expiry filter", async () => {
    const pngBuffer = Buffer.from("fake-png-content");
    const mp4Buffer = Buffer.from("fake-mp4-video-content");

    // 1. Create image story
    const imgRes = await request(app)
      .post("/api/stories/create")
      .set("Cookie", [user1Token])
      .field("caption", "My Image Story")
      .attach("file", pngBuffer, { filename: "story.png", contentType: "image/png" });

    assert.equal(imgRes.status, 201);
    assert.equal(imgRes.body.story.media_type, "image");

    // 2. Create video story
    const vidRes = await request(app)
      .post("/api/stories/create")
      .set("Cookie", [user1Token])
      .field("caption", "My Video Story")
      .attach("file", mp4Buffer, { filename: "story.mp4", contentType: "video/mp4" });

    assert.equal(vidRes.status, 201);
    assert.equal(vidRes.body.story.media_type, "video");

    // 3. Create an expired story manually
    await StoryModel.create({
      user: user1._id,
      media_type: "image",
      media_url: "https://cdn.local/expired.png",
      caption: "Expired Story",
      expiresAt: new Date(Date.now() - 3600 * 1000), // 1 hour ago
    });

    // 4. Retrieve stories as Viewer
    const feedRes = await request(app)
      .get("/api/stories/get-stories")
      .set("Cookie", [user2Token]);

    assert.equal(feedRes.status, 200);
    assert.equal(feedRes.body.data.length, 1); // 1 creator group

    const creatorGroup = feedRes.body.data[0];
    assert.equal(creatorGroup.user.username, "storycreator");
    assert.equal(creatorGroup.hasUnviewedStories, true);
    // Strict 24h filter: only 2 active stories returned, the expired one was excluded!
    assert.equal(creatorGroup.stories.length, 2);
  });

  test("Story viewing, duplicate prevention, and expired view rejection", async () => {
    const activeStory = await StoryModel.create({
      user: user1._id,
      media_type: "image",
      media_url: "https://cdn.local/active.png",
      caption: "Active",
      expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
    });

    const expiredStory = await StoryModel.create({
      user: user1._id,
      media_type: "image",
      media_url: "https://cdn.local/expired2.png",
      caption: "Expired",
      expiresAt: new Date(Date.now() - 1000),
    });

    // View active story
    const viewRes = await request(app)
      .post(`/api/stories/${activeStory._id}/view`)
      .set("Cookie", [user2Token]);

    assert.equal(viewRes.status, 200);
    assert.equal(viewRes.body.isViewed, true);
    assert.equal(viewRes.body.viewersCount, 1);

    // Repeated view does not duplicate
    const viewAgainRes = await request(app)
      .post(`/api/stories/${activeStory._id}/view`)
      .set("Cookie", [user2Token]);

    assert.equal(viewAgainRes.status, 200);
    assert.equal(viewAgainRes.body.viewersCount, 1);

    // Viewing expired story returns 410 Gone
    const viewExpiredRes = await request(app)
      .post(`/api/stories/${expiredStory._id}/view`)
      .set("Cookie", [user2Token]);

    assert.equal(viewExpiredRes.status, 410);
  });

  test("Reels CRUD, video validation, views tracking, likes, and cascade", async () => {
    const mp4Buffer = Buffer.from("fake-reel-mp4-data");

    // 1. Create Reel
    const createRes = await request(app)
      .post("/api/reels")
      .set("Cookie", [user1Token])
      .field("caption", "Amazing Reel #viral")
      .attach("video", mp4Buffer, { filename: "reel.mp4", contentType: "video/mp4" });

    assert.equal(createRes.status, 201);
    assert.equal(createRes.body.data.caption, "Amazing Reel #viral");
    assert.equal(createRes.body.data.likeCount, 0);
    assert.equal(createRes.body.data.viewCount, 0);

    const reelId = createRes.body.data._id;

    // 2. Paginated Reels feed
    const feedRes = await request(app).get("/api/reels?page=1&limit=5");
    assert.equal(feedRes.status, 200);
    assert.equal(feedRes.body.data.length, 1);
    assert.equal(feedRes.body.data[0]._id.toString(), reelId.toString());

    // 3. Single Reel retrieval
    const singleRes = await request(app).get(`/api/reels/${reelId}`);
    assert.equal(singleRes.status, 200);
    assert.equal(singleRes.body.data.caption, "Amazing Reel #viral");

    // 4. Record Reel View
    const viewRes = await request(app)
      .post(`/api/reels/${reelId}/view`)
      .set("Cookie", [user2Token]);

    assert.equal(viewRes.status, 200);
    assert.equal(viewRes.body.data.viewCount, 1);

    // 5. Like/unlike Reel
    const likeRes = await request(app)
      .patch(`/api/reels/${reelId}/like`)
      .set("Cookie", [user2Token]);

    assert.equal(likeRes.status, 200);
    assert.equal(likeRes.body.data.isLiked, true);
    assert.equal(likeRes.body.data.likeCount, 1);

    const unlikeRes = await request(app)
      .patch(`/api/reels/${reelId}/like`)
      .set("Cookie", [user2Token]);

    assert.equal(unlikeRes.status, 200);
    assert.equal(unlikeRes.body.data.isLiked, false);
    assert.equal(unlikeRes.body.data.likeCount, 0);

    // 6. Update Reel (owner only)
    const updateRes = await request(app)
      .patch(`/api/reels/${reelId}`)
      .set("Cookie", [user1Token])
      .send({ caption: "Updated Reel Caption" });

    assert.equal(updateRes.status, 200);
    assert.equal(updateRes.body.data.caption, "Updated Reel Caption");

    // 7. Delete Reel (owner only)
    const unauthDel = await request(app)
      .delete(`/api/reels/${reelId}`)
      .set("Cookie", [user2Token]);
    assert.equal(unauthDel.status, 403);

    const authDel = await request(app)
      .delete(`/api/reels/${reelId}`)
      .set("Cookie", [user1Token]);
    assert.equal(authDel.status, 200);

    const checkReel = await ReelModel.findById(reelId);
    assert.equal(checkReel, null);
  });
});
