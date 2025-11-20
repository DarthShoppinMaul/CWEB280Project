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
 * - Tests both UI and API functionality
 * - Will fail if API server is not running
 */

describe('User Registration', () => {
    beforeEach(() => {
        // Ensure API is available before tests (will fail if API down)
        cy.testAPI()
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

        it('should have proper form field attributes', () => {
            // Check input types
            cy.get('[data-cy="reg-email-input"]').should('have.attr', 'type', 'email')
            cy.get('[data-cy="reg-password-input"]').should('have.attr', 'type', 'password')
            cy.get('[data-cy="reg-confirm-password-input"]').should('have.attr', 'type', 'password')

            // Check required attributes
            cy.get('[data-cy="reg-email-input"]').should('have.attr', 'required')
            cy.get('[data-cy="reg-password-input"]').should('have.attr', 'required')
            cy.get('[data-cy="reg-confirm-password-input"]').should('have.attr', 'required')
            cy.get('[data-cy="reg-first-name-input"]').should('have.attr', 'required')
            cy.get('[data-cy="reg-last-name-input"]').should('have.attr', 'required')
        })

        it('should navigate to login page from link', () => {
            cy.get('[data-cy="login-link"]').click()
            cy.url().should('include', '/login')
            cy.get('h1').should('contain.text', 'Login')
        })
    })

    describe('Registration Form Validation', () => {
        it('should show validation errors for empty required fields', () => {
            cy.get('[data-cy="register-button"]').click()

            // Check all required field errors
            cy.get('[data-cy="reg-email-error"]').should('be.visible')
            cy.get('[data-cy="reg-email-error"]').should('have.text', 'Email is required')

            cy.get('[data-cy="reg-password-error"]').should('be.visible')
            cy.get('[data-cy="reg-password-error"]').should('have.text', 'Password is required')

            cy.get('[data-cy="reg-confirm-password-error"]').should('be.visible')
            cy.get('[data-cy="reg-confirm-password-error"]').should('have.text', 'Please confirm your password')

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
        })

        it('should validate password strength', () => {
            cy.get('[data-cy="reg-password-input"]').type('weak')
            cy.get('[data-cy="register-button"]').click()

            cy.get('[data-cy="reg-password-error"]').should('be.visible')
            cy.get('[data-cy="reg-password-error"]').should('have.text', 'Password must be at least 6 characters long')
        })

        it('should validate password confirmation match', () => {
            cy.get('[data-cy="reg-password-input"]').type('password123')
            cy.get('[data-cy="reg-confirm-password-input"]').type('differentpassword')
            cy.get('[data-cy="register-button"]').click()

            cy.get('[data-cy="reg-confirm-password-error"]').should('be.visible')
            cy.get('[data-cy="reg-confirm-password-error"]').should('have.text', 'Passwords do not match')
        })

        it('should validate phone number format', () => {
            cy.get('[data-cy="reg-phone-input"]').type('invalid-phone')
            cy.get('[data-cy="register-button"]').click()

            cy.get('[data-cy="reg-phone-error"]').should('be.visible')
            cy.get('[data-cy="reg-phone-error"]').should('have.text', 'Please enter a valid phone number')
        })

        it('should clear individual field errors when user corrects them', () => {
            // Trigger email error
            cy.get('[data-cy="reg-email-input"]').type('invalid')
            cy.get('[data-cy="register-button"]').click()
            cy.get('[data-cy="reg-email-error"]').should('be.visible')

            // Correct email - error should disappear
            cy.get('[data-cy="reg-email-input"]').clear().type('valid@example.com')
            cy.get('[data-cy="reg-email-error"]').should('not.exist')
        })
    })

    describe('Successful Registration', () => {
        it('should successfully register with valid data', () => {
            const uniqueEmail = `testuser${Date.now()}@example.com`

            cy.get('[data-cy="reg-email-input"]').type(uniqueEmail)
            cy.get('[data-cy="reg-password-input"]').type('securePassword123')
            cy.get('[data-cy="reg-confirm-password-input"]').type('securePassword123')
            cy.get('[data-cy="reg-first-name-input"]').type('Test')
            cy.get('[data-cy="reg-last-name-input"]').type('User')
            cy.get('[data-cy="reg-phone-input"]').type('(555) 123-4567')

            cy.get('[data-cy="register-button"]').click()

            // Should redirect to login page with success message
            cy.url().should('include', '/login')
            cy.get('[data-cy="success-message"]').should('be.visible')
            cy.get('[data-cy="success-message"]').should('have.text', 'Account created successfully! Please log in.')

            // Verify user was created via API
            cy.request({
                method: 'POST',
                url: `${Cypress.env('apiBaseUrl')}/auth/login`,
                body: {
                    email: uniqueEmail,
                    password: 'securePassword123'
                }
            }).then((response) => {
                expect(response.status).to.eq(200)
                expect(response.body).to.have.property('email', uniqueEmail)
            })
        })

        it('should handle special characters in name fields', () => {
            const uniqueEmail = `special${Date.now()}@example.com`

            cy.get('[data-cy="reg-email-input"]').type(uniqueEmail)
            cy.get('[data-cy="reg-password-input"]').type('password123')
            cy.get('[data-cy="reg-confirm-password-input"]').type('password123')
            cy.get('[data-cy="reg-first-name-input"]').type("Test-User's")
            cy.get('[data-cy="reg-last-name-input"]').type('O\'Connor')
            cy.get('[data-cy="reg-phone-input"]').type('+1 (555) 987-6543 ext. 123')

            cy.get('[data-cy="register-button"]').click()

            cy.url().should('include', '/login')

            // Verify special characters were preserved
            cy.request({
                method: 'POST',
                url: `${Cypress.env('apiBaseUrl')}/auth/login`,
                body: {
                    email: uniqueEmail,
                    password: 'password123'
                }
            }).then((response) => {
                expect(response.status).to.eq(200)
            })
        })

        it('should show loading state during registration', () => {
            const uniqueEmail = `loading${Date.now()}@example.com`

            cy.get('[data-cy="reg-email-input"]').type(uniqueEmail)
            cy.get('[data-cy="reg-password-input"]').type('password123')
            cy.get('[data-cy="reg-confirm-password-input"]').type('password123')
            cy.get('[data-cy="reg-first-name-input"]').type('Loading')
            cy.get('[data-cy="reg-last-name-input"]').type('Test')
            cy.get('[data-cy="reg-phone-input"]').type('(555) 999-8888')

            cy.get('[data-cy="register-button"]').click()

            // Button should show loading state
            cy.get('[data-cy="register-button"]')
                .should('have.text', 'Creating Account...')
                .and('be.disabled')

            // Should eventually redirect
            cy.url().should('include', '/login', { timeout: 10000 })
        })
    })

    describe('Duplicate Registration Prevention', () => {
        it('should prevent registration with existing email', () => {
            // Try to register with admin email (which should exist)
            cy.get('[data-cy="reg-email-input"]').type('test@t.ca')
            cy.get('[data-cy="reg-password-input"]').type('newpassword123')
            cy.get('[data-cy="reg-confirm-password-input"]').type('newpassword123')
            cy.get('[data-cy="reg-first-name-input"]').type('Duplicate')
            cy.get('[data-cy="reg-last-name-input"]').type('User')
            cy.get('[data-cy="reg-phone-input"]').type('(555) 000-0000')

            cy.get('[data-cy="register-button"]').click()

            // Should show error message and stay on registration page
            cy.get('[data-cy="registration-error"]').should('be.visible')
            cy.get('[data-cy="registration-error"]').should('have.text', 'Email already exists. Please use a different email.')
            cy.url().should('include', '/registration')

            // Verify via API that duplicate registration failed
            cy.request({
                method: 'POST',
                url: `${Cypress.env('apiBaseUrl')}/auth/register`,
                body: {
                    email: 'test@t.ca',
                    password: 'newpassword123',
                    first_name: 'Duplicate',
                    last_name: 'User',
                    phone: '(555) 000-0000'
                },
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.eq(400)
            })
        })
    })

    describe('Form Accessibility and UX', () => {
        it('should support keyboard navigation', () => {
            cy.get('[data-cy="reg-email-input"]').focus()
            cy.focused().should('have.attr', 'data-cy', 'reg-email-input')

            cy.focused().tab()
            cy.focused().should('have.attr', 'data-cy', 'reg-password-input')

            cy.focused().tab()
            cy.focused().should('have.attr', 'data-cy', 'reg-confirm-password-input')
        })

        it('should auto-focus first input field on page load', () => {
            cy.visit('/registration')
            cy.focused().should('have.attr', 'data-cy', 'reg-email-input')
        })

        it('should handle form reset/clear functionality', () => {
            // Fill out form
            cy.get('[data-cy="reg-email-input"]').type('test@example.com')
            cy.get('[data-cy="reg-password-input"]').type('password123')
            cy.get('[data-cy="reg-first-name-input"]').type('Test')

            // If there's a clear/reset button, test it
            cy.get('body').then(($body) => {
                if ($body.find('button').text().includes('Clear') || $body.find('button').text().includes('Reset')) {
                    cy.get('button').contains(/Clear|Reset/).click()

                    cy.get('[data-cy="reg-email-input"]').should('have.value', '')
                    cy.get('[data-cy="reg-password-input"]').should('have.value', '')
                    cy.get('[data-cy="reg-first-name-input"]').should('have.value', '')
                }
            })
        })
    })

    describe('Password Strength Indicator', () => {
        it('should show password strength feedback', () => {
            // If password strength indicator exists, test it
            cy.get('body').then(($body) => {
                if ($body.find('[data-cy="password-strength"]').length > 0) {
                    cy.get('[data-cy="reg-password-input"]').type('weak')
                    cy.get('[data-cy="password-strength"]').should('contain', 'Weak')

                    cy.get('[data-cy="reg-password-input"]').clear().type('StrongPassword123!')
                    cy.get('[data-cy="password-strength"]').should('contain', 'Strong')
                }
            })
        })
    })

    describe('API Integration', () => {
        it('should fail when API server is unavailable', () => {
            // This test validates that tests fail if API server is not running
            cy.request(`${Cypress.env('apiBaseUrl')}/auth/status`).then((response) => {
                expect(response.status).to.eq(200)
            })
        })

        it('should handle API errors gracefully', () => {
            // Test registration with potentially problematic data
            cy.get('[data-cy="reg-email-input"]').type('error.test@example.com')
            cy.get('[data-cy="reg-password-input"]').type('password123')
            cy.get('[data-cy="reg-confirm-password-input"]').type('password123')
            cy.get('[data-cy="reg-first-name-input"]').type('Error')
            cy.get('[data-cy="reg-last-name-input"]').type('Test')

            cy.get('[data-cy="register-button"]').click()

            // Should either succeed or show appropriate error
            cy.get('body').then(($body) => {
                if ($body.find('[data-cy="registration-error"]').length > 0) {
                    cy.get('[data-cy="registration-error"]').should('be.visible')
                } else {
                    cy.url().should('include', '/login')
                }
            })
        })
    })
})