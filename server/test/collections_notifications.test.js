import { test, describe, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/app.js";
import UserModel from "../src/models/user.model.js";
import PostModel from "../src/models/post.model.js";
import CollectionModel from "../src/models/collection.model.js";
import NotificationModel from "../src/models/notification.model.js";
import { connectTestDB, clearTestDB, disconnectTestDB } from "./setup.js";

describe("Collections & Notifications API Tests", () => {
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
        username: "curator",
        fullName: "Curator One",
        email: "curator@example.com",
        password: "password123",
      });
    user1 = u1Res.body.data;
    user1Token = u1Res.headers["set-cookie"].find((c) => c.startsWith("accessToken="));

    const u2Res = await request(app)
      .post("/api/auth/register")
      .send({
        username: "visitor",
        fullName: "Visitor Two",
        email: "visitor@example.com",
        password: "password123",
      });
    user2 = u2Res.body.data;
    user2Token = u2Res.headers["set-cookie"].find((c) => c.startsWith("accessToken="));
  });

  test("Collections CRUD, post management, and private vs public visibility enforcement", async () => {
    const post = await PostModel.create({
      user: user1._id,
      media_urls: ["https://cdn.local/art.png"],
      caption: "Editorial architecture",
    });

    // 1. Create collection (private by default)
    const createRes = await request(app)
      .post("/api/collections")
      .set("Cookie", [user1Token])
      .send({
        title: "Minimalist Spaces",
        description: "Curated architectural shots",
      });

    assert.equal(createRes.status, 201);
    assert.equal(createRes.body.data.isPublic, false);
    assert.equal(createRes.body.data.title, "Minimalist Spaces");

    const collectionId = createRes.body.data._id;

    // 2. Add post to collection
    const addPostRes = await request(app)
      .post(`/api/collections/${collectionId}/posts`)
      .set("Cookie", [user1Token])
      .send({ postId: post._id });

    assert.equal(addPostRes.status, 200);
    assert.equal(addPostRes.body.data.postCount, 1);

    // Duplicate post rejected
    const dupRes = await request(app)
      .post(`/api/collections/${collectionId}/posts`)
      .set("Cookie", [user1Token])
      .send({ postId: post._id });

    assert.equal(dupRes.status, 400);

    // 3. Privacy test: Visitor accessing private collection is rejected with 403
    const visitorPrivateRes = await request(app)
      .get(`/api/collections/${collectionId}`)
      .set("Cookie", [user2Token]);

    assert.equal(visitorPrivateRes.status, 403);
    assert.equal(visitorPrivateRes.body.success, false);

    // 4. Owner can access private collection
    const ownerRes = await request(app)
      .get(`/api/collections/${collectionId}`)
      .set("Cookie", [user1Token]);

    assert.equal(ownerRes.status, 200);
    assert.equal(ownerRes.body.data.posts.length, 1);

    // 5. Update collection to public
    const updateRes = await request(app)
      .patch(`/api/collections/${collectionId}`)
      .set("Cookie", [user1Token])
      .send({ isPublic: true });

    assert.equal(updateRes.status, 200);
    assert.equal(updateRes.body.data.isPublic, true);

    // Now visitor can view public collection
    const visitorPublicRes = await request(app)
      .get(`/api/collections/${collectionId}`)
      .set("Cookie", [user2Token]);

    assert.equal(visitorPublicRes.status, 200);
    assert.equal(visitorPublicRes.body.data.title, "Minimalist Spaces");

    // 6. Remove post from collection
    const removeRes = await request(app)
      .delete(`/api/collections/${collectionId}/posts/${post._id}`)
      .set("Cookie", [user1Token]);

    assert.equal(removeRes.status, 200);
    assert.equal(removeRes.body.data.postCount, 0);

    // 7. Delete collection (does not delete original post)
    const delRes = await request(app)
      .delete(`/api/collections/${collectionId}`)
      .set("Cookie", [user1Token]);

    assert.equal(delRes.status, 200);

    // Verify post still exists in DB
    const postStillExists = await PostModel.findById(post._id);
    assert.ok(postStillExists, "Original post must not be deleted when collection is deleted");
  });

  test("Notifications creation, user isolation, unread count, and read state transitions", async () => {
    const post = await PostModel.create({
      user: user1._id,
      media_urls: ["https://cdn.local/post.png"],
      caption: "Curator's photo",
    });

    // 1. Self-action: Curator likes own post -> NO notification created
    await request(app)
      .patch(`/api/posts/${post._id}/like`)
      .set("Cookie", [user1Token]);

    const selfNotifCount = await NotificationModel.countDocuments({ recipient: user1._id });
    assert.equal(selfNotifCount, 0, "Users should not receive notifications for their own actions");

    // 2. Visitor likes Curator's post -> Notification created for Curator
    await request(app)
      .patch(`/api/posts/${post._id}/like`)
      .set("Cookie", [user2Token]);

    // 3. Visitor follows Curator -> Notification created for Curator
    await request(app)
      .patch(`/api/users/follow/${user1._id}`)
      .set("Cookie", [user2Token]);

    // 4. Visitor comments on Curator's post -> Notification created
    await request(app)
      .post("/api/comments/create")
      .set("Cookie", [user2Token])
      .send({ postId: post._id, text: "Inspiring composition" });

    // 5. Curator checks unread count (should be 3)
    const unreadRes = await request(app)
      .get("/api/notifications/unread-count")
      .set("Cookie", [user1Token]);

    assert.equal(unreadRes.status, 200);
    assert.equal(unreadRes.body.data.unreadCount, 3);

    // 6. Curator retrieves notifications list
    const listRes = await request(app)
      .get("/api/notifications")
      .set("Cookie", [user1Token]);

    assert.equal(listRes.status, 200);
    assert.equal(listRes.body.data.length, 3);
    assert.equal(listRes.body.unreadCount, 3);

    const firstNotifId = listRes.body.data[0]._id;

    // 7. Mark single notification as read
    const markSingleRes = await request(app)
      .patch(`/api/notifications/${firstNotifId}/read`)
      .set("Cookie", [user1Token]);

    assert.equal(markSingleRes.status, 200);
    assert.equal(markSingleRes.body.data.read, true);

    // Unread count should now be 2
    const unreadAfterSingle = await request(app)
      .get("/api/notifications/unread-count")
      .set("Cookie", [user1Token]);
    assert.equal(unreadAfterSingle.body.data.unreadCount, 2);

    // 8. Mark all notifications as read
    const markAllRes = await request(app)
      .patch("/api/notifications/read-all")
      .set("Cookie", [user1Token]);

    assert.equal(markAllRes.status, 200);

    const unreadAfterAll = await request(app)
      .get("/api/notifications/unread-count")
      .set("Cookie", [user1Token]);
    assert.equal(unreadAfterAll.body.data.unreadCount, 0);

    // 9. Visitor checking notifications sees 0 (user isolation)
    const visitorNotifs = await request(app)
      .get("/api/notifications")
      .set("Cookie", [user2Token]);

    assert.equal(visitorNotifs.status, 200);
    assert.equal(visitorNotifs.body.data.length, 0);
  });
});
