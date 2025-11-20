// Enhanced Cypress Login Command
// This fixes the authentication issues specific to Cypress testing

// Helper function to get API base URL
function getApiBaseUrl() {
    return Cypress.env('apiBaseUrl') || 'http://localhost:8000'
}

/**
 * Enhanced login command that works with cookie-based authentication
 * Usage: cy.loginEnhanced()
 */
Cypress.Commands.add('loginEnhanced', () => {
    cy.session('admin-login-enhanced', () => {
        //  Clear any existing cookies and localStorage
        cy.clearCookies()
        cy.clearLocalStorage()

        //  Visit login page and wait for it to load
        cy.visit('/login')
        cy.get('[data-cy="email-input"]').should('be.visible')

        //  Fill in credentials
        cy.get('[data-cy="email-input"]').clear().type('test@t.ca')
        cy.get('[data-cy="password-input"]').clear().type('123456Pw')

        //  Submit the form
        cy.get('[data-cy="login-button"]').click()

        //  Wait for redirect to complete
        cy.url().should('include', '/pets', { timeout: 15000 })

        // Verify authentication worked by making API call
        cy.request({
            method: 'GET',
            url: `${getApiBaseUrl()}/auth/me`,
            failOnStatusCode: false
        }).then((response) => {
            expect(response.status).to.eq(200)
            expect(response.body).to.have.property('email', 'test@t.ca')
        })


        cy.get('h1').should('exist') // Should have a heading on the pets page
    }, {
        // Session validation - check if we're still authenticated
        validate() {
            cy.request({
                method: 'GET',
                url: `${getApiBaseUrl()}/auth/me`,
                failOnStatusCode: false
            }).then((response) => {
                if (response.status !== 200) {
                    // Session is invalid, need to login again
                    throw new Error('Session validation failed')
                }
            })
        }
    })
})

/**
 * Direct API login (bypasses UI)
 * Usage: cy.loginAPI()
 */
Cypress.Commands.add('loginAPI', () => {
    cy.session('api-login', () => {
        cy.request({
            method: 'POST',
            url: `${getApiBaseUrl()}/auth/login`,
            body: {
                email: 'test@t.ca',
                password: '123456Pw'
            },
            headers: {
                'Content-Type': 'application/json'
            }
        }).then((response) => {
            expect(response.status).to.eq(200)
            expect(response.body).to.have.property('email', 'test@t.ca')
        })
    })
})

/**
 * Test if API is responding
 * Usage: cy.testAPI()
 */
Cypress.Commands.add('testAPI', () => {
    cy.request({
        method: 'GET',
        url: `${getApiBaseUrl()}/auth/status`,
        timeout: 10000,
        retryOnStatusCodeFailure: true
    }).then((response) => {
        expect(response.status).to.eq(200)
    })
})

/**
 * Wait for authentication to be ready
 * Usage: cy.waitForAuth()
 */
Cypress.Commands.add('waitForAuth', () => {
    cy.window().its('localStorage').should('exist')
    // Give the auth context time to initialize
    cy.wait(1000)
})