// Import Cucumber step definition functions
const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('@playwright/test');
const { Before } = require('@cucumber/cucumber');
const config = require('../utils/config');


// ----------------- Hooks -----------------
Before(async function () {
  // Use the pageManager from SimpleWorld (setup-teardown.js)
  pm = this.pageManager;
});

// ----------------- Given Steps (Setup) -----------------
Given('I navigate to {string}', async function (url) {
  const testArticlePage = pm.getTestArticlePage();
  await testArticlePage.navigateToArticle();
});

Given('I am on the BBC article comments page', async function () {
  // Page already loaded via Background step, just wait for page to be ready
  await this.page.waitForLoadState('domcontentloaded');
});

// ----------------- When Steps (Actions) -----------------
When('I click the {string} section', async function (buttonName) {
  const testArticlePage = pm.getTestArticlePage();
  await testArticlePage.clickOnViewCommentsButton(buttonName);
});

// ----------------- Then Steps (Verification) -----------------
Then('I should see the existing comments section', async function () {
  const testArticlePage = pm.getTestArticlePage();
  await testArticlePage.validateCommentsSectionIsDisplayed();
});

Then('I should see the {string} button', async function (buttonText) {
  const testArticlePage = pm.getTestArticlePage();
  await testArticlePage.verifySigninRegisterButtonExists(buttonText);
});

Then('I should not see any option to post a new comment', async function () {
  const testArticlePage = pm.getTestArticlePage();
  await testArticlePage.verifyCommentInputNotVisible();
});

// ----------------- New Steps for unsigned user interactions -----------------
When('I click on reply button for the first comment', { timeout: 60000 }, async function () {
  const testArticlePage = pm.getTestArticlePage();
  await testArticlePage.clickReplyOnFirstComment();
});

Then('I should see the sign in or register prompt', async function () {
  const testArticlePage = pm.getTestArticlePage();
  await testArticlePage.validateSignInPromptDisplayed();
});

When('I click on like button for the first comment', async function () {
  const testArticlePage = pm.getTestArticlePage();
  await testArticlePage.clickLikeOnFirstComment();
});

// ----------------- Steps for Signed-in User Scenario -----------------

Given('I am signed in', { timeout: 60000 }, async function () {
  const authPage = pm.getAuthPage();
  const testArticlePage = pm.getTestArticlePage();
  
  // Sign in with credentials from config
  await testArticlePage.signIn(authPage);
  
  // Open comments section after signing in
  await testArticlePage.clickOnViewCommentsButton('comments');
});

When('I enter a new comment {string}', async function (commentText) {
  const testArticlePage = pm.getTestArticlePage();
  await testArticlePage.enterComment(commentText);
});

When('I click the Post button', async function () {
  const testArticlePage = pm.getTestArticlePage();
  await testArticlePage.clickPostButton();
});

Then('the comment should appear at the top of the comment list', async function () {
  const testArticlePage = pm.getTestArticlePage();
  // Use the actual comment that was entered (stored in page object)
  await testArticlePage.validateCommentAppearsAtTop();
});

Then('it should show my display name and timestamp', async function () {
  const testArticlePage = pm.getTestArticlePage();
  await testArticlePage.validateCommentHasDisplayNameAndTimestamp();
});

// ----------------- Steps for Duplicate Comment Scenario -----------------

When('I enter the same comment again {string}', async function (commentText) {
  const testArticlePage = pm.getTestArticlePage();
  await testArticlePage.enterSameCommentAgain();
});

Then('I should see the duplicate comment message', async function () {
  const testArticlePage = pm.getTestArticlePage();
  await testArticlePage.verifyDuplicateCommentMessage();
});

// ----------------- Steps for Reply to Comment Scenario -----------------

Given('a parent comment exists', async function () {
  const testArticlePage = pm.getTestArticlePage();
  // Just verify parent comment exists - comments should already be visible from sign-in step
  await testArticlePage.verifyParentCommentExists();
});

