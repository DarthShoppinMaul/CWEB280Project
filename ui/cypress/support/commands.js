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
 * Create a test pet via API
 * Usage: cy.createTestPet(locationId, status).then((pet) => { ... })
 */
Cypress.Commands.add('createTestPet', (locationId, status = 'pending') => {
    if (!locationId) {
        throw new Error('locationId is required for createTestPet')
    }

    const petData = {
        name: `Test Pet ${Date.now()}`,
        species: 'Test Dog',
        age: 2,
        description: 'A test pet for e2e testing',
        location_id: locationId
    }

    return cy.request({
        method: 'POST',
        url: `${getApiBaseUrl()}/pets`,
        body: petData
    }).then((response) => {
        return response.body
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

    return cy.request({
        method: 'PATCH',
        url: `${getApiBaseUrl()}/pets/${petId}`,
        body: {
            status: status
        }
    })
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