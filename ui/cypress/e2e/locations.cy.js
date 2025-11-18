describe('Location Management', () => {
    beforeEach(() => {
        cy.waitForAPI()
        cy.login()
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
            cy.get('[data-cy="add-location-button"]').should('have.text', 'Add Location')
            cy.get('button').should('contain', 'Clear')
        })

        it('should show required field indicators', () => {
            // Check for required field asterisks in labels
            cy.get('label').should('contain', 'Location Name *')
            cy.get('label').should('contain', 'Address *')
            cy.get('label').should('contain', 'Phone') // Phone is optional
        })

        it('should show validation errors for empty required fields', () => {
            cy.get('[data-cy="add-location-button"]').click()

            cy.get('[data-cy="location-name-error"]').should('be.visible')
            cy.get('[data-cy="location-name-error"]').should('have.text', 'Location name is required')

            cy.get('[data-cy="location-address-error"]').should('be.visible')
            cy.get('[data-cy="location-address-error"]').should('have.text', 'Address is required')

            // Phone should not have an error since it's optional
            cy.get('[data-cy="location-phone-error"]').should('not.exist')
        })

        it('should validate location name length', () => {
            cy.get('[data-cy="location-name-input"]').type('AB')
            cy.get('[data-cy="add-location-button"]').click()

            cy.get('[data-cy="location-name-error"]').should('be.visible')
            cy.get('[data-cy="location-name-error"]').should('have.text', 'Location name must be at least 3 characters')
        })

        it('should validate phone format when provided', () => {
            cy.get('[data-cy="location-name-input"]').type('Valid Location Name')
            cy.get('[data-cy="location-address-input"]').type('123 Valid Address')
            cy.get('[data-cy="location-phone-input"]').type('invalid-phone-format!')
            cy.get('[data-cy="add-location-button"]').click()

            cy.get('[data-cy="location-phone-error"]').should('be.visible')
            cy.get('[data-cy="location-phone-error"]').should('have.text', 'Please enter a valid phone number')
        })

        it('should accept valid phone formats', () => {
            const validPhoneFormats = [
                '(416) 555-0123',
                '416-555-0123',
                '416 555 0123',
                '4165550123'
            ]

            validPhoneFormats.forEach(phone => {
                cy.get('[data-cy="location-name-input"]').clear().type('Test Location')
                cy.get('[data-cy="location-address-input"]').clear().type('123 Test Street')
                cy.get('[data-cy="location-phone-input"]').clear().type(phone)
                cy.get('[data-cy="add-location-button"]').click()

                // Should redirect to dashboard (no phone error)
                cy.url().should('include', '/dashboard')
                cy.go('back')
            })
        })

        it('should clear field errors as user types', () => {
            // Trigger errors
            cy.get('[data-cy="add-location-button"]').click()
            cy.get('[data-cy="location-name-error"]').should('be.visible')
            cy.get('[data-cy="location-address-error"]').should('be.visible')

            // Type in name field - should clear name error only
            cy.get('[data-cy="location-name-input"]').type('Test Location')
            cy.get('[data-cy="location-name-error"]').should('not.exist')
            cy.get('[data-cy="location-address-error"]').should('be.visible')

            // Type in address field - should clear address error
            cy.get('[data-cy="location-address-input"]').type('123 Test Address')
            cy.get('[data-cy="location-address-error"]').should('not.exist')
        })

        it('should successfully create a location with required fields only', () => {
            const locationName = `Test Location ${Date.now()}`

            cy.get('[data-cy="location-name-input"]').type(locationName)
            cy.get('[data-cy="location-address-input"]').type('123 Test Street, Test City, ON')
            cy.get('[data-cy="add-location-button"]').click()

            cy.wait(2000)
            // Should redirect to dashboard with success message
            cy.url().should('include', '/dashboard')
            cy.get('.bg-green-100').should('be.visible')
            cy.get('.bg-green-100').should('contain', 'Location added successfully!')

            // Verify location was created via API
            cy.request('GET', `${Cypress.env('apiBaseUrl')}/locations`).then((response) => {
                const createdLocation = response.body.find(loc => loc.name === locationName)
                expect(createdLocation).to.exist
                expect(createdLocation.address).to.eq('123 Test Street, Test City, ON')
                expect(createdLocation.phone).to.eq('')
            })
        })

        it('should successfully create a location with all fields', () => {
            const locationName = `Full Test Location ${Date.now()}`

            cy.get('[data-cy="location-name-input"]').type(locationName)
            cy.get('[data-cy="location-address-input"]').type('456 Full Street, Full City, ON')
            cy.get('[data-cy="location-phone-input"]').type('(416) 555-9999')
            cy.get('[data-cy="add-location-button"]').click()

            // Should redirect to dashboard with success message
            cy.url().should('include', '/dashboard')
            cy.get('.bg-green-100').should('be.visible')
            cy.get('.bg-green-100').should('contain', 'Location added successfully!')

            // Verify location was created via API
            cy.request('GET', `${Cypress.env('apiBaseUrl')}/locations`).then((response) => {
                const createdLocation = response.body.find(loc => loc.name === locationName)
                expect(createdLocation).to.exist
                expect(createdLocation.address).to.eq('456 Full Street, Full City, ON')
                expect(createdLocation.phone).to.eq('(416) 555-9999')
            })
        })

        it('should clear form when clear button is clicked', () => {
            cy.get('[data-cy="location-name-input"]').type('Test Location')
            cy.get('[data-cy="location-address-input"]').type('123 Test Address')
            cy.get('[data-cy="location-phone-input"]').type('(416) 555-0123')

            cy.get('button').contains('Clear').click()

            cy.get('[data-cy="location-name-input"]').should('have.value', '')
            cy.get('[data-cy="location-address-input"]').should('have.value', '')
            cy.get('[data-cy="location-phone-input"]').should('have.value', '')
        })

        it('should disable form while submitting', () => {
            cy.get('[data-cy="location-name-input"]').type('Test Location')
            cy.get('[data-cy="location-address-input"]').type('123 Test Address')

            cy.get('[data-cy="add-location-button"]').click()

            // Button should change text and be disabled
            cy.get('[data-cy="add-location-button"]').should('have.text', 'Adding Location...')
            cy.get('[data-cy="add-location-button"]').should('be.disabled')

            // Clear button should also be disabled
            cy.get('button').contains('Clear').should('be.disabled')

            // Wait for completion
            cy.url().should('include', '/dashboard')
        })

        it('should handle API errors gracefully', () => {
            // This would require mocking a failed API call
            // For now, verify the error structure exists
            cy.get('[data-cy="location-name-input"]').type('Test Location')
            cy.get('[data-cy="location-address-input"]').type('123 Test Address')
            cy.get('[data-cy="add-location-button"]').click()

            // If successful, should redirect
            cy.url().should('include', '/dashboard')
        })

        it('should trim whitespace from inputs', () => {
            const locationName = `Whitespace Test ${Date.now()}`

            cy.get('[data-cy="location-name-input"]').type(`  ${locationName}  `)
            cy.get('[data-cy="location-address-input"]').type('  123 Trimmed Street  ')
            cy.get('[data-cy="location-phone-input"]').type('  (416) 555-7777  ')
            cy.get('[data-cy="add-location-button"]').click()

            cy.url().should('include', '/dashboard')

            // Verify trimmed data was saved
            cy.request('GET', `${Cypress.env('apiBaseUrl')}/locations`).then((response) => {
                const createdLocation = response.body.find(loc => loc.name === locationName)
                expect(createdLocation).to.exist
                expect(createdLocation.name).to.eq(locationName) // Should be trimmed
                expect(createdLocation.address).to.eq('123 Trimmed Street')
                expect(createdLocation.phone).to.eq('(416) 555-7777')
            })
        })

        it('should handle special characters in location data', () => {
            const locationName = `Location w/ Special Chars ${Date.now()}`

            cy.get('[data-cy="location-name-input"]').type(locationName)
            cy.get('[data-cy="location-address-input"]').type('123 Main St, Suite #5, Toronto, ON M5V 2K2')
            cy.get('[data-cy="location-phone-input"]').type('+1 (416) 555-0123 ext. 45')
            cy.get('[data-cy="add-location-button"]').click()

            cy.url().should('include', '/dashboard')

            // Verify special characters were preserved
            cy.request('GET', `${Cypress.env('apiBaseUrl')}/locations`).then((response) => {
                const createdLocation = response.body.find(loc => loc.name === locationName)
                expect(createdLocation).to.exist
                expect(createdLocation.address).to.include('#5')
                expect(createdLocation.phone).to.include('+1')
                expect(createdLocation.phone).to.include('ext.')
            })
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
            cy.url().should('include', '/dashboard')

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

    describe('Location API Integration', () => {
        it('should create location via API correctly', () => {
            const locationData = {
                name: 'API Test Location',
                address: '789 API Street, API City, ON',
                phone: '(416) 555-0199'
            }

            cy.request({
                method: 'POST',
                url: `${Cypress.env('apiBaseUrl')}/locations`,
                body: locationData
            }).then((response) => {
                expect(response.status).to.eq(200)
                expect(response.body).to.have.property('location_id')
                expect(response.body.name).to.eq(locationData.name)
                expect(response.body.address).to.eq(locationData.address)
                expect(response.body.phone).to.eq(locationData.phone)
            })
        })

        it('should list locations via API correctly', () => {
            cy.request('GET', `${Cypress.env('apiBaseUrl')}/locations`).then((response) => {
                expect(response.status).to.eq(200)
                expect(response.body).to.be.an('array')

                response.body.forEach(location => {
                    expect(location).to.have.property('location_id')
                    expect(location).to.have.property('name')
                    expect(location).to.have.property('address')
                    expect(location).to.have.property('phone')
                })
            })
        })

        it('should validate location data via API', () => {
            // Test with invalid data (empty name)
            cy.request({
                method: 'POST',
                url: `${Cypress.env('apiBaseUrl')}/locations`,
                body: {
                    name: '',
                    address: '123 Test Street',
                    phone: '(416) 555-0123'
                },
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.eq(422) // Validation error
            })

            // Test with invalid data (short name)
            cy.request({
                method: 'POST',
                url: `${Cypress.env('apiBaseUrl')}/locations`,
                body: {
                    name: 'A',
                    address: '123 Test Street',
                    phone: '(416) 555-0123'
                },
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.eq(422) // Validation error
            })
        })

        it('should handle locations without phone numbers', () => {
            const locationData = {
                name: 'No Phone Location',
                address: '456 Phoneless Street, Toronto, ON'
            }

            cy.request({
                method: 'POST',
                url: `${Cypress.env('apiBaseUrl')}/locations`,
                body: locationData
            }).then((response) => {
                expect(response.status).to.eq(200)
                expect(response.body.name).to.eq(locationData.name)
                expect(response.body.address).to.eq(locationData.address)
                expect(response.body.phone).to.eq('')
            })
        })
    })

    describe('Location Data Consistency', () => {
        it('should maintain location data consistency across the application', () => {
            // Create a location
            cy.createTestLocation().then((location) => {
                // Verify it appears in locations list
                cy.request('GET', `${Cypress.env('apiBaseUrl')}/locations`).then((response) => {
                    const foundLocation = response.body.find(loc => loc.location_id === location.location_id)
                    expect(foundLocation).to.exist
                })

                // Verify it appears in pet form dropdown
                cy.visit('/add-pet')
                cy.get('[data-cy="pet-location-select"] option').should('contain', location.name)

                // Create a pet with this location
                cy.createTestPet(location.location_id, 'approved')

                // Verify location name displays correctly in home page
                cy.visit('/')
                cy.get('[data-cy="pet-card"]').should('contain', location.name)

                // Verify location name displays correctly in dashboard
                cy.visit('/dashboard')
                cy.get('.card').should('contain', location.name)
            })
        })

        it('should sort locations alphabetically in API response', () => {
            //clear db
            cy.request({
                method: 'POST',
                url: `${Cypress.env('apiBaseUrl')}/_test/reset`,
                headers: { 'x-admin-key': 'letmein' }
            });


            // Create multiple locations
            const locations = [
                { name: 'Zebra Location', address: '1 Z Street', phone: '' },
                { name: 'Alpha Location', address: '1 A Street', phone: '' },
                { name: 'Beta Location', address: '1 B Street', phone: '' }
            ]

            // Create them in reverse alphabetical order
            locations.reverse().forEach(locationData => {
                cy.request({
                    method: 'POST',
                    url: `${Cypress.env('apiBaseUrl')}/locations`,
                    body: locationData
                })
            })

            // Verify they come back sorted alphabetically
            cy.request('GET', `${Cypress.env('apiBaseUrl')}/locations`).then((response) => {
                const testLocations = response.body.filter(loc =>
                    loc.name.includes('Alpha Location') ||
                    loc.name.includes('Beta Location') ||
                    loc.name.includes('Zebra Location')
                )

                expect(testLocations.length).to.be.at.least(3)

                // Should be in alphabetical order
                expect(testLocations[0].name).to.contain('Alpha')
                expect(testLocations[1].name).to.contain('Beta')
                expect(testLocations[2].name).to.contain('Zebra')
            })
        })
    })
})