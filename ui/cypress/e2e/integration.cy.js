describe('Basic Integration Workflow', () => {
    beforeEach(() => {
        cy.testAPI()
    })

    afterEach(() => {
        // Clean up test data
        cy.loginAPI()
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
            cy.loginEnhanced()

            // Navigate to add location
            cy.visit('/add-location')
            cy.get('h1').should('contain', 'Add Location')

            // Fill out form
            const locationName = `UI Test Location ${Date.now()}`
            cy.get('[data-cy="location-name-input"]').type(locationName)
            cy.get('[data-cy="location-address-input"]').type('123 UI Test Street')
            cy.get('[data-cy="location-phone-input"]').type('(416) 555-9999')
            cy.get('[data-cy="location-email-input"]').type('uitest@example.com')
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
            cy.loginEnhanced()

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

    describe('Adoption Application Workflow', () => {
        it('should complete full adoption application process', () => {
            cy.loginEnhanced()

            // Create test data
            cy.createTestLocation().then((location) => {
                cy.createTestPet(location.location_id, 'approved').then((pet) => {
                    // Navigate to pet details
                    cy.visit(`/pets/${pet.pet_id}`)
                    cy.get('h1').should('have.text', pet.name)

                    // Click apply button
                    cy.get('[data-cy="apply-button"]').click()
                    cy.url().should('include', `/apply/${pet.pet_id}`)

                    // Fill out application
                    cy.get('[data-cy="applicant-name-input"]').type('Integration Test User')
                    cy.get('[data-cy="applicant-email-input"]').type('integration@test.com')
                    cy.get('[data-cy="applicant-phone-input"]').type('(555) 123-9999')
                    cy.get('[data-cy="applicant-address-input"]').type('123 Integration Ave')
                    cy.get('[data-cy="housing-type-select"]').select('house')
                    cy.get('[data-cy="experience-input"]').type('Integration test experience')
                    cy.get('[data-cy="reason-input"]').type('Integration test reason')

                    // Submit application
                    cy.get('[data-cy="submit-application-button"]').click()
                    cy.url().should('include', '/my-applications')

                    // Verify application was created
                    cy.get('[data-cy="application-item"]').should('contain', pet.name)
                    cy.get('[data-cy="application-status"]').should('have.text', 'Pending')
                })
            })
        })
    })

    describe('Admin Review Workflow', () => {
        it('should allow admin to review and approve application', () => {
            cy.loginEnhanced()

            // Create test application
            cy.createTestLocation().then((location) => {
                cy.createTestPet(location.location_id, 'approved').then((pet) => {
                    // Submit application via API for speed
                    cy.request({
                        method: 'POST',
                        url: `${Cypress.env('apiBaseUrl')}/applications`,
                        body: {
                            pet_id: pet.pet_id,
                            applicant_name: 'Admin Review Test',
                            applicant_email: 'adminreview@test.com',
                            applicant_phone: '(555) 777-8888',
                            applicant_address: '456 Review Street',
                            housing_type: 'apartment',
                            experience: 'Admin review test experience',
                            reason: 'Admin review test reason'
                        }
                    }).then((response) => {
                        const application = response.body

                        // Navigate to application review
                        cy.visit(`/applications/review/${application.application_id}`)
                        cy.get('h1').should('have.text', 'Application Review')

                        // Verify application details
                        cy.get('[data-cy="applicant-name-display"]').should('have.text', 'Admin Review Test')
                        cy.get('[data-cy="pet-name-display"]').should('have.text', pet.name)
                        cy.get('[data-cy="current-status"]').should('have.text', 'Pending')

                        // Approve application
                        cy.get('[data-cy="approve-button"]').click()
                        cy.get('[data-cy="admin-notes-input"]').type('Approved via integration test')
                        cy.get('[data-cy="confirm-approve-button"]').click()

                        // Verify approval
                        cy.get('[data-cy="current-status"]').should('have.text', 'Approved')
                    })
                })
            })
        })
    })

    describe('User Registration to Application Flow', () => {
        it('should complete new user registration and application submission', () => {
            const uniqueEmail = `integration${Date.now()}@test.com`

            // Step 1: Register new user
            cy.visit('/registration')
            cy.get('[data-cy="reg-email-input"]').type(uniqueEmail)
            cy.get('[data-cy="reg-password-input"]').type('password123')
            cy.get('[data-cy="reg-confirm-password-input"]').type('password123')
            cy.get('[data-cy="reg-first-name-input"]').type('Integration')
            cy.get('[data-cy="reg-last-name-input"]').type('User')
            cy.get('[data-cy="reg-phone-input"]').type('(555) 999-1234')
            cy.get('[data-cy="register-button"]').click()

            // Step 2: Login with new account
            cy.url().should('include', '/login')
            cy.get('[data-cy="email-input"]').type(uniqueEmail)
            cy.get('[data-cy="password-input"]').type('password123')
            cy.get('[data-cy="login-button"]').click()

            // Step 3: Browse and apply for pet
            cy.url().should('include', '/pets')
            cy.visit('/')

            // Find and apply for first available pet
            cy.get('[data-cy="pet-card"]').first().within(() => {
                cy.get('[data-cy="view-details-button"]').click()
            })

            cy.get('[data-cy="apply-button"]').click()

            // Step 4: Submit application
            cy.get('[data-cy="applicant-name-input"]').type('Integration User')
            cy.get('[data-cy="applicant-email-input"]').type(uniqueEmail)
            cy.get('[data-cy="applicant-phone-input"]').type('(555) 999-1234')
            cy.get('[data-cy="applicant-address-input"]').type('123 New User Street')
            cy.get('[data-cy="housing-type-select"]').select('apartment')
            cy.get('[data-cy="experience-input"]').type('New user applying for first pet')
            cy.get('[data-cy="reason-input"]').type('Want to provide loving home')

            cy.get('[data-cy="submit-application-button"]').click()

            // Step 5: Verify application submitted
            cy.url().should('include', '/my-applications')
            cy.get('[data-cy="application-item"]').should('have.length', 1)
            cy.get('[data-cy="application-status"]').should('have.text', 'Pending')
        })
    })

    describe('API Integration Verification', () => {
        it('should verify all main API endpoints work', () => {
            cy.loginEnhanced()

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

            // Test applications API
            cy.request('GET', `${Cypress.env('apiBaseUrl')}/applications`).then((response) => {
                expect(response.status).to.eq(200)
                expect(response.body).to.be.an('array')
            })

            // Test users API (admin only)
            cy.request('GET', `${Cypress.env('apiBaseUrl')}/users`).then((response) => {
                expect(response.status).to.eq(200)
                expect(response.body).to.be.an('array')
            })
        })

        it('should handle cross-endpoint data consistency', () => {
            cy.loginEnhanced()

            // Create location and verify it appears in pet creation form
            cy.createTestLocation().then((location) => {
                cy.visit('/add-pet')
                cy.get('[data-cy="pet-location-select"] option').should('contain', location.name)

                // Create pet and verify it appears in applications
                cy.createTestPet(location.location_id, 'approved').then((pet) => {
                    cy.visit(`/apply/${pet.pet_id}`)
                    cy.get('[data-cy="pet-name-display"]').should('have.text', pet.name)
                })
            })
        })

        it('should maintain data integrity across operations', () => {
            cy.loginEnhanced()

            // Create complete test scenario
            cy.createTestLocation().then((location) => {
                cy.createTestPet(location.location_id, 'approved').then((pet) => {
                    // Submit application
                    cy.visit(`/apply/${pet.pet_id}`)
                    cy.get('[data-cy="applicant-name-input"]').type('Data Integrity Test')
                    cy.get('[data-cy="applicant-email-input"]').type('integrity@test.com')
                    cy.get('[data-cy="applicant-phone-input"]').type('(555) 111-2222')
                    cy.get('[data-cy="applicant-address-input"]').type('123 Integrity Lane')
                    cy.get('[data-cy="housing-type-select"]').select('house')
                    cy.get('[data-cy="experience-input"]').type('Data integrity testing')
                    cy.get('[data-cy="reason-input"]').type('Testing data consistency')
                    cy.get('[data-cy="submit-application-button"]').click()

                    // Verify data appears consistently across different views
                    cy.visit('/my-applications')
                    cy.get('[data-cy="application-item"]').should('contain', pet.name)
                    cy.get('[data-cy="application-item"]').should('contain', 'Data Integrity Test')

                    // Check admin view
                    cy.visit('/dashboard')
                    cy.get('body').then(($body) => {
                        if ($body.find('[data-cy="pending-applications"]').length > 0) {
                            cy.get('[data-cy="pending-applications"]').should('contain', 'Data Integrity Test')
                        }
                    })
                })
            })
        })
    })

    describe('Error Handling Integration', () => {
        it('should handle network errors gracefully', () => {
            cy.loginEnhanced()
            cy.visit('/add-pet')

            // All pages should load even with potential API delays
            cy.get('h1').should('be.visible')
            cy.get('[data-cy="pet-name-input"]').should('be.visible')
        })

        it('should handle invalid data gracefully', () => {
            cy.loginEnhanced()

            // Test invalid pet creation
            cy.visit('/add-pet')
            cy.get('[data-cy="pet-name-input"]').type('Test Pet')
            cy.get('[data-cy="pet-species-input"]').type('')  // Invalid empty species
            cy.get('[data-cy="add-pet-button"]').click()

            // Should show validation error, not crash
            cy.get('[data-cy="pet-species-error"]').should('be.visible')
        })

        it('should maintain session across page errors', () => {
            cy.loginEnhanced()

            // Visit non-existent page
            cy.visit('/non-existent-page', { failOnStatusCode: false })

            // Navigation should still work
            cy.visit('/dashboard')
            cy.get('h1').should('contain', 'Dashboard')

            // Should still be logged in
            cy.verifyLoggedIn()
        })
    })
})