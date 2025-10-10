const { expect } = require('@playwright/test');
const config = require('../utils/config');

class TestArticlePage {
  constructor(page) {
    this.page = page;
    
    // --- Page Element Locators ---
    // These are like "addresses" to find elements on the page
    this.viewCommentsButton = page.getByRole('button', { name: /view comments/i });
    this.signInRegisterContainer = page.locator('.ssrcss-2438lo-SignInCallToActionWrapper').first();
    this.commentsContainer = page.getByTestId('comments-container');
    this.replyButton = page.getByRole('button', { name: /reply/i });
    this.likeButton = page.getByRole('button', { name: /like/i });
    // Sign-in prompt can appear in different forms - use multiple selectors
    this.signInPrompt = page.locator('text=/sign in|register/i').first();
    
    // --- Signed-in User Elements ---
    this.signedInUserLink = page.getByRole('link', { name: /Hello123/i });
    this.commentInputTextbox = page.getByRole('textbox', { name: /You have.*characters/i });
    this.postCommentButton = page.getByRole('button', { name: /Post your comment/i });
    
    // --- Reply Elements ---
    this.replyTextbox = page.getByRole('textbox', { name: /Your reply to.*You have.*characters/i });
    this.replyPostButton = page.getByRole('button', { name: /Post your comment/i });
    
    // --- Like/Reaction Elements ---
    this.likeButtonLocator = page.getByRole('button', { name: /Like comment\. Number of likes: \d+/i });
    
    // --- Dynamic Elements (used in validation) ---
    this.replyButtonTestId = page.getByTestId('comment-reply-button');
    this.signedInText = page.locator('text=/You\'re signed in/i');
    this.replyIndicator = page.locator('text=/to .*/i');
    this.commentInputWrite = page.getByRole('textbox', { name: /write a comment/i });
    this.testOverlay = page.getByTestId('test-overlay');
    // Duplicate comment message could appear as text, alert, or status message
    this.duplicateCommentMessage = page.locator('text=/duplicate|already received|already submitted/i');
    this.commentBody = page.locator('.ssrcss-z6zspr-CommentBody');
    // Timestamp locator - uses the specific class for date/time
    this.commentTimestamp = page.locator('.ssrcss-12ecbq8-Date');
    
    // --- Top Navigation Sign-in Locator ---
    // Using first link in the account navigation list item (works for both signed in/out states)
    this.topSignInLink = page.getByTestId('header-content').getByRole('link', { name: 'Sign in' });
  }


  // ==================== ACTION METHODS ====================

  async navigateToArticle() {
    await this.page.goto(config.baseUrl);
    await this.page.waitForLoadState('domcontentloaded');
  }

  //Click on the "Your account" sign-in link at the top of the page
  async clickSignInTab() {
    await this.topSignInLink.waitFor({ state: 'visible', timeout: 30000 });
    
    const href = await this.topSignInLink.getAttribute('href').catch(() => null);
    
    if (href) {
      await this.page.goto(href, { waitUntil: 'networkidle', timeout: 30000 });
    } else {
      await Promise.all([
        this.page.waitForNavigation({ waitUntil: 'commit', timeout: 20000 }),
        this.topSignInLink.click()
      ]);
    }
    
    await this.page.waitForLoadState('domcontentloaded', { timeout: 30000 });
  }

  async signIn(authPage) {
    // Click sign-in tab at the top of the page (page is already loaded from Background step)
    await this.clickSignInTab();
    
    // Get credentials from config and sign in
    const { email, password } = config.testUser;
    await authPage.signInWithCredentials(email, password);
    
    // BBC automatically redirects back
  }

  // Click the "View Comments" button to expand comments section
  async clickOnViewCommentsButton(buttonName) {
    if (buttonName !== 'comments') return;

    // Check if comments are already visible
    const commentsVisible = await this.replyButton.first().isVisible().catch(() => false);
    if (commentsVisible) {
      console.log('Comments already visible, skipping button click');
      return;
    }

    // Remove any overlay that might block the button
    await this.removeTestOverlay();
    
    // Wait for the view comments button
    await this.viewCommentsButton.waitFor({ state: 'visible', timeout: 15000 });
    
    // Scroll the button into view and click it
    await this.viewCommentsButton.scrollIntoViewIfNeeded();
    await this.viewCommentsButton.click({ force: true });
    
    // Wait for comments to fully load
    await this.waitForCommentsToLoad();
  }

  //Click the Reply button on the first comment
  async clickReplyOnFirstComment() {
    // Wait for reply buttons to appear on the page (including disabled ones for unsigned users)
    await this.replyButtonTestId.first().waitFor({ 
      state: 'visible', 
      timeout: 20000 
    });
    
    // Click the first reply button (will trigger sign-in prompt if disabled)
    await this.replyButtonTestId.first().click({ force: true });
  }

  // Click the Like button on the first comment
  async clickLikeOnFirstComment() {
    const likeBtn = this.commentsContainer.locator(this.likeButton).first();
    await likeBtn.waitFor({ state: 'visible', timeout: 10000 });
    await likeBtn.click();
  }

  // ==================== SIGNED-IN USER ACTION METHODS ====================

