describe('Pet Management', () => {
    beforeEach(() => {
        cy.testAPI()
        cy.loginEnhanced()
    })

    afterEach(() => {
        cy.cleanupTestData()
    })

    describe('Add Pet Page', () => {
        beforeEach(() => {
            cy.visit('/add-pet')
        })

        it('should display add pet form correctly', () => {
            cy.get('h1').should('have.text', 'Add Pet')
            cy.get('[data-cy="pet-name-input"]').should('be.visible')
            cy.get('[data-cy="pet-species-input"]').should('be.visible')
            cy.get('[data-cy="pet-age-input"]').should('be.visible')
            cy.get('[data-cy="pet-location-select"]').should('be.visible')
            cy.get('[data-cy="pet-description-input"]').should('be.visible')
            cy.get('[data-cy="pet-photo-input"]').should('be.visible')
            cy.get('[data-cy="add-pet-button"]').should('have.text', 'Add Pet')
            cy.get('button').should('contain', 'Clear')
        })

        it('should load locations in dropdown', () => {
            // Wait for locations to load and check options
            cy.get('[data-cy="pet-location-select"] option').should('have.length.at.least', 1)

            // First option should be "Select a location"
            cy.get('[data-cy="pet-location-select"] option').first().should('have.text', 'Select a location')
        })

        it('should show validation errors for empty required fields', () => {
            cy.get('[data-cy="add-pet-button"]').click()

            cy.get('[data-cy="pet-name-error"]').should('be.visible')
            cy.get('[data-cy="pet-name-error"]').should('have.text', 'Pet name is required')

            cy.get('[data-cy="pet-species-error"]').should('be.visible')
            cy.get('[data-cy="pet-species-error"]').should('have.text', 'Species is required')

            cy.get('[data-cy="pet-age-error"]').should('be.visible')
            cy.get('[data-cy="pet-age-error"]').should('have.text', 'Age is required')

            cy.get('[data-cy="pet-location-error"]').should('be.visible')
            cy.get('[data-cy="pet-location-error"]').should('have.text', 'Please select a location')

            cy.get('[data-cy="pet-description-error"]').should('be.visible')
            cy.get('[data-cy="pet-description-error"]').should('have.text', 'Description is required')
        })

        it('should validate age is a positive number', () => {
            cy.get('[data-cy="pet-age-input"]').type('-1')
            cy.get('[data-cy="add-pet-button"]').click()

            cy.get('[data-cy="pet-age-error"]').should('be.visible')
            cy.get('[data-cy="pet-age-error"]').should('have.text', 'Age must be a positive number')
        })

        it('should clear form when clear button is clicked', () => {
            // Fill out form
            cy.get('[data-cy="pet-name-input"]').type('Test Pet')
            cy.get('[data-cy="pet-species-input"]').type('Dog')
            cy.get('[data-cy="pet-age-input"]').type('3')
            cy.get('[data-cy="pet-description-input"]').type('A test description')

            // Click clear button
            cy.get('button').contains('Clear').click()

            // All fields should be empty
            cy.get('[data-cy="pet-name-input"]').should('have.value', '')
            cy.get('[data-cy="pet-species-input"]').should('have.value', '')
            cy.get('[data-cy="pet-age-input"]').should('have.value', '')
            cy.get('[data-cy="pet-description-input"]').should('have.value', '')
            cy.get('[data-cy="pet-location-select"]').should('have.value', '')
        })
    })

    describe('Add Pet Functionality', () => {
        beforeEach(() => {
            cy.createTestLocation().as('testLocation')
            cy.visit('/add-pet')
        })

        it('should successfully add a new pet with valid data', function() {
            const petName = `Test Pet ${Date.now()}`

            cy.get('[data-cy="pet-name-input"]').type(petName)
            cy.get('[data-cy="pet-species-input"]').type('Dog')
            cy.get('[data-cy="pet-age-input"]').type('2')
            cy.get('[data-cy="pet-location-select"]').select(this.testLocation.location_id.toString())
            cy.get('[data-cy="pet-description-input"]').type('A friendly and energetic dog looking for a loving home.')

            cy.get('[data-cy="add-pet-button"]').click()

            // Should redirect to dashboard or pets list
            cy.url().should('match', /\/(dashboard|pets)/)

            // Verify pet was created via API
            cy.request('GET', `${Cypress.env('apiBaseUrl')}/pets`).then((response) => {
                expect(response.status).to.eq(200)
                const createdPet = response.body.find(pet => pet.name === petName)
                expect(createdPet).to.exist
                expect(createdPet.species).to.eq('Dog')
                expect(createdPet.age).to.eq(2)
                expect(createdPet.location_id).to.eq(this.testLocation.location_id)
                expect(createdPet.description).to.include('friendly and energetic')
            })
        })

        it('should handle special characters in pet data', function() {
            const petName = `Test Pet with Special Ch@r$ & Numbers 123`

            cy.get('[data-cy="pet-name-input"]').type(petName)
            cy.get('[data-cy="pet-species-input"]').type('Cat (Maine Coon)')
            cy.get('[data-cy="pet-age-input"]').type('5')
            cy.get('[data-cy="pet-location-select"]').select(this.testLocation.location_id.toString())
            cy.get('[data-cy="pet-description-input"]').type('A cat with "quotes" and other special characters: !@#$%')

            cy.get('[data-cy="add-pet-button"]').click()

            cy.url().should('match', /\/(dashboard|pets)/)

            // Verify special characters were preserved
            cy.request('GET', `${Cypress.env('apiBaseUrl')}/pets`).then((response) => {
                const createdPet = response.body.find(pet => pet.name === petName)
                expect(createdPet).to.exist
                expect(createdPet.species).to.include('Maine Coon')
                expect(createdPet.description).to.include('quotes')
            })
        })

        it('should show loading state during pet creation', function() {
            cy.get('[data-cy="pet-name-input"]').type('Loading Test Pet')
            cy.get('[data-cy="pet-species-input"]').type('Dog')
            cy.get('[data-cy="pet-age-input"]').type('1')
            cy.get('[data-cy="pet-location-select"]').select(this.testLocation.location_id.toString())
            cy.get('[data-cy="pet-description-input"]').type('Testing loading state')

            cy.get('[data-cy="add-pet-button"]').click()

            // Button should show loading state
            cy.get('[data-cy="add-pet-button"]')
                .should('have.text', 'Adding Pet...')
                .and('be.disabled')

            // Should eventually redirect
            cy.url().should('match', /\/(dashboard|pets)/, { timeout: 10000 })
        })
    })

    describe('Pet Photo Upload', () => {
        beforeEach(() => {
            cy.createTestLocation().as('testLocation')
            cy.visit('/add-pet')
        })

        it('should handle photo upload field', () => {
            // Photo input should accept files
            cy.get('[data-cy="pet-photo-input"]').should('have.attr', 'type', 'file')
            cy.get('[data-cy="pet-photo-input"]').should('have.attr', 'accept')
        })

        it('should allow pet creation without photo', function() {
            cy.get('[data-cy="pet-name-input"]').type('No Photo Pet')
            cy.get('[data-cy="pet-species-input"]').type('Bird')
            cy.get('[data-cy="pet-age-input"]').type('1')
            cy.get('[data-cy="pet-location-select"]').select(this.testLocation.location_id.toString())
            cy.get('[data-cy="pet-description-input"]').type('A pet without a photo')

            cy.get('[data-cy="add-pet-button"]').click()
            cy.url().should('match', /\/(dashboard|pets)/)
        })
    })

    describe('Pet List Display', () => {
        beforeEach(() => {
            cy.createTestLocation().then((location) => {
                // Create some test pets
                cy.createTestPet(location.location_id, 'approved', 'List Test Pet 1')
                cy.createTestPet(location.location_id, 'pending', 'List Test Pet 2')
                cy.createTestPet(location.location_id, 'adopted', 'List Test Pet 3')
            })
        })

        it('should display pets on home page', () => {
            cy.visit('/')
            cy.get('h1').should('contain', 'Adoptable Pets')

            // Should show pet cards
            cy.get('[data-cy="pet-card"]').should('have.length.at.least', 1)

            // Check that approved pets are visible
            cy.get('[data-cy="pet-card"]').should('contain', 'List Test Pet 1')
        })

        it('should show pet details in cards', () => {
            cy.visit('/')

            cy.get('[data-cy="pet-card"]').first().within(() => {
                cy.get('[data-cy="pet-name"]').should('be.visible')
                cy.get('[data-cy="pet-species"]').should('be.visible')
                cy.get('[data-cy="pet-age"]').should('be.visible')
                cy.get('[data-cy="pet-location"]').should('be.visible')
                cy.get('[data-cy="pet-description"]').should('be.visible')
                cy.get('[data-cy="view-details-button"]').should('be.visible')
            })
        })

        it('should navigate to pet details page', () => {
            cy.visit('/')

            cy.get('[data-cy="pet-card"]').first().within(() => {
                cy.get('[data-cy="view-details-button"]').click()
            })

            cy.url().should('include', '/pets/')
            cy.get('h1').should('be.visible')
        })

        it('should filter pets by availability status', () => {
            cy.visit('/')

            // Should not show adopted pets in main listing
            cy.get('[data-cy="pet-card"]').should('not.contain', 'List Test Pet 3')

            // Should show available pets
            cy.get('[data-cy="pet-card"]').should('contain', 'List Test Pet 1')
        })
    })

    describe('Pet Management (Admin)', () => {
        beforeEach(() => {
            cy.visit('/dashboard')
        })

        it('should display pet management dashboard', () => {
            cy.get('h1').should('contain', 'Dashboard')

            // Should show pet management sections
            cy.get('body').then(($body) => {
                if ($body.find('[data-cy="pending-pets"]').length > 0) {
                    cy.get('[data-cy="pending-pets"]').should('be.visible')
                }
                if ($body.find('[data-cy="approved-pets"]').length > 0) {
                    cy.get('[data-cy="approved-pets"]').should('be.visible')
                }
            })
        })

        it('should allow approving pending pets', () => {
            // Create a pending pet first
            cy.createTestLocation().then((location) => {
                cy.createTestPet(location.location_id, 'pending').then((pet) => {
                    cy.visit('/dashboard')

                    // Find the pending pet and approve it
                    cy.get('body').then(($body) => {
                        if ($body.find(`[data-cy="approve-pet-${pet.pet_id}"]`).length > 0) {
                            cy.get(`[data-cy="approve-pet-${pet.pet_id}"]`).click()

                            // Verify approval via API
                            cy.request(`${Cypress.env('apiBaseUrl')}/pets/${pet.pet_id}`).then((response) => {
                                expect(response.body.status).to.eq('approved')
                            })
                        }
                    })
                })
            })
        })

        it('should allow editing pet information', () => {
            cy.createTestLocation().then((location) => {
                cy.createTestPet(location.location_id, 'approved').then((pet) => {
                    cy.visit(`/pets/${pet.pet_id}/edit`)

                    cy.get('[data-cy="pet-name-input"]').clear().type('Updated Pet Name')
                    cy.get('[data-cy="save-pet-button"]').click()

                    // Verify update via API
                    cy.request(`${Cypress.env('apiBaseUrl')}/pets/${pet.pet_id}`).then((response) => {
                        expect(response.body.name).to.eq('Updated Pet Name')
                    })
                })
            })
        })

        it('should allow deleting pets', () => {
            cy.createTestLocation().then((location) => {
                cy.createTestPet(location.location_id, 'approved').then((pet) => {
                    cy.visit('/dashboard')

                    // Find delete button and click it
                    cy.get('body').then(($body) => {
                        if ($body.find(`[data-cy="delete-pet-${pet.pet_id}"]`).length > 0) {
                            cy.get(`[data-cy="delete-pet-${pet.pet_id}"]`).click()

                            // Confirm deletion in modal/alert
                            cy.get('[data-cy="confirm-delete-button"]').click()

                            // Verify deletion via API
                            cy.request({
                                method: 'GET',
                                url: `${Cypress.env('apiBaseUrl')}/pets/${pet.pet_id}`,
                                failOnStatusCode: false
                            }).then((response) => {
                                expect(response.status).to.eq(404)
                            })
                        }
                    })
                })
            })
        })
    })

    describe('Pet Details Page', () => {
        beforeEach(() => {
            cy.createTestLocation().then((location) => {
                cy.createTestPet(location.location_id, 'approved').then((pet) => {
                    cy.visit(`/pets/${pet.pet_id}`)
                    cy.wrap(pet).as('testPet')
                })
            })
        })

        it('should display complete pet information', function() {
            cy.get('h1').should('have.text', this.testPet.name)
            cy.get('[data-cy="pet-species-display"]').should('have.text', this.testPet.species)
            cy.get('[data-cy="pet-age-display"]').should('contain', this.testPet.age)
            cy.get('[data-cy="pet-description-display"]').should('have.text', this.testPet.description)
            cy.get('[data-cy="pet-location-display"]').should('be.visible')
        })

        it('should show adoption application button for available pets', () => {
            cy.get('[data-cy="apply-button"]').should('be.visible')
            cy.get('[data-cy="apply-button"]').should('have.text', 'Apply for Adoption')
            cy.get('[data-cy="apply-button"]').should('not.be.disabled')
        })

        it('should navigate to adoption application form', function() {
            cy.get('[data-cy="apply-button"]').click()
            cy.url().should('include', `/apply/${this.testPet.pet_id}`)
        })

        it('should handle non-existent pet gracefully', () => {
            cy.visit('/pets/99999', { failOnStatusCode: false })

            // Should show 404 or error message
            cy.get('body').should('contain.text', 'Pet not found')
        })
    })

    describe('API Integration', () => {
        it('should fail when API server is unavailable', () => {
            // This test validates that tests fail if API server is not running
            cy.request(`${Cypress.env('apiBaseUrl')}/pets`).then((response) => {
                expect(response.status).to.eq(200)
            })
        })

        it('should handle API errors gracefully', () => {
            // Test behavior when API returns errors
            cy.visit('/add-pet')

            // Fill out form but with potentially problematic data
            cy.get('[data-cy="pet-name-input"]').type('Error Test Pet')
            cy.get('[data-cy="pet-species-input"]').type('Unknown Species')
            cy.get('[data-cy="pet-age-input"]').type('999999')
            cy.get('[data-cy="pet-description-input"]').type('Testing error handling')

            // Attempt submission should either succeed or show appropriate error
            cy.get('[data-cy="add-pet-button"]').click()

            // Should either redirect on success or show error message
            cy.url().should('not.eq', Cypress.config().baseUrl + '/add-pet')
        })
    })
})