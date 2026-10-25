import { chromium } from "playwright-core";

async function test() {
  try {
    const browser = await chromium.launch({
      executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      headless: true,
    });
    const page = await browser.newPage();
    await page.goto("http://localhost:5173/");
    const title = await page.title();
    console.log("Successfully loaded in Chrome! Page title:", title);
    await browser.close();
  } catch (err) {
    console.error("Chrome launch error:", err.message);
  }
}

test();