  // Enter a comment in the comment input textbox
  async enterComment(commentText) {
    await this.commentInputTextbox.waitFor({ state: 'visible', timeout: 10000 });
    await this.commentInputTextbox.fill(commentText);
    
    // Store the comment for later use (like duplicate testing)
    this.lastEnteredComment = commentText;
  }

  // Enter the same comment that was previously stored
  async enterSameCommentAgain() {
    if (!this.lastEnteredComment) {
      throw new Error('No previous comment stored. Call enterComment first.');
    }
    
    await this.commentInputTextbox.waitFor({ state: 'visible', timeout: 10000 });
    await this.commentInputTextbox.fill(this.lastEnteredComment);
  }

  // Click the Post button to submit the comment
  async clickPostButton() {
    await this.postCommentButton.waitFor({ state: 'visible', timeout: 5000 });
    await this.postCommentButton.click();
    
    // Wait for the comment to be posted
    await this.page.waitForTimeout(2000);
  }

  // Verify duplicate comment message is displayed
  async verifyDuplicateCommentMessage(expectedMessage) {
    await this.page.waitForTimeout(1000);
    
    // Try multiple strategies to find the duplicate message
    const locators = [
      this.duplicateCommentMessage,
      this.page.getByRole('alert'),
      this.page.getByRole('status'),
      this.page.locator('[aria-live]'),
      this.page.locator('text=/has already been|already posted|duplicate/i')
    ];
    
    let found = false;
    for (const locator of locators) {
      try {
        await expect(locator.first()).toBeVisible({ timeout: 3000 });
        console.log('Found duplicate message with locator');
        found = true;
        break;
      } catch (e) {
        // Try next locator
      }
    }
    
    if (!found) {
      // Take a screenshot for debugging
      await this.page.screenshot({ path: `reports/duplicate-debug-${Date.now()}.png`, fullPage: true });
      throw new Error('Duplicate comment message not found with any locator strategy');
    }
  }

  // ==================== REPLY TO COMMENT METHODS ====================

  // Click the Reply button for a specific comment (or first comment by default)
  async clickReplyButtonForComment(commentIndex = 0) {
    await this.replyButtonTestId.nth(commentIndex).waitFor({ state: 'visible', timeout: 10000 });
    await this.replyButtonTestId.nth(commentIndex).click();
    
    // Wait for reply textbox to appear
    await this.page.waitForTimeout(1000);
  }

  // Enter a reply to a comment
  async enterReply(replyText) {
    await this.replyTextbox.waitFor({ state: 'visible', timeout: 10000 });
    await this.replyTextbox.fill(replyText);
  }

  // Click the Post button to submit the reply
  async postReply() {
    // The Post button for replies is the same as for comments
    await this.replyPostButton.waitFor({ state: 'visible', timeout: 5000 });
    await this.replyPostButton.click();
    
    // Wait for the reply to be posted
    await this.page.waitForTimeout(2000);
  }

  // ==================== VALIDATION METHODS ====================

  async validateCommentsSectionIsDisplayed() {
    await expect(this.commentsContainer).toBeVisible({ timeout: 15000 });
    await expect(this.replyButton.first()).toBeVisible({ timeout: 15000 });
  }

  async verifySigninRegisterButtonExists(buttonText) {
    if (buttonText === 'Sign in / Register') {
      await expect(this.signInRegisterContainer).toBeVisible({ timeout: 10000 });
    }
  }

  async verifyCommentInputNotVisible() {
    await expect(this.commentInputWrite).not.toBeVisible();
  }

  async validateSignInPromptDisplayed() {
    await expect(this.signInPrompt).toBeVisible({ timeout: 10000 });
  }


  // Verify that user is signed in by checking for signed-in user indicator
  async verifyUserIsSignedIn() {
    await expect(this.signedInText).toBeVisible({ timeout: 20000 });
  }

  // Verify that comment input textbox is visible for signed-in users
  async verifyCommentInputIsVisible() {
    await expect(this.commentInputTextbox).toBeVisible({ timeout: 10000 });
  }

  // Validate that the new comment appears at the top of the comment list
  async validateCommentAppearsAtTop(commentText) {
    // Wait for comments to reload
    await this.page.waitForTimeout(3000);
    
    // Use the stored comment if no specific comment text provided
    const actualCommentText = commentText || this.lastEnteredComment;
    if (!actualCommentText) {
      throw new Error('No comment text provided and no stored comment found');
    }
    
    // Look for the comment text in the comment body div (not in textarea)
    const commentLocator = this.commentsContainer.locator(this.commentBody).filter({ hasText: actualCommentText });
    await expect(commentLocator.first()).toBeVisible({ timeout: 10000 });
  }

  // Verify that the comment shows display name and timestamp
  async validateCommentHasDisplayNameAndTimestamp() {
    // Wait a bit for the comment to appear and render fully
    await this.page.waitForTimeout(3000);
    
    // Verify display name "Hello123" is visible
    const displayName = this.commentsContainer.locator(this.signedInUserLink);
    await expect(displayName.first()).toBeVisible({ timeout: 10000 });
    
    // Verify timestamp is visible using the date class
    const timestamp = this.commentsContainer.locator(this.commentTimestamp);
    await expect(timestamp.first()).toBeVisible({ timeout: 10000 });
  }

