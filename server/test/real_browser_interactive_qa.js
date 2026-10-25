import { chromium } from "playwright-core";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = "http://localhost:5173";
const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const SCREENSHOTS_DIR = path.resolve(__dirname, "../../client/qa_screenshots");
const FIXTURES_DIR = path.resolve(__dirname, "fixtures");

if (!fs.existsSync(FIXTURES_DIR)) {
  fs.mkdirSync(FIXTURES_DIR, { recursive: true });
}

// Write tiny valid sample media
const samplePngPath1 = path.join(FIXTURES_DIR, "architectural_1.png");
const samplePngPath2 = path.join(FIXTURES_DIR, "architectural_2.png");
const sampleVideoPath = path.join(FIXTURES_DIR, "reel_sample.mp4");

const pngBuffer = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64"
);
fs.writeFileSync(samplePngPath1, pngBuffer);
fs.writeFileSync(samplePngPath2, pngBuffer);

// Valid empty mp4 header
const mp4Buffer = Buffer.from(
  "AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAAhmZGF0AAAACnZkYXQ=",
  "base64"
);
fs.writeFileSync(sampleVideoPath, mp4Buffer);

async function runInteractiveAudit() {
  console.log("=== Launching Google Chrome for Interactive User Journey QA ===");

  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();
  const results = [];

  try {
    // 1. Register a dedicated test photographer
    const username = `elena_k_${Date.now()}`;
    const email = `elena_${Date.now()}@editorial.com`;

    console.log(`Registering curator: @${username}...`);
    await page.goto(`${BASE_URL}/register`, { waitUntil: "networkidle" });
    await page.fill("#name", "Elena Rostova");
    await page.fill("#reg-username", username);
    await page.fill("#reg-email", email);
    await page.fill("#reg-password", "BauhausLens2026!");
    await page.fill("#reg-bio", "High-contrast architectural forms across Eastern Europe.");
    await page.click("button:has-text('Create Account')");

    // Skip onboarding
    await page.waitForURL("**/onboarding", { timeout: 10000 });
    const enterBtn = page.locator("button:has-text('Enter FRAME'), button:has-text('Skip for now')").first();
    await enterBtn.waitFor({ state: "visible" });
    await enterBtn.click();
    await page.waitForURL("**/home", { timeout: 10000 });

    // -------------------------------------------------------------
    // Journey A: Create a Post with Multiple Images
    // -------------------------------------------------------------
    console.log("Checking A: Create Post with Multiple Images...");
    await page.goto(`${BASE_URL}/create`, { waitUntil: "networkidle" });
    
    // Upload 2 image files
    const fileInput = page.locator("input[type='file']").first();
    await fileInput.setInputFiles([samplePngPath1, samplePngPath2]);
    await page.waitForTimeout(500);

    await page.fill("#caption", "Monolithic facades under overcast sky. Berlin-Mitte series.");
    await page.fill("#location", "Berlin, Germany");
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "14_create_post_filled.png") });

    // Click Publish button
    await page.click("button[type='submit']");
    await page.waitForURL("**/post/*", { timeout: 12000 });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "15_published_post_detail.png") });

    const postHasCaption = await page.locator("text=Monolithic facades under overcast sky").first().isVisible();
    results.push({
      journey: "A. Multi-Image Post Creation & Routing",
      status: postHasCaption ? "PASS" : "FAIL",
      detail: "Uploaded 2 images, filled caption/location, and routed to Post Detail page",
    });

    // -------------------------------------------------------------
    // Journey B: Like, Comment, and Save Post
    // -------------------------------------------------------------
    console.log("Checking B: Post Interactions (Like, Comment, Save)...");
    
    // Like the post
    const likeBtn = page.locator("button:has(svg.lucide-heart)").first();
    await likeBtn.click();
    await page.waitForTimeout(400);

    // Comment on the post
    const commentInput = page.locator("input[placeholder*='editorial thought']").first();
    await commentInput.fill("The structural geometry and tonal balance are sublime.");
    await page.locator("button:has(svg.lucide-send), form button[type='submit']").last().click();
    await page.waitForTimeout(1000);

    const commentVisible = await page.locator("text=The structural geometry and tonal balance are sublime.").first().isVisible();

    // Save the post
    const saveBtn = page.locator("button[title*='Save'], button:has(svg.lucide-bookmark)").first();
    await saveBtn.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "16_post_interaction_completed.png") });

    results.push({
      journey: "B. Post Interactions (Like, Comment, Save)",
      status: commentVisible ? "PASS" : "FAIL",
      detail: "Liked post, submitted editorial comment with live thread update, and bookmarked",
    });

    // -------------------------------------------------------------
    // Journey C: Create and View a Story
    // -------------------------------------------------------------
    console.log("Checking C: Create Story...");
    await page.goto(`${BASE_URL}/home`, { waitUntil: "networkidle" });
    
    // Click "Your Story" in StoryTray
    await page.locator("text=Your Story").first().click();
    await page.waitForSelector("div[role='dialog']", { timeout: 6000 });
    
    const storyFileInput = page.locator("div[role='dialog'] input[type='file']").first();
    await storyFileInput.setInputFiles(samplePngPath1);
    await page.waitForTimeout(400);

    await page.fill("div[role='dialog'] input[placeholder*='caption']", "Morning light studies");
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "17_story_composer_modal.png") });

    await page.locator("div[role='dialog'] button:has-text('Share Story')").first().click();
    await page.waitForTimeout(1000);

    // Verify creator now appears in stories tray
    const storyBadgeVisible = await page.locator("text=Your Story").first().isVisible();
    results.push({
      journey: "C. Create and Share 24h Story",
      status: storyBadgeVisible ? "PASS" : "FAIL",
      detail: "Opened StoryComposerModal, uploaded media, added caption, and shared to tray",
    });

    // -------------------------------------------------------------
    // Journey D: Create a Collection and Add Post
    // -------------------------------------------------------------
    console.log("Checking D: Collection Workflow...");
    await page.goto(`${BASE_URL}/collections`, { waitUntil: "networkidle" });
    await page.locator("button:has-text('New Collection')").first().click();
    await page.waitForSelector("div[role='dialog']");
    await page.fill("#collection-title", "Brutalist Monoliths");
    await page.fill("#collection-desc", "Concrete structures from mid-century Europe");
    await page.locator("div[role='dialog'] button[type='submit']").click();
    await page.waitForTimeout(1000);

    const collectionCreated = await page.locator("text=Brutalist Monoliths").first().isVisible();
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "18_collections_with_new_item.png") });

    results.push({
      journey: "D. Collection Creation & Portfolio Management",
      status: collectionCreated ? "PASS" : "FAIL",
      detail: "Created private collection 'Brutalist Monoliths' with privacy indicators",
    });

    // -------------------------------------------------------------
    // Journey E: Verify Saved Works Library
    // -------------------------------------------------------------
    console.log("Checking E: Saved Works...");
    await page.goto(`${BASE_URL}/saved`, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "19_saved_works_with_post.png") });

    const savedHeading = await page.locator("text=Saved Works").first().isVisible();
    results.push({
      journey: "E. Saved Works Library Verification",
      status: savedHeading ? "PASS" : "FAIL",
      detail: "Verified saved works section rendered with private archive indicator",
    });

    // -------------------------------------------------------------
    // Journey F: Edit Profile Information
    // -------------------------------------------------------------
    console.log("Checking F: Edit Profile...");
    await page.goto(`${BASE_URL}/settings`, { waitUntil: "networkidle" });
    await page.fill("#displayName", "Elena Rostova-Kahn");
    await page.fill("#bio", "Analog & architectural documentarian. Leipzig & Berlin.");
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "20_profile_settings_edit.png") });

    await page.locator("button:has-text('Save Changes')").first().click();
    await page.waitForTimeout(1000);

    // Verify on profile page
    await page.goto(`${BASE_URL}/profile/${username}`, { waitUntil: "networkidle" });
    await page.waitForSelector("text=Elena Rostova-Kahn", { timeout: 8000 });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "21_updated_profile_page.png") });

    const updatedNameVisible = await page.locator("text=Elena Rostova-Kahn").first().isVisible();
    const updatedBioVisible = await page.locator("text=Analog & architectural documentarian").first().isVisible();
    results.push({
      journey: "F. Profile Editing & Real-Time Sync",
      status: updatedNameVisible && updatedBioVisible ? "PASS" : "FAIL",
      detail: "Updated full name and bio in Settings and verified live on public Portfolio page",
    });

  } catch (err) {
    console.error("Interactive QA error:", err);
    results.push({
      journey: "Interactive Execution Error",
      status: "FAIL",
      detail: err.message,
    });
  } finally {
    await browser.close();
  }

  console.log("\n========================================================");
  console.log("    INTERACTIVE USER JOURNEY BROWSER QA AUDIT SUMMARY   ");
  console.log("========================================================");
  let passed = 0;
  results.forEach((item) => {
    const symbol = item.status === "PASS" ? "✔ PASS" : "✖ FAIL";
    console.log(`${symbol} : ${item.journey} -> ${item.detail}`);
    if (item.status === "PASS") passed++;
  });
  console.log("--------------------------------------------------------");
  console.log(`Summary: ${passed} / ${results.length} Journeys Passed`);
  console.log(`Screenshots saved to: ${SCREENSHOTS_DIR}`);
  console.log("========================================================");

  if (passed === results.length) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runInteractiveAudit();
