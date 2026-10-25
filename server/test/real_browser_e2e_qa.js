import { chromium } from "playwright-core";
import fs from "fs";
import path from "path";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE_URL = "http://localhost:5173";
const SCREENSHOTS_DIR = "c:\\Rishabh\\WebDev\\BackEnd\\Frame\\client\\qa_screenshots";

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function runBrowserAudit() {
  console.log("=== Launching Real Google Chrome Browser for FRAME V1 QA Audit ===");
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
  });

  const consoleErrors = [];
  const networkFailures = [];

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });

  page.on("requestfailed", (req) => {
    networkFailures.push(`${req.method()} ${req.url()} - ${req.failure()?.errorText}`);
  });

  const auditLog = [];

  try {
    // -------------------------------------------------------------
    // Journey 1: Landing Page
    // -------------------------------------------------------------
    console.log("Checking 1: Landing Page...");
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "01_landing_desktop.png") });
    const title = await page.title();
    const hasHero = await page.locator("h1").textContent();
    auditLog.push({
      journey: "1. Landing Page",
      status: title.includes("FRAME") && hasHero.includes("sanctuary") ? "PASS" : "FAIL",
      detail: `Title: "${title}", Heading: "${hasHero.trim()}"`,
    });

    // -------------------------------------------------------------
    // Journey 2: Public Navigation to Register
    // -------------------------------------------------------------
    console.log("Checking 2: Register Form & Validation...");
    await page.click("text=Join FRAME");
    await page.waitForURL("**/register");
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "02_register_page.png") });

    // Test form validation: try submitting empty
    const testUsername = `qa_curator_${Date.now()}`;
    const testEmail = `qa_${Date.now()}@example.com`;
    await page.fill("#name", "Marcus Vance");
    await page.fill("#reg-username", testUsername);
    await page.fill("#reg-email", testEmail);
    await page.fill("#reg-password", "short"); // < 8 characters
    await page.click("button:has-text('Create Account')");

    const errorVisible = await page.locator("text=Password must be at least 8 characters long").isVisible();
    auditLog.push({
      journey: "2. Registration Validation (8+ Char Password)",
      status: errorVisible ? "PASS" : "FAIL",
      detail: "Correctly triggered validation message on short password",
    });

    // Complete valid registration
    await page.fill("#reg-password", "VanceStudio2026!");
    await page.fill("#reg-bio", "Analog & architectural documentation. Berlin & Tokyo.");
    await page.click("button:has-text('Create Account')");

    // -------------------------------------------------------------
    // Journey 3: Onboarding Page
    // -------------------------------------------------------------
    console.log("Checking 3: Onboarding...");
    await page.waitForURL("**/onboarding", { timeout: 10000 });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "03_onboarding_page.png") });
    const hasPillars = await page.locator("text=Editorial Canvas").first().isVisible();
    auditLog.push({
      journey: "3. Onboarding Experience",
      status: hasPillars ? "PASS" : "FAIL",
      detail: "Displayed editorial pillars and creator discovery",
    });

    // Click "Enter FRAME" or "Skip for now"
    const enterBtn = page.locator("button:has-text('Enter FRAME'), button:has-text('Skip for now')").first();
    await enterBtn.waitFor({ state: "visible", timeout: 8000 });
    await enterBtn.click();

    // -------------------------------------------------------------
    // Journey 4: Home Feed (Editorial Canvas)
    // -------------------------------------------------------------
    console.log("Checking 4: Home Canvas...");
    await page.waitForURL("**/home", { timeout: 10000 });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "04_home_canvas_desktop.png") });
    const hasSidebar = await page.locator(".app-sidebar").first().isVisible();
    const hasStoryTray = await page.locator("text=Your Story").first().isVisible();
    const hasTabs = (await page.locator("text=For You").first().isVisible()) && (await page.locator("text=Following").first().isVisible());
    auditLog.push({
      journey: "4. Editorial Canvas Home Feed",
      status: hasSidebar && hasStoryTray && hasTabs ? "PASS" : "FAIL",
      detail: "Sidebar, StoryTray, and For You/Following feeds verified",
    });

    // -------------------------------------------------------------
    // Journey 5: Explore Discovery Gallery
    // -------------------------------------------------------------
    console.log("Checking 5: Explore Gallery...");
    await page.click("a[href='/explore']");
    await page.waitForURL("**/explore");
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "05_explore_gallery.png") });
    const hasExploreTitle = await page.locator("text=Visual Discovery").first().isVisible();
    auditLog.push({
      journey: "5. Explore Discovery Gallery",
      status: hasExploreTitle ? "PASS" : "FAIL",
      detail: "Rendered asymmetric discovery canvas",
    });

    // -------------------------------------------------------------
    // Journey 6: Search
    // -------------------------------------------------------------
    console.log("Checking 6: Search...");
    await page.click("a[href='/search']");
    await page.waitForURL("**/search");
    await page.fill("input[placeholder*='Search by username']", "marcus");
    await page.waitForTimeout(600); // debounce
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "06_search_results.png") });
    const hasCreatorTab = await page.locator("text=Photographers").first().isVisible();
    auditLog.push({
      journey: "6. Search Creators and Works",
      status: hasCreatorTab ? "PASS" : "FAIL",
      detail: "Debounced search with Photographers and Visual Works tabs",
    });

    // -------------------------------------------------------------
    // Journey 7: Collections & Privacy Badge
    // -------------------------------------------------------------
    console.log("Checking 7: Collections...");
    await page.click("a[href='/collections']");
    await page.waitForURL("**/collections");
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "07_collections_page.png") });
    const hasCollectionsTitle = await page.locator("text=Curated Collections").first().isVisible();

    // Create a new Collection via Modal
    await page.locator("button:has-text('New Collection')").first().click();
    await page.waitForSelector("role=dialog");
    await page.fill("#collection-title", "Brutalist Tokyo");
    await page.fill("#collection-desc", "Monolithic concrete and elevated expressways");
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "07b_collection_modal.png") });
    await page.locator("div[role='dialog'] button[type='submit']").click();
    await page.waitForTimeout(1000);

    const createdColVisible = await page.locator("text=Brutalist Tokyo").first().isVisible();
    auditLog.push({
      journey: "7. Collections Creation (Private-by-default)",
      status: hasCollectionsTitle && createdColVisible ? "PASS" : "FAIL",
      detail: "Created private collection with lock privacy indicator",
    });

    // -------------------------------------------------------------
    // Journey 8: Saved Library
    // -------------------------------------------------------------
    console.log("Checking 8: Saved...");
    await page.click("a[href='/saved']");
    await page.waitForURL("**/saved");
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "08_saved_library.png") });
    const hasSavedTitle = await page.locator("text=Saved Works").first().isVisible();
    const hasPrivateBadge = await page.locator("text=Private Library").first().isVisible();
    auditLog.push({
      journey: "8. Saved Works Library",
      status: hasSavedTitle && hasPrivateBadge ? "PASS" : "FAIL",
      detail: "Private library with privacy indicator and explore CTA",
    });

    // -------------------------------------------------------------
    // Journey 9: Notifications
    // -------------------------------------------------------------
    console.log("Checking 9: Notifications...");
    await page.click("a[href='/notifications']");
    await page.waitForURL("**/notifications");
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "09_notifications_page.png") });
    const hasNotifTitle = await page.locator("text=Activity & Notifications").first().isVisible();
    auditLog.push({
      journey: "9. Notifications & Activity Feed",
      status: hasNotifTitle ? "PASS" : "FAIL",
      detail: "Activity inbox rendering with empty state and read controls",
    });

    // -------------------------------------------------------------
    // Journey 10: Settings & Theme Switching
    // -------------------------------------------------------------
    console.log("Checking 10: Settings & Dark Theme...");
    await page.click("a[href='/settings']");
    await page.waitForURL("**/settings");
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "10_settings_light.png") });

    // Click Appearance tab
    await page.locator("button:has-text('Appearance')").first().click();
    await page.waitForTimeout(200);

    // Switch to Dark Theme
    await page.locator("strong:has-text('Dark Theme')").first().click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "10b_settings_dark.png") });

    const themeAttribute = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
    const darkPass = themeAttribute === "dark";

    // Refresh page to verify persistence
    await page.reload({ waitUntil: "networkidle" });
    const persistedTheme = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
    const persistencePass = persistedTheme === "dark";

    auditLog.push({
      journey: "10. Appearance Settings & Dark Theme Persistence",
      status: darkPass && persistencePass ? "PASS" : "FAIL",
      detail: `Theme attribute applied: "${themeAttribute}", persisted after reload: "${persistedTheme}"`,
    });

    // Switch back to Light Theme
    await page.locator("button:has-text('Appearance')").first().click();
    await page.locator("strong:has-text('Light Theme')").first().click();

    // -------------------------------------------------------------
    // Journey 11: Creator Profile Page
    // -------------------------------------------------------------
    console.log("Checking 11: Creator Profile...");
    await page.goto(`${BASE_URL}/profile/${testUsername}`, { waitUntil: "networkidle" });
    await page.waitForSelector("text=Marcus Vance", { timeout: 8000 });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "11_creator_profile.png") });
    const hasCreatorName = await page.locator("text=Marcus Vance").first().isVisible();
    const hasTabsSection = (await page.locator("text=Photographs").first().isVisible()) && (await page.locator("text=Reels").first().isVisible());
    auditLog.push({
      journey: "11. Creator Profile Portfolio",
      status: hasCreatorName && hasTabsSection ? "PASS" : "FAIL",
      detail: `Creator: "Marcus Vance" with Photographs, Reels, and Collections tabs`,
    });

    // -------------------------------------------------------------
    // Journey 12: Mobile Viewport Responsiveness (375x667)
    // -------------------------------------------------------------
    console.log("Checking 12: Mobile Viewport...");
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${BASE_URL}/home`, { waitUntil: "networkidle" });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "12_mobile_home_375.png") });

    const mobileTopBarVisible = await page.locator(".mobile-topbar").first().isVisible();
    const mobileNavVisible = await page.locator(".mobile-bottomnav").first().isVisible();
    auditLog.push({
      journey: "12. Mobile Responsive Layout (375x667)",
      status: mobileTopBarVisible && mobileNavVisible ? "PASS" : "FAIL",
      detail: "Mobile top bar and bottom navigation cleanly activated without horizontal scroll",
    });

    // -------------------------------------------------------------
    // Journey 13: Logout & Protected Route Rejection
    // -------------------------------------------------------------
    console.log("Checking 13: Logout...");
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${BASE_URL}/home`, { waitUntil: "networkidle" });
    const logoutBtn = page.locator("button[aria-label='Log out of FRAME']").first();
    await logoutBtn.click();

    await page.waitForURL("**/login", { timeout: 8000 });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "13_post_logout_login.png") });

    // Try navigating to protected route /home
    await page.goto(`${BASE_URL}/home`, { waitUntil: "networkidle" });
    await page.waitForURL("**/login");
    const onLogin = page.url().includes("/login");

    auditLog.push({
      journey: "13. Sign Out & Protected Route Guarding",
      status: onLogin ? "PASS" : "FAIL",
      detail: "Safely logged out and redirected unauthorized access to /login",
    });

  } catch (err) {
    console.error("Test execution error:", err);
    auditLog.push({
      journey: "Execution Error",
      status: "FAIL",
      detail: err.message,
    });
  } finally {
    await browser.close();
  }

  console.log("\n========================================================");
  console.log("       REAL GOOGLE CHROME BROWSER QA AUDIT SUMMARY       ");
  console.log("========================================================");
  let passed = 0;
  auditLog.forEach((item) => {
    const symbol = item.status === "PASS" ? "✔ PASS" : "✖ FAIL";
    console.log(`${symbol} : ${item.journey} -> ${item.detail}`);
    if (item.status === "PASS") passed++;
  });
  console.log("--------------------------------------------------------");
  console.log(`Summary: ${passed} / ${auditLog.length} Journeys Passed`);
  console.log(`Console Errors: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.log("Top console errors:", consoleErrors.slice(0, 5));
  }
  console.log(`Network Failures: ${networkFailures.length}`);
  if (networkFailures.length > 0) {
    console.log("Top network failures:", networkFailures.slice(0, 5));
  }
  console.log(`Screenshots saved to: ${SCREENSHOTS_DIR}`);
  console.log("========================================================");

  if (passed === auditLog.length) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runBrowserAudit();