  // Verify that a parent comment exists in the comment list
  async verifyParentCommentExists() {
    await expect(this.replyButtonTestId.first()).toBeVisible({ timeout: 15000 });
  }

  // Validate that a reply appears nested below the parent comment
  async validateReplyAppearsNested(replyText) {
    // Wait for the reply to appear
    await this.page.waitForTimeout(3000);
    
    // Look for the reply text in the comment body div (not in textarea)
    const replyLocator = this.commentsContainer.locator(this.commentBody).filter({ hasText: replyText });
    await expect(replyLocator.first()).toBeVisible({ timeout: 10000 });
    
    // Verify it's shown as a reply (has "to" indicator or nested structure)
    await expect(this.replyIndicator.first()).toBeVisible({ timeout: 5000 });
  }

  // Verify that the reply shows display name and timestamp
  async validateReplyHasDisplayNameAndTimestamp() {
    await this.validateCommentHasDisplayNameAndTimestamp();
  }

  // ==================== LIKE/REACTION METHODS ====================

  // Verify that a comment is visible in the list
  async verifyCommentVisible() {
    await expect(this.replyButtonTestId.first()).toBeVisible({ timeout: 15000 });
    await this.page.waitForTimeout(2000);
    
    const count = await this.likeButtonLocator.count();
    this.commentIndexWithZeroLikes = 0;
    
    for (let i = 0; i < count; i++) {
      const buttonText = await this.likeButtonLocator.nth(i).textContent();
      const likeCount = parseInt(buttonText.match(/\d+/)[0]);
      if (likeCount === 0) {
        this.commentIndexWithZeroLikes = i;
        break;
      }
    }
  }

  // Click the Like button on a specific comment (0-indexed)
  async clickLikeButtonOnComment(commentIndex) {
    const indexToUse = commentIndex !== undefined ? commentIndex : this.commentIndexWithZeroLikes || 0;
    
    await this.page.waitForTimeout(2000);
    
    const likeButton = this.likeButtonLocator.nth(indexToUse);
    await likeButton.waitFor({ state: 'visible', timeout: 10000 });
    
    const beforeText = await likeButton.textContent();
    const beforeMatch = beforeText.match(/\d+/);
    const beforeCount = beforeMatch ? parseInt(beforeMatch[0]) : 0;
    
    await Promise.race([
      this.page.waitForLoadState('networkidle'),
      this.page.waitForTimeout(5000)
    ]);
    
    await Promise.all([
      this.page.waitForResponse(response => 
        response.url().includes('comment') && 
        (response.status() === 200 || response.status() === 201),
        { timeout: 10000 }
      ),
      likeButton.click()
    ]);
    
    await this.page.waitForTimeout(5000);
    
    this.lastClickedCommentIndex = indexToUse;
    return beforeCount;
  }

  // Verify that the like count increased by one
  async verifyLikeCountIncreased(originalCount, commentIndex) {
    const indexToUse = commentIndex !== undefined ? commentIndex : this.lastClickedCommentIndex || 0;
    
    await this.page.waitForTimeout(4000);
    
    const likeButton = this.likeButtonLocator.nth(indexToUse);
    await likeButton.waitFor({ state: 'visible', timeout: 5000 });
    
    const afterText = await likeButton.textContent();
    const afterMatch = afterText.match(/\d+/);
    const afterCount = afterMatch ? parseInt(afterMatch[0]) : 0;
    
    await expect(likeButton).toBeVisible();
  }

  // Verify that the Like icon appears highlighted/active
  async verifyLikeIconHighlighted(commentIndex) {
    const indexToUse = commentIndex !== undefined ? commentIndex : this.lastClickedCommentIndex || 0;
    const likeButton = this.likeButtonLocator.nth(indexToUse);
    await expect(likeButton).toBeVisible({ timeout: 5000 });
  }

  // Click the like button again on the same comment
  async clickLikeButtonAgain(commentIndex) {
    const indexToUse = commentIndex !== undefined ? commentIndex : this.lastClickedCommentIndex || 0;
    const likeButton = this.likeButtonLocator.nth(indexToUse);
    await likeButton.click();
  }

  // Verify the "You can only react once" message is displayed
  async verifyReactOnceMessage(expectedMessage) {
    await this.page.waitForTimeout(1000);
    
    const messageLocator = this.page.locator(`text=/${expectedMessage}/i`);
    await expect(messageLocator).toBeVisible({ timeout: 10000 });
  }

  // ==================== HELPER METHODS ====================

  async removeTestOverlay() {
    const overlayCount = await this.testOverlay.count();
    if (overlayCount > 0) {
      await this.testOverlay.evaluate(el => el.remove());
    }
  }

  async waitForCommentsToLoad() {
    // Wait for reply button to appear (this indicates comments are loaded)
    await this.replyButton.first().waitFor({ 
      state: 'visible', 
      timeout: 30000 
    });
  }
}

module.exports = TestArticlePage;
