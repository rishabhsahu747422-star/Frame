import { test, describe, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/app.js";
import UserModel from "../src/models/user.model.js";
import PostModel from "../src/models/post.model.js";
import CommentModel from "../src/models/comment.model.js";
import { connectTestDB, clearTestDB, disconnectTestDB } from "./setup.js";

describe("Posts & Comments API Tests", () => {
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
        username: "alice",
        fullName: "Alice Wonderland",
        email: "alice@example.com",
        password: "password123",
      });
    user1 = u1Res.body.data;
    user1Token = u1Res.headers["set-cookie"].find((c) => c.startsWith("accessToken="));

    const u2Res = await request(app)
      .post("/api/auth/register")
      .send({
        username: "bob",
        fullName: "Bob Builder",
        email: "bob@example.com",
        password: "password123",
      });
    user2 = u2Res.body.data;
    user2Token = u2Res.headers["set-cookie"].find((c) => c.startsWith("accessToken="));
  });

  test("Create post with image attachment and verify user relationship", async () => {
    // 1x1 transparent png buffer
    const pngBuffer = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64"
    );

    const res = await request(app)
      .post("/api/posts/create")
      .set("Cookie", [user1Token])
      .field("caption", "My first photo on FRAME")
      .field("location", "Paris, France")
      .attach("images", pngBuffer, "photo.png");

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.caption, "My first photo on FRAME");
    assert.equal(res.body.data.media_urls.length, 1);
    assert.equal(res.body.data.likeCount, 0);
    assert.equal(res.body.data.commentCount, 0);

    // Verify user posts array updated
    const updatedUser = await UserModel.findById(user1._id);
    assert.ok(updatedUser.posts.some((p) => p.toString() === res.body.data._id.toString()));
  });

  test("General feed returns paginated posts with deterministic newest-first sorting", async () => {
    const post1 = await PostModel.create({
      user: user1._id,
      media_urls: ["https://cdn.local/img1.png"],
      caption: "Post One",
    });

    const post2 = await PostModel.create({
      user: user2._id,
      media_urls: ["https://cdn.local/img2.png"],
      caption: "Post Two",
    });

    const res = await request(app).get("/api/posts?page=1&limit=10");

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.length, 2);
    // Newest first
    assert.equal(res.body.data[0]._id.toString(), post2._id.toString());
    assert.equal(res.body.data[1]._id.toString(), post1._id.toString());
    assert.ok(res.body.meta);
    assert.equal(res.body.meta.total, 2);
  });

  test("Following feed returns only posts from followed accounts plus self", async () => {
    // Alice posts
    await PostModel.create({
      user: user1._id,
      media_urls: ["https://cdn.local/alice.png"],
      caption: "Alice Post",
    });

    // Bob posts
    await PostModel.create({
      user: user2._id,
      media_urls: ["https://cdn.local/bob.png"],
      caption: "Bob Post",
    });

    // Before follow: Alice following feed only shows Alice
    const preRes = await request(app)
      .get("/api/posts/feed/following")
      .set("Cookie", [user1Token]);

    assert.equal(preRes.status, 200);
    assert.equal(preRes.body.data.length, 1);
    assert.equal(preRes.body.data[0].caption, "Alice Post");

    // Alice follows Bob
    await request(app)
      .patch(`/api/users/follow/${user2._id}`)
      .set("Cookie", [user1Token]);

    // Now Alice following feed shows both Bob and Alice
    const postRes = await request(app)
      .get("/api/posts/feed/following")
      .set("Cookie", [user1Token]);

    assert.equal(postRes.status, 200);
    assert.equal(postRes.body.data.length, 2);
  });

  test("Like and unlike a post toggles reaction state and updates count idempotently", async () => {
    const post = await PostModel.create({
      user: user1._id,
      media_urls: ["https://cdn.local/img.png"],
      caption: "Likeable post",
    });

    // Bob likes Alice's post
    const likeRes = await request(app)
      .patch(`/api/posts/${post._id}/like`)
      .set("Cookie", [user2Token]);

    assert.equal(likeRes.status, 200);
    assert.equal(likeRes.body.data.isLiked, true);
    assert.equal(likeRes.body.data.likeCount, 1);

    // Bob unlikes post
    const unlikeRes = await request(app)
      .patch(`/api/posts/${post._id}/like`)
      .set("Cookie", [user2Token]);

    assert.equal(unlikeRes.status, 200);
    assert.equal(unlikeRes.body.data.isLiked, false);
    assert.equal(unlikeRes.body.data.likeCount, 0);
  });

  test("Save and unsave post in user library", async () => {
    const post = await PostModel.create({
      user: user1._id,
      media_urls: ["https://cdn.local/save.png"],
      caption: "Save me",
    });

    // Save
    const saveRes = await request(app)
      .patch(`/api/posts/${post._id}/save`)
      .set("Cookie", [user2Token]);

    assert.equal(saveRes.status, 200);
    assert.equal(saveRes.body.data.isSaved, true);

    // Retrieve saved
    const savedListRes = await request(app)
      .get("/api/posts/saved/me")
      .set("Cookie", [user2Token]);

    assert.equal(savedListRes.status, 200);
    assert.equal(savedListRes.body.data.length, 1);
    assert.equal(savedListRes.body.data[0]._id.toString(), post._id.toString());
    assert.equal(savedListRes.body.data[0].isSaved, true);

    // Unsave
    const unsaveRes = await request(app)
      .patch(`/api/posts/${post._id}/save`)
      .set("Cookie", [user2Token]);

    assert.equal(unsaveRes.status, 200);
    assert.equal(unsaveRes.body.data.isSaved, false);
  });

  test("Post update and delete enforce ownership and cascade properly", async () => {
    const post = await PostModel.create({
      user: user1._id,
      media_urls: ["https://cdn.local/del.png"],
      caption: "Original caption",
    });

    // Unauthorized update by Bob
    const unauthUpdate = await request(app)
      .put(`/api/posts/${post._id}`)
      .set("Cookie", [user2Token])
      .send({ caption: "Hacked caption" });

    assert.equal(unauthUpdate.status, 403);

    // Authorized update by Alice
    const authUpdate = await request(app)
      .put(`/api/posts/${post._id}`)
      .set("Cookie", [user1Token])
      .send({ caption: "Updated caption" });

    assert.equal(authUpdate.status, 200);
    assert.equal(authUpdate.body.data.caption, "Updated caption");

    // Add comment to post
    await CommentModel.create({
      user: user2._id,
      post: post._id,
      text: "Nice post!",
    });

    // Unauthorized delete by Bob
    const unauthDel = await request(app)
      .delete(`/api/posts/${post._id}`)
      .set("Cookie", [user2Token]);

    assert.equal(unauthDel.status, 403);

    // Authorized delete by Alice
    const authDel = await request(app)
      .delete(`/api/posts/${post._id}`)
      .set("Cookie", [user1Token]);

    assert.equal(authDel.status, 200);

    // Check cascade: comments on this post should be deleted
    const remainingComments = await CommentModel.find({ post: post._id });
    assert.equal(remainingComments.length, 0);
  });

  test("Comments CRUD, moderation permission, and like/unlike", async () => {
    const post = await PostModel.create({
      user: user1._id,
      media_urls: ["https://cdn.local/comment.png"],
      caption: "Post with comments",
    });

    // Bob creates comment on Alice's post
    const createCommentRes = await request(app)
      .post("/api/comments/create")
      .set("Cookie", [user2Token])
      .send({
        postId: post._id,
        text: "Great photo!",
      });

    assert.equal(createCommentRes.status, 201);
    assert.equal(createCommentRes.body.data.text, "Great photo!");
    const commentId = createCommentRes.body.data._id;

    // Retrieve comments
    const listCommentsRes = await request(app)
      .get(`/api/comments/${post._id}`)
      .set("Cookie", [user1Token]);

    assert.equal(listCommentsRes.status, 200);
    assert.equal(listCommentsRes.body.data.length, 1);
    assert.equal(listCommentsRes.body.data[0].likeCount, 0);

    // Alice likes Bob's comment
    const likeCommentRes = await request(app)
      .patch(`/api/comments/${commentId}/like`)
      .set("Cookie", [user1Token]);

    assert.equal(likeCommentRes.status, 200);
    assert.equal(likeCommentRes.body.data.isLiked, true);
    assert.equal(likeCommentRes.body.data.likeCount, 1);

    // Alice unlikes Bob's comment
    const unlikeCommentRes = await request(app)
      .patch(`/api/comments/${commentId}/like`)
      .set("Cookie", [user1Token]);

    assert.equal(unlikeCommentRes.status, 200);
    assert.equal(unlikeCommentRes.body.data.isLiked, false);
    assert.equal(unlikeCommentRes.body.data.likeCount, 0);

    // Moderation: Alice (as post owner) can delete Bob's comment
    const deleteByPostOwnerRes = await request(app)
      .delete(`/api/comments/${commentId}`)
      .set("Cookie", [user1Token]);

    assert.equal(deleteByPostOwnerRes.status, 200);

    const deleted = await CommentModel.findById(commentId);
    assert.equal(deleted, null);
  });
});
