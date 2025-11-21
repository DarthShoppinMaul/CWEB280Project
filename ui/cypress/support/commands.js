// Cypress Commands -

// Helper function to get API base URL
function getApiBaseUrl() {
    return Cypress.env('apiBaseUrl') || 'http://localhost:8000'
}

/**
 * Usage: cy.login()
 */
Cypress.Commands.add('login', () => {
    cy.session('admin-login', () => {
        cy.visit('/login')

        cy.get('[data-cy="email-input"]').type('test@t.ca')
        cy.get('[data-cy="password-input"]').type('123456Pw')
        cy.get('[data-cy="login-button"]').click()

        // Wait for successful login - app should redirect to /pets
        cy.url().should('include', '/pets', { timeout: 10000 })

        // Verify login via API call
        cy.request(`${getApiBaseUrl()}/auth/me`).then((response) => {
            expect(response.status).to.eq(200)
            expect(response.body).to.have.property('email', 'test@t.ca')
        })
    })
})

/**
 * Logout current user
 * Usage: cy.logout()
 */
Cypress.Commands.add('logout', () => {
    cy.request('POST', `${getApiBaseUrl()}/auth/logout`)
})

/**
 * Verify user is logged out
 * Usage: cy.verifyLoggedOut()
 */
Cypress.Commands.add('verifyLoggedOut', () => {
    cy.request({
        url: `${getApiBaseUrl()}/auth/me`,
        failOnStatusCode: false
    }).then((response) => {
        expect(response.status).to.eq(401)
    })
})

/**
 * Wait for API to be ready
 * Usage: cy.waitForAPI()
 */
Cypress.Commands.add('waitForAPI', () => {
    cy.request({
        url: `${getApiBaseUrl()}/pets`,
        retryOnStatusCodeFailure: true,
        timeout: 30000
    })
})

/**
 * Create a test location via API
 * Usage: cy.createTestLocation().then((location) => { ... })
 */
Cypress.Commands.add('createTestLocation', () => {
    const locationData = {
        name: `Test Location ${Date.now()}`,
        address: `${Math.floor(Math.random() * 9999)} Test St, Test City, ON`,
        phone: '(555) 123-4567'
    }

    return cy.request({
        method: 'POST',
        url: `${getApiBaseUrl()}/locations`,
        body: locationData
    }).then((response) => {
        return response.body
    })
})

/**
 * Create a test pet through the UI (most reliable method)
 * Usage: cy.createTestPet(locationId, status, name, species, age).then((pet) => { ... })
 * All parameters except locationId are optional
 */
