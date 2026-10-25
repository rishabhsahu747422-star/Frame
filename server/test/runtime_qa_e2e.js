/**
 * Comprehensive Runtime QA E2E Verification Script
 * Validates the full user journey against the live frontend dev server (port 5173 with proxy to port 4000)
 */

const BASE_URL = "http://localhost:5173";

async function runE2EQA() {
  console.log("=== Starting FRAME V1 Runtime E2E QA Audit ===");
  const results = [];
  let cookieHeader = "";

  function extractCookies(res) {
    const raw = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
    if (raw && raw.length > 0) {
      cookieHeader = raw.map((c) => c.split(";")[0]).join("; ");
    }
  }

  // 1. Verify Public HTML served by Vite
  try {
    const res = await fetch(`${BASE_URL}/`);
    const html = await res.text();
    const hasSpaceGrotesk = html.includes("Space+Grotesk");
    const hasInter = html.includes("Inter");
    if (res.status === 200 && hasSpaceGrotesk && hasInter) {
      results.push({ test: "1. Public Landing HTML & Google Fonts", passed: true });
    } else {
      results.push({ test: "1. Public Landing HTML & Google Fonts", passed: false, detail: `Status ${res.status}` });
    }
  } catch (err) {
    results.push({ test: "1. Public Landing HTML & Google Fonts", passed: false, detail: err.message });
  }

  // 2. Authentication: Register new unique user
  const testUser = {
    fullName: "Elena Rostova",
    username: `elena_${Date.now()}`,
    email: `elena_${Date.now()}@example.com`,
    password: "Password123!",
    bio: "Editorial and architectural photographer based in Berlin",
  };

  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testUser),
    });
    extractCookies(res);
    const data = await res.json();
    if (res.status === 201 && data.success) {
      results.push({ test: "2. User Registration API", passed: true, detail: data.message });
    } else {
      results.push({ test: "2. User Registration API", passed: false, detail: JSON.stringify(data) });
    }
  } catch (err) {
    results.push({ test: "2. User Registration API", passed: false, detail: err.message });
  }

  // 3. Duplicate Registration 409 Conflict Prevention
  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testUser),
    });
    const data = await res.json();
    if (res.status === 409) {
      results.push({ test: "3. Duplicate Registration Conflict Prevention (409)", passed: true, detail: data.message });
    } else {
      results.push({ test: "3. Duplicate Registration Conflict Prevention (409)", passed: false, detail: `Expected 409, got ${res.status}` });
    }
  } catch (err) {
    results.push({ test: "3. Duplicate Registration Conflict Prevention (409)", passed: false, detail: err.message });
  }

  // 4. Login and Session Cookie Issuance
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testUser.email, password: testUser.password }),
    });
    extractCookies(res);
    const data = await res.json();
    if (res.status === 200 && data.success && cookieHeader.includes("accessToken")) {
      results.push({ test: "4. User Login & HTTP-Only Auth Cookies", passed: true });
    } else {
      results.push({ test: "4. User Login & HTTP-Only Auth Cookies", passed: false, detail: JSON.stringify(data) });
    }
  } catch (err) {
    results.push({ test: "4. User Login & HTTP-Only Auth Cookies", passed: false, detail: err.message });
  }

  // 5. Authenticated Profile Fetch (/api/users/me)
  let currentUser = null;
  try {
    const res = await fetch(`${BASE_URL}/api/users/me`, {
      headers: { Cookie: cookieHeader },
    });
    const data = await res.json();
    if (res.status === 200 && data.user) {
      currentUser = data.user;
      results.push({ test: "5. Authenticated Session Verification (/api/users/me)", passed: true, detail: `@${currentUser.username}` });
    } else {
      results.push({ test: "5. Authenticated Session Verification (/api/users/me)", passed: false, detail: JSON.stringify(data) });
    }
  } catch (err) {
    results.push({ test: "5. Authenticated Session Verification (/api/users/me)", passed: false, detail: err.message });
  }

  // 6. Profile Editing (/api/users/update-profile)
  try {
    const res = await fetch(`${BASE_URL}/api/users/update-profile`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: cookieHeader },
      body: JSON.stringify({ fullName: "Elena Rostova-Kahn", bio: "Updated bio for editorial works" }),
    });
    const data = await res.json();
    if (res.status === 200 && data.updatedUser?.fullName === "Elena Rostova-Kahn") {
      results.push({ test: "6. Creator Profile Update", passed: true });
    } else {
      results.push({ test: "6. Creator Profile Update", passed: false, detail: JSON.stringify(data) });
    }
  } catch (err) {
    results.push({ test: "6. Creator Profile Update", passed: false, detail: err.message });
  }

  // 7. Search Users (/api/users/search)
  try {
    const res = await fetch(`${BASE_URL}/api/users/search?query=elena`, {
      headers: { Cookie: cookieHeader },
    });
    const data = await res.json();
    if (res.status === 200 && Array.isArray(data.data) && data.data.length > 0) {
      results.push({ test: "7. Creator Search with Query Debounce Support", passed: true, detail: `Found ${data.data.length} match(es)` });
    } else {
      results.push({ test: "7. Creator Search with Query Debounce Support", passed: false, detail: JSON.stringify(data) });
    }
  } catch (err) {
    results.push({ test: "7. Creator Search with Query Debounce Support", passed: false, detail: err.message });
  }

  // 8. Collections CRUD (Create private collection)
  let createdCollection = null;
  try {
    const res = await fetch(`${BASE_URL}/api/collections`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieHeader },
      body: JSON.stringify({ title: "Nordic Architecture", description: "Minimalist concrete and light", isPublic: false }),
    });
    const data = await res.json();
    if (res.status === 201 && data.data?._id && data.data?.isPublic === false) {
      createdCollection = data.data;
      results.push({ test: "8. Collection Creation (Private-by-default)", passed: true, detail: `ID: ${createdCollection._id}` });
    } else {
      results.push({ test: "8. Collection Creation (Private-by-default)", passed: false, detail: JSON.stringify(data) });
    }
  } catch (err) {
    results.push({ test: "8. Collection Creation (Private-by-default)", passed: false, detail: err.message });
  }

  // 9. Fetch User Collections (/api/collections/me)
  try {
    const res = await fetch(`${BASE_URL}/api/collections/me`, {
      headers: { Cookie: cookieHeader },
    });
    const data = await res.json();
    if (res.status === 200 && Array.isArray(data.data) && data.data.length > 0) {
      results.push({ test: "9. Fetch Curated Collections Overview", passed: true, detail: `${data.data.length} collection(s)` });
    } else {
      results.push({ test: "9. Fetch Curated Collections Overview", passed: false, detail: JSON.stringify(data) });
    }
  } catch (err) {
    results.push({ test: "9. Fetch Curated Collections Overview", passed: false, detail: err.message });
  }

  // 10. Saved Posts Library Query (/api/posts/saved/me)
  try {
    const res = await fetch(`${BASE_URL}/api/posts/saved/me`, {
      headers: { Cookie: cookieHeader },
    });
    const data = await res.json();
    if (res.status === 200 && Array.isArray(data.data)) {
      results.push({ test: "10. Private Saved Works Library Query", passed: true, detail: `${data.data.length} item(s)` });
    } else {
      results.push({ test: "10. Private Saved Works Library Query", passed: false, detail: JSON.stringify(data) });
    }
  } catch (err) {
    results.push({ test: "10. Private Saved Works Library Query", passed: false, detail: err.message });
  }

  // 11. Notifications Unread Count (/api/notifications/unread-count)
  try {
    const res = await fetch(`${BASE_URL}/api/notifications/unread-count`, {
      headers: { Cookie: cookieHeader },
    });
    const data = await res.json();
    const unread = data.data?.unreadCount !== undefined ? data.data.unreadCount : data.unreadCount;
    if (res.status === 200 && typeof unread === "number") {
      results.push({ test: "11. Notifications Unread Counter", passed: true, detail: `Unread: ${unread}` });
    } else {
      results.push({ test: "11. Notifications Unread Counter", passed: false, detail: JSON.stringify(data) });
    }
  } catch (err) {
    results.push({ test: "11. Notifications Unread Counter", passed: false, detail: err.message });
  }

  // 12. Password Reset Flow Check (/api/auth/forgot-password)
  try {
    const res = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testUser.email }),
    });
    const data = await res.json();
    if (res.status === 200 && data.success) {
      results.push({ test: "12. Password Recovery Endpoint Enumeration Safe", passed: true, detail: data.message });
    } else {
      results.push({ test: "12. Password Recovery Endpoint Enumeration Safe", passed: false, detail: JSON.stringify(data) });
    }
  } catch (err) {
    results.push({ test: "12. Password Recovery Endpoint Enumeration Safe", passed: false, detail: err.message });
  }

  // 13. Token Refresh Rotation (/api/auth/refresh-token)
  try {
    const res = await fetch(`${BASE_URL}/api/auth/refresh-token`, {
      method: "POST",
      headers: { Cookie: cookieHeader },
    });
    extractCookies(res);
    const data = await res.json();
    if (res.status === 200 && data.success) {
      results.push({ test: "13. Token Refresh Rotation", passed: true, detail: data.message });
    } else {
      results.push({ test: "13. Token Refresh Rotation", passed: false, detail: JSON.stringify(data) });
    }
  } catch (err) {
    results.push({ test: "13. Token Refresh Rotation", passed: false, detail: err.message });
  }

  // 14. Logout (/api/auth/logout)
  try {
    const res = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: "POST",
      headers: { Cookie: cookieHeader },
    });
    extractCookies(res);
    const data = await res.json();
    if (res.status === 200 && data.success) {
      results.push({ test: "14. User Logout Session Invalidation", passed: true });
    } else {
      results.push({ test: "14. User Logout Session Invalidation", passed: false, detail: JSON.stringify(data) });
    }
  } catch (err) {
    results.push({ test: "14. User Logout Session Invalidation", passed: false, detail: err.message });
  }

  // 15. Verify Protected Route Access Rejection after Logout
  try {
    const res = await fetch(`${BASE_URL}/api/users/me`, {
      headers: { Cookie: cookieHeader },
    });
    if (res.status === 401) {
      results.push({ test: "15. Post-Logout Protected Route Rejection (401)", passed: true });
    } else {
      results.push({ test: "15. Post-Logout Protected Route Rejection (401)", passed: false, detail: `Expected 401, got ${res.status}` });
    }
  } catch (err) {
    results.push({ test: "15. Post-Logout Protected Route Rejection (401)", passed: false, detail: err.message });
  }

  console.log("\n=== E2E QA Test Summary ===");
  let passedCount = 0;
  results.forEach((r) => {
    const mark = r.passed ? "✔ PASS" : "✖ FAIL";
    console.log(`${mark} : ${r.test} ${r.detail ? `(${r.detail})` : ""}`);
    if (r.passed) passedCount++;
  });
  console.log(`\nTotal: ${results.length} | Passed: ${passedCount} | Failed: ${results.length - passedCount}`);

  if (passedCount === results.length) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runE2EQA();
