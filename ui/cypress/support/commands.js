/**
 * Cypress Custom Commands
 * -----------------------
 *
 * All commands test both UI and API functionality.
 *
 * Available Commands:
 * - cy.login() - Login as admin user
 * - cy.waitForAPI() - Ensure API server is available
 * - cy.createTestLocation() - Create test location via API
 * - cy.createTestPet() - Create test pet via API
 * - cy.deletePetViaAPI() - Delete pet via API
 * - cy.cleanupTestData() - Clean up test data
 * - cy.verifyLoggedIn() - Verify user is authenticated via API
 * - cy.verifyLoggedOut() - Verify user is logged out via API
 * - cy.createTestUser() - Create test user account via API
 * - cy.createTestApplication() - Create adoption application via API
 * - cy.resetDatabase() - Reset database for testing (use sparingly)
 */

// Configuration constants
const DEMO_EMAIL = 'test@t.ca'
const DEMO_PASSWORD = '123456Pw'

/**
 * Get API base URL from environment
 * Usage: getApiBaseUrl()
 */
function getApiBaseUrl() {
    return Cypress.env('apiBaseUrl') || 'http://localhost:8000'
}

/**
 * Login as admin user - UPDATED to avoid cy.contains
 * Usage: cy.login()
 */
Cypress.Commands.add('login', () => {
    cy.session('admin-login', () => {
        cy.visit('/login')

        // Fill login form
        cy.get('[data-cy="email-input"]').type(DEMO_EMAIL)
        cy.get('[data-cy="password-input"]').type(DEMO_PASSWORD)
        cy.get('[data-cy="login-button"]').click()

        // Wait for redirect to dashboard
        cy.url().should('include', '/dashboard')

        // Verify login via API call
        cy.request(`${getApiBaseUrl()}/auth/me`).then((response) => {
            expect(response.status).to.eq(200)
            expect(response.body).to.have.property('email', DEMO_EMAIL)
        })
    })
})

/**
 * Wait for API to be ready - UPDATED
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
 * Create a test location via API - UPDATED to follow guidelines
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
        expect(response.status).to.eq(200)
        expect(response.body).to.have.property('location_id')
        return cy.wrap(response.body)
    })
})

/**
 * Create a test pet via API - UPDATED to avoid form encoding issues
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
        form: true, // Use form encoding for file uploads
        body: petData
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
        } else if (status === 'adopted' && pet.status !== 'adopted') {
            return cy.request({
                method: 'PATCH',
                url: `${getApiBaseUrl()}/pets/${pet.pet_id}/adopt`
            }).then((adoptResponse) => {
                expect(adoptResponse.status).to.eq(200)
                return cy.wrap({ ...pet, status: 'adopted' })
            })
        }

        return cy.wrap(pet)
    })
})

/**
 * Delete a pet via API - UPDATED
 * Usage: cy.deletePetViaAPI(petId)
 */
Cypress.Commands.add('deletePetViaAPI', (petId) => {
    if (!petId || petId === 'undefined') {
        cy.log(`Skipping deletion of invalid pet ID: ${petId}`)
        return cy.wrap(null)
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
 * Clean up test data (pets and locations) - UPDATED
 * Usage: cy.cleanupTestData()
 */
Cypress.Commands.add('cleanupTestData', () => {
    // Get all pets and delete test pets only
    cy.request({
        method: 'GET',
        url: `${getApiBaseUrl()}/pets`,
        failOnStatusCode: false
    }).then((response) => {
        if (response.status === 200 && response.body.length > 0) {
            response.body.forEach(pet => {
                // Only delete test pets (those with "Test Pet" in name)
                if (pet.pet_id && pet.name && pet.name.includes('Test Pet')) {
                    cy.deletePetViaAPI(pet.pet_id)
                }
            })
        }
    })

    // Note: We don't delete all locations as they might be used by non-test pets
    // Only clean up if we had a way to identify test locations
})

/**
 * Reset database for testing - NEW (use sparingly)
 * Usage: cy.resetDatabase()
 */
Cypress.Commands.add('resetDatabase', () => {
    cy.log('Resetting database - this should only be used in isolated tests')

    return cy.request({
        method: 'POST',
        url: `${getApiBaseUrl()}/_test/reset`,
        headers: {
            'X-Admin-Key': 'letmein'
        }
    }).then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body).to.have.property('ok', true)
    })
})

