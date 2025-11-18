describe('Basic Integration Workflow', () => {
    beforeEach(() => {
        cy.waitForAPI()
    })

    afterEach(() => {
        // Clean up test data
        cy.loginViaAPI()
        cy.cleanupTestData()
    })

    describe('Complete Authentication and Navigation Flow', () => {
        it('should complete login to dashboard workflow', () => {
            // Step 1: Visit home page as public user
            cy.visit('/')
            cy.get('h1').should('contain', 'Adoptable Pets')

            // Step 2: Navigate to login
            cy.get('nav a').contains('Login').click()
            cy.url().should('include', '/login')

            // Step 3: Login as admin
            cy.get('[data-cy="email-input"]').type('test@t.ca')
            cy.get('[data-cy="password-input"]').type('123456Pw')
            cy.get('[data-cy="login-button"]').click()

            // Step 4: Should be redirected to dashboard
            cy.url().should('include', '/dashboard')
            cy.get('h1').should('contain', 'Dashboard')

            // Step 5: Verify navigation shows authenticated links
            cy.get('nav').should('contain', 'Dashboard')
            cy.get('nav').should('contain', 'Add Pet')
            cy.get('nav').should('contain', 'Add Location')
            cy.get('nav').should('contain', 'Logout')

            // Step 6: Navigate to different sections
            cy.get('nav a').contains('Add Location').click()
            cy.url().should('include', '/add-location')
            cy.get('h1').should('contain', 'Add Location')

            cy.get('nav a').contains('Add Pet').click()
            cy.url().should('include', '/add-pet')
            cy.get('h1').should('contain', 'Add Pet')

            // Step 7: Return to dashboard
            cy.get('nav a').contains('Dashboard').click()
            cy.url().should('include', '/dashboard')

            // Step 8: Logout
            cy.get('[data-cy="logout-link"]').click()

            // Step 9: Verify logged out state
            cy.get('nav').should('contain', 'Login')
            cy.get('nav').should('not.contain', 'Dashboard')
        })
    })

    describe('Location Creation Workflow', () => {
        it('should create a location through the UI', () => {
            cy.login()

            // Navigate to add location
            cy.visit('/add-location')
            cy.get('h1').should('contain', 'Add Location')

            // Fill out form
            const locationName = `UI Test Location ${Date.now()}`
            cy.get('[data-cy="location-name-input"]').type(locationName)
            cy.get('[data-cy="location-address-input"]').type('123 UI Test Street')
            cy.get('[data-cy="location-phone-input"]').type('(416) 555-9999')
            cy.get('[data-cy="add-location-button"]').click()

            // Should redirect to dashboard
            cy.url().should('include', '/dashboard')

            // Verify location was created via API
            cy.request('GET', `${Cypress.env('apiBaseUrl')}/locations`).then((response) => {
                const createdLocation = response.body.find(loc => loc.name === locationName)
                expect(createdLocation).to.exist
            })
        })
    })

    describe('Pet Creation Workflow', () => {
        it('should create a pet through the UI', () => {
            cy.login()

            // First create a location
            cy.createTestLocation().then((location) => {
                // Navigate to add pet
                cy.visit('/add-pet')
                cy.get('h1').should('contain', 'Add Pet')

                // Fill out form
                const petName = `UI Test Pet ${Date.now()}`
                cy.get('[data-cy="pet-name-input"]').type(petName)
                cy.get('[data-cy="pet-species-input"]').type('Test Dog')
                cy.get('[data-cy="pet-age-input"]').type('3')
                cy.get('[data-cy="pet-location-select"]').select(location.location_id.toString())
                cy.get('[data-cy="pet-description-input"]').type('A test pet created through UI workflow')
                cy.get('[data-cy="add-pet-button"]').click()

                // Should redirect to dashboard
                cy.url().should('include', '/dashboard')

                // Verify pet appears in pending section (if elements exist)
                cy.get('body').then(($body) => {
                    if ($body.find('[data-cy="pending-pets"]').length > 0) {
                        cy.get('[data-cy="pending-pets"]').should('contain', petName)
                    }
                })
            })
        })
    })

    describe('API Integration Verification', () => {
        it('should verify all main API endpoints work', () => {
            cy.login()

            // Test authentication API
            cy.verifyLoggedIn()

            // Test locations API
            cy.request('GET', `${Cypress.env('apiBaseUrl')}/locations`).then((response) => {
                expect(response.status).to.eq(200)
                expect(response.body).to.be.an('array')
            })

            // Test pets API
            cy.request('GET', `${Cypress.env('apiBaseUrl')}/pets`).then((response) => {
                expect(response.status).to.eq(200)
                expect(response.body).to.be.an('array')
            })

            // Create location via API
            cy.createTestLocation().then((location) => {
                expect(location).to.have.property('location_id')
                expect(location).to.have.property('name')
            })

            // Test logout API
            cy.request('POST', `${Cypress.env('apiBaseUrl')}/auth/logout`).then((response) => {
                expect(response.status).to.eq(200)
            })

            // Verify logged out
            cy.verifyLoggedOut()
        })
    })

    describe('Error Handling', () => {
        it('should handle form validation errors gracefully', () => {
            cy.login()

            // Try to submit empty location form
            cy.visit('/add-location')
            cy.get('[data-cy="add-location-button"]').click()

            // Should show validation errors
            cy.get('[data-cy="location-name-error"]').should('be.visible')
            cy.get('[data-cy="location-address-error"]').should('be.visible')

            // Should still be on add location page
            cy.url().should('include', '/add-location')
        })

        it('should handle session expiry during workflow', () => {
            cy.login()
            cy.visit('/dashboard')

            // Clear session
            cy.clearCookies()

            // Try to visit protected page
            cy.visit('/add-pet')
            cy.url().should('include', '/login')
        })
    })
})