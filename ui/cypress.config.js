import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    video: false,
    screenshotOnRunFailure: true,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    env: {
      apiBaseUrl: 'http://localhost:8000'
    },
    // Test files pattern
    specPattern: 'cypress/e2e/**/*.cy.js',
    // Support file
    supportFile: 'cypress/support/e2e.js'
  },
});