/**
 * Verify authentication status via API - UPDATED
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

/**
 * Create test user account via API - NEW
 * Usage: cy.createTestUser(userData).then((user) => { ... })
 */
Cypress.Commands.add('createTestUser', (userData = {}) => {
    const defaultUserData = {
        email: `testuser${Date.now()}@test.com`,
        password: 'TestPass123',
        first_name: 'Test',
        last_name: 'User',
        phone: '(555) 999-8888',
        role: 'user'
    }

    const userPayload = { ...defaultUserData, ...userData }

    return cy.request({
        method: 'POST',
        url: `${getApiBaseUrl()}/auth/register`,
        body: userPayload
    }).then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body).to.have.property('user')
        return cy.wrap(response.body.user)
    })
})

/**
 * Create adoption application via API - NEW
 * Usage: cy.createTestApplication(petId, applicationData).then((application) => { ... })
 */
Cypress.Commands.add('createTestApplication', (petId, applicationData = {}) => {
    if (!petId) {
        throw new Error('petId is required for createTestApplication')
    }

    const defaultApplicationData = {
        pet_id: petId,
        applicant_name: `Test Applicant ${Date.now()}`,
        applicant_email: `applicant${Date.now()}@test.com`,
        applicant_phone: '(555) 777-8888',
        applicant_address: '123 Test Application St',
        housing_type: 'house',
        has_yard: 'yes',
        other_pets: 'no',
        experience: 'I have had pets for many years',
        reason: 'I would like to provide a loving home'
    }

    const applicationPayload = { ...defaultApplicationData, ...applicationData }

    return cy.request({
        method: 'POST',
        url: `${getApiBaseUrl()}/applications`,
        body: applicationPayload
    }).then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body).to.have.property('application_id')
        return cy.wrap(response.body)
    })
})

/**
 * Update application status via API - NEW
 * Usage: cy.updateApplicationStatus(applicationId, status, adminNotes)
 */
Cypress.Commands.add('updateApplicationStatus', (applicationId, status, adminNotes = '') => {
    if (!applicationId) {
        throw new Error('applicationId is required')
    }
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
    }).then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body.status).to.eq(status)
        return cy.wrap(response.body)
    })
})

/**
 * Login as specific user - NEW
 * Usage: cy.loginAsUser(email, password)
 */
Cypress.Commands.add('loginAsUser', (email, password) => {
    cy.session(`user-login-${email}`, () => {
        cy.visit('/login')

        cy.get('[data-cy="email-input"]').type(email)
        cy.get('[data-cy="password-input"]').type(password)
        cy.get('[data-cy="login-button"]').click()

        // Wait for successful login (may redirect to home or dashboard)
        cy.url().should('not.include', '/login')

        // Verify login via API call
        cy.request(`${getApiBaseUrl()}/auth/me`).then((response) => {
            expect(response.status).to.eq(200)
            expect(response.body).to.have.property('email', email)
        })
    })
})

/**
 * Check if element exists without failing - NEW
 * Usage: cy.elementExists(selector).then((exists) => { ... })
 */
Cypress.Commands.add('elementExists', (selector) => {
    cy.get('body').then(($body) => {
        const exists = $body.find(selector).length > 0
        return cy.wrap(exists)
    })
})

/**
 * Wait for element to appear with custom timeout - NEW
 * Usage: cy.waitForElement(selector, timeout)
 */
Cypress.Commands.add('waitForElement', (selector, timeout = 10000) => {
    cy.get(selector, { timeout }).should('be.visible')
})

/**
 * Verify page accessibility basics - NEW
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
 * Take screenshot with custom name - NEW
 * Usage: cy.takeNamedScreenshot('test-case-name')
 */
Cypress.Commands.add('takeNamedScreenshot', (name) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    cy.screenshot(`${name}-${timestamp}`)
})

// Global error handling for commands
Cypress.on('fail', (err, runnable) => {
    // Log additional context for failed commands
    cy.log('Command failed:', runnable.title)
    cy.log('Error:', err.message)

    // Take screenshot on failure
    const testTitle = runnable.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()
    cy.screenshot(`failed-${testTitle}`)

    throw err
})

// Add command logging for debugging
Cypress.Commands.overwrite('request', (originalFn, ...args) => {
    const options = typeof args[0] === 'string' ? { url: args[0] } : args[0]

    cy.log(`API Request: ${options.method || 'GET'} ${options.url}`)

    return originalFn(...args).then((response) => {
        cy.log(`API Response: ${response.status} for ${options.url}`)
        return response
    })
})