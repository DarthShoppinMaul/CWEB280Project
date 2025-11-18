// Custom Commands for Pet Gallery App

// Demo credentials from the application
const DEMO_EMAIL = 'test@t.ca'
const DEMO_PASSWORD = '123456Pw'

// Get API base URL consistently
const getApiBaseUrl = () => Cypress.env('apiBaseUrl') || 'http://localhost:8000'

/**
 * Login command that performs UI login
 * Usage: cy.login()
 */
Cypress.Commands.add('login', () => {
    cy.visit('/login')
    cy.get('[data-cy="email-input"]').type(DEMO_EMAIL)
    cy.get('[data-cy="password-input"]').type(DEMO_PASSWORD)
    cy.get('[data-cy="login-button"]').click()

    // Wait for successful redirect to dashboard
    cy.url().should('include', '/dashboard')
    cy.get('h1').should('have.text', 'Admin Dashboard')
})

/**
 * Login via API directly (faster for setup)
 * Usage: cy.loginViaAPI()
 */
Cypress.Commands.add('loginViaAPI', () => {
    cy.request({
        method: 'POST',
        url: `${getApiBaseUrl()}/auth/login`,
        body: {
            email: DEMO_EMAIL,
            password: DEMO_PASSWORD
        }
    }).then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body).to.have.property('email', DEMO_EMAIL)
    })
})

/**
 * Logout command
 * Usage: cy.logout()
 */
Cypress.Commands.add('logout', () => {
    cy.get('[data-cy="logout-link"]').click()
    cy.url().should('eq', Cypress.config().baseUrl + '/')
    cy.get('h1').should('have.text', 'Adoptable Pets')
})

/**
 * Create a test location via API
 * Usage: cy.createTestLocation().then((location) => { ... })
 */
Cypress.Commands.add('createTestLocation', () => {
    const locationData = {
        name: `Test Location ${Date.now()}`,
        address: '123 Test Street, Test City, ON',
        phone: '(416) 555-0199'
    }

    return cy.request({
        method: 'POST',
        url: `${getApiBaseUrl()}/locations`,
        body: locationData
    }).then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body).to.have.property('location_id')
        return cy.wrap(response.body)
    })
})

/**
 * Create a test pet via API - FIXED
 * Usage: cy.createTestPet(locationId).then((pet) => { ... })
 */
Cypress.Commands.add('createTestPet', (locationId, status = 'pending') => {
    const petData = {
        name: `Test Pet ${Date.now()}`,
        species: 'Test Dog',
        age: 2,
        description: 'A test pet for e2e testing',
        location_id: locationId
    }

    //  Use form: true instead of manual FormData + Content-Type header
    return cy.request({
        method: 'POST',
        url: `${getApiBaseUrl()}/pets`,
        form: true, // Let Cypress handle form encoding properly
        body: petData
        //  Don't set Content-Type header manually
    }).then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body).to.have.property('pet_id')

        const pet = response.body

        // Update status if needed
        if (status === 'approved' && pet.status !== 'approved') {
            return cy.request({
                method: 'PATCH',
                url: `${getApiBaseUrl()}/pets/${pet.pet_id}/approve`
            }).then((approveResponse) => {
                expect(approveResponse.status).to.eq(200)
                return cy.wrap({ ...pet, status: 'approved' })
            })
        }

        return cy.wrap(pet)
    })
})

/**
 * Delete a pet via API - NEW
 * Usage: cy.deletePetViaAPI(petId)
 */
Cypress.Commands.add('deletePetViaAPI', (petId) => {
    if (!petId || petId === 'undefined') {
        throw new Error(`Invalid pet ID: ${petId}`)
    }

    return cy.request({
        method: 'DELETE',
        url: `${getApiBaseUrl()}/pets/${petId}`,
        failOnStatusCode: false // Don't fail if pet doesn't exist
    }).then((response) => {
        // Accept both 200 (deleted) and 404 (already gone) as success
        expect([200, 404]).to.include(response.status)
        return response.body
    })
})

/**
 * Clean up test data (pets and locations) - FIXED
 * Usage: cy.cleanupTestData()
 */
Cypress.Commands.add('cleanupTestData', () => {
    // Get all pets and delete them
    cy.request({
        method: 'GET',
        url: `${getApiBaseUrl()}/pets`,
        failOnStatusCode: false
    }).then((response) => {
        if (response.status === 200 && response.body.length > 0) {
            response.body.forEach(pet => {
                if (pet.pet_id) {
                    cy.deletePetViaAPI(pet.pet_id)
                }
            })
        }
    })

    // Note: We don't delete locations as they might be needed for other tests
    // and the app doesn't provide a delete endpoint for locations
})

/**
 * Alternative cleanup that's more thorough - NEW
 * Usage: cy.cleanDatabase()
 */
Cypress.Commands.add('cleanDatabase', () => {
    return cy.cleanupTestData()
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
    }).then((response) => {
        expect(response.status).to.eq(200)
    })
})

/**
 * Verify authentication status via API
 * Usage: cy.verifyLoggedIn() or cy.verifyLoggedOut()
 */
Cypress.Commands.add('verifyLoggedIn', () => {
    cy.request({
        url: `${getApiBaseUrl()}/auth/me`,
        failOnStatusCode: false
    }).then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body).to.have.property('email', DEMO_EMAIL)
    })
})

Cypress.Commands.add('verifyLoggedOut', () => {
    cy.request({
        url: `${getApiBaseUrl()}/auth/me`,
        failOnStatusCode: false
    }).then((response) => {
        expect(response.status).to.eq(401)
    })
})