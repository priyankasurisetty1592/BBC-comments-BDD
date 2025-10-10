const { expect } = require('@playwright/test');

class AuthPage {
  constructor(page) {
    this.page = page;
    
    // --- Authentication Page Locators ---
    // Email/Username page locators
    this.emailUsernameField = page.locator('#user-identifier-input'); // Email or username input field
    this.emailContinueButton = page.getByRole('button', { name: 'Continue' });
    
    // Password page locators
    this.passwordField = page.locator('#password-input'); // Password input field
    this.signInButton = page.getByTestId('form').getByRole('button', { name: 'Sign in' });
  }

  async signInWithCredentials(email, password) {
    // Enter email/username
    await this.emailUsernameField.waitFor({ state: 'visible', timeout: 30000 });
    await this.emailUsernameField.fill(email);
    await this.emailContinueButton.click();
    
    // Enter password
    await this.passwordField.waitFor({ state: 'visible', timeout: 10000 });
    await this.passwordField.fill(password);
    
    // Click Sign in button
    await this.signInButton.click();
    
    // Wait for redirect back to article
    await this.page.waitForLoadState('domcontentloaded', { timeout: 20000 });
  }

}

module.exports = AuthPage;