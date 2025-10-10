Feature: BBC Commenting Service
  As a BBC user
  I want to view, post, reply, and react to comments
  So that I can participate in discussions on BBC articles

  Background:
    Given I navigate to "https://www.test.bbc.co.uk/sport/articles/cj2ne09x2j0o?mode=testData"

  @unsigned
  Scenario: Unsigned user can view comments but cannot interact
    Given I am on the BBC article comments page
    When I click the "comments" section
    Then I should see the existing comments section
    And I should see the "Sign in / Register" button
    And I should not see any option to post a new comment
    When I click on reply button for the first comment
    Then I should see the sign in or register prompt
    When I click on like button for the first comment
    Then I should see the sign in or register prompt

  @signin
  Scenario: Signed-in user can post a comment and verify duplicate detection
    Given I am on the BBC article comments page
    And I am signed in
    When I enter a new comment "This is an automated comment for testing"
    And I click the Post button
    Then the comment should appear at the top of the comment list
    And it should show my display name and timestamp
    When I enter the same comment again "This is an automated comment for testing"
    Then I should see the duplicate comment message

  @signin
  Scenario: Signed-in user can reply to an existing comment
    Given I am on the BBC article comments page
    And I am signed in
    And a parent comment exists
    When I click the Reply button under that comment
    And I enter a reply "This is an automated reply for testing"
    And I post the reply
    Then my reply should appear nested below the parent comment
    And it should display my display name and timestamp

  @signin
  Scenario: Signed-in user can react to a comment
    Given I am on the BBC article comments page
    And I am signed in
    And a comment is visible in the list
    When I click the "Like" reaction icon on that comment
    Then the reaction count should increase by one
    And the "Like" icon should appear highlighted
    When I click on the like comment again
    Then I should see the message "You can only react once"