Cypress.Commands.add('createTestPet', (locationId, status = 'pending', name = null, species = null, age = null) => {
    if (!locationId) {
        throw new Error('locationId is required for createTestPet')
    }

    // Generate dynamic name if not provided
    const petName = name || `Test Pet ${Date.now()}`
    const petSpecies = species || 'Test Dog'
    const petAge = age || 2

    // Navigate to the pet management page
    cy.visit('/add-pet')

    // Wait for page to load and click "Add New Pet" button to get to the form
    cy.get('[data-cy="add-new-pet-button"]').should('be.visible').click()

    // Now the form should be visible - wait for the first input
    cy.get('[data-cy="pet-name-input"]').should('be.visible')

    // Fill out the form
    cy.get('[data-cy="pet-name-input"]').clear().type(petName)
    cy.get('[data-cy="pet-species-input"]').clear().type(petSpecies)
    cy.get('[data-cy="pet-age-input"]').clear().type(petAge.toString())
    cy.get('[data-cy="pet-location-select"]').select(locationId.toString())
    cy.get('[data-cy="pet-description-input"]').clear().type('A test pet for e2e testing')

    // Submit the form
    cy.get('[data-cy="add-pet-button"]').click()

    // Wait for success (should go back to list view)
    cy.url().should('include', '/add-pet') // Should stay on same page
    cy.get('h1').should('have.text', 'Manage Pets') // Should be back to list view

    // Get the created pet from the API (try multiple times in case there's a delay)
    return cy.wait(1000).then(() => {
        return cy.request('GET', `${getApiBaseUrl()}/pets`).then((response) => {
            const pets = response.body
            const createdPet = pets.find(pet => pet.name === petName && pet.location_id === locationId)

            if (!createdPet) {
                // Try again after a short delay
                return cy.wait(2000).then(() => {
                    return cy.request('GET', `${getApiBaseUrl()}/pets`).then((retryResponse) => {
                        const retryPets = retryResponse.body
                        const retryCreatedPet = retryPets.find(pet => pet.name === petName && pet.location_id === locationId)

                        if (!retryCreatedPet) {
                            throw new Error(`Failed to find created pet: ${petName}. Available pets: ${JSON.stringify(retryPets.map(p => ({ name: p.name, id: p.pet_id })))}`)
                        }

                        return retryCreatedPet
                    })
                })
            }

            return createdPet
        })
    }).then((createdPet) => {
        cy.log('Pet created successfully:', JSON.stringify(createdPet))

        // Update status if not pending (approve the pet)
        if (status === 'approved') {
            return cy.approvePet(createdPet.pet_id).then(() => {
                return { ...createdPet, status: 'approved' }
            })
        } else if (status === 'adopted') {
            // For 'adopted' status, log a warning since we can't set it via API
            cy.log(`Warning: Cannot set pet status to "adopted" via API. Pet will remain 'pending'.`)
            return createdPet
        }

        return createdPet
    })
})

/**
 * Create a test pet and approve it if needed
 * Usage: cy.createTestPetWithStatus(locationId, 'approved').then((pet) => { ... })
 */
Cypress.Commands.add('createTestPetWithStatus', (locationId, status = 'pending') => {
    return cy.createTestPet(locationId, status)
})

/**
 * Approve a pet by ID
 * Usage: cy.approvePet(petId)
 */
Cypress.Commands.add('approvePet', (petId) => {
    return cy.request({
        method: 'PATCH',
        url: `${getApiBaseUrl()}/pets/${petId}/approve`
    })
})

/**
 * Update pet status via API
 * Usage: cy.updatePetStatus(petId, 'approved')
 */
Cypress.Commands.add('updatePetStatus', (petId, status) => {
    if (!['pending', 'approved', 'adopted'].includes(status)) {
        throw new Error('Invalid status. Must be pending, approved, or adopted')
    }

    // Only "approved" status can be set via API - "pending" is default, "adopted" requires manual DB update
    if (status === 'approved') {
        return cy.request({
            method: 'PATCH',
            url: `${getApiBaseUrl()}/pets/${petId}/approve`
        })
    } else if (status === 'pending') {
        // Pet is already pending by default, just return success
        return cy.wrap({ status: 200, body: { status: 'pending' } })
    } else {
        // For "adopted" status, log a warning since we can't set it via API
        cy.log(`Warning: Cannot set pet status to "${status}" via API. Pet will remain in its current status.`)
        return cy.wrap({ status: 200, body: { status: 'pending' } })
    }
})

/**
 * Delete test pet via API
 * Usage: cy.deleteTestPet(petId)
 */
Cypress.Commands.add('deleteTestPet', (petId) => {
    return cy.request({
        method: 'DELETE',
        url: `${getApiBaseUrl()}/pets/${petId}`,
        failOnStatusCode: false
    })
})

/**
 * Delete test location via API
 * Usage: cy.deleteTestLocation(locationId)
 */
Cypress.Commands.add('deleteTestLocation', (locationId) => {
    return cy.request({
        method: 'DELETE',
        url: `${getApiBaseUrl()}/locations/${locationId}`,
        failOnStatusCode: false
    })
})

/**
 * Clean up test data
 * Usage: cy.cleanupTestData()
 */
