const { setWorldConstructor, setDefaultTimeout, Before, After } = require('@cucumber/cucumber');
const { chromium } = require('@playwright/test');
const PageObjectManager = require('./pageObjectManager');

// Set timeout for steps (30 seconds)
setDefaultTimeout(30 * 1000);

// Simple World class for beginners
class SimpleWorld {
  constructor() {
    this.browser = null;
    this.page = null;
    this.pageManager = null;
  }

  // Start browser and create page
  async startBrowser() {
    this.browser = await chromium.launch({ 
      headless: process.env.HEADLESS === 'true'  // Default false, can be set via HEADLESS=true
    });
    this.page = await this.browser.newPage();
    
    // Initialize page object manager
    this.pageManager = new PageObjectManager(this.page);
  }

  // Close browser
  async closeBrowser() {
    if (this.page) await this.page.close();
    if (this.browser) await this.browser.close();
  }
}

// Use our simple world
setWorldConstructor(SimpleWorld);

// Before each test scenario
Before(async function () {
  await this.startBrowser();
});

// Clear all cookies and storage before @unsigned scenarios
Before({ tags: '@unsigned' }, async function () {
  if (this.page) {
    await this.page.context().clearCookies();
    await this.page.context().clearPermissions();
  }
});

// After each test scenario  
After(async function () {
  await this.closeBrowser();
});

module.exports = SimpleWorld;