describe('Authentication', () => {
    beforeEach(() => {
        // Ensure API is available before tests
        cy.waitForAPI()
    })

    describe('Login Flow', () => {
        beforeEach(() => {
            cy.visit('/login')
        })

        it('should display login form', () => {
            cy.get('h1').should('contain', 'Admin Login')
            cy.get('[data-cy="email-input"]').should('be.visible')
            cy.get('[data-cy="password-input"]').should('be.visible')
            cy.get('[data-cy="login-button"]').should('contain', 'Login')
        })

        it('should show validation errors for empty fields', () => {
            cy.get('[data-cy="login-button"]').click()

            cy.get('[data-cy="email-error"]').should('be.visible')
            cy.get('[data-cy="password-error"]').should('be.visible')

            // Should still be on login page
            cy.url().should('include', '/login')
        })

        it('should successfully login with correct credentials', () => {
            cy.get('[data-cy="email-input"]').type('test@t.ca')
            cy.get('[data-cy="password-input"]').type('123456Pw')
            cy.get('[data-cy="login-button"]').click()

            // Should redirect to dashboard
            cy.url().should('include', '/dashboard')
            cy.get('h1').should('contain', 'Dashboard')

            // Verify authentication via API
            cy.verifyLoggedIn()
        })

        it('should show error for invalid credentials', () => {
            cy.get('[data-cy="email-input"]').type('wrong@email.com')
            cy.get('[data-cy="password-input"]').type('wrongpassword')
            cy.get('[data-cy="login-button"]').click()

            // Should show submission error
            cy.get('.bg-red-100').should('be.visible')
            cy.url().should('include', '/login')
        })
    })

    describe('Route Protection', () => {
        const protectedRoutes = ['/dashboard', '/add-pet', '/add-location']

        protectedRoutes.forEach(route => {
            it(`should redirect ${route} to login when not authenticated`, () => {
                cy.visit(route)
                cy.url().should('include', '/login')
            })
        })

        it('should allow access to protected routes when authenticated', () => {
            cy.login()

            cy.visit('/dashboard')
            cy.url().should('include', '/dashboard')

            cy.visit('/add-pet')
            cy.url().should('include', '/add-pet')

            cy.visit('/add-location')
            cy.url().should('include', '/add-location')
        })
    })

    describe('Navigation State', () => {
        it('should show public navigation when logged out', () => {
            cy.visit('/')

            cy.get('nav').should('contain', 'Home')
            cy.get('nav').should('contain', 'Login')
            cy.get('nav').should('not.contain', 'Dashboard')
        })

        it('should show authenticated navigation when logged in', () => {
            cy.login()
            cy.visit('/')

            cy.get('nav').should('contain', 'Home')
            cy.get('nav').should('contain', 'Dashboard')
            cy.get('nav').should('contain', 'Add Pet')
            cy.get('nav').should('contain', 'Logout')
            cy.get('nav').should('not.contain', 'Login')
        })
    })

    describe('Session Management', () => {
        it('should maintain login state across page refreshes', () => {
            cy.login()
            cy.url().should('include', '/dashboard')

            // Refresh page
            cy.reload()

            // Should still be logged in
            cy.url().should('include', '/dashboard')
            cy.verifyLoggedIn()
        })

        it('should handle session expiry', () => {
            cy.login()

            // Clear session cookie
            cy.clearCookies()

            // Try to access protected route
            cy.visit('/dashboard')
            cy.url().should('include', '/login')

            // Verify API responds with 401
            cy.verifyLoggedOut()
        })
    })
})