When('I click the Reply button under that comment', async function () {
  const testArticlePage = pm.getTestArticlePage();
  await testArticlePage.clickReplyButtonForComment(0); // First comment
});

When('I enter a reply {string}', async function (replyText) {
  const testArticlePage = pm.getTestArticlePage();
  await testArticlePage.enterReply(replyText);
});

When('I post the reply', async function () {
  const testArticlePage = pm.getTestArticlePage();
  await testArticlePage.postReply();
});

Then('my reply should appear nested below the parent comment', async function () {
  const testArticlePage = pm.getTestArticlePage();
  // Get the reply text from config
  const replyText = config.testData.reply;
  await testArticlePage.validateReplyAppearsNested(replyText);
});

Then('it should display my display name and timestamp', async function () {
  const testArticlePage = pm.getTestArticlePage();
  await testArticlePage.validateReplyHasDisplayNameAndTimestamp();
});

// ==================== LIKE/REACTION STEPS ====================

Given('a comment is visible in the list', async function () {
  const testArticlePage = pm.getTestArticlePage();
  await testArticlePage.verifyCommentVisible();
});

When('I click the {string} reaction icon on that comment', async function (reactionType) {
  const testArticlePage = pm.getTestArticlePage();
  
  if (reactionType === 'Like') {
    // Click the Like button and store the original count
    // The page object will use the comment with 0 likes found earlier
    const originalCount = await testArticlePage.clickLikeButtonOnComment();
    this.originalLikeCount = originalCount;
  }
});

Then('the reaction count should increase by one', async function () {
  const testArticlePage = pm.getTestArticlePage();
  await testArticlePage.verifyLikeCountIncreased(this.originalLikeCount);
});

Then('the {string} icon should appear highlighted', async function (reactionType) {
  const testArticlePage = pm.getTestArticlePage();
  
  if (reactionType === 'Like') {
    await testArticlePage.verifyLikeIconHighlighted();
  }
});

When('I click on the like comment again', async function () {
  const testArticlePage = pm.getTestArticlePage();
  await testArticlePage.clickLikeButtonAgain();
});

Then('I should see the message {string}', async function (expectedMessage) {
  const testArticlePage = pm.getTestArticlePage();
  await testArticlePage.verifyReactOnceMessage(expectedMessage);
});


// ========== Report Comment Scenario Steps ==========
When('I click on the three dot button for the first comment', async function () {
  const testArticlePage = pm.getTestArticlePage();
  await testArticlePage.clickThreeDotMenu();
});

Then('I should see Report Comment', async function () {
  const testArticlePage = pm.getTestArticlePage();
  await testArticlePage.assertReportCommentOptionVisible();
});

When('I click on Report Comment', async function () {
  const testArticlePage = pm.getTestArticlePage();
  await testArticlePage.clickReportCommentOption();
});

Then('I should be on the report comment page', async function () {
  const testArticlePage = pm.getTestArticlePage();
  await testArticlePage.assertReportCommentsPageNavigation();
  // await testArticlePage.page.waitForURL(config.reportsUrl, { timeout: 10000 });
  // expect(testArticlePage.page.url()).toBe(config.reportsUrl);
  // Optionally, check for a unique element:
  // await expect(testArticlePage.page.getByTestId('report-comment-form')).toBeVisible();
});

// ========== Sort Comments by Latest Scenario Steps ==========
Given('at least 3 comments are visible in the list', async function () {
  const testArticlePage = pm.getTestArticlePage();
  await testArticlePage.assertAtLeastThreeCommentsVisible();
});

Given('the Show dropdown is present', async function () {
  const testArticlePage = pm.getTestArticlePage();
  await testArticlePage.assertShowDropdownPresent();
});

When("I select the 'Latest' option from the Show dropdown", async function () {
  const testArticlePage = pm.getTestArticlePage();
  await testArticlePage.selectLatestFromShowDropdown();
});

Then('I should see latest comments first', async function () {
  const testArticlePage = pm.getTestArticlePage();
  await testArticlePage.assertLatestCommentFirst();
});







