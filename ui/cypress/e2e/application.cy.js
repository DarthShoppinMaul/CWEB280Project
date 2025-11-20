/**
 * Adoption Application Tests
 * -------------------------
 * Tests for adoption application functionality following proposal test plan.
 *
 * Test Cases Covered:
 * - Submit Adoption Application (valid data creates application)
 * - Application Validation (missing fields show errors)
 * - Duplicate Application Prevention (same user can't apply for same pet twice)
 * - Apply from Pet Details (button opens application form with correct pet)
 * - View My Applications (user sees all their applications with status)
 * - Application Status Filter (filter applications by status)
 * - Disabled for Unavailable Pets (can't apply for adopted pets)
 * - Guest Application Restriction (non-logged users redirected to login)
 *
 * - Tests both UI and API functionality
 * - Will fail if API server is not running
 */

describe('Adoption Applications', () => {
    beforeEach(() => {
        cy.testAPI()
    })

    afterEach(() => {
        cy.cleanupTestData()
    })

    describe('Guest User Restrictions', () => {
        it('should redirect non-logged-in user to login page when trying to apply', () => {
            // Create a test pet first
            cy.loginEnhanced()
            cy.createTestLocation().then((location) => {
                cy.createTestPet(location.location_id, 'approved').then((pet) => {
                    // Logout and try to apply
                    cy.request('POST', `${Cypress.env('apiBaseUrl')}/auth/logout`)

                    cy.visit(`/pets/${pet.pet_id}`)
                    cy.get('[data-cy="apply-button"]').click()

                    // Should redirect to login
                    cy.url().should('include', '/login')
                })
            })
        })

        it('should redirect non-logged-in user trying to access application form directly', () => {
            cy.visit('/apply/123')
            cy.url().should('include', '/login')
        })

        it('should redirect non-logged-in user trying to access my applications page', () => {
            cy.visit('/my-applications')
            cy.url().should('include', '/login')
        })
    })

    describe('Application Form Access', () => {
        beforeEach(() => {
            cy.loginEnhanced()
        })

        it('should navigate to application form from pet details page', () => {
            cy.createTestLocation().then((location) => {
                cy.createTestPet(location.location_id, 'approved').then((pet) => {
                    cy.visit(`/pets/${pet.pet_id}`)

                    // Verify apply button is visible and enabled
                    cy.get('[data-cy="apply-button"]').should('be.visible')
                    cy.get('[data-cy="apply-button"]').should('not.be.disabled')
                    cy.get('[data-cy="apply-button"]').should('have.text', 'Apply for Adoption')

                    // Click apply button
                    cy.get('[data-cy="apply-button"]').click()

                    // Should navigate to application form with correct pet
                    cy.url().should('include', `/apply/${pet.pet_id}`)
                    cy.get('h1').should('have.text', 'Adoption Application')
                    cy.get('[data-cy="pet-name-display"]').should('have.text', pet.name)
                })
            })
        })

        it('should display application form correctly', () => {
            cy.createTestLocation().then((location) => {
                cy.createTestPet(location.location_id, 'approved').then((pet) => {
                    cy.visit(`/apply/${pet.pet_id}`)

                    // Check all form fields are present
                    cy.get('h1').should('have.text', 'Adoption Application')
                    cy.get('[data-cy="pet-name-display"]').should('have.text', pet.name)

                    cy.get('[data-cy="applicant-name-input"]').should('be.visible')
                    cy.get('[data-cy="applicant-email-input"]').should('be.visible')
                    cy.get('[data-cy="applicant-phone-input"]').should('be.visible')
                    cy.get('[data-cy="applicant-address-input"]').should('be.visible')
                    cy.get('[data-cy="housing-type-select"]').should('be.visible')
                    cy.get('[data-cy="has-yard-select"]').should('be.visible')
                    cy.get('[data-cy="other-pets-select"]').should('be.visible')
                    cy.get('[data-cy="experience-input"]').should('be.visible')
                    cy.get('[data-cy="reason-input"]').should('be.visible')

                    cy.get('[data-cy="submit-application-button"]').should('have.text', 'Submit Application')
                })
            })
        })

        it('should disable apply button for unavailable pets', () => {
            cy.createTestLocation().then((location) => {
                // Create an adopted pet
                cy.createTestPet(location.location_id, 'adopted').then((pet) => {
                    cy.visit(`/pets/${pet.pet_id}`)

                    // Apply button should be disabled
                    cy.get('[data-cy="apply-button"]').should('be.disabled')
                    cy.get('[data-cy="adoption-status-message"]').should('be.visible')
                    cy.get('[data-cy="adoption-status-message"]').should('have.text', 'This pet has already been adopted')
                })
            })
        })
    })

    describe('Application Form Validation', () => {
        beforeEach(() => {
            cy.loginEnhanced()
            cy.createTestLocation().then((location) => {
                cy.createTestPet(location.location_id, 'approved').then((pet) => {
                    cy.visit(`/apply/${pet.pet_id}`)
                    cy.wrap(pet).as('testPet')
                })
            })
        })

        it('should show validation errors for empty required fields', () => {
            // Try to submit empty form
            cy.get('[data-cy="submit-application-button"]').click()

            // Check validation errors
            cy.get('[data-cy="applicant-name-error"]').should('be.visible')
            cy.get('[data-cy="applicant-name-error"]').should('have.text', 'Full name is required')

            cy.get('[data-cy="applicant-email-error"]').should('be.visible')
            cy.get('[data-cy="applicant-email-error"]').should('have.text', 'Email is required')

            cy.get('[data-cy="applicant-phone-error"]').should('be.visible')
            cy.get('[data-cy="applicant-phone-error"]').should('have.text', 'Phone number is required')

            cy.get('[data-cy="applicant-address-error"]').should('be.visible')
            cy.get('[data-cy="applicant-address-error"]').should('have.text', 'Address is required')

            cy.get('[data-cy="housing-type-error"]').should('be.visible')
            cy.get('[data-cy="housing-type-error"]').should('have.text', 'Please select housing type')

            cy.get('[data-cy="experience-error"]').should('be.visible')
            cy.get('[data-cy="experience-error"]').should('have.text', 'Please describe your experience')

            cy.get('[data-cy="reason-error"]').should('be.visible')
            cy.get('[data-cy="reason-error"]').should('have.text', 'Please explain why you want to adopt')

            // Should remain on form page
            cy.url().should('include', '/apply/')
        })

        it('should validate email format', () => {
            cy.get('[data-cy="applicant-email-input"]').type('invalid-email')
            cy.get('[data-cy="submit-application-button"]').click()

            cy.get('[data-cy="applicant-email-error"]').should('be.visible')
            cy.get('[data-cy="applicant-email-error"]').should('have.text', 'Please enter a valid email address')
        })

        it('should validate phone number format', () => {
            cy.get('[data-cy="applicant-phone-input"]').type('invalid-phone')
            cy.get('[data-cy="submit-application-button"]').click()

            cy.get('[data-cy="applicant-phone-error"]').should('be.visible')
            cy.get('[data-cy="applicant-phone-error"]').should('have.text', 'Please enter a valid phone number')
        })
    })

    describe('Successful Application Submission', () => {
        beforeEach(() => {
            cy.loginEnhanced()
            cy.createTestLocation().then((location) => {
                cy.createTestPet(location.location_id, 'approved').then((pet) => {
                    cy.visit(`/apply/${pet.pet_id}`)
                    cy.wrap(pet).as('testPet')
                })
            })
        })

        it('should successfully submit valid application', function() {
            // Fill out all required fields
            cy.get('[data-cy="applicant-name-input"]').type('John Doe')
            cy.get('[data-cy="applicant-email-input"]').type('john.doe@example.com')
            cy.get('[data-cy="applicant-phone-input"]').type('(555) 123-4567')
            cy.get('[data-cy="applicant-address-input"]').type('123 Main Street, City, State 12345')
            cy.get('[data-cy="housing-type-select"]').select('house')
            cy.get('[data-cy="has-yard-select"]').select('yes')
            cy.get('[data-cy="other-pets-select"]').select('no')
            cy.get('[data-cy="experience-input"]').type('I have had dogs for over 10 years and understand their needs.')
            cy.get('[data-cy="reason-input"]').type('I want to provide a loving home for a pet in need.')

            cy.get('[data-cy="submit-application-button"]').click()

            // Should show success message and redirect
            cy.url().should('include', '/my-applications')
            cy.get('[data-cy="success-message"]').should('be.visible')
            cy.get('[data-cy="success-message"]').should('have.text', 'Application submitted successfully!')

            // Verify application was created via API
            cy.request(`${Cypress.env('apiBaseUrl')}/applications/my`).then((response) => {
                expect(response.status).to.eq(200)
                expect(response.body).to.have.length.at.least(1)

                const application = response.body.find(app => app.pet_id === this.testPet.pet_id)
                expect(application).to.exist
                expect(application.applicant_name).to.eq('John Doe')
                expect(application.applicant_email).to.eq('john.doe@example.com')
                expect(application.status).to.eq('pending')
            })
        })

        it('should show loading state during submission', () => {
            // Fill minimal required fields
            cy.get('[data-cy="applicant-name-input"]').type('Loading Test')
            cy.get('[data-cy="applicant-email-input"]').type('loading@test.com')
            cy.get('[data-cy="applicant-phone-input"]').type('(555) 999-9999')
            cy.get('[data-cy="applicant-address-input"]').type('Test Address')
            cy.get('[data-cy="housing-type-select"]').select('apartment')
            cy.get('[data-cy="experience-input"]').type('Test experience')
            cy.get('[data-cy="reason-input"]').type('Test reason')

            cy.get('[data-cy="submit-application-button"]').click()

            // Button should show loading state
            cy.get('[data-cy="submit-application-button"]')
                .should('have.text', 'Submitting...')
                .and('be.disabled')

            // Should eventually redirect
            cy.url().should('include', '/my-applications', { timeout: 10000 })
        })
    })

    describe('Duplicate Application Prevention', () => {
        beforeEach(() => {
            cy.loginEnhanced()
        })

        it('should prevent user from applying for the same pet twice', () => {
            cy.createTestLocation().then((location) => {
                cy.createTestPet(location.location_id, 'approved').then((pet) => {
                    // Submit first application
                    cy.visit(`/apply/${pet.pet_id}`)

                    cy.get('[data-cy="applicant-name-input"]').type('Duplicate Test')
                    cy.get('[data-cy="applicant-email-input"]').type('duplicate@test.com')
                    cy.get('[data-cy="applicant-phone-input"]').type('(555) 111-1111')
                    cy.get('[data-cy="applicant-address-input"]').type('Test Address')
                    cy.get('[data-cy="housing-type-select"]').select('house')
                    cy.get('[data-cy="experience-input"]').type('Test experience')
                    cy.get('[data-cy="reason-input"]').type('Test reason')

                    cy.get('[data-cy="submit-application-button"]').click()
                    cy.url().should('include', '/my-applications')

                    // Try to apply again for the same pet
                    cy.visit(`/pets/${pet.pet_id}`)

                    // Apply button should be disabled with message
                    cy.get('[data-cy="apply-button"]').should('be.disabled')
                    cy.get('[data-cy="application-status-message"]').should('be.visible')
                    cy.get('[data-cy="application-status-message"]').should('have.text', 'You have already submitted an application for this pet')
                })
            })
        })
    })

    describe('My Applications Page', () => {
        beforeEach(() => {
            cy.loginEnhanced()
        })

        it('should display user applications with correct information', () => {
            cy.createTestLocation().then((location) => {
                cy.createTestPet(location.location_id, 'approved').then((pet1) => {
                    cy.createTestPet(location.location_id, 'approved').then((pet2) => {
                        // Create applications for both pets
                        const applications = [
                            { pet: pet1, name: 'App Test 1' },
                            { pet: pet2, name: 'App Test 2' }
                        ]

                        // Submit applications
                        applications.forEach((app, index) => {
                            cy.visit(`/apply/${app.pet.pet_id}`)

                            cy.get('[data-cy="applicant-name-input"]').type(app.name)
                            cy.get('[data-cy="applicant-email-input"]').type(`test${index}@example.com`)
                            cy.get('[data-cy="applicant-phone-input"]').type(`(555) 000-000${index}`)
                            cy.get('[data-cy="applicant-address-input"]').type('Test Address')
                            cy.get('[data-cy="housing-type-select"]').select('house')
                            cy.get('[data-cy="experience-input"]').type('Test experience')
                            cy.get('[data-cy="reason-input"]').type('Test reason')

                            cy.get('[data-cy="submit-application-button"]').click()
                        })

                        // Visit My Applications page
                        cy.visit('/my-applications')

                        // Verify page displays correctly
                        cy.get('h1').should('have.text', 'My Applications')

                        // Should show both applications
                        cy.get('[data-cy="application-item"]').should('have.length', 2)

                        // Check first application details
                        cy.get('[data-cy="application-item"]').first().within(() => {
                            cy.get('[data-cy="pet-name"]').should('be.visible')
                            cy.get('[data-cy="application-status"]').should('have.text', 'Pending')
                            cy.get('[data-cy="submission-date"]').should('be.visible')
                            cy.get('[data-cy="view-details-button"]').should('be.visible')
                        })
                    })
                })
            })
        })

        it('should filter applications by status', () => {
            cy.visit('/my-applications')

            // Check filter dropdown exists
            cy.get('[data-cy="status-filter-select"]').should('be.visible')
            cy.get('[data-cy="status-filter-select"] option[value="all"]').should('exist')
            cy.get('[data-cy="status-filter-select"] option[value="pending"]').should('exist')
            cy.get('[data-cy="status-filter-select"] option[value="approved"]').should('exist')
            cy.get('[data-cy="status-filter-select"] option[value="rejected"]').should('exist')

            // Test filtering (will show appropriate results based on data)
            cy.get('[data-cy="status-filter-select"]').select('pending')
            cy.get('[data-cy="filter-results-info"]').should('be.visible')

            cy.get('[data-cy="status-filter-select"]').select('all')
        })

        it('should show empty state when user has no applications', () => {
            // Create new user who hasn't applied for anything
            cy.visit('/my-applications')

            // Should show empty state (if no applications exist)
            cy.get('[data-cy="no-applications-message"]').should('be.visible')
            cy.get('[data-cy="no-applications-message"]').should('have.text', 'You have not submitted any adoption applications yet.')
            cy.get('[data-cy="browse-pets-link"]').should('be.visible')
            cy.get('[data-cy="browse-pets-link"]').should('have.attr', 'href', '/')
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