Cypress.Commands.add('cleanupTestData', () => {
    // Get all pets and delete test ones
    cy.request({
        url: `${getApiBaseUrl()}/pets`,
        failOnStatusCode: false
    }).then((response) => {
        if (response.status === 200 && response.body) {
            response.body.forEach((pet) => {
                if (pet.name && pet.name.includes('Test Pet')) {
                    cy.request({
                        method: 'DELETE',
                        url: `${getApiBaseUrl()}/pets/${pet.pet_id}`,
                        failOnStatusCode: false
                    })
                }
            })
        }
    })

    // Get all locations and delete test ones
    cy.request({
        url: `${getApiBaseUrl()}/locations`,
        failOnStatusCode: false
    }).then((response) => {
        if (response.status === 200 && response.body) {
            response.body.forEach((location) => {
                if (location.name && location.name.includes('Test Location')) {
                    cy.request({
                        method: 'DELETE',
                        url: `${getApiBaseUrl()}/locations/${location.location_id}`,
                        failOnStatusCode: false
                    })
                }
            })
        }
    })
})

/**
 * Create test user via API
 * Usage: cy.createTestUser(userData).then((user) => { ... })
 */
Cypress.Commands.add('createTestUser', (userData = {}) => {
    const defaultUserData = {
        email: `test${Date.now()}@test.com`,
        password: 'testPassword123',
        display_name: 'Test User',
        phone: '(555) 123-4567'
    }

    const user = { ...defaultUserData, ...userData }

    return cy.request({
        method: 'POST',
        url: `${getApiBaseUrl()}/auth/register`,
        body: user
    })
})

/**
 * Create test adoption application
 * Usage: cy.createTestApplication(petId, applicationData).then((application) => { ... })
 */
Cypress.Commands.add('createTestApplication', (petId, applicationData = {}) => {
    if (!petId) {
        throw new Error('petId is required for createTestApplication')
    }

    const defaultApplicationData = {
        applicant_name: `Test Applicant ${Date.now()}`,
        applicant_email: `applicant${Date.now()}@test.com`,
        applicant_phone: '(555) 987-6543',
        applicant_address: '123 Test St, Test City, ON',
        housing_type: 'house',
        experience: 'I have experience with pets',
        reason: 'I want to adopt this pet for testing purposes'
    }

    const application = { ...defaultApplicationData, ...applicationData }

    return cy.request({
        method: 'POST',
        url: `${getApiBaseUrl()}/pets/${petId}/applications`,
        body: application
    })
})

/**
 * Update application status
 * Usage: cy.updateApplicationStatus(applicationId, status, adminNotes)
 */
Cypress.Commands.add('updateApplicationStatus', (applicationId, status, adminNotes = '') => {
    if (!['pending', 'approved', 'rejected'].includes(status)) {
        throw new Error('Invalid status. Must be pending, approved, or rejected')
    }

    return cy.request({
        method: 'PATCH',
        url: `${getApiBaseUrl()}/applications/${applicationId}`,
        body: {
            status: status,
            admin_notes: adminNotes
        }
    })
})

/**
 * Login as specific user
 * Usage: cy.loginAsUser(email, password)
 */
Cypress.Commands.add('loginAsUser', (email, password) => {
    cy.session(`user-login-${email}`, () => {
        cy.visit('/login')

        cy.get('[data-cy="email-input"]').type(email)
        cy.get('[data-cy="password-input"]').type(password)
        cy.get('[data-cy="login-button"]').click()

        // Wait for successful login - should redirect to /pets
        cy.url().should('include', '/pets', { timeout: 10000 })

        // Verify login via API call
        cy.request(`${getApiBaseUrl()}/auth/me`)
    })
})

/**
 * Check if element exists without failing
 * Usage: cy.elementExists(selector).then((exists) => { ... })
 */
Cypress.Commands.add('elementExists', (selector) => {
    return cy.get('body').then(($body) => {
        const exists = $body.find(selector).length > 0
        return cy.wrap(exists)
    })
})

