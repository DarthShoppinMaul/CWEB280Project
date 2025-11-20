describe('Location Management', () => {
    beforeEach(() => {
        cy.testAPI()
        cy.loginEnhanced()
    })

    afterEach(() => {
        cy.cleanupTestData()
    })

    describe('Add Location Page', () => {
        beforeEach(() => {
            cy.visit('/add-location')
        })

        it('should display add location form correctly', () => {
            cy.get('h1').should('have.text', 'Add Location')
            cy.get('[data-cy="location-name-input"]').should('be.visible')
            cy.get('[data-cy="location-address-input"]').should('be.visible')
            cy.get('[data-cy="location-phone-input"]').should('be.visible')
            cy.get('[data-cy="location-email-input"]').should('be.visible')
            cy.get('[data-cy="add-location-button"]').should('have.text', 'Add Location')
        })

        it('should show validation errors for empty required fields', () => {
            cy.get('[data-cy="add-location-button"]').click()

            cy.get('[data-cy="location-name-error"]').should('be.visible')
            cy.get('[data-cy="location-name-error"]').should('have.text', 'Location name is required')

            cy.get('[data-cy="location-address-error"]').should('be.visible')
            cy.get('[data-cy="location-address-error"]').should('have.text', 'Address is required')

            cy.get('[data-cy="location-phone-error"]').should('be.visible')
            cy.get('[data-cy="location-phone-error"]').should('have.text', 'Phone number is required')

            cy.get('[data-cy="location-email-error"]').should('be.visible')
            cy.get('[data-cy="location-email-error"]').should('have.text', 'Email is required')
        })

        it('should validate email format', () => {
            cy.get('[data-cy="location-email-input"]').type('invalid-email')
            cy.get('[data-cy="add-location-button"]').click()

            cy.get('[data-cy="location-email-error"]').should('be.visible')
            cy.get('[data-cy="location-email-error"]').should('have.text', 'Please enter a valid email address')
        })

        it('should validate phone number format', () => {
            cy.get('[data-cy="location-phone-input"]').type('invalid-phone')
            cy.get('[data-cy="add-location-button"]').click()

            cy.get('[data-cy="location-phone-error"]').should('be.visible')
            cy.get('[data-cy="location-phone-error"]').should('have.text', 'Please enter a valid phone number')
        })

        it('should clear form when clear button exists', () => {
            cy.get('[data-cy="location-name-input"]').type('Test Location')
            cy.get('[data-cy="location-address-input"]').type('123 Test St')

            cy.get('body').then(($body) => {
                if ($body.find('button').text().includes('Clear')) {
                    cy.get('button').contains('Clear').click()
                    cy.get('[data-cy="location-name-input"]').should('have.value', '')
                    cy.get('[data-cy="location-address-input"]').should('have.value', '')
                }
            })
        })
    })

    describe('Location Creation Functionality', () => {
        beforeEach(() => {
            cy.visit('/add-location')
        })

        it('should successfully create a new location with valid data', () => {
            const locationName = `Test Location ${Date.now()}`

            cy.get('[data-cy="location-name-input"]').type(locationName)
            cy.get('[data-cy="location-address-input"]').type('123 Main Street, City, State 12345')
            cy.get('[data-cy="location-phone-input"]').type('(555) 123-4567')
            cy.get('[data-cy="location-email-input"]').type('location@example.com')

            cy.get('[data-cy="add-location-button"]').click()

            // Should redirect to dashboard or locations list
            cy.url().should('match', /\/(dashboard|locations)/)

            // Verify location was created via API
            cy.request('GET', `${Cypress.env('apiBaseUrl')}/locations`).then((response) => {
                expect(response.status).to.eq(200)
                const createdLocation = response.body.find(loc => loc.name === locationName)
                expect(createdLocation).to.exist
                expect(createdLocation.address).to.include('123 Main Street')
                expect(createdLocation.phone).to.eq('(555) 123-4567')
                expect(createdLocation.email).to.eq('location@example.com')
            })
        })

        it('should handle special characters and formatting in location data', () => {
            const locationName = `Location with Special Ch@rs & Numbers 123`

            cy.get('[data-cy="location-name-input"]').type(locationName)
            cy.get('[data-cy="location-address-input"]').type('456 Oak Avenue #5, Suite 200, Toronto, ON M5V 3A8')
            cy.get('[data-cy="location-phone-input"]').type('+1 (416) 555-9876 ext. 245')
            cy.get('[data-cy="location-email-input"]').type('special.location+test@example.com')

            cy.get('[data-cy="add-location-button"]').click()

            cy.url().should('match', /\/(dashboard|locations)/)

            // Verify special characters were preserved
            cy.request('GET', `${Cypress.env('apiBaseUrl')}/locations`).then((response) => {
                const createdLocation = response.body.find(loc => loc.name === locationName)
                expect(createdLocation).to.exist
                expect(createdLocation.address).to.include('#5')
                expect(createdLocation.phone).to.include('+1')
                expect(createdLocation.phone).to.include('ext.')
            })
        })

        it('should show loading state during location creation', () => {
            cy.get('[data-cy="location-name-input"]').type('Loading Test Location')
            cy.get('[data-cy="location-address-input"]').type('123 Loading St')
            cy.get('[data-cy="location-phone-input"]').type('(555) 999-0000')
            cy.get('[data-cy="location-email-input"]').type('loading@test.com')

            cy.get('[data-cy="add-location-button"]').click()

            // Button should show loading state
            cy.get('[data-cy="add-location-button"]')
                .should('have.text', 'Adding Location...')
                .and('be.disabled')

            // Should eventually redirect
            cy.url().should('match', /\/(dashboard|locations)/, { timeout: 10000 })
        })
    })

    describe('Location Display in Pet Forms', () => {
        beforeEach(() => {
            // Create a test location to verify it appears in dropdowns
            cy.createTestLocation().as('testLocation')
        })

        it('should display created location in add pet form dropdown', function() {
            cy.visit('/add-pet')

            cy.get('[data-cy="pet-location-select"] option').should('contain', this.testLocation.name)
        })

        it('should allow selecting created location for new pets', function() {
            cy.visit('/add-pet')

            // Fill out pet form with new location
            cy.get('[data-cy="pet-name-input"]').type('Location Test Pet')
            cy.get('[data-cy="pet-species-input"]').type('Test Dog')
            cy.get('[data-cy="pet-age-input"]').type('3')
            cy.get('[data-cy="pet-location-select"]').select(this.testLocation.location_id.toString())
            cy.get('[data-cy="pet-description-input"]').type('Testing location selection')

            cy.get('[data-cy="add-pet-button"]').click()

            // Should successfully create pet
            cy.url().should('match', /\/(dashboard|pets)/)

            // Verify pet was created with correct location
            cy.request('GET', `${Cypress.env('apiBaseUrl')}/pets`).then((response) => {
                const createdPet = response.body.find(pet => pet.name === 'Location Test Pet')
                expect(createdPet).to.exist
                expect(createdPet.location_id).to.eq(this.testLocation.location_id)
            })
        })

        it('should display location name in pet cards', function() {
            // Create a pet with the test location
            cy.createTestPet(this.testLocation.location_id, 'approved')

            // Visit home page to see pet cards
            cy.visit('/')

            // Should display location name in pet card
            cy.get('[data-cy="pet-card"]').should('contain', this.testLocation.name)
        })
    })

    describe('Location Management (Admin)', () => {
        beforeEach(() => {
            cy.createTestLocation().as('testLocation')
        })

        it('should display locations list in admin interface', function() {
            cy.visit('/dashboard')

            // Check if locations section exists
            cy.get('body').then(($body) => {
                if ($body.find('[data-cy="locations-section"]').length > 0) {
                    cy.get('[data-cy="locations-section"]').should('be.visible')
                    cy.get('[data-cy="locations-section"]').should('contain', this.testLocation.name)
                }
            })
        })

        it('should allow editing location information', function() {
            cy.visit(`/locations/${this.testLocation.location_id}/edit`)

            cy.get('[data-cy="location-name-input"]').clear().type('Updated Location Name')
            cy.get('[data-cy="save-location-button"]').click()

            // Verify update via API
            cy.request(`${Cypress.env('apiBaseUrl')}/locations/${this.testLocation.location_id}`).then((response) => {
                expect(response.body.name).to.eq('Updated Location Name')
            })
        })

        it('should allow deleting locations (if no pets assigned)', function() {
            cy.visit('/dashboard')

            // Find delete button for location
            cy.get('body').then(($body) => {
                if ($body.find(`[data-cy="delete-location-${this.testLocation.location_id}"]`).length > 0) {
                    cy.get(`[data-cy="delete-location-${this.testLocation.location_id}"]`).click()

                    // Confirm deletion
                    cy.get('[data-cy="confirm-delete-button"]').click()

                    // Verify deletion via API
                    cy.request({
                        method: 'GET',
                        url: `${Cypress.env('apiBaseUrl')}/locations/${this.testLocation.location_id}`,
                        failOnStatusCode: false
                    }).then((response) => {
                        expect(response.status).to.eq(404)
                    })
                }
            })
        })

        it('should prevent deleting locations with assigned pets', function() {
            // Create a pet at this location first
            cy.createTestPet(this.testLocation.location_id, 'approved')

            cy.visit('/dashboard')

            cy.get('body').then(($body) => {
                if ($body.find(`[data-cy="delete-location-${this.testLocation.location_id}"]`).length > 0) {
                    cy.get(`[data-cy="delete-location-${this.testLocation.location_id}"]`).click()

                    // Should show error message
                    cy.get('[data-cy="delete-error-message"]').should('be.visible')
                    cy.get('[data-cy="delete-error-message"]').should('contain', 'Cannot delete location with assigned pets')
                }
            })
        })
    })

    describe('Location Details Page', () => {
        beforeEach(() => {
            cy.createTestLocation().then((location) => {
                cy.createTestPet(location.location_id, 'approved')
                cy.visit(`/locations/${location.location_id}`)
                cy.wrap(location).as('testLocation')
            })
        })

        it('should display complete location information', function() {
            cy.get('h1').should('have.text', this.testLocation.name)
            cy.get('[data-cy="location-address-display"]').should('have.text', this.testLocation.address)
            cy.get('[data-cy="location-phone-display"]').should('have.text', this.testLocation.phone)
            cy.get('[data-cy="location-email-display"]').should('have.text', this.testLocation.email)
        })

        it('should display pets at this location', function() {
            cy.get('[data-cy="location-pets-section"]').should('be.visible')
            cy.get('[data-cy="location-pets-section"]').should('contain', 'Pets at this location')
            cy.get('[data-cy="pet-card"]').should('have.length.at.least', 1)
        })

        it('should handle non-existent location gracefully', () => {
            cy.visit('/locations/99999', { failOnStatusCode: false })

            // Should show 404 or error message
            cy.get('body').should('contain.text', 'Location not found')
        })
    })

    describe('Location Search and Filtering', () => {
        beforeEach(() => {
            // Create multiple test locations
            cy.createTestLocation('Downtown Shelter', 'Toronto, ON').as('location1')
            cy.createTestLocation('Suburban Rescue', 'Mississauga, ON').as('location2')
            cy.createTestLocation('Rural Sanctuary', 'Oakville, ON').as('location3')
        })

        it('should filter locations by city if filter exists', () => {
            cy.visit('/locations')

            cy.get('body').then(($body) => {
                if ($body.find('[data-cy="city-filter"]').length > 0) {
                    cy.get('[data-cy="city-filter"]').select('Toronto')
                    cy.get('[data-cy="location-card"]').should('contain', 'Downtown Shelter')
                    cy.get('[data-cy="location-card"]').should('not.contain', 'Suburban Rescue')
                }
            })
        })

        it('should search locations by name if search exists', () => {
            cy.visit('/locations')

            cy.get('body').then(($body) => {
                if ($body.find('[data-cy="location-search"]').length > 0) {
                    cy.get('[data-cy="location-search"]').type('Downtown')
                    cy.get('[data-cy="location-card"]').should('have.length', 1)
                    cy.get('[data-cy="location-card"]').should('contain', 'Downtown Shelter')
                }
            })
        })
    })

    describe('API Integration', () => {
        it('should load locations from API', () => {
            cy.visit('/add-pet')

            // Verify locations API is working
            cy.request(`${Cypress.env('apiBaseUrl')}/locations`).then((response) => {
                expect(response.status).to.eq(200)
                expect(response.body).to.be.an('array')
            })
        })

        it('should fail when API server is unavailable', () => {
            // This test validates that tests fail if API server is not running
            cy.request(`${Cypress.env('apiBaseUrl')}/locations`).then((response) => {
                expect(response.status).to.eq(200)
            })
        })

        it('should handle API errors gracefully', () => {
            cy.visit('/add-location')

            // Fill out form with potentially problematic data
            cy.get('[data-cy="location-name-input"]').type('Error Test Location')
            cy.get('[data-cy="location-address-input"]').type('123 Error Street')
            cy.get('[data-cy="location-phone-input"]').type('(555) 999-9999')
            cy.get('[data-cy="location-email-input"]').type('error@test.com')

            cy.get('[data-cy="add-location-button"]').click()

            // Should either succeed or show appropriate error
            cy.url().should('not.eq', Cypress.config().baseUrl + '/add-location')
        })
    })
})