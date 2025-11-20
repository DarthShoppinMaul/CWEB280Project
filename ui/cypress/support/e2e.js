// Import commands.js using ES2015 syntax:
import './commands'
import './authcommands.js'  // Import enhanced auth commands

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Global test setup
beforeEach(() => {
    // Clear cookies and localStorage before each test
    cy.clearCookies()
    cy.clearLocalStorage()
})

// Global error handling
Cypress.on('uncaught:exception', (err, runnable) => {
    // returning false here prevents Cypress from failing the test
    // for unhandled promise rejections and other uncaught exceptions
    console.warn('Uncaught exception:', err.message)
    return false
})