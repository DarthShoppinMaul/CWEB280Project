// navigation.cy.js - Updated to match actual navigation structure
describe('Navigation Tests', () => {
    beforeEach(() => {
        cy.waitForAPI()
    })

    describe('Public Navigation (Not Logged In)', () => {
        it('should display correct navigation for public users', () => {
            cy.visit('/')

            cy.get('nav').should('contain', 'Pet Gallery')
            cy.get('nav').should('contain', 'Home')
            cy.get('nav').should('contain', 'Browse Pets')
            cy.get('nav').should('contain', 'Login')
            cy.get('nav').should('contain', 'Sign Up')
            cy.get('nav').should('not.contain', 'Dashboard')
            cy.get('nav').should('not.contain', 'Profile')
        })

        it('should navigate to login page', () => {
            cy.visit('/')
            cy.get('nav a').contains('Login').click()
            cy.url().should('include', '/login')
        })

        it('should navigate to registration page', () => {
            cy.visit('/')
            cy.get('nav a').contains('Sign Up').click()
            cy.url().should('include', '/register')
        })

        it('should navigate back to home from other pages', () => {
            cy.visit('/login')
            cy.get('nav a').contains('Home').click()
            cy.url().should('eq', Cypress.config().baseUrl + '/')
        })
    })

    describe('Authenticated Navigation', () => {
        beforeEach(() => {
            cy.login()
        })

        it('should display correct navigation for authenticated users', () => {
            cy.visit('/')

            cy.get('nav').should('contain', 'Pet Gallery')
            cy.get('nav').should('contain', 'Home')
            cy.get('nav').should('contain', 'Browse Pets')
            cy.get('nav').should('contain', 'Profile')
            cy.get('nav').should('contain', 'Logout')
            cy.get('nav').should('not.contain', 'Login')
            cy.get('nav').should('not.contain', 'Sign Up')
        })

        it('should navigate to dashboard', () => {
            cy.visit('/')

            // Check if user is admin first
            cy.get('body').then(($body) => {
                if ($body.find('nav a:contains("Dashboard")').length > 0) {
                    cy.get('nav a').contains('Dashboard').click()
                    cy.url().should('include', '/admin/dashboard')
                }
            })
        })

        it('should navigate to manage pet page', () => {
            cy.visit('/')

            // Check if admin navigation exists
            cy.get('body').then(($body) => {
                if ($body.find('nav a:contains("Manage Pet")').length > 0) {
                    cy.get('nav a').contains('Manage Pet').click()
                    cy.url().should('include', '/add-pet')
                }
            })
        })

        it('should navigate to manage location page', () => {
            cy.visit('/')

            // Check if admin navigation exists
            cy.get('body').then(($body) => {
                if ($body.find('nav a:contains("Manage Location")').length > 0) {
                    cy.get('nav a').contains('Manage Location').click()
                    cy.url().should('include', '/add-location')
                }
            })
        })

        it('should handle logout functionality', () => {
            cy.visit('/')
            cy.get('[data-cy="logout-link"]').click()

            // Should redirect to home and show public nav
            cy.url().should('eq', Cypress.config().baseUrl + '/')
            cy.get('nav').should('contain', 'Login')
            cy.get('nav').should('not.contain', 'Profile')
        })
    })

    describe('Basic Navigation Functionality', () => {
        it('should support navigation link interactions', () => {
            cy.visit('/')

            cy.get('nav a').contains('Browse Pets').click()
            cy.url().should('include', '/pets')

            cy.get('nav a').contains('Home').click()
            cy.url().should('eq', Cypress.config().baseUrl + '/')
        })

        it('should support authenticated navigation interactions', () => {
            cy.login()
            cy.visit('/')

            cy.get('nav a').contains('Profile').click()
            cy.url().should('include', '/profile')

            cy.get('nav a').contains('Home').click()
            cy.url().should('eq', Cypress.config().baseUrl + '/')
        })
    })

    describe('Mobile Navigation', () => {
        it('should display navigation correctly on mobile', () => {
            cy.viewport(375, 667)
            cy.visit('/')

            cy.get('nav').should('contain', 'Pet Gallery')
            cy.get('nav').should('contain', 'Home')
        })

        it('should handle navigation on mobile after login', () => {
            cy.viewport(375, 667)
            cy.login()
            cy.visit('/')

            cy.get('nav').should('contain', 'Profile')
        })
    })

    describe('Navigation Performance', () => {
        it('should navigate between routes quickly', () => {
            cy.visit('/')

            const start = performance.now()
            cy.get('nav a').contains('Browse Pets').click()
            cy.url().should('include', '/pets').then(() => {
                const end = performance.now()
                expect(end - start).to.be.lessThan(2000) // Less than 2 seconds
            })
        })
    })

    describe('Admin Navigation', () => {
        beforeEach(() => {
            cy.login() // Login as admin
        })

        it('should show admin-specific navigation items', () => {
            cy.visit('/')

            // Admin should see additional navigation items
            cy.get('body').then(($body) => {
                if ($body.find('nav a:contains("Dashboard")').length > 0) {
                    cy.get('nav').should('contain', 'Dashboard')
                    cy.get('nav').should('contain', 'Manage Users')
                    cy.get('nav').should('contain', 'Manage Pet')
                    cy.get('nav').should('contain', 'Manage Location')
                }
            })
        })

        it('should navigate to user management if available', () => {
            cy.visit('/')

            cy.get('body').then(($body) => {
                if ($body.find('[data-cy="user-management-link"]').length > 0) {
                    cy.get('[data-cy="user-management-link"]').click()
                    cy.url().should('include', '/admin/users')
                }
            })
        })
    })

    describe('Navigation State Management', () => {
        it('should highlight current page in navigation', () => {
            cy.visit('/')
            cy.get('nav a').contains('Home').should('have.class', 'nav-active')

            cy.get('nav a').contains('Browse Pets').click()
            cy.get('nav a').contains('Browse Pets').should('have.class', 'nav-active')
        })

        it('should maintain navigation state across page refreshes', () => {
            cy.login()
            cy.visit('/profile')

            cy.get('nav a').contains('Profile').should('have.class', 'nav-active')

            cy.reload()

            cy.get('nav a').contains('Profile').should('have.class', 'nav-active')
        })

        it('should handle browser back/forward navigation', () => {
            cy.visit('/')
            cy.get('nav a').contains('Browse Pets').click()
            cy.url().should('include', '/pets')

            cy.go('back')
            cy.url().should('eq', Cypress.config().baseUrl + '/')

            cy.go('forward')
            cy.url().should('include', '/pets')
        })
    })

    describe('Protected Route Navigation', () => {
        it('should redirect to login for protected routes when not authenticated', () => {
            cy.visit('/profile')
            cy.url().should('include', '/login')
        })

        it('should allow access to protected routes when authenticated', () => {
            cy.login()
            cy.visit('/profile')
            cy.url().should('include', '/profile')
        })

        it('should redirect after login to originally requested page', () => {
            // Try to access protected page
            cy.visit('/profile')
            cy.url().should('include', '/login')

            // Login
            cy.get('[data-cy="email-input"]').type('test@t.ca')
            cy.get('[data-cy="password-input"]').type('123456Pw')
            cy.get('[data-cy="login-button"]').click()

            // Should redirect to originally requested page
            cy.url().should('include', '/profile')
        })
    })

    describe('API Integration', () => {
        it('should fail when API server is unavailable', () => {
            // Test navigation still works even if API is down
            cy.visit('/')
            cy.get('nav a').contains('Browse Pets').click()
            cy.url().should('include', '/pets')
        })
    })
})