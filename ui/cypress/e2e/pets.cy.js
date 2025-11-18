describe('Pet Management', () => {
    beforeEach(() => {
        cy.waitForAPI()
        cy.login()
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
        })

        it('should validate pet name length', () => {
            cy.get('[data-cy="pet-name-input"]').type('A')
            cy.get('[data-cy="add-pet-button"]').click()

            cy.get('[data-cy="pet-name-error"]').should('be.visible')
            cy.get('[data-cy="pet-name-error"]').should('have.text', 'Pet name must be at least 2 characters')
        })

        it('should validate age constraints', () => {
            // Clear fields first and add small waits
            cy.get('[data-cy="pet-age-input"]').clear()
            cy.get('[data-cy="pet-name-input"]').clear()

            // Clear and test too high age
            cy.get('[data-cy="pet-age-input"]').clear().type('31')
            cy.get('[data-cy="add-pet-button"]').click()

            cy.wait(100)

            cy.get('[data-cy="pet-age-error"]').should('be.visible')
            cy.get('[data-cy="pet-age-error"]').should('have.text', 'Age seems too high (max 30 years)')
        })

        it('should clear field errors as user types', () => {
            // Trigger errors
            cy.get('[data-cy="add-pet-button"]').click()
            cy.get('[data-cy="pet-name-error"]').should('be.visible')
            cy.get('[data-cy="pet-species-error"]').should('be.visible')

            // Type in name field - should clear name error only
            cy.get('[data-cy="pet-name-input"]').type('Test Pet')
            cy.get('[data-cy="pet-name-error"]').should('not.exist')
            cy.get('[data-cy="pet-species-error"]').should('be.visible')

            // Type in species field - should clear species error
            cy.get('[data-cy="pet-species-input"]').type('Dog')
            cy.get('[data-cy="pet-species-error"]').should('not.exist')
        })

        it('should successfully create a pet with valid data', () => {
            // First create a location to use
            cy.createTestLocation().then((location) => {
                cy.get('[data-cy="pet-name-input"]').type('Cypress Test Pet')
                cy.get('[data-cy="pet-species-input"]').type('Golden Retriever')
                cy.get('[data-cy="pet-age-input"]').type('3')

                // Wait for location to appear in dropdown
                cy.get('[data-cy="pet-location-select"]').should('contain', location.name)
                cy.get('[data-cy="pet-location-select"]').select(location.location_id.toString())
                cy.get('[data-cy="pet-description-input"]').type('A friendly dog perfect for testing')

                cy.get('[data-cy="add-pet-button"]').click()

                // Should redirect to dashboard with success message
                cy.url().should('include', '/dashboard')
                cy.get('.bg-green-100').should('be.visible')
                cy.get('.bg-green-100').should('contain', 'Pet added successfully!')

                // Verify pet appears in pending section
                cy.get('[data-cy="pending-pets"]').should('contain', 'Cypress Test Pet')
            })
        })


        it('should clear form when clear button is clicked', () => {
            cy.get('[data-cy="pet-name-input"]').type('Test Pet')
            cy.get('[data-cy="pet-species-input"]').type('Dog')
            cy.get('[data-cy="pet-age-input"]').type('2')
            cy.get('[data-cy="pet-description-input"]').type('Test description')

            cy.get('button').contains('Clear').click()

            cy.get('[data-cy="pet-name-input"]').should('have.value', '')
            cy.get('[data-cy="pet-species-input"]').should('have.value', '')
            cy.get('[data-cy="pet-age-input"]').should('have.value', '')
            cy.get('[data-cy="pet-description-input"]').should('have.value', '')
            cy.get('[data-cy="pet-location-select"]').should('have.value', '')
        })

        it('should disable form while submitting', () => {
            cy.createTestLocation().then((location) => {
                cy.get('[data-cy="pet-name-input"]').type('Test Pet')
                cy.get('[data-cy="pet-species-input"]').type('Dog')
                cy.get('[data-cy="pet-age-input"]').type('2')

                // Wait for location to be available
                cy.get('[data-cy="pet-location-select"]').should('contain', location.name)
                cy.get('[data-cy="pet-location-select"]').select(location.location_id.toString())

                //  Intercept API call to add delay for testing
                cy.intercept('POST', '**/pets', (req) => {
                    return new Promise(resolve => {
                        setTimeout(() => resolve(req.continue()), 100)
                    })
                }).as('createPet')

                cy.get('[data-cy="add-pet-button"]').click()

                // Now we should catch the submitting state
                cy.get('[data-cy="add-pet-button"]')
                    .should('have.text', 'Adding Pet...')
                    .and('be.disabled')

                // Wait for completion
                cy.wait('@createPet')
                cy.url().should('include', '/dashboard')
            })
        })
    })

    describe('Dashboard Pet Management', () => {
        beforeEach(() => {
            // Create test data
            cy.createTestLocation().then((location) => {
                cy.createTestPet(location.location_id, 'pending').as('pendingPet')
                cy.createTestPet(location.location_id, 'approved').as('approvedPet')
            })

            cy.visit('/dashboard')
        })

        it('should display pending pets with approve and delete buttons', function() {
            cy.get('[data-cy="pending-pets"]').should('contain', this.pendingPet.name)

            cy.get('[data-cy="pending-pet-card"]').first().within(() => {
                cy.get('[data-cy="approve-button"]').should('be.visible')
                cy.get('button').contains('Delete').should('be.visible')
            })
        })


        it('should delete a pending pet with confirmation', function() {
            // Stub window.confirm to return true (user confirms)
            cy.window().then((win) => {
                cy.stub(win, 'confirm').returns(true)
            })

            // Handle empty states
            cy.get('body').then(($body) => {
                if ($body.find('[data-cy="pending-pets"]').length > 0) {
                    cy.get('[data-cy="pending-pets"]').should('contain', this.pendingPet.name)

                    cy.get('[data-cy="pending-pet-card"]').first().within(() => {
                        cy.get('button').contains('Delete').click()
                    })

                    // Should show success message
                    cy.get('.bg-green-100').should('be.visible')
                    cy.get('.bg-green-100').should('contain', 'Pet deleted successfully!')

                    // Check final state
                    cy.get('body').then(($bodyAfter) => {
                        if ($bodyAfter.find('[data-cy="pending-pets"]').length > 0) {
                            cy.get('[data-cy="pending-pets"]').should('not.contain', this.pendingPet.name)
                        } else {
                            cy.contains('No pending pets to approve').should('be.visible')
                        }
                    })

                    // Verify deletion via API
                    cy.request({
                        url: `${Cypress.env('apiBaseUrl')}/pets/${this.pendingPet.pet_id}`,
                        failOnStatusCode: false
                    }).then((response) => {
                        expect(response.status).to.eq(404)
                    })
                }
            })
        })

        it('should not delete pet when user cancels confirmation', function() {
            // Stub window.confirm to return false (user cancels)
            cy.window().then((win) => {
                cy.stub(win, 'confirm').returns(false)
            })

            cy.get('[data-cy="pending-pets"]').should('contain', this.pendingPet.name)

            cy.get('[data-cy="pending-pet-card"]').first().within(() => {
                cy.get('button').contains('Delete').click()
            })

            // Pet should still be in UI
            cy.get('[data-cy="pending-pets"]').should('contain', this.pendingPet.name)

            // No success message should appear
            cy.get('.bg-green-100').should('not.exist')
        })

        it('should display approved pets with only delete button', function() {
            cy.get('h2').contains('Approved Pets').parent().should('contain', this.approvedPet.name)

            // Find the approved pet card and check it only has delete button
            cy.get('h2').contains('Approved Pets').parent().within(() => {
                cy.get('.card').contains(this.approvedPet.name).parent().parent().within(() => {
                    cy.get('button').should('contain', 'Delete')
                    cy.get('button').should('not.contain', 'Approve')
                })
            })
        })

        it('should delete an approved pet', function() {
            cy.window().then((win) => {
                cy.stub(win, 'confirm').returns(true)
            })

            cy.get('h2').contains('Approved Pets').parent().should('contain', this.approvedPet.name)

            cy.get('h2').contains('Approved Pets').parent().within(() => {
                cy.get('.card').contains(this.approvedPet.name).parent().parent().within(() => {
                    cy.get('button').contains('Delete').click()
                })
            })

            // Should show success message
            cy.get('.bg-green-100').should('be.visible')
            cy.get('.bg-green-100').should('contain', 'Pet deleted successfully!')

            // Pet should be removed
            cy.get('h2').contains('Approved Pets').parent().should('not.contain', this.approvedPet.name)
        })


        it('should auto-hide success messages after 5 seconds', function() {
            cy.get('[data-cy="pending-pet-card"]').first().within(() => {
                cy.get('[data-cy="approve-button"]').click()
            })

            cy.get('.bg-green-100').should('be.visible')

            // Wait for auto-hide (5 seconds + buffer)
            cy.wait(5500)
            cy.get('.bg-green-100').should('not.exist')
        })
    })

    describe('Pet API Integration', () => {
        it('should create pet via API correctly', () => {
            cy.createTestLocation().then((location) => {
                const petData = {
                    name: 'API Test Pet',
                    species: 'Test Species',
                    age: 5,
                    description: 'Created via API test',
                    location_id: location.location_id
                }

                cy.request({
                    method: 'POST',
                    url: `${Cypress.env('apiBaseUrl')}/pets`,
                    form: true,
                    body: petData
                }).then((response) => {
                    expect(response.status).to.eq(200)
                    expect(response.body).to.have.property('pet_id')
                    expect(response.body.name).to.eq(petData.name)
                    expect(response.body.species).to.eq(petData.species)
                    expect(response.body.age).to.eq(petData.age)
                    expect(response.body.status).to.eq('pending')
                    expect(response.body.location_id).to.eq(petData.location_id)
                })
            })
        })

        it('should approve pet via API correctly', () => {
            cy.createTestLocation().then((location) => {
                cy.createTestPet(location.location_id, 'pending').then((pet) => {
                    expect(pet).to.have.property('pet_id')
                    expect(pet.pet_id).to.be.a('number')

                    cy.request({
                        method: 'PATCH',
                        url: `${Cypress.env('apiBaseUrl')}/pets/${pet.pet_id}/approve`
                    }).then((response) => {
                        expect(response.status).to.eq(200)
                        expect(response.body.status).to.eq('approved')
                        expect(response.body.pet_id).to.eq(pet.pet_id)
                    })
                })
            })
        })

        it('should delete pet via API correctly', () => {
            cy.createTestLocation().then((location) => {
                cy.createTestPet(location.location_id).then((pet) => {
                    expect(pet).to.have.property('pet_id')
                    expect(pet.pet_id).to.be.a('number')

                    cy.request({
                        method: 'DELETE',
                        url: `${Cypress.env('apiBaseUrl')}/pets/${pet.pet_id}`
                    }).then((response) => {
                        expect(response.status).to.eq(200)
                        expect(response.body).to.have.property('ok', true)
                    })

                    // Verify pet is deleted
                    cy.request({
                        url: `${Cypress.env('apiBaseUrl')}/pets/${pet.pet_id}`,
                        failOnStatusCode: false
                    }).then((response) => {
                        expect(response.status).to.eq(404)
                    })
                })
            })
        })

        it('should list pets via API correctly', () => {
            cy.request('GET', `${Cypress.env('apiBaseUrl')}/pets`).then((response) => {
                expect(response.status).to.eq(200)
                expect(response.body).to.be.an('array')

                response.body.forEach(pet => {
                    expect(pet).to.have.property('pet_id')
                    expect(pet).to.have.property('name')
                    expect(pet).to.have.property('species')
                    expect(pet).to.have.property('age')
                    expect(pet).to.have.property('status')
                    expect(pet).to.have.property('location_id')
                    expect(['pending', 'approved']).to.include(pet.status)
                })
            })
        })
    })
})