/**
 * Wait for element to appear with custom timeout
 * Usage: cy.waitForElement(selector, timeout)
 */
Cypress.Commands.add('waitForElement', (selector, timeout = 10000) => {
    cy.get(selector, { timeout }).should('be.visible')
})

/**
 * Verify page accessibility basics
 * Usage: cy.checkBasicAccessibility()
 */
Cypress.Commands.add('checkBasicAccessibility', () => {
    // Check for basic accessibility requirements
    cy.get('h1').should('exist') // Page should have a main heading
    cy.get('[data-cy]').should('exist') // Should have test identifiers

    // Check that interactive elements are keyboard accessible
    cy.get('button, a, input, select, textarea').each(($el) => {
        cy.wrap($el).should('not.have.attr', 'tabindex', '-1')
    })
})

/**
 * Test if API is responding
 * Usage: cy.testAPI()
 */
Cypress.Commands.add('testAPI', () => {
    cy.request({
        method: 'GET',
        url: `${getApiBaseUrl()}/auth/status`,
        timeout: 10000,
        retryOnStatusCodeFailure: true
    }).then((response) => {
        expect(response.status).to.eq(200)
    })
})

/**
 * Enhanced login command that works with cookie-based authentication
 * Usage: cy.loginEnhanced()
 */
Cypress.Commands.add('loginEnhanced', () => {
    cy.session('admin-login-enhanced', () => {
        // Step 1: Clear any existing cookies and localStorage
        cy.clearCookies()
        cy.clearLocalStorage()

        // Step 2: Visit login page and wait for it to load
        cy.visit('/login')
        cy.get('[data-cy="email-input"]').should('be.visible')

        // Step 3: Fill in credentials
        cy.get('[data-cy="email-input"]').clear().type('test@t.ca')
        cy.get('[data-cy="password-input"]').clear().type('123456Pw')

        // Step 4: Submit the form
        cy.get('[data-cy="login-button"]').click()

        // Step 5: Wait for redirect to complete
        cy.url().should('include', '/pets', { timeout: 15000 })

        // Step 6: Verify authentication worked by making API call
        cy.request({
            method: 'GET',
            url: `${getApiBaseUrl()}/auth/me`,
            failOnStatusCode: false
        }).then((response) => {
            expect(response.status).to.eq(200)
            expect(response.body).to.have.property('email', 'test@t.ca')
        })

        // Step 7: Ensure we're actually logged in by checking the page content
        cy.get('h1').should('exist') // Should have a heading on the pets page
    }, {
        // Session validation - check if we're still authenticated
        validate() {
            cy.request({
                method: 'GET',
                url: `${getApiBaseUrl()}/auth/me`,
                failOnStatusCode: false
            }).then((response) => {
                if (response.status !== 200) {
                    // Session is invalid, need to login again
                    throw new Error('Session validation failed')
                }
            })
        }
    })
})

/**
 * Direct API login (bypasses UI)
 * Usage: cy.loginAPI()
 */
Cypress.Commands.add('loginAPI', () => {
    cy.session('api-login', () => {
        cy.request({
            method: 'POST',
            url: `${getApiBaseUrl()}/auth/login`,
            body: {
                email: 'test@t.ca',
                password: '123456Pw'
            },
            headers: {
                'Content-Type': 'application/json'
            }
        }).then((response) => {
            expect(response.status).to.eq(200)
            expect(response.body).to.have.property('email', 'test@t.ca')
        })
    })
})

// Overwrite cy.request to add better error handling
Cypress.Commands.overwrite('request', (originalFn, ...args) => {
    const options = typeof args[0] === 'object' ? args[0] : { url: args[0] }

    // Add default timeout and retries for better reliability
    const defaultOptions = {
        timeout: 10000,
        retryOnStatusCodeFailure: false,
        failOnStatusCode: true
    }

    const finalOptions = { ...defaultOptions, ...options }

    return originalFn(finalOptions)
})