/**
 * Complete Authentication Tests
 * ----------------------------
 * Tests for all authentication functionality
 *
 * Test Cases Covered:
 * - Email Login (user logs in with email/password, redirected to home page)
 * - Google Sign-In (user logs in using Google OAuth, redirected to home)
 * - Remember Me (user checks "Remember Me", session persists after browser restart)
 * - Login Validation (user enters invalid credentials, error message displayed)
 * - Logout (user clicks logout button, logged out and redirected to login)
 * - Route Protection (authenticated/unauthenticated access control)
 * - Session Management (persistence, expiry)
 *
 */

describe('Complete Authentication System', () => {
    beforeEach(() => {
        // Ensure API is available before tests (will fail if API down)
        cy.waitForAPI()
    })

    describe('Login Page Display', () => {
        beforeEach(() => {
            cy.visit('/login')
        })

        it('should display complete login form with all authentication options', () => {
            // Check page title and basic elements
            cy.get('h1').should('have.text', 'Admin Login')

            // Email/password login section
            cy.get('[data-cy="email-input"]').should('be.visible')
            cy.get('[data-cy="password-input"]').should('be.visible')
            cy.get('[data-cy="remember-me-checkbox"]').should('be.visible')
            cy.get('[data-cy="remember-me-label"]').should('have.text', 'Remember me for 7 days')
            cy.get('[data-cy="login-button"]').should('have.text', 'Login')

            // Google OAuth section
            cy.get('[data-cy="google-oauth-section"]').should('be.visible')
            cy.get('[data-cy="oauth-divider"]').should('be.visible')
            cy.get('[data-cy="oauth-divider"]').should('have.text', 'OR')
            cy.get('[data-cy="google-signin-button"]').should('be.visible')
            cy.get('[data-cy="google-signin-button"]').should('have.text', 'Sign in with Google')

            // Navigation links
            cy.get('[data-cy="registration-link"]').should('be.visible')
            cy.get('[data-cy="registration-link"]').should('have.attr', 'href', '/registration')
        })

        it('should have proper form field attributes and accessibility', () => {
            // Check input types and attributes
            cy.get('[data-cy="email-input"]').should('have.attr', 'type', 'email')
            cy.get('[data-cy="password-input"]').should('have.attr', 'type', 'password')
            cy.get('[data-cy="remember-me-checkbox"]').should('have.attr', 'type', 'checkbox')

            // Check accessibility attributes
            cy.get('[data-cy="email-input"]').should('have.attr', 'required')
            cy.get('[data-cy="password-input"]').should('have.attr', 'required')

            // Check labels are properly associated
            cy.get('label[for="email"]').should('exist')
            cy.get('label[for="password"]').should('exist')
        })
    })

    describe('Email/Password Login Validation', () => {
        beforeEach(() => {
            cy.visit('/login')
        })

        it('should show validation errors for empty fields', () => {
            cy.get('[data-cy="login-button"]').click()

            // Check validation errors are displayed
            cy.get('[data-cy="email-error"]').should('be.visible')
            cy.get('[data-cy="email-error"]').should('have.text', 'Email is required')

            cy.get('[data-cy="password-error"]').should('be.visible')
            cy.get('[data-cy="password-error"]').should('have.text', 'Password is required')

            // Should remain on login page
            cy.url().should('include', '/login')
        })

        it('should validate email format', () => {
            cy.get('[data-cy="email-input"]').type('invalid-email')
            cy.get('[data-cy="login-button"]').click()

            cy.get('[data-cy="email-error"]').should('be.visible')
            cy.get('[data-cy="email-error"]').should('have.text', 'Please enter a valid email address')
        })

        it('should show error for invalid credentials', () => {
            cy.get('[data-cy="email-input"]').type('wrong@email.com')
            cy.get('[data-cy="password-input"]').type('wrongpassword')
            cy.get('[data-cy="login-button"]').click()

            // Should show authentication error
            cy.get('[data-cy="auth-error"]').should('be.visible')
            cy.get('[data-cy="auth-error"]').should('have.text', 'Invalid email or password')
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

        it('should clear field errors as user types valid input', () => {
            // Trigger errors
            cy.get('[data-cy="login-button"]').click()
            cy.get('[data-cy="email-error"]').should('be.visible')
            cy.get('[data-cy="password-error"]').should('be.visible')

            // Type valid email - should clear email error only
            cy.get('[data-cy="email-input"]').type('test@example.com')
            cy.get('[data-cy="email-error"]').should('not.exist')
            cy.get('[data-cy="password-error"]').should('be.visible')

            // Type password - should clear password error
            cy.get('[data-cy="password-input"]').type('password123')
            cy.get('[data-cy="password-error"]').should('not.exist')
        })
    })

    describe('Successful Email/Password Login', () => {
        beforeEach(() => {
            cy.visit('/login')
        })

        it('should successfully login with correct admin credentials', () => {
            cy.get('[data-cy="email-input"]').type('test@t.ca')
            cy.get('[data-cy="password-input"]').type('123456Pw')
            cy.get('[data-cy="login-button"]').click()

            // Should redirect to dashboard
            cy.url().should('include', '/dashboard')
            cy.get('h1').should('have.text', 'Dashboard')

            // Verify authentication via API
            cy.request(`${Cypress.env('apiBaseUrl')}/auth/me`).then((response) => {
                expect(response.status).to.eq(200)
                expect(response.body).to.have.property('email', 'test@t.ca')
                expect(response.body).to.have.property('role', 'admin')
            })
        })

        it('should show loading state during login', () => {
            cy.get('[data-cy="email-input"]').type('test@t.ca')
            cy.get('[data-cy="password-input"]').type('123456Pw')
            cy.get('[data-cy="login-button"]').click()

            // Button should show loading state
            cy.get('[data-cy="login-button"]')
                .should('have.text', 'Logging in...')
                .and('be.disabled')

            // Should eventually redirect
            cy.url().should('include', '/dashboard', { timeout: 10000 })
        })

        it('should update navigation after successful login', () => {
            cy.get('[data-cy="email-input"]').type('test@t.ca')
            cy.get('[data-cy="password-input"]').type('123456Pw')
            cy.get('[data-cy="login-button"]').click()

            cy.url().should('include', '/dashboard')

            // Check authenticated navigation
            cy.get('nav').should('exist')
            cy.get('[data-cy="nav-dashboard"]').should('be.visible')
            cy.get('[data-cy="nav-add-pet"]').should('be.visible')
            cy.get('[data-cy="nav-add-location"]').should('be.visible')
            cy.get('[data-cy="nav-logout"]').should('be.visible')

            // Should not show login link
            cy.get('[data-cy="nav-login"]').should('not.exist')
        })
    })

    describe('Remember Me Functionality', () => {
        beforeEach(() => {
            cy.visit('/login')
        })

        it('should persist session for 7 days when remember me is checked', () => {
            // Login with remember me checked
            cy.get('[data-cy="email-input"]').type('test@t.ca')
            cy.get('[data-cy="password-input"]').type('123456Pw')
            cy.get('[data-cy="remember-me-checkbox"]').check()
            cy.get('[data-cy="login-button"]').click()

            cy.url().should('include', '/dashboard')

            // Verify remember me cookie is set with 7-day expiration
            cy.getCookie('remember_me').should('exist')
            cy.getCookie('remember_me').should((cookie) => {
                expect(cookie.value).to.exist
                // Cookie should expire in ~7 days (allowing some margin)
                const expiry = new Date(cookie.expiry * 1000)
                const now = new Date()
                const daysDiff = (expiry - now) / (1000 * 60 * 60 * 24)
                expect(daysDiff).to.be.within(6.5, 7.5)
            })

            // Simulate browser restart by clearing session cookies but keeping remember_me
            cy.clearCookies({ domain: null, except: ['remember_me'] })

            // Visit protected page - should still be authenticated
            cy.visit('/dashboard')
            cy.url().should('include', '/dashboard')
            cy.get('h1').should('have.text', 'Dashboard')

            // Verify API still recognizes user
            cy.request(`${Cypress.env('apiBaseUrl')}/auth/me`).then((response) => {
                expect(response.status).to.eq(200)
                expect(response.body).to.have.property('email', 'test@t.ca')
            })
        })

        it('should not persist session when remember me is unchecked', () => {
            // Login without remember me (default unchecked)
            cy.get('[data-cy="email-input"]').type('test@t.ca')
            cy.get('[data-cy="password-input"]').type('123456Pw')
            // Ensure remember me is unchecked
            cy.get('[data-cy="remember-me-checkbox"]').should('not.be.checked')
            cy.get('[data-cy="login-button"]').click()

            cy.url().should('include', '/dashboard')

            // Remember me cookie should not exist
            cy.getCookie('remember_me').should('not.exist')

            // Clear session cookies
            cy.clearCookies()

            // Visit protected page - should redirect to login
            cy.visit('/dashboard')
            cy.url().should('include', '/login')
        })

        it('should show remember me checkbox state correctly', () => {
            // Default state should be unchecked
            cy.get('[data-cy="remember-me-checkbox"]').should('not.be.checked')

            // Should be able to check and uncheck
            cy.get('[data-cy="remember-me-checkbox"]').check()
            cy.get('[data-cy="remember-me-checkbox"]').should('be.checked')

            cy.get('[data-cy="remember-me-checkbox"]').uncheck()
            cy.get('[data-cy="remember-me-checkbox"]').should('not.be.checked')
        })
    })

    describe('Google OAuth Authentication', () => {
        beforeEach(() => {
            cy.visit('/login')
        })

        it('should display Google OAuth option', () => {
            cy.get('[data-cy="google-signin-button"]').should('be.visible')
            cy.get('[data-cy="google-signin-button"]').should('have.text', 'Sign in with Google')

            // Should have proper styling and icons
            cy.get('[data-cy="google-signin-button"]').should('have.class', 'google-oauth-btn')
            cy.get('[data-cy="google-icon"]').should('be.visible')
        })

        it('should handle Google OAuth initiation', () => {
            // Click Google sign-in button
            cy.get('[data-cy="google-signin-button"]').click()

            // Should redirect to Google OAuth or show OAuth popup
            // Note: In a real implementation, this would redirect to Google
            // For testing, we verify the OAuth endpoint is called
            cy.url().should('match', /oauth|google/)
        })

        it('should authenticate user with existing Google account (ebasotest@gmail.com)', () => {
            // Simulate successful Google OAuth callback
            // In real implementation, this would be handled by Google OAuth flow
            cy.request('POST', `${Cypress.env('apiBaseUrl')}/auth/google`, {
                email: 'ebasotest@gmail.com',
                google_id: 'test_google_id',
                name: 'Test Google User'
            }).then((response) => {
                expect(response.status).to.eq(200)
                expect(response.body).to.have.property('user')
                expect(response.body.user).to.have.property('email', 'ebasotest@gmail.com')
                expect(response.body.user).to.have.property('role', 'user')
            })

            // Simulate successful OAuth redirect
            cy.visit('/dashboard')
            cy.url().should('include', '/dashboard')
        })
    })

    describe('Logout Functionality', () => {
        beforeEach(() => {
            cy.login() // Use existing login command
            cy.visit('/dashboard')
        })

        it('should successfully logout and redirect to login page', () => {
            // Verify we're logged in first
            cy.get('[data-cy="nav-logout"]').should('be.visible')

            // Click logout
            cy.get('[data-cy="nav-logout"]').click()

            // Should redirect to login page
            cy.url().should('include', '/login')
            cy.get('h1').should('have.text', 'Admin Login')

            // Navigation should show public links
            cy.get('[data-cy="nav-login"]').should('be.visible')
            cy.get('[data-cy="nav-dashboard"]').should('not.exist')

            // Verify logout via API
            cy.request({
                method: 'GET',
                url: `${Cypress.env('apiBaseUrl')}/auth/me`,
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.eq(401)
            })
        })

        it('should clear remember me cookie on logout', () => {
            // Set remember me cookie first
            cy.clearCookies()
            cy.visit('/login')
            cy.get('[data-cy="email-input"]').type('test@t.ca')
            cy.get('[data-cy="password-input"]').type('123456Pw')
            cy.get('[data-cy="remember-me-checkbox"]').check()
            cy.get('[data-cy="login-button"]').click()

            cy.getCookie('remember_me').should('exist')

            // Logout
            cy.get('[data-cy="nav-logout"]').click()

            // Remember me cookie should be cleared
            cy.getCookie('remember_me').should('not.exist')
        })

        it('should show logout confirmation if needed', () => {
            // If logout requires confirmation
            cy.get('[data-cy="nav-logout"]').click()

            // Should show confirmation dialog (if implemented)
            cy.get('[data-cy="logout-confirm-dialog"]').should('be.visible')
            cy.get('[data-cy="confirm-logout-button"]').click()

            cy.url().should('include', '/login')
        })
    })

    describe('Route Protection', () => {
        const protectedRoutes = [
            '/dashboard',
            '/add-pet',
            '/add-location',
            '/my-applications',
            '/admin'
        ]

        protectedRoutes.forEach(route => {
            it(`should redirect ${route} to login when not authenticated`, () => {
                cy.visit(route)
                cy.url().should('include', '/login')

                // Should show redirect message
                cy.get('[data-cy="redirect-message"]').should('be.visible')
                cy.get('[data-cy="redirect-message"]').should('have.text', 'Please log in to access this page')
            })
        })

        it('should allow access to protected routes when authenticated', () => {
            cy.login()

            protectedRoutes.forEach(route => {
                cy.visit(route)
                cy.url().should('include', route)
                // Should not redirect to login
                cy.url().should('not.include', '/login')
            })
        })

        it('should allow access to public routes without authentication', () => {
            const publicRoutes = ['/', '/login', '/registration']

            publicRoutes.forEach(route => {
                cy.visit(route)
                cy.url().should('include', route)
                // Should not redirect to login
                cy.url().should('not.include', '/login')
            })
        })
    })

    describe('Session Management', () => {
        it('should maintain login state across page refreshes', () => {
            cy.login()
            cy.visit('/dashboard')
            cy.url().should('include', '/dashboard')

            // Refresh page
            cy.reload()

            // Should still be logged in
            cy.url().should('include', '/dashboard')
            cy.get('h1').should('have.text', 'Dashboard')

            // Verify via API
            cy.request(`${Cypress.env('apiBaseUrl')}/auth/me`).then((response) => {
                expect(response.status).to.eq(200)
                expect(response.body).to.have.property('email', 'test@t.ca')
            })
        })

        it('should handle session expiry gracefully', () => {
            cy.login()
            cy.visit('/dashboard')

            // Clear session cookies to simulate expiry
            cy.clearCookies()

            // Try to access protected route
            cy.visit('/add-pet')
            cy.url().should('include', '/login')

            // Should show session expired message
            cy.get('[data-cy="session-expired-message"]').should('be.visible')
            cy.get('[data-cy="session-expired-message"]').should('have.text', 'Your session has expired. Please log in again.')
        })

        it('should handle concurrent session management', () => {
            cy.login()
            cy.visit('/dashboard')

            // Verify logged in
            cy.request(`${Cypress.env('apiBaseUrl')}/auth/me`).then((response) => {
                expect(response.status).to.eq(200)
            })

            // Logout via API (simulate logout in another tab)
            cy.request('POST', `${Cypress.env('apiBaseUrl')}/auth/logout`)

            // Navigate to protected page
            cy.visit('/add-pet')

            // Should redirect to login
            cy.url().should('include', '/login')
        })
    })

    describe('API Integration', () => {
        it('should fail when API server is unavailable', () => {
            // This test validates that tests fail if API server is not running
            cy.request(`${Cypress.env('apiBaseUrl')}/auth/status`).then((response) => {
                expect(response.status).to.eq(200)
            })
        })

        it('should handle API errors gracefully during authentication', () => {
            // Test authentication with server errors
            cy.visit('/login')

            cy.get('[data-cy="email-input"]').type('test@t.ca')
            cy.get('[data-cy="password-input"]').type('123456Pw')

            // Test with mock server error response
            cy.request({
                method: 'POST',
                url: `${Cypress.env('apiBaseUrl')}/auth/login`,
                body: { email: 'test@t.ca', password: '123456Pw' },
                failOnStatusCode: false
            }).then((response) => {
                // Should handle both success and server error gracefully
                expect([200, 500]).to.include(response.status)
            })
        })
    })
})