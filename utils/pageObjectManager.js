// PageObjectManager - manages all page objects
class PageObjectManager {
  constructor(page) {
    this.page = page;
    this.pages = {};
  }

  // Get or create a page object
  getPage(pageName) {
    // If page already exists, return it
    if (this.pages[pageName]) {
      return this.pages[pageName];
    }

    // Create new page object based on name
    try {
      const PageClass = require(`../page_objects/${pageName}.page.js`);
      this.pages[pageName] = new PageClass(this.page);
      return this.pages[pageName];
    } catch (error) {
      throw new Error(`Page object '${pageName}.page.js' not found in page_objects folder`);
    }
  }

  // Helper methods for common page objects

  getTestArticlePage() {
    return this.getPage('testArticle');
  }

  getCommentsPage() {
    return this.getPage('comments');
  }

  getAuthPage() {
    return this.getPage('auth');
  }

  // Get all loaded pages
  getAllPages() {
    return this.pages;
  }

  // Clear all pages (useful for cleanup)
  clearPages() {
    this.pages = {};
  }
}

module.exports = PageObjectManager;