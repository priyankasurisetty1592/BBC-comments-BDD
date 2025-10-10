# BBC Comments BDD Testing Project

## WHAT THIS PROJECT DOES:
This project automatically tests the BBC commenting system using Behavior-Driven Development (BDD). It verifies that users can view, post, reply to, and react to comments on BBC articles.

## HOW IT'S BUILT:
- Node.js - JavaScript runtime environment
- Playwright - Browser automation for testing web applications
- Cucumber.js - BDD framework for writing tests (Gherkin)
- Page Object Model - Design pattern for organizing test code

## PROJECT STRUCTURE:
- features/ - Test scenarios written in Gherkin
- step_definitions/ - Code that executes the test scenarios
- page_objects/ - Code that interacts with web pages
- utils/ - Helper files and configuration

## CONFIGURATION:

Test Credentials:
Edit utils/config.js to change test user credentials


## HOW TO RUN:

Initial Setup:
1. Install Node.js (version 14 or higher)
2. Install dependencies:
   npm install
3. Install Playwright browsers:
   npx playwright install chromium

Running Tests:

Run all tests (browser visible):
npm test

Run all tests in headless mode (no browser UI):
HEADLESS=true npm test

Run only unsigned user tests:
npm test -- --tags "@unsigned"

Run only signed-in user tests:
npm test -- --tags "@signin"


## WHAT GETS TESTED:

Unsigned User Tests (@unsigned):
✓ View comments section
✓ See "Sign in / Register" button
✓ Cannot post new comments
✓ See sign-in prompt when trying to reply
✓ See sign-in prompt when trying to like comments

Signed-in User Tests (@signin):
✓ Post Comments: Create new comments and verify they appear
✓ Duplicate Detection: Verify duplicate comment warnings
✓ Reply to Comments: Reply to existing comments
✓ React to Comments: Like comments and verify reactions
✓ Reaction Limits: Verify "react once" message