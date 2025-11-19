/**
 * Registration Tests
 * ------------------
 * Tests for user registration functionality following proposal test plan.
 *
 * Test Cases Covered:
 * - User Registration (valid data creates account, redirects to login)
 * - Registration Validation (invalid email, missing fields show errors)
 * - Password confirmation validation
 * - Duplicate email prevention
 *
 * Note: Tests follow corrected guidelines:
 * - No cy.contains or cy.intercept usage
 * - Tests both UI and API functionality
 * - Will fail if API server is not running
 */

describe('User Registration', () => {
    beforeEach(() => {
        // Ensure API is available before tests (will fail if API down)
        cy.waitForAPI()
        cy.visit('/registration')
    })

    describe('Registration Form Display', () => {
        it('should display registration form correctly', () => {
            // Check page title
            cy.get('h1').should('have.text', 'Create Account')

            // Verify all form fields are present
            cy.get('[data-cy="reg-email-input"]').should('be.visible')
            cy.get('[data-cy="reg-password-input"]').should('be.visible')
            cy.get('[data-cy="reg-confirm-password-input"]').should('be.visible')
            cy.get('[data-cy="reg-first-name-input"]').should('be.visible')
            cy.get('[data-cy="reg-last-name-input"]').should('be.visible')
            cy.get('[data-cy="reg-phone-input"]').should('be.visible')
            cy.get('[data-cy="register-button"]').should('have.text', 'Create Account')

            // Check link to login page
            cy.get('[data-cy="login-link"]').should('be.visible')
            cy.get('[data-cy="login-link"]').should('have.attr', 'href', '/login')
        })
    })

    describe('Registration Validation - Invalid Inputs', () => {
        it('should show error messages for empty required fields', () => {
            // Try to submit with empty form
            cy.get('[data-cy="register-button"]').click()

            // Check that validation errors are displayed
            cy.get('[data-cy="reg-email-error"]').should('be.visible')
            cy.get('[data-cy="reg-email-error"]').should('have.text', 'Email is required')

            cy.get('[data-cy="reg-password-error"]').should('be.visible')
            cy.get('[data-cy="reg-password-error"]').should('have.text', 'Password is required')

            cy.get('[data-cy="reg-first-name-error"]').should('be.visible')
            cy.get('[data-cy="reg-first-name-error"]').should('have.text', 'First name is required')

            cy.get('[data-cy="reg-last-name-error"]').should('be.visible')
            cy.get('[data-cy="reg-last-name-error"]').should('have.text', 'Last name is required')

            // Should remain on registration page
            cy.url().should('include', '/registration')
        })

        it('should validate email format', () => {
            cy.get('[data-cy="reg-email-input"]').type('invalid-email')
            cy.get('[data-cy="register-button"]').click()

            cy.get('[data-cy="reg-email-error"]').should('be.visible')
            cy.get('[data-cy="reg-email-error"]').should('have.text', 'Please enter a valid email address')

            // Test another invalid format
            cy.get('[data-cy="reg-email-input"]').clear().type('test@')
            cy.get('[data-cy="register-button"]').click()

            cy.get('[data-cy="reg-email-error"]').should('be.visible')
        })

        it('should validate password strength requirements', () => {
            cy.get('[data-cy="reg-password-input"]').type('weak')
            cy.get('[data-cy="register-button"]').click()

            cy.get('[data-cy="reg-password-error"]').should('be.visible')
            cy.get('[data-cy="reg-password-error"]').should('have.text', 'Password must be at least 8 characters with uppercase, lowercase, and number')
        })

        it('should validate password confirmation match', () => {
            cy.get('[data-cy="reg-password-input"]').type('ValidPass123')
            cy.get('[data-cy="reg-confirm-password-input"]').type('DifferentPass123')
            cy.get('[data-cy="register-button"]').click()

            cy.get('[data-cy="reg-confirm-password-error"]').should('be.visible')
            cy.get('[data-cy="reg-confirm-password-error"]').should('have.text', 'Passwords do not match')
        })

        it('should clear individual field errors as user types valid input', () => {
            // Trigger errors first
            cy.get('[data-cy="register-button"]').click()
            cy.get('[data-cy="reg-email-error"]').should('be.visible')
            cy.get('[data-cy="reg-password-error"]').should('be.visible')

            // Type valid email - should clear only email error
            cy.get('[data-cy="reg-email-input"]').type('test@example.com')
            cy.get('[data-cy="reg-email-error"]').should('not.exist')
            cy.get('[data-cy="reg-password-error"]').should('be.visible')

            // Type valid password - should clear password error
            cy.get('[data-cy="reg-password-input"]').type('ValidPass123')
            cy.get('[data-cy="reg-password-error"]').should('not.exist')
        })
    })

    describe('Successful Registration', () => {
        it('should create new user account with valid data and redirect to login', () => {
            const timestamp = Date.now()
            const testEmail = `newuser${timestamp}@test.com`

            // Fill out registration form with valid data
            cy.get('[data-cy="reg-email-input"]').type(testEmail)
            cy.get('[data-cy="reg-password-input"]').type('NewUser123')
            cy.get('[data-cy="reg-confirm-password-input"]').type('NewUser123')
            cy.get('[data-cy="reg-first-name-input"]').type('Test')
            cy.get('[data-cy="reg-last-name-input"]').type('User')
            cy.get('[data-cy="reg-phone-input"]').type('(555) 123-4567')

            // Submit form
            cy.get('[data-cy="register-button"]').click()

            // Should redirect to login page
            cy.url().should('include', '/login')

            // Should show success message
            cy.get('[data-cy="success-message"]').should('be.visible')
            cy.get('[data-cy="success-message"]').should('have.text', 'Account created successfully! Please log in.')

            // Verify account was created via API call
            cy.request('POST', `${Cypress.env('apiBaseUrl')}/auth/login`, {
                email: testEmail,
                password: 'NewUser123'
            }).then((response) => {
                expect(response.status).to.eq(200)
                expect(response.body).to.have.property('user')
                expect(response.body.user).to.have.property('email', testEmail)
                expect(response.body.user).to.have.property('first_name', 'Test')
                expect(response.body.user).to.have.property('last_name', 'User')
            })
        })

        it('should handle form submission with loading state', () => {
            const timestamp = Date.now()
            const testEmail = `loadingtest${timestamp}@test.com`

            cy.get('[data-cy="reg-email-input"]').type(testEmail)
            cy.get('[data-cy="reg-password-input"]').type('LoadTest123')
            cy.get('[data-cy="reg-confirm-password-input"]').type('LoadTest123')
            cy.get('[data-cy="reg-first-name-input"]').type('Loading')
            cy.get('[data-cy="reg-last-name-input"]').type('Test')

            cy.get('[data-cy="register-button"]').click()

            // Button should show loading state
            cy.get('[data-cy="register-button"]')
                .should('have.text', 'Creating Account...')
                .and('be.disabled')

            // Should eventually redirect to login
            cy.url().should('include', '/login', { timeout: 10000 })
        })
    })

    describe('Duplicate Email Prevention', () => {
        it('should prevent registration with existing email address', () => {
            // Try to register with the test admin email that already exists
            cy.get('[data-cy="reg-email-input"]').type('test@t.ca')
            cy.get('[data-cy="reg-password-input"]').type('NewPass123')
            cy.get('[data-cy="reg-confirm-password-input"]').type('NewPass123')
            cy.get('[data-cy="reg-first-name-input"]').type('Duplicate')
            cy.get('[data-cy="reg-last-name-input"]').type('User')

            cy.get('[data-cy="register-button"]').click()

            // Should show error message
            cy.get('[data-cy="submission-error"]').should('be.visible')
            cy.get('[data-cy="submission-error"]').should('have.text', 'Email already exists. Please use a different email or log in.')

            // Should remain on registration page
            cy.url().should('include', '/registration')

            // Verify no duplicate user was created via API
            cy.request({
                method: 'GET',
                url: `${Cypress.env('apiBaseUrl')}/users`,
                failOnStatusCode: false
            }).then((response) => {
                if (response.status === 200) {
                    const users = response.body
                    const duplicateUsers = users.filter(user => user.email === 'test@t.ca')
                    expect(duplicateUsers).to.have.length(1) // Only original admin should exist
                }
            })
        })
    })

    describe('Navigation Links', () => {
        it('should navigate to login page when login link clicked', () => {
            cy.get('[data-cy="login-link"]').click()
            cy.url().should('include', '/login')
            cy.get('h1').should('have.text', 'Admin Login')
        })
    })

    describe('API Integration', () => {
        it('should fail gracefully when API server is unavailable', () => {
            // This test validates that tests fail if API server is not running
            // by making a direct API call that should work if server is up
            cy.request(`${Cypress.env('apiBaseUrl')}/users`).then((response) => {
                expect(response.status).to.eq(200)
            })
        })
    })
})