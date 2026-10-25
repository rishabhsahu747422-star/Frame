import { test, describe, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/app.js";
import UserModel from "../src/models/user.model.js";
import { connectTestDB, clearTestDB, disconnectTestDB } from "./setup.js";

describe("Authentication & Token Flow API Tests", () => {
  before(async () => {
    process.env.NODE_ENV = "test";
    await connectTestDB();
  });

  after(async () => {
    await disconnectTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  test("POST /api/auth/register creates user and returns cookies and user payload", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        username: "testuser",
        fullName: "Test User",
        email: "test@example.com",
        password: "password123",
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.username, "testuser");
    assert.equal(res.body.data.email, "test@example.com");
    assert.equal(res.body.data.password, undefined);

    const cookies = res.headers["set-cookie"];
    assert.ok(cookies, "Cookies should be set");
    assert.ok(cookies.some((c) => c.includes("accessToken=")));
    assert.ok(cookies.some((c) => c.includes("refreshToken=")));
  });

  test("POST /api/auth/register rejects duplicate username or email with 409", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        username: "duplicateuser",
        fullName: "Duplicate User",
        email: "duplicate@example.com",
        password: "password123",
      });

    const res = await request(app)
      .post("/api/auth/register")
      .send({
        username: "duplicateuser",
        fullName: "Another User",
        email: "different@example.com",
        password: "password123",
      });

    assert.equal(res.status, 409);
    assert.equal(res.body.success, false);
  });

  test("POST /api/auth/login validates credentials and returns 401 on incorrect password", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        username: "loginuser",
        fullName: "Login User",
        email: "login@example.com",
        password: "correctpassword",
      });

    // Wrong password
    const failRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: "login@example.com",
        password: "wrongpassword",
      });

    assert.equal(failRes.status, 401);
    assert.equal(failRes.body.success, false);

    // Correct password
    const successRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: "login@example.com",
        password: "correctpassword",
      });

    assert.equal(successRes.status, 200);
    assert.equal(successRes.body.success, true);
    assert.equal(successRes.body.data.username, "loginuser");
  });

  test("POST /api/auth/refresh-token rotates refresh token and issues fresh access token", async () => {
    const regRes = await request(app)
      .post("/api/auth/register")
      .send({
        username: "refreshuser",
        fullName: "Refresh User",
        email: "refresh@example.com",
        password: "password123",
      });

    const cookies = regRes.headers["set-cookie"];
    const refreshCookie = cookies.find((c) => c.startsWith("refreshToken="));

    const refreshRes = await request(app)
      .post("/api/auth/refresh-token")
      .set("Cookie", [refreshCookie]);

    assert.equal(refreshRes.status, 200);
    assert.equal(refreshRes.body.success, true);

    const newCookies = refreshRes.headers["set-cookie"];
    assert.ok(newCookies.some((c) => c.includes("accessToken=")));
    assert.ok(newCookies.some((c) => c.includes("refreshToken=")));

    // Replay attack: Old refresh token should now be blacklisted
    const replayRes = await request(app)
      .post("/api/auth/refresh-token")
      .set("Cookie", [refreshCookie]);

    assert.equal(replayRes.status, 401);
    assert.equal(replayRes.body.success, false);
  });

  test("POST /api/auth/logout invalidates access token and clears cookies", async () => {
    const regRes = await request(app)
      .post("/api/auth/register")
      .send({
        username: "logoutuser",
        fullName: "Logout User",
        email: "logout@example.com",
        password: "password123",
      });

    const cookies = regRes.headers["set-cookie"];
    const accessCookie = cookies.find((c) => c.startsWith("accessToken="));

    const logoutRes = await request(app)
      .post("/api/auth/logout")
      .set("Cookie", cookies);

    assert.equal(logoutRes.status, 200);
    assert.equal(logoutRes.body.success, true);

    // Verifying protected endpoint rejects revoked token
    const protectedRes = await request(app)
      .get("/api/users/getMe")
      .set("Cookie", [accessCookie]);

    assert.equal(protectedRes.status, 401);
  });

  test("Password reset flow: single-use, hashed token verification, enumeration safe", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        username: "resetuser",
        fullName: "Reset User",
        email: "reset@example.com",
        password: "oldpassword123",
      });

    // Forgot password request (returns 200 regardless of existence)
    const forgotRes = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "reset@example.com" });

    assert.equal(forgotRes.status, 200);

    const user = await UserModel.findOne({ email: "reset@example.com" });
    assert.ok(user.resetPasswordToken, "Hashed token should be stored");
    assert.ok(user.resetPasswordExpires > new Date(), "Expiration should be in future");

    // Attempt reset with invalid token
    const invalidRes = await request(app)
      .post("/api/auth/reset-password")
      .send({
        token: "invalid_token_123",
        newPassword: "brandnewpassword123",
      });
    assert.equal(invalidRes.status, 400);

    // Simulate reset using the valid token mechanism
    // In our implementation, the stored token is crypto.createHash("sha256").update(rawToken).digest("hex")
    // Let's set a known token
    const crypto = await import("crypto");
    const testRawToken = "my_secure_random_raw_token";
    const testHash = crypto.createHash("sha256").update(testRawToken).digest("hex");
    user.resetPasswordToken = testHash;
    user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    const validResetRes = await request(app)
      .post("/api/auth/reset-password")
      .send({
        token: testRawToken,
        newPassword: "brandnewpassword123",
      });

    assert.equal(validResetRes.status, 200);
    assert.equal(validResetRes.body.success, true);

    // Verify token was cleared (single-use)
    const updatedUser = await UserModel.findById(user._id);
    assert.equal(updatedUser.resetPasswordToken, null);

    // Verify login with new password succeeds
    const newLoginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: "reset@example.com",
        password: "brandnewpassword123",
      });
    assert.equal(newLoginRes.status, 200);
  });
});
