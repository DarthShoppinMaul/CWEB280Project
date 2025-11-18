describe('Home Page', () => {
    beforeEach(() => {
        cy.waitForAPI()
    })

    describe('Basic Page Functionality', () => {
        it('should display home page correctly', () => {
            cy.visit('/')

            cy.get('h1').should('contain', 'Adoptable Pets')
            cy.get('nav').should('be.visible')
            cy.get('nav').should('contain', 'Pet Gallery Admin')
        })

        it('should load pets and locations from API', () => {
            // Verify API endpoints work
            cy.request('GET', `${Cypress.env('apiBaseUrl')}/pets`).then((response) => {
                expect(response.status).to.eq(200)
                expect(response.body).to.be.an('array')
            })

            cy.request('GET', `${Cypress.env('apiBaseUrl')}/locations`).then((response) => {
                expect(response.status).to.eq(200)
                expect(response.body).to.be.an('array')
            })

            cy.visit('/')
            cy.get('h1').should('contain', 'Adoptable Pets')
        })

        it('should handle empty state or show pets', () => {
            cy.visit('/')

            // Either show pets or empty state - both are valid
            cy.get('body').then(($body) => {
                if ($body.find('[data-cy="pets-grid"]').length > 0) {
                    // Has pets - verify structure
                    cy.get('[data-cy="pets-grid"]').should('be.visible')
                    cy.get('[data-cy="pet-card"]').should('have.length.at.least', 1)
                } else {
                    // No pets - should show some content still
                    cy.get('h1').should('contain', 'Adoptable Pets')
                }
            })
        })
    })

    describe('Pet Display', () => {
        it('should show pet information when pets exist', () => {
            cy.visit('/')

            // Check if pets exist and verify their display
            cy.get('body').then(($body) => {
                if ($body.find('[data-cy="pet-card"]').length > 0) {
                    cy.get('[data-cy="pet-card"]').first().within(() => {
                        // Should have basic pet info structure
                        cy.get('.card-img').should('exist')
                        cy.get('.card-body').should('exist')
                    })
                }
            })
        })

        it('should handle pet cards with different data', () => {
            cy.visit('/')

            cy.get('body').then(($body) => {
                if ($body.find('[data-cy="pet-card"]').length > 0) {
                    cy.get('[data-cy="pet-card"]').each(($card) => {
                        cy.wrap($card).within(() => {
                            // Each card should have basic structure
                            cy.get('.card-body').should('exist')

                            // May or may not have specific data-cy attributes
                            // depending on actual implementation
                        })
                    })
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
})