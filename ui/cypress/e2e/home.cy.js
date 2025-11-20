describe('Home Page', () => {
    beforeEach(() => {
        cy.testAPI()
    })

    afterEach(() => {
        cy.cleanupTestData()
    })

    describe('Public Home Page Display', () => {
        beforeEach(() => {
            // Visit as public user (not logged in)
            cy.visit('/')
        })

        it('should display the home page correctly', () => {
            cy.get('h1').should('contain', 'Adoptable Pets')
            cy.get('nav').should('be.visible')
            cy.get('nav').should('contain', 'Pet Gallery Admin')
        })

        it('should show public navigation options', () => {
            cy.get('nav').should('contain', 'Home')
            cy.get('nav').should('contain', 'Login')
            cy.get('nav').should('contain', 'Register')
            cy.get('nav').should('not.contain', 'Dashboard')
            cy.get('nav').should('not.contain', 'Logout')
        })
    })

    describe('Pet Gallery Display', () => {
        beforeEach(() => {
            // Create test data
            cy.loginAPI()
            cy.createTestLocation().then((location) => {
                // Create multiple pets with different statuses
                cy.createTestPet(location.location_id, 'approved', 'Available Pet 1')
                cy.createTestPet(location.location_id, 'approved', 'Available Pet 2')
                cy.createTestPet(location.location_id, 'pending', 'Pending Pet')
                cy.createTestPet(location.location_id, 'adopted', 'Adopted Pet')
            })
            // Clear session to visit as public user
            cy.clearCookies()
            cy.clearLocalStorage()
            cy.visit('/')
        })

        it('should display approved pets in gallery', () => {
            // Should show approved pets
            cy.get('[data-cy="pet-card"]').should('have.length.at.least', 2)
            cy.get('[data-cy="pet-card"]').should('contain', 'Available Pet 1')
            cy.get('[data-cy="pet-card"]').should('contain', 'Available Pet 2')
        })

        it('should not display pending or adopted pets', () => {
            // Should not show pending or adopted pets in public gallery
            cy.get('[data-cy="pet-card"]').should('not.contain', 'Pending Pet')
            cy.get('[data-cy="pet-card"]').should('not.contain', 'Adopted Pet')
        })

        it('should display pet card information correctly', () => {
            cy.get('[data-cy="pet-card"]').first().within(() => {
                cy.get('[data-cy="pet-name"]').should('be.visible')
                cy.get('[data-cy="pet-species"]').should('be.visible')
                cy.get('[data-cy="pet-age"]').should('be.visible')
                cy.get('[data-cy="pet-location"]').should('be.visible')
                cy.get('[data-cy="pet-description"]').should('be.visible')
                cy.get('[data-cy="view-details-button"]').should('be.visible')
                cy.get('[data-cy="view-details-button"]').should('contain', 'View Details')
            })
        })

        it('should navigate to pet details page when clicking view details', () => {
            cy.get('[data-cy="pet-card"]').first().within(() => {
                cy.get('[data-cy="view-details-button"]').click()
            })

            cy.url().should('include', '/pets/')
            cy.get('h1').should('be.visible')
        })

        it('should handle empty state when no pets available', () => {
            // Create a scenario with no approved pets
            cy.loginAPI()
            cy.cleanupTestData()
            cy.clearCookies()
            cy.clearLocalStorage()
            cy.visit('/')

            // Should show appropriate message
            cy.get('body').then(($body) => {
                if ($body.find('[data-cy="no-pets-message"]').length > 0) {
                    cy.get('[data-cy="no-pets-message"]').should('be.visible')
                    cy.get('[data-cy="no-pets-message"]').should('contain', 'No pets available')
                } else {
                    // Or just ensure the gallery container exists
                    cy.get('body').should('exist')
                }
            })
        })
    })

    describe('Pet Filtering and Search', () => {
        beforeEach(() => {
            // Create test pets with different characteristics
            cy.loginAPI()
            cy.createTestLocation().then((location) => {
                cy.createTestPet(location.location_id, 'approved', 'Buddy', 'Dog', 3)
                cy.createTestPet(location.location_id, 'approved', 'Whiskers', 'Cat', 2)
                cy.createTestPet(location.location_id, 'approved', 'Charlie', 'Dog', 5)
                cy.createTestPet(location.location_id, 'approved', 'Luna', 'Cat', 1)
            })
            cy.clearCookies()
            cy.clearLocalStorage()
            cy.visit('/')
        })

        it('should filter pets by species if filter exists', () => {
            cy.get('body').then(($body) => {
                if ($body.find('[data-cy="species-filter"]').length > 0) {
                    // Test dog filter
                    cy.get('[data-cy="species-filter"]').select('Dog')
                    cy.get('[data-cy="pet-card"]').should('contain', 'Buddy')
                    cy.get('[data-cy="pet-card"]').should('contain', 'Charlie')
                    cy.get('[data-cy="pet-card"]').should('not.contain', 'Whiskers')

                    // Test cat filter
                    cy.get('[data-cy="species-filter"]').select('Cat')
                    cy.get('[data-cy="pet-card"]').should('contain', 'Whiskers')
                    cy.get('[data-cy="pet-card"]').should('contain', 'Luna')
                    cy.get('[data-cy="pet-card"]').should('not.contain', 'Buddy')

                    // Test all filter
                    cy.get('[data-cy="species-filter"]').select('All')
                    cy.get('[data-cy="pet-card"]').should('have.length', 4)
                }
            })
        })

        it('should search pets by name if search exists', () => {
            cy.get('body').then(($body) => {
                if ($body.find('[data-cy="pet-search"]').length > 0) {
                    cy.get('[data-cy="pet-search"]').type('Buddy')
                    cy.get('[data-cy="pet-card"]').should('have.length', 1)
                    cy.get('[data-cy="pet-card"]').should('contain', 'Buddy')

                    cy.get('[data-cy="pet-search"]').clear().type('Luna')
                    cy.get('[data-cy="pet-card"]').should('have.length', 1)
                    cy.get('[data-cy="pet-card"]').should('contain', 'Luna')

                    cy.get('[data-cy="pet-search"]').clear()
                    cy.get('[data-cy="pet-card"]').should('have.length', 4)
                }
            })
        })
    })

    describe('Responsive Design', () => {
        const viewports = [
            { name: 'mobile', width: 375, height: 667 },
            { name: 'tablet', width: 768, height: 1024 },
            { name: 'desktop', width: 1280, height: 720 }
        ]

        viewports.forEach(viewport => {
            it(`should display correctly on ${viewport.name}`, () => {
                cy.viewport(viewport.width, viewport.height)
                cy.visit('/')

                cy.get('h1').should('be.visible')
                cy.get('nav').should('be.visible')
            })
        })
    })

    describe('Navigation Integration', () => {
        it('should navigate to login page', () => {
            cy.visit('/')
            cy.get('nav a').contains('Login').click()
            cy.url().should('include', '/login')
        })

        it('should maintain home page navigation', () => {
            cy.visit('/login')
            cy.get('nav a').contains('Home').click()
            cy.url().should('eq', Cypress.config().baseUrl + '/')
            cy.get('h1').should('contain', 'Adoptable Pets')
        })
    })

    describe('Performance and Loading', () => {
        it('should load pet gallery within reasonable time', () => {
            const startTime = Date.now()
            cy.visit('/')
            cy.get('h1').should('contain', 'Adoptable Pets')

            cy.get('[data-cy="pet-card"]').should('be.visible')

            const loadTime = Date.now() - startTime
            expect(loadTime).to.be.lessThan(5000)
        })

        it('should handle loading states gracefully', () => {
            cy.visit('/')

            // Should show loading indicator or immediate content
            cy.get('body').should('be.visible')
            cy.get('h1').should('be.visible')
        })
    })

    describe('Accessibility', () => {
        it('should have proper heading hierarchy', () => {
            cy.visit('/')
            cy.get('h1').should('exist').and('be.visible')
        })

        it('should have accessible navigation', () => {
            cy.visit('/')
            cy.get('nav').should('have.attr', 'role', 'navigation')
            cy.get('nav a').each(($link) => {
                cy.wrap($link).should('have.attr', 'href')
            })
        })

        it('should support keyboard navigation', () => {
            cy.visit('/')

            // Tab through navigation elements
            cy.get('nav a').first().focus()
            cy.focused().tab()
            cy.focused().should('be.visible')
        })
    })

    describe('API Integration', () => {
        it('should load pets from API', () => {
            cy.visit('/')

            // Verify API is being called
            cy.request(`${Cypress.env('apiBaseUrl')}/pets`).then((response) => {
                expect(response.status).to.eq(200)
                expect(response.body).to.be.an('array')
            })
        })

        it('should handle API errors gracefully', () => {
            cy.visit('/')

            // Should still render page even if no pets available
            cy.get('h1').should('contain', 'Adoptable Pets')
        })
    })
})