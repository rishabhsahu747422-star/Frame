import { test, describe, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app, { normalizeOrigin, getAllowedOrigins } from "../src/app.js";
import { connectTestDB, clearTestDB, disconnectTestDB } from "./setup.js";

describe("CORS Origin Validation & Preflight Regression Tests", () => {
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

  test("normalizeOrigin strips whitespace and trailing slashes", () => {
    assert.equal(normalizeOrigin("https://frame-alpha-six.vercel.app/"), "https://frame-alpha-six.vercel.app");
    assert.equal(normalizeOrigin("https://frame-alpha-six.vercel.app///"), "https://frame-alpha-six.vercel.app");
    assert.equal(normalizeOrigin("  http://localhost:5173/  "), "http://localhost:5173");
    assert.equal(normalizeOrigin(""), "");
    assert.equal(normalizeOrigin(null), "");
    assert.equal(normalizeOrigin(undefined), "");
  });

  test("getAllowedOrigins includes deployed Vercel origin, localhost defaults, and comma-separated CLIENT_URL", () => {
    const originalEnv = process.env.CLIENT_URL;
    process.env.CLIENT_URL = "https://custom1.com/, https://custom2.com ";
    try {
      const origins = getAllowedOrigins();
      assert.ok(origins.includes("https://frame-alpha-six.vercel.app"));
      assert.ok(origins.includes("http://localhost:5173"));
      assert.ok(origins.includes("http://localhost:3000"));
      assert.ok(origins.includes("https://custom1.com"));
      assert.ok(origins.includes("https://custom2.com"));
    } finally {
      process.env.CLIENT_URL = originalEnv;
    }
  });

  test("getAllowedOrigins restricts default localhost origins when NODE_ENV is production", () => {
    const originalEnv = process.env.CLIENT_URL;
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    delete process.env.CLIENT_URL;
    try {
      const origins = getAllowedOrigins();
      assert.ok(origins.includes("https://frame-alpha-six.vercel.app"));
      assert.equal(origins.includes("http://localhost:5173"), false);
      assert.equal(origins.includes("http://localhost:3000"), false);
    } finally {
      process.env.CLIENT_URL = originalEnv;
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  test("https://frame-alpha-six.vercel.app is allowed with credentials and proper CORS headers", async () => {
    const res = await request(app)
      .get("/api/health")
      .set("Origin", "https://frame-alpha-six.vercel.app");

    assert.equal(res.status, 200);
    assert.equal(res.headers["access-control-allow-origin"], "https://frame-alpha-six.vercel.app");
    assert.equal(res.headers["access-control-allow-credentials"], "true");
    assert.equal(res.headers["vary"], "Origin");
  });

  test("https://frame-alpha-six.vercel.app/ (with trailing slash) is normalized and allowed", async () => {
    const res = await request(app)
      .get("/api/health")
      .set("Origin", "https://frame-alpha-six.vercel.app/");

    assert.equal(res.status, 200);
    assert.equal(res.headers["access-control-allow-origin"], "https://frame-alpha-six.vercel.app/");
    assert.equal(res.headers["access-control-allow-credentials"], "true");
  });

  test("http://localhost:5173 is allowed in development with credentials", async () => {
    const res = await request(app)
      .get("/api/health")
      .set("Origin", "http://localhost:5173");

    assert.equal(res.status, 200);
    assert.equal(res.headers["access-control-allow-origin"], "http://localhost:5173");
    assert.equal(res.headers["access-control-allow-credentials"], "true");
  });

  test("An unrelated external origin is rejected safely without HTTP 500 error", async () => {
    const res = await request(app)
      .get("/api/health")
      .set("Origin", "https://unauthorized-malicious-site.com");

    // Route executes but CORS headers are NOT granted to unauthorized origin
    assert.equal(res.status, 200);
    assert.equal(res.headers["access-control-allow-origin"], undefined);
  });

  test("OPTIONS /api/auth/login from production frontend returns successful 204 preflight with CORS headers", async () => {
    const res = await request(app)
      .options("/api/auth/login")
      .set("Origin", "https://frame-alpha-six.vercel.app")
      .set("Access-Control-Request-Method", "POST")
      .set("Access-Control-Request-Headers", "Content-Type,Authorization");

    assert.equal(res.status, 204);
    assert.equal(res.headers["access-control-allow-origin"], "https://frame-alpha-six.vercel.app");
    assert.equal(res.headers["access-control-allow-credentials"], "true");
    assert.ok(res.headers["access-control-allow-methods"].includes("POST"));
    assert.ok(res.headers["access-control-allow-headers"].includes("Content-Type"));
  });

  test("OPTIONS /api/auth/login from disallowed origin is safely rejected and does not produce HTTP 500", async () => {
    const res = await request(app)
      .options("/api/auth/login")
      .set("Origin", "https://disallowed-attacker.com")
      .set("Access-Control-Request-Method", "POST");

    // Must not be an unhandled 500 internal server error
    assert.notEqual(res.status, 500);
    assert.equal(res.headers["access-control-allow-origin"], undefined);
  });

  test("Credentialed GET /api/users/me returns appropriate CORS headers for authorized origin", async () => {
    // 1. Register a test user to obtain authentication cookie
    const regRes = await request(app)
      .post("/api/auth/register")
      .send({
        username: "corsuser",
        fullName: "CORS User",
        email: "corsuser@example.com",
        password: "Password123!",
      });

    assert.equal(regRes.status, 201);
    const cookies = regRes.headers["set-cookie"];
    assert.ok(cookies, "Must receive auth cookies");

    // 2. Fetch authenticated profile /api/users/me with production Origin
    const meRes = await request(app)
      .get("/api/users/me")
      .set("Origin", "https://frame-alpha-six.vercel.app")
      .set("Cookie", cookies);

    assert.equal(meRes.status, 200);
    assert.equal(meRes.body.success, true);
    assert.equal(meRes.body.user.username, "corsuser");
    assert.equal(meRes.headers["access-control-allow-origin"], "https://frame-alpha-six.vercel.app");
    assert.equal(meRes.headers["access-control-allow-credentials"], "true");
    assert.equal(meRes.headers["vary"], "Origin");
  });

  test("Health check endpoint responds on both /health and /api/health", async () => {
    const resApi = await request(app).get("/api/health");
    assert.equal(resApi.status, 200);
    assert.equal(resApi.body.status, "healthy");

    const resRoot = await request(app).get("/health");
    assert.equal(resRoot.status, 200);
    assert.equal(resRoot.body.status, "healthy");
  });
});
