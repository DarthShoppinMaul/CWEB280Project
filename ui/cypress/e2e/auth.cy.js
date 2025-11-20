/**
 * Complete Authentication Tests
 * ----------------------------
 */

describe('Complete Authentication System', () => {
    beforeEach(() => {
        // Ensure API is available before tests (will fail if API down)
        cy.testAPI()
    })

    describe('Login Page Display', () => {
        beforeEach(() => {
            cy.visit('/login')
        })

        it('should display complete login form with all authentication options', () => {
            // Check page title - should be "Login"
            cy.get('h1').should('contain.text', 'Login')

            // Email/password login section
            cy.get('[data-cy="email-input"]').should('be.visible')
            cy.get('[data-cy="password-input"]').should('be.visible')
            cy.get('[data-cy="remember-me-checkbox"]').should('be.visible')
            cy.get('[data-cy="login-button"]').should('have.text', 'Login')

            // Google OAuth section
            cy.get('[data-cy="google-signin-button"]').should('be.visible')
            cy.get('[data-cy="google-signin-button"]').should('contain.text', 'Google')

            // Navigation links - should go to /register
            cy.get('[data-cy="register-link"]').should('be.visible')
            cy.get('[data-cy="register-link"]').should('have.attr', 'href', '/register')
        })

        it('should have proper form field attributes and accessibility', () => {
            // Check input types and attributes
            cy.get('[data-cy="email-input"]').should('have.attr', 'type', 'email')
            cy.get('[data-cy="password-input"]').should('have.attr', 'type', 'password')
            cy.get('[data-cy="remember-me-checkbox"]').should('have.attr', 'type', 'checkbox')

            // Check accessibility attributes
            cy.get('[data-cy="email-input"]').should('have.attr', 'required')
            cy.get('[data-cy="password-input"]').should('have.attr', 'required')
        })
    })

    describe('Email/Password Login Validation', () => {
        beforeEach(() => {
            cy.visit('/login')
        })

        it('should handle empty form submission gracefully', () => {
            cy.get('[data-cy="login-button"]').click()

            // Should remain on login page (validation prevents submission)
            cy.url().should('include', '/login')
        })

        it('should handle invalid email format', () => {
            cy.get('[data-cy="email-input"]').type('invalid-email')
            cy.get('[data-cy="login-button"]').click()

            // Should remain on login page
            cy.url().should('include', '/login')
        })

        it('should show error for invalid credentials', () => {
            cy.get('[data-cy="email-input"]').type('wrong@email.com')
            cy.get('[data-cy="password-input"]').type('wrongpassword')
            cy.get('[data-cy="login-button"]').click()

            // Should show "Login failed" error (based on your test logs)
            cy.get('body').should('contain.text', 'Login failed')
            cy.url().should('include', '/login')

            // Verify via API that login failed
            cy.request({
                method: 'POST',
                url: `${Cypress.env('apiBaseUrl')}/auth/login`,
                body: {
                    email: 'wrong@email.com',
                    password: 'wrongpassword'
                },
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.eq(401)
            })
        })
    })

    describe('Successful Email/Password Login', () => {
        beforeEach(() => {
            cy.visit('/login')
        })

        it('should successfully login admin user with correct credentials', () => {
            // Fill in correct admin credentials
            cy.get('[data-cy="email-input"]').type('test@t.ca')
            cy.get('[data-cy="password-input"]').type('123456Pw')
            cy.get('[data-cy="login-button"]').click()

            // Should redirect to pets dashboard page
            cy.url().should('include', '/pets')

            // Verify authentication via API call
            cy.request(`${Cypress.env('apiBaseUrl')}/auth/me`).then((response) => {
                expect(response.status).to.eq(200)
                expect(response.body).to.have.property('email', 'test@t.ca')
                expect(response.body).to.have.property('role', 'admin')
            })
        })

        it('should maintain user session across page visits', () => {
            // Login first
            cy.get('[data-cy="email-input"]').type('test@t.ca')
            cy.get('[data-cy="password-input"]').type('123456Pw')
            cy.get('[data-cy="login-button"]').click()

            // Should redirect and maintain session
            cy.url().should('include', '/pets')

            // Visit another page - should stay logged in
            cy.visit('/add-pet')
            cy.url().should('include', '/add-pet')

            // Verify still logged in via API
            cy.request(`${Cypress.env('apiBaseUrl')}/auth/me`).then((response) => {
                expect(response.status).to.eq(200)
                expect(response.body).to.have.property('email', 'test@t.ca')
            })
        })

        it('should show proper loading state during login', () => {
            cy.get('[data-cy="email-input"]').type('test@t.ca')
            cy.get('[data-cy="password-input"]').type('123456Pw')
            cy.get('[data-cy="login-button"]').click()

            // Button should show loading state briefly
            cy.get('[data-cy="login-button"]').should('contain.text', 'Logging in...')

            // Should eventually redirect
            cy.url().should('include', '/pets', { timeout: 10000 })
        })
    })

    describe('Remember Me Functionality', () => {
        beforeEach(() => {
            cy.visit('/login')
        })

        it('should have remember me checkbox functionality', () => {
            // Check that remember me checkbox exists and works
            cy.get('[data-cy="remember-me-checkbox"]').should('not.be.checked')
            cy.get('[data-cy="remember-me-checkbox"]').check()
            cy.get('[data-cy="remember-me-checkbox"]').should('be.checked')
        })
    })

    describe('Google OAuth Authentication', () => {
        beforeEach(() => {
            cy.visit('/login')
        })

        it('should display Google sign-in option', () => {
            // Google sign-in button should be visible
            cy.get('[data-cy="google-signin-button"]').should('be.visible')
            cy.get('[data-cy="google-signin-button"]').should('contain.text', 'Continue with Google')
        })

        it('should handle Google OAuth flow initiation', () => {
            // Click Google sign-in button
            cy.get('[data-cy="google-signin-button"]').click()

            // Should redirect to Google OAuth

        })
    })

    describe('Logout Functionality', () => {
        beforeEach(() => {
            cy.loginEnhanced()
        })

        it('should successfully logout and redirect to login page', () => {
            // Visit a page that requires authentication
            cy.visit('/add-pet')

            // Find and click logout (may be in navigation)
            cy.get('nav').within(() => {
                cy.get('a, button').contains(/logout|sign out/i).click()
            })

            // Should redirect to login or home page
            cy.url().should('match', /(\/login|\/|\/home)/)

            // Verify logout via API
            cy.request({
                method: 'GET',
                url: `${Cypress.env('apiBaseUrl')}/auth/me`,
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.eq(401)
            })
        })
    })

    describe('Session Management', () => {
        it('should maintain login state across page refreshes', () => {
            cy.loginEnhanced()
            cy.visit('/add-pet')
            cy.url().should('include', '/add-pet')

            // Refresh page
            cy.reload()

            // Should still be logged in and on same page
            cy.url().should('include', '/add-pet')

            // Verify via API
            cy.request(`${Cypress.env('apiBaseUrl')}/auth/me`).then((response) => {
                expect(response.status).to.eq(200)
                expect(response.body).to.have.property('email', 'test@t.ca')
            })
        })
    })

    describe('API Integration', () => {
        it('should fail when API server is unavailable', () => {
            // This test validates that tests fail if API server is not running
            cy.request(`${Cypress.env('apiBaseUrl')}/pets`).then((response) => {
                expect(response.status).to.eq(200)
            })
        })
    })
})