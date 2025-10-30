module.exports = {
  default: {
    // Feature files
    require: [
      'utils/setup-teardown.js',
      'step_definitions/**/*.js'
    ],
    
    // Feature file paths
    paths: ['features/**/*.feature'],
    
    // Formatting options
    format: [
      'progress-bar',
      'json:reports/cucumber_report.json',
      'html:reports/cucumber_report.html'
    ],
    
    // Parallel execution
    parallel: 2,
    
    // Tags
    tags: 'not @skip',
    
    // Retry failed scenarios
    retry: 0,
    
    // Timeout for steps (in milliseconds)
    timeout: 60000,
    
    // World parameters
    worldParameters: {
      headless: true,
      browser: 'chromium',
      viewport: { width: 1280, height: 720 },
      video: 'retain-on-failure',
      trace: 'retain-on-failure'
    }
  }
};