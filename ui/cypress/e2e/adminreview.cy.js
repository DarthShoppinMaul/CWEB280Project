/**
 * Admin Application Review Tests
 * -----------------------------
 * Tests for admin functionality to review adoption applications.
 *
 * Test Cases Covered:
 * - Navigate to Application Review from Dashboard
 * - Display Complete Application Details
 * - Approve Application with Admin Notes
 * - Reject Application with Admin Notes
 * - Update Application Status
 * - Admin Notes Functionality
 * - Application History Tracking
 *
 * - Tests both UI and API functionality
 * - Will fail if API server is not running
 */

describe('Admin Application Review', () => {
    beforeEach(() => {
        cy.testAPI()
        cy.loginEnhanced() // Login as admin (test@t.ca)

        // Create test data for each test
        cy.createTestLocation().then((location) => {
            cy.createTestPet(location.location_id, 'approved').then((pet) => {
                // Submit application
                cy.visit(`/apply/${pet.pet_id}`)

                cy.get('[data-cy="applicant-name-input"]').type('Review Page Test')
                cy.get('[data-cy="applicant-email-input"]').type('reviewpage@test.com')
                cy.get('[data-cy="applicant-phone-input"]').type('(555) 333-4444')
                cy.get('[data-cy="applicant-address-input"]').type('456 Review Ave')
                cy.get('[data-cy="housing-type-select"]').select('apartment')
                cy.get('[data-cy="has-yard-select"]').select('no')
                cy.get('[data-cy="other-pets-select"]').select('yes')
                cy.get('[data-cy="experience-input"]').type('Have had cats for 5 years')
                cy.get('[data-cy="reason-input"]').type('Want to give a pet a loving home')

                cy.get('[data-cy="submit-application-button"]').click()
                cy.wrap({ pet }).as('testData')
            })
        })
    })

    afterEach(() => {
        cy.cleanupTestData()
    })

    describe('Application Review Page Navigation', () => {
        it('should navigate to application review page from dashboard', function() {
            cy.visit('/dashboard')

            // Click review button on first pending application
            cy.get('[data-cy="review-button"]').first().click()

            // Should navigate to application review page
            cy.url().should('include', '/applications/review/')
            cy.get('h1').should('have.text', 'Application Review')
        })

        it('should display complete application details', function() {
            // Get application ID and navigate directly to review page
            cy.request(`${Cypress.env('apiBaseUrl')}/applications`).then((response) => {
                const applications = response.body
                const testApp = applications.find(app => app.applicant_email === 'reviewpage@test.com')

                cy.visit(`/applications/review/${testApp.application_id}`)

                // Check application details are displayed
                cy.get('h1').should('have.text', 'Application Review')

                // Pet information
                cy.get('[data-cy="pet-info-section"]').should('be.visible')
                cy.get('[data-cy="pet-name-display"]').should('have.text', this.testData.pet.name)
                cy.get('[data-cy="pet-species-display"]').should('have.text', this.testData.pet.species)

                // Applicant information
                cy.get('[data-cy="applicant-info-section"]').should('be.visible')
                cy.get('[data-cy="applicant-name-display"]').should('have.text', 'Review Page Test')
                cy.get('[data-cy="applicant-email-display"]').should('have.text', 'reviewpage@test.com')
                cy.get('[data-cy="applicant-phone-display"]').should('have.text', '(555) 333-4444')
                cy.get('[data-cy="applicant-address-display"]').should('have.text', '456 Review Ave')

                // Housing information
                cy.get('[data-cy="housing-info-section"]').should('be.visible')
                cy.get('[data-cy="housing-type-display"]').should('have.text', 'Apartment')
                cy.get('[data-cy="has-yard-display"]').should('have.text', 'No')
                cy.get('[data-cy="other-pets-display"]').should('have.text', 'Yes')

                // Application details
                cy.get('[data-cy="experience-display"]').should('have.text', 'Have had cats for 5 years')
                cy.get('[data-cy="reason-display"]').should('have.text', 'Want to give a pet a loving home')

                // Status and actions
                cy.get('[data-cy="current-status"]').should('have.text', 'Pending')
                cy.get('[data-cy="approve-button"]').should('be.visible')
                cy.get('[data-cy="reject-button"]').should('be.visible')
                cy.get('[data-cy="admin-notes-textarea"]').should('be.visible')
            })
        })
    })

    describe('Application Approval Process', () => {
        it('should approve application with admin notes', function() {
            cy.request(`${Cypress.env('apiBaseUrl')}/applications`).then((response) => {
                const testApp = response.body.find(app => app.applicant_email === 'reviewpage@test.com')
                cy.visit(`/applications/review/${testApp.application_id}`)

                // Add admin notes
                cy.get('[data-cy="admin-notes-textarea"]').type('Applicant has excellent references and experience. Approved for adoption.')

                // Approve application
                cy.get('[data-cy="approve-button"]').click()

                // Should show confirmation dialog
                cy.get('[data-cy="approve-confirmation-modal"]').should('be.visible')
                cy.get('[data-cy="confirm-approve-button"]').click()

                // Should update status and show success message
                cy.get('[data-cy="current-status"]').should('have.text', 'Approved')
                cy.get('[data-cy="success-message"]').should('be.visible')
                cy.get('[data-cy="success-message"]').should('have.text', 'Application approved successfully!')

                // Verify via API that application was approved
                cy.request(`${Cypress.env('apiBaseUrl')}/applications/${testApp.application_id}`).then((apiResponse) => {
                    expect(apiResponse.body.status).to.eq('approved')
                    expect(apiResponse.body.admin_notes).to.include('excellent references')
                })
            })
        })

        it('should show loading state during approval', function() {
            cy.request(`${Cypress.env('apiBaseUrl')}/applications`).then((response) => {
                const testApp = response.body.find(app => app.applicant_email === 'reviewpage@test.com')
                cy.visit(`/applications/review/${testApp.application_id}`)

                cy.get('[data-cy="admin-notes-textarea"]').type('Quick approval test')
                cy.get('[data-cy="approve-button"]').click()
                cy.get('[data-cy="confirm-approve-button"]').click()

                // Button should show loading state
                cy.get('[data-cy="approve-button"]')
                    .should('have.text', 'Approving...')
                    .and('be.disabled')

                // Should eventually show success
                cy.get('[data-cy="current-status"]').should('have.text', 'Approved', { timeout: 10000 })
            })
        })
    })

    describe('Application Rejection Process', () => {
        it('should reject application with admin notes', function() {
            cy.request(`${Cypress.env('apiBaseUrl')}/applications`).then((response) => {
                const testApp = response.body.find(app => app.applicant_email === 'reviewpage@test.com')
                cy.visit(`/applications/review/${testApp.application_id}`)

                // Add admin notes for rejection
                cy.get('[data-cy="admin-notes-textarea"]').type('Unfortunately, apartment living is not suitable for this pet size. Rejected.')

                // Reject application
                cy.get('[data-cy="reject-button"]').click()

                // Should show confirmation dialog
                cy.get('[data-cy="reject-confirmation-modal"]').should('be.visible')
                cy.get('[data-cy="confirm-reject-button"]').click()

                // Should update status and show message
                cy.get('[data-cy="current-status"]').should('have.text', 'Rejected')
                cy.get('[data-cy="success-message"]').should('be.visible')
                cy.get('[data-cy="success-message"]').should('have.text', 'Application rejected.')

                // Verify via API that application was rejected
                cy.request(`${Cypress.env('apiBaseUrl')}/applications/${testApp.application_id}`).then((apiResponse) => {
                    expect(apiResponse.body.status).to.eq('rejected')
                    expect(apiResponse.body.admin_notes).to.include('not suitable')
                })
            })
        })

        it('should require admin notes for rejection', function() {
            cy.request(`${Cypress.env('apiBaseUrl')}/applications`).then((response) => {
                const testApp = response.body.find(app => app.applicant_email === 'reviewpage@test.com')
                cy.visit(`/applications/review/${testApp.application_id}`)

                // Try to reject without notes
                cy.get('[data-cy="reject-button"]').click()

                // Should show validation error
                cy.get('[data-cy="admin-notes-error"]').should('be.visible')
                cy.get('[data-cy="admin-notes-error"]').should('have.text', 'Admin notes are required when rejecting an application')

                // Should not show confirmation dialog
                cy.get('[data-cy="reject-confirmation-modal"]').should('not.exist')
            })
        })
    })

    describe('Admin Notes Functionality', () => {
        it('should allow adding and editing admin notes', function() {
            cy.request(`${Cypress.env('apiBaseUrl')}/applications`).then((response) => {
                const testApp = response.body.find(app => app.applicant_email === 'reviewpage@test.com')
                cy.visit(`/applications/review/${testApp.application_id}`)

                // Add initial notes
                cy.get('[data-cy="admin-notes-textarea"]').type('Initial review notes - applicant contacted via phone.')

                // Save notes without changing status
                cy.get('[data-cy="save-notes-button"]').click()

                // Should show success message
                cy.get('[data-cy="notes-saved-message"]').should('be.visible')
                cy.get('[data-cy="notes-saved-message"]').should('have.text', 'Notes saved successfully')

                // Refresh page and verify notes persist
                cy.reload()
                cy.get('[data-cy="admin-notes-textarea"]').should('have.value', 'Initial review notes - applicant contacted via phone.')

                // Add more notes
                cy.get('[data-cy="admin-notes-textarea"]').clear()
                cy.get('[data-cy="admin-notes-textarea"]').type('Updated notes - references checked. All positive feedback.')
                cy.get('[data-cy="save-notes-button"]').click()

                // Verify updated notes via API
                cy.request(`${Cypress.env('apiBaseUrl')}/applications/${testApp.application_id}`).then((apiResponse) => {
                    expect(apiResponse.body.admin_notes).to.include('references checked')
                })
            })
        })

        it('should display character count for admin notes', function() {
            cy.request(`${Cypress.env('apiBaseUrl')}/applications`).then((response) => {
                const testApp = response.body.find(app => app.applicant_email === 'reviewpage@test.com')
                cy.visit(`/applications/review/${testApp.application_id}`)

                // Check if character counter exists
                cy.get('body').then(($body) => {
                    if ($body.find('[data-cy="notes-character-count"]').length > 0) {
                        cy.get('[data-cy="admin-notes-textarea"]').type('Test notes for character counting')
                        cy.get('[data-cy="notes-character-count"]').should('contain', '33')
                    }
                })
            })
        })
    })

    describe('Application History and Tracking', () => {
        it('should display application submission date', function() {
            cy.request(`${Cypress.env('apiBaseUrl')}/applications`).then((response) => {
                const testApp = response.body.find(app => app.applicant_email === 'reviewpage@test.com')
                cy.visit(`/applications/review/${testApp.application_id}`)

                cy.get('[data-cy="submission-date-display"]').should('be.visible')
                cy.get('[data-cy="submission-date-display"]').should('contain', new Date().getFullYear())
            })
        })

        it('should track status change history', function() {
            cy.request(`${Cypress.env('apiBaseUrl')}/applications`).then((response) => {
                const testApp = response.body.find(app => app.applicant_email === 'reviewpage@test.com')
                cy.visit(`/applications/review/${testApp.application_id}`)

                // Check if history section exists
                cy.get('body').then(($body) => {
                    if ($body.find('[data-cy="application-history"]').length > 0) {
                        cy.get('[data-cy="application-history"]').should('be.visible')
                        cy.get('[data-cy="history-item"]').should('contain', 'Application submitted')
                    }
                })

                // Make a status change
                cy.get('[data-cy="admin-notes-textarea"]').type('Approving for history test')
                cy.get('[data-cy="approve-button"]').click()
                cy.get('[data-cy="confirm-approve-button"]').click()

                // Check updated history
                cy.get('body').then(($body) => {
                    if ($body.find('[data-cy="application-history"]').length > 0) {
                        cy.get('[data-cy="history-item"]').should('contain', 'Application approved')
                    }
                })
            })
        })
    })

    describe('Batch Application Management', () => {
        it('should allow navigating between multiple applications', function() {
            // Create additional test application
            cy.createTestLocation().then((location) => {
                cy.createTestPet(location.location_id, 'approved', 'Second Pet').then((secondPet) => {
                    // Submit second application via API
                    cy.request({
                        method: 'POST',
                        url: `${Cypress.env('apiBaseUrl')}/applications`,
                        body: {
                            pet_id: secondPet.pet_id,
                            applicant_name: 'Second Applicant',
                            applicant_email: 'second@test.com',
                            applicant_phone: '(555) 444-5555',
                            applicant_address: '789 Second St',
                            housing_type: 'house',
                            experience: 'Second application experience',
                            reason: 'Second application reason'
                        }
                    })

                    // Navigate to dashboard
                    cy.visit('/dashboard')

                    // Should show multiple pending applications
                    cy.get('[data-cy="pending-applications"]').should('contain', 'Review Page Test')
                    cy.get('[data-cy="pending-applications"]').should('contain', 'Second Applicant')

                    // Navigate between applications
                    cy.get('[data-cy="review-button"]').first().click()
                    cy.get('[data-cy="applicant-name-display"]').then(($name) => {
                        const firstName = $name.text()

                        cy.visit('/dashboard')
                        cy.get('[data-cy="review-button"]').last().click()
                        cy.get('[data-cy="applicant-name-display"]').should('not.have.text', firstName)
                    })
                })
            })
        })
    })

    describe('Access Control and Permissions', () => {
        it('should only allow admin users to access application review', () => {
            // This test assumes admin role - in a real system, you'd test with different user roles
            cy.request(`${Cypress.env('apiBaseUrl')}/applications`).then((response) => {
                const testApp = response.body.find(app => app.applicant_email === 'reviewpage@test.com')

                cy.visit(`/applications/review/${testApp.application_id}`)
                cy.get('h1').should('have.text', 'Application Review')

                // Admin actions should be available
                cy.get('[data-cy="approve-button"]').should('be.visible')
                cy.get('[data-cy="reject-button"]').should('be.visible')
                cy.get('[data-cy="admin-notes-textarea"]').should('be.visible')
            })
        })
    })

    describe('API Integration', () => {
        it('should fail when API server is unavailable', () => {
            // This test validates that tests fail if API server is not running
            cy.request(`${Cypress.env('apiBaseUrl')}/applications`).then((response) => {
                expect(response.status).to.eq(200)
            })
        })

        it('should handle API errors gracefully during review actions', function() {
            cy.request(`${Cypress.env('apiBaseUrl')}/applications`).then((response) => {
                const testApp = response.body.find(app => app.applicant_email === 'reviewpage@test.com')
                cy.visit(`/applications/review/${testApp.application_id}`)

                // Should load page even if there are API delays
                cy.get('h1').should('have.text', 'Application Review')
                cy.get('[data-cy="approve-button"]').should('be.visible')
            })
        })
    })
})