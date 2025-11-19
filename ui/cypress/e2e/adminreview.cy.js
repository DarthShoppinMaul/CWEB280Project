/**
 * Admin Application Review Tests
 * -----------------------------
 * Tests for admin application review functionality
 *
 * Test Cases Covered:
 * - View Pending Applications (admin sees pending applications in dashboard)
 * - Review Application (admin clicks to review, sees application review page with details)
 * - Approve Application (admin approves application, status changes with timestamp)
 * - Reject Application (admin rejects application, status changes with timestamp)
 * - Add Admin Notes (admin adds internal notes, notes are saved and visible)
 * - Update Adoption Status (admin changes pet status, reflected in UI)
 * - Admin Dashboard Applications Display

 */

describe('Admin Application Review', () => {
    beforeEach(() => {
        cy.waitForAPI()
        cy.login() // Login as admin (test@t.ca)
    })

    afterEach(() => {
        cy.cleanupTestData()
    })

    describe('Admin Dashboard - Pending Applications', () => {
        it('should display pending applications in admin dashboard', () => {
            // Create test data: location, pet, and application
            cy.createTestLocation().then((location) => {
                cy.createTestPet(location.location_id, 'approved').then((pet) => {
                    // Submit an application for the pet
                    cy.visit(`/apply/${pet.pet_id}`)

                    cy.get('[data-cy="applicant-name-input"]').type('Review Test User')
                    cy.get('[data-cy="applicant-email-input"]').type('reviewtest@example.com')
                    cy.get('[data-cy="applicant-phone-input"]').type('(555) 111-2222')
                    cy.get('[data-cy="applicant-address-input"]').type('123 Review St')
                    cy.get('[data-cy="housing-type-select"]').select('house')
                    cy.get('[data-cy="experience-input"]').type('Experienced with dogs')
                    cy.get('[data-cy="reason-input"]').type('Looking for a companion')

                    cy.get('[data-cy="submit-application-button"]').click()
                    cy.url().should('include', '/my-applications')

                    // Now visit admin dashboard
                    cy.visit('/dashboard')

                    // Check that dashboard displays pending applications section
                    cy.get('[data-cy="pending-applications-section"]').should('be.visible')
                    cy.get('[data-cy="pending-applications-title"]').should('have.text', 'Pending Applications')

                    // Should show the application we just created
                    cy.get('[data-cy="pending-application-item"]').should('have.length.at.least', 1)

                    cy.get('[data-cy="pending-application-item"]').first().within(() => {
                        cy.get('[data-cy="applicant-name"]').should('have.text', 'Review Test User')
                        cy.get('[data-cy="pet-name"]').should('have.text', pet.name)
                        cy.get('[data-cy="application-date"]').should('be.visible')
                        cy.get('[data-cy="review-button"]').should('be.visible')
                        cy.get('[data-cy="review-button"]').should('have.text', 'Review')
                    })
                })
            })
        })

        it('should show empty state when no pending applications exist', () => {
            cy.visit('/dashboard')

            cy.get('[data-cy="pending-applications-section"]').should('be.visible')

            // Should show empty state (if no pending applications)
            cy.get('[data-cy="no-pending-applications"]').should('be.visible')
            cy.get('[data-cy="no-pending-applications"]').should('have.text', 'No pending applications to review')
        })
    })

    describe('Application Review Page', () => {
        beforeEach(() => {
            // Create test application for each test
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
                cy.get('[data-cy="admin-notes-input"]').should('be.visible')
            })
        })
    })

    describe('Application Approval', () => {
        beforeEach(() => {
            cy.createTestLocation().then((location) => {
                cy.createTestPet(location.location_id, 'approved').then((pet) => {
                    // Create application to approve
                    cy.visit(`/apply/${pet.pet_id}`)

                    cy.get('[data-cy="applicant-name-input"]').type('Approval Test')
                    cy.get('[data-cy="applicant-email-input"]').type('approval@test.com')
                    cy.get('[data-cy="applicant-phone-input"]').type('(555) 555-5555')
                    cy.get('[data-cy="applicant-address-input"]').type('789 Approval Ln')
                    cy.get('[data-cy="housing-type-select"]').select('house')
                    cy.get('[data-cy="experience-input"]').type('Ready to care for a pet')
                    cy.get('[data-cy="reason-input"]').type('Perfect match for our family')

                    cy.get('[data-cy="submit-application-button"]').click()
                    cy.wrap({ pet }).as('testData')
                })
            })
        })

        it('should approve application and update status with timestamp', function() {
            // Find and navigate to the application
            cy.request(`${Cypress.env('apiBaseUrl')}/applications`).then((response) => {
                const applications = response.body
                const testApp = applications.find(app => app.applicant_email === 'approval@test.com')

                cy.visit(`/applications/review/${testApp.application_id}`)

                // Add admin notes before approval
                cy.get('[data-cy="admin-notes-input"]').type('Excellent application. Approved after thorough review.')
                cy.get('[data-cy="save-notes-button"]').click()

                // Approve the application
                cy.get('[data-cy="approve-button"]').click()

                // Should show confirmation dialog
                cy.get('[data-cy="approve-confirm-dialog"]').should('be.visible')
                cy.get('[data-cy="confirm-approve-button"]').click()

                // Should update status display
                cy.get('[data-cy="current-status"]').should('have.text', 'Approved')
                cy.get('[data-cy="status-timestamp"]').should('be.visible')
                cy.get('[data-cy="status-timestamp"]').should('match', /\d{4}-\d{2}-\d{2}/)

                // Approve and reject buttons should be disabled
                cy.get('[data-cy="approve-button"]').should('be.disabled')
                cy.get('[data-cy="reject-button"]').should('be.disabled')

                // Verify via API that status was updated
                cy.request(`${Cypress.env('apiBaseUrl')}/applications/${testApp.application_id}`).then((apiResponse) => {
                    expect(apiResponse.status).to.eq(200)
                    expect(apiResponse.body.status).to.eq('approved')
                    expect(apiResponse.body.reviewed_at).to.exist
                    expect(apiResponse.body.admin_notes).to.eq('Excellent application. Approved after thorough review.')
                })
            })
        })

        it('should show success message after approval', () => {
            cy.request(`${Cypress.env('apiBaseUrl')}/applications`).then((response) => {
                const applications = response.body
                const testApp = applications.find(app => app.applicant_email === 'approval@test.com')

                cy.visit(`/applications/review/${testApp.application_id}`)

                cy.get('[data-cy="approve-button"]').click()
                cy.get('[data-cy="confirm-approve-button"]').click()

                // Should show success message
                cy.get('[data-cy="approval-success-message"]').should('be.visible')
                cy.get('[data-cy="approval-success-message"]').should('have.text', 'Application approved successfully!')
            })
        })
    })

    describe('Application Rejection', () => {
        beforeEach(() => {
            cy.createTestLocation().then((location) => {
                cy.createTestPet(location.location_id, 'approved').then((pet) => {
                    // Create application to reject
                    cy.visit(`/apply/${pet.pet_id}`)

                    cy.get('[data-cy="applicant-name-input"]').type('Rejection Test')
                    cy.get('[data-cy="applicant-email-input"]').type('rejection@test.com')
                    cy.get('[data-cy="applicant-phone-input"]').type('(555) 666-7777')
                    cy.get('[data-cy="applicant-address-input"]').type('321 Reject St')
                    cy.get('[data-cy="housing-type-select"]').select('apartment')
                    cy.get('[data-cy="experience-input"]').type('Limited experience')
                    cy.get('[data-cy="reason-input"]').type('Want a pet')

                    cy.get('[data-cy="submit-application-button"]').click()
                })
            })
        })

        it('should reject application and update status with timestamp', () => {
            cy.request(`${Cypress.env('apiBaseUrl')}/applications`).then((response) => {
                const applications = response.body
                const testApp = applications.find(app => app.applicant_email === 'rejection@test.com')

                cy.visit(`/applications/review/${testApp.application_id}`)

                // Add rejection reason in admin notes
                cy.get('[data-cy="admin-notes-input"]').type('Application rejected due to insufficient experience with pets.')
                cy.get('[data-cy="save-notes-button"]').click()

                // Reject the application
                cy.get('[data-cy="reject-button"]').click()

                // Should show confirmation dialog
                cy.get('[data-cy="reject-confirm-dialog"]').should('be.visible')
                cy.get('[data-cy="confirm-reject-button"]').click()

                // Should update status display
                cy.get('[data-cy="current-status"]').should('have.text', 'Rejected')
                cy.get('[data-cy="status-timestamp"]').should('be.visible')

                // Buttons should be disabled
                cy.get('[data-cy="approve-button"]').should('be.disabled')
                cy.get('[data-cy="reject-button"]').should('be.disabled')

                // Verify via API
                cy.request(`${Cypress.env('apiBaseUrl')}/applications/${testApp.application_id}`).then((apiResponse) => {
                    expect(apiResponse.status).to.eq(200)
                    expect(apiResponse.body.status).to.eq('rejected')
                    expect(apiResponse.body.reviewed_at).to.exist
                    expect(apiResponse.body.admin_notes).to.eq('Application rejected due to insufficient experience with pets.')
                })
            })
        })

        it('should show success message after rejection', () => {
            cy.request(`${Cypress.env('apiBaseUrl')}/applications`).then((response) => {
                const applications = response.body
                const testApp = applications.find(app => app.applicant_email === 'rejection@test.com')

                cy.visit(`/applications/review/${testApp.application_id}`)

                cy.get('[data-cy="reject-button"]').click()
                cy.get('[data-cy="confirm-reject-button"]').click()

                cy.get('[data-cy="rejection-success-message"]').should('be.visible')
                cy.get('[data-cy="rejection-success-message"]').should('have.text', 'Application rejected successfully!')
            })
        })
    })

    describe('Admin Notes Management', () => {
        beforeEach(() => {
            cy.createTestLocation().then((location) => {
                cy.createTestPet(location.location_id, 'approved').then((pet) => {
                    // Create application for notes testing
                    cy.visit(`/apply/${pet.pet_id}`)

                    cy.get('[data-cy="applicant-name-input"]').type('Notes Test')
                    cy.get('[data-cy="applicant-email-input"]').type('notes@test.com')
                    cy.get('[data-cy="applicant-phone-input"]').type('(555) 888-9999')
                    cy.get('[data-cy="applicant-address-input"]').type('987 Notes Rd')
                    cy.get('[data-cy="housing-type-select"]').select('house')
                    cy.get('[data-cy="experience-input"]').type('Some experience')
                    cy.get('[data-cy="reason-input"]').type('Good reason')

                    cy.get('[data-cy="submit-application-button"]').click()
                })
            })
        })

        it('should save and display admin notes', () => {
            cy.request(`${Cypress.env('apiBaseUrl')}/applications`).then((response) => {
                const applications = response.body
                const testApp = applications.find(app => app.applicant_email === 'notes@test.com')

                cy.visit(`/applications/review/${testApp.application_id}`)

                // Add admin notes
                const noteText = 'Initial review completed. Candidate seems suitable but needs reference check.'
                cy.get('[data-cy="admin-notes-input"]').type(noteText)
                cy.get('[data-cy="save-notes-button"]').click()

                // Should show success message
                cy.get('[data-cy="notes-saved-message"]').should('be.visible')
                cy.get('[data-cy="notes-saved-message"]').should('have.text', 'Notes saved successfully!')

                // Refresh page to verify persistence
                cy.reload()

                // Notes should be displayed
                cy.get('[data-cy="admin-notes-input"]').should('have.value', noteText)

                // Verify via API
                cy.request(`${Cypress.env('apiBaseUrl')}/applications/${testApp.application_id}`).then((apiResponse) => {
                    expect(apiResponse.status).to.eq(200)
                    expect(apiResponse.body.admin_notes).to.eq(noteText)
                })
            })
        })

        it('should update existing admin notes', () => {
            cy.request(`${Cypress.env('apiBaseUrl')}/applications`).then((response) => {
                const applications = response.body
                const testApp = applications.find(app => app.applicant_email === 'notes@test.com')

                cy.visit(`/applications/review/${testApp.application_id}`)

                // Add initial notes
                cy.get('[data-cy="admin-notes-input"]').type('Initial notes.')
                cy.get('[data-cy="save-notes-button"]').click()

                // Update notes
                cy.get('[data-cy="admin-notes-input"]').clear()
                cy.get('[data-cy="admin-notes-input"]').type('Updated notes with more details.')
                cy.get('[data-cy="save-notes-button"]').click()

                cy.get('[data-cy="notes-saved-message"]').should('be.visible')

                // Verify updated notes via API
                cy.request(`${Cypress.env('apiBaseUrl')}/applications/${testApp.application_id}`).then((apiResponse) => {
                    expect(apiResponse.status).to.eq(200)
                    expect(apiResponse.body.admin_notes).to.eq('Updated notes with more details.')
                })
            })
        })
    })

    describe('Pet Status Updates', () => {
        it('should update pet adoption status when application is approved', () => {
            cy.createTestLocation().then((location) => {
                cy.createTestPet(location.location_id, 'approved').then((pet) => {
                    // Create and approve an application
                    cy.visit(`/apply/${pet.pet_id}`)

                    cy.get('[data-cy="applicant-name-input"]').type('Status Update Test')
                    cy.get('[data-cy="applicant-email-input"]').type('statusupdate@test.com')
                    cy.get('[data-cy="applicant-phone-input"]').type('(555) 000-1111')
                    cy.get('[data-cy="applicant-address-input"]').type('Status St')
                    cy.get('[data-cy="housing-type-select"]').select('house')
                    cy.get('[data-cy="experience-input"]').type('Experience')
                    cy.get('[data-cy="reason-input"]').type('Reason')

                    cy.get('[data-cy="submit-application-button"]').click()

                    // Find and approve application
                    cy.request(`${Cypress.env('apiBaseUrl')}/applications`).then((response) => {
                        const applications = response.body
                        const testApp = applications.find(app => app.applicant_email === 'statusupdate@test.com')

                        cy.visit(`/applications/review/${testApp.application_id}`)
                        cy.get('[data-cy="approve-button"]').click()
                        cy.get('[data-cy="confirm-approve-button"]').click()

                        // Check that pet status was updated
                        cy.request(`${Cypress.env('apiBaseUrl')}/pets/${pet.pet_id}`).then((petResponse) => {
                            expect(petResponse.status).to.eq(200)
                            expect(petResponse.body.status).to.eq('adopted')
                        })
                    })
                })
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
    })
})