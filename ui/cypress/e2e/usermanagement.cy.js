/**
 * User Management Tests
 * --------------------
 * Tests for user management functionality
 *
 * Test Cases Covered:
 * - Admin can view all users
 * - Admin can create new user accounts
 * - Admin can edit user information
 * - Admin can delete users (with proper authorization)
 * - Admin can elevate user permissions
 * - User can only edit their own profile
 * - User management form validation
 * - Role-based access control
 */

describe('User Management', () => {
    beforeEach(() => {
        cy.waitForAPI()
        cy.login() // Login as admin
    })

    afterEach(() => {
        // Clean up any test users created
        cy.cleanupTestUsers()
    })

    describe('Admin User Management Dashboard', () => {
        it('should display user management interface for admin', () => {
            cy.visit('/admin/users')

            // Check page structure
            cy.get('h1').should('have.text', 'User Management')
            cy.get('[data-cy="add-user-button"]').should('be.visible')
            cy.get('[data-cy="add-user-button"]').should('have.text', 'Add New User')

            // Check users table
            cy.get('[data-cy="users-table"]').should('be.visible')
            cy.get('[data-cy="users-table-header"]').should('exist')
            cy.get('[data-cy="user-row"]').should('exist')

            // Verify table columns
            cy.get('[data-cy="header-email"]').should('have.text', 'Email')
            cy.get('[data-cy="header-name"]').should('have.text', 'Name')
            cy.get('[data-cy="header-role"]').should('have.text', 'Role')
            cy.get('[data-cy="header-created"]').should('have.text', 'Created')
            cy.get('[data-cy="header-actions"]').should('have.text', 'Actions')
        })

        it('should display existing users in table', () => {
            cy.visit('/admin/users')

            // Should show at least the admin user (test@t.ca)
            cy.get('[data-cy="user-row"]').should('have.length.at.least', 1)

            // Check admin user row
            cy.get('[data-cy="user-row"]').first().within(() => {
                cy.get('[data-cy="user-email"]').should('have.text', 'test@t.ca')
                cy.get('[data-cy="user-role"]').should('have.text', 'admin')
                cy.get('[data-cy="edit-user-button"]').should('be.visible')
                cy.get('[data-cy="delete-user-button"]').should('be.visible')
            })

            // Verify data matches API response
            cy.request(`${Cypress.env('apiBaseUrl')}/users`).then((response) => {
                expect(response.status).to.eq(200)
                expect(response.body).to.be.an('array')
                expect(response.body.length).to.be.at.least(1)

                const adminUser = response.body.find(user => user.email === 'test@t.ca')
                expect(adminUser).to.exist
                expect(adminUser.role).to.eq('admin')
            })
        })

        it('should filter and search users', () => {
            cy.visit('/admin/users')

            // Check search functionality
            cy.get('[data-cy="user-search-input"]').should('be.visible')
            cy.get('[data-cy="user-search-input"]').type('test@t.ca')

            // Should filter results
            cy.get('[data-cy="user-row"]').should('have.length', 1)
            cy.get('[data-cy="user-email"]').should('have.text', 'test@t.ca')

            // Clear search
            cy.get('[data-cy="user-search-input"]').clear()

            // Check role filter
            cy.get('[data-cy="role-filter-select"]').should('be.visible')
            cy.get('[data-cy="role-filter-select"]').select('admin')

            // Should show only admin users
            cy.get('[data-cy="user-role"]').each(($el) => {
                cy.wrap($el).should('have.text', 'admin')
            })
        })
    })

    describe('Add New User', () => {
        beforeEach(() => {
            cy.visit('/admin/users')
            cy.get('[data-cy="add-user-button"]').click()
        })

        it('should display add user form correctly', () => {
            cy.url().should('include', '/admin/users/add')
            cy.get('h1').should('have.text', 'Add New User')

            // Check all form fields
            cy.get('[data-cy="user-email-input"]').should('be.visible')
            cy.get('[data-cy="user-first-name-input"]').should('be.visible')
            cy.get('[data-cy="user-last-name-input"]').should('be.visible')
            cy.get('[data-cy="user-phone-input"]').should('be.visible')
            cy.get('[data-cy="user-password-input"]').should('be.visible')
            cy.get('[data-cy="user-confirm-password-input"]').should('be.visible')
            cy.get('[data-cy="user-role-select"]').should('be.visible')

            cy.get('[data-cy="create-user-button"]').should('have.text', 'Create User')
            cy.get('[data-cy="cancel-button"]').should('have.text', 'Cancel')
        })

        it('should validate required fields', () => {
            cy.get('[data-cy="create-user-button"]').click()

            // Check validation errors
            cy.get('[data-cy="user-email-error"]').should('be.visible')
            cy.get('[data-cy="user-email-error"]').should('have.text', 'Email is required')

            cy.get('[data-cy="user-first-name-error"]').should('be.visible')
            cy.get('[data-cy="user-first-name-error"]').should('have.text', 'First name is required')

            cy.get('[data-cy="user-last-name-error"]').should('be.visible')
            cy.get('[data-cy="user-last-name-error"]').should('have.text', 'Last name is required')

            cy.get('[data-cy="user-password-error"]').should('be.visible')
            cy.get('[data-cy="user-password-error"]').should('have.text', 'Password is required')

            // Should remain on form page
            cy.url().should('include', '/admin/users/add')
        })

        it('should validate email format and uniqueness', () => {
            // Test invalid email format
            cy.get('[data-cy="user-email-input"]').type('invalid-email')
            cy.get('[data-cy="create-user-button"]').click()

            cy.get('[data-cy="user-email-error"]').should('be.visible')
            cy.get('[data-cy="user-email-error"]').should('have.text', 'Please enter a valid email address')

            // Test duplicate email
            cy.get('[data-cy="user-email-input"]').clear().type('test@t.ca')
            cy.get('[data-cy="user-first-name-input"]').type('Duplicate')
            cy.get('[data-cy="user-last-name-input"]').type('User')
            cy.get('[data-cy="user-password-input"]').type('TempPass123')
            cy.get('[data-cy="user-confirm-password-input"]').type('TempPass123')

            cy.get('[data-cy="create-user-button"]').click()

            cy.get('[data-cy="submission-error"]').should('be.visible')
            cy.get('[data-cy="submission-error"]').should('have.text', 'Email already exists')
        })

        it('should validate password requirements and confirmation', () => {
            // Test weak password
            cy.get('[data-cy="user-password-input"]').type('weak')
            cy.get('[data-cy="create-user-button"]').click()

            cy.get('[data-cy="user-password-error"]').should('be.visible')
            cy.get('[data-cy="user-password-error"]').should('have.text', 'Password must be at least 8 characters with uppercase, lowercase, and number')

            // Test password confirmation mismatch
            cy.get('[data-cy="user-password-input"]').clear().type('ValidPass123')
            cy.get('[data-cy="user-confirm-password-input"]').type('DifferentPass123')
            cy.get('[data-cy="create-user-button"]').click()

            cy.get('[data-cy="user-confirm-password-error"]').should('be.visible')
            cy.get('[data-cy="user-confirm-password-error"]').should('have.text', 'Passwords do not match')
        })

        it('should successfully create new user with valid data', () => {
            const timestamp = Date.now()
            const testEmail = `newuser${timestamp}@test.com`

            // Fill form with valid data
            cy.get('[data-cy="user-email-input"]').type(testEmail)
            cy.get('[data-cy="user-first-name-input"]').type('Test')
            cy.get('[data-cy="user-last-name-input"]').type('User')
            cy.get('[data-cy="user-phone-input"]').type('(555) 123-9876')
            cy.get('[data-cy="user-password-input"]').type('NewUser123')
            cy.get('[data-cy="user-confirm-password-input"]').type('NewUser123')
            cy.get('[data-cy="user-role-select"]').select('user')

            cy.get('[data-cy="create-user-button"]').click()

            // Should redirect to users list
            cy.url().should('include', '/admin/users')
            cy.get('[data-cy="success-message"]').should('be.visible')
            cy.get('[data-cy="success-message"]').should('have.text', 'User created successfully!')

            // Verify user appears in table
            cy.get('[data-cy="user-email"]').should('include.text', testEmail)

            // Verify via API
            cy.request(`${Cypress.env('apiBaseUrl')}/users`).then((response) => {
                const newUser = response.body.find(user => user.email === testEmail)
                expect(newUser).to.exist
                expect(newUser.first_name).to.eq('Test')
                expect(newUser.last_name).to.eq('User')
                expect(newUser.role).to.eq('user')
            })
        })
    })

    describe('Edit User', () => {
        beforeEach(() => {
            // Create a test user to edit
            cy.createTestUser({
                email: 'edituser@test.com',
                first_name: 'Edit',
                last_name: 'User',
                role: 'user'
            }).then((user) => {
                cy.wrap(user).as('testUser')
            })

            cy.visit('/admin/users')
        })

        it('should navigate to edit form from user table', function() {
            // Find the test user row and click edit
            cy.get('[data-cy="user-row"]').each(($row) => {
                if ($row.find('[data-cy="user-email"]').text() === this.testUser.email) {
                    cy.wrap($row).within(() => {
                        cy.get('[data-cy="edit-user-button"]').click()
                    })
                    return false
                }
            })

            cy.url().should('include', `/admin/users/edit/${this.testUser.user_id}`)
            cy.get('h1').should('have.text', 'Edit User')
        })

        it('should populate form with existing user data', function() {
            cy.visit(`/admin/users/edit/${this.testUser.user_id}`)

            // Check that form is populated
            cy.get('[data-cy="user-email-input"]').should('have.value', this.testUser.email)
            cy.get('[data-cy="user-first-name-input"]').should('have.value', this.testUser.first_name)
            cy.get('[data-cy="user-last-name-input"]').should('have.value', this.testUser.last_name)
            cy.get('[data-cy="user-role-select"]').should('have.value', this.testUser.role)

            // Password fields should be empty (for security)
            cy.get('[data-cy="user-password-input"]').should('have.value', '')
        })

        it('should update user information successfully', function() {
            cy.visit(`/admin/users/edit/${this.testUser.user_id}`)

            // Update user information
            cy.get('[data-cy="user-first-name-input"]').clear().type('Updated')
            cy.get('[data-cy="user-last-name-input"]').clear().type('Name')
            cy.get('[data-cy="user-phone-input"]').clear().type('(555) 987-6543')

            cy.get('[data-cy="update-user-button"]').click()

            // Should redirect to users list
            cy.url().should('include', '/admin/users')
            cy.get('[data-cy="success-message"]').should('be.visible')
            cy.get('[data-cy="success-message"]').should('have.text', 'User updated successfully!')

            // Verify via API
            cy.request(`${Cypress.env('apiBaseUrl')}/users/${this.testUser.user_id}`).then((response) => {
                expect(response.status).to.eq(200)
                expect(response.body.first_name).to.eq('Updated')
                expect(response.body.last_name).to.eq('Name')
                expect(response.body.phone).to.eq('(555) 987-6543')
            })
        })

        it('should elevate user role from user to admin', function() {
            cy.visit(`/admin/users/edit/${this.testUser.user_id}`)

            // Change role to admin
            cy.get('[data-cy="user-role-select"]').select('admin')
            cy.get('[data-cy="update-user-button"]').click()

            cy.url().should('include', '/admin/users')
            cy.get('[data-cy="success-message"]').should('be.visible')

            // Verify role change via API
            cy.request(`${Cypress.env('apiBaseUrl')}/users/${this.testUser.user_id}`).then((response) => {
                expect(response.status).to.eq(200)
                expect(response.body.role).to.eq('admin')
            })
        })
    })

    describe('Delete User', () => {
        beforeEach(() => {
            // Create a test user to delete
            cy.createTestUser({
                email: 'deleteuser@test.com',
                first_name: 'Delete',
                last_name: 'User',
                role: 'user'
            }).then((user) => {
                cy.wrap(user).as('testUser')
            })

            cy.visit('/admin/users')
        })

        it('should show confirmation dialog before deletion', function() {
            // Find and click delete button
            cy.get('[data-cy="user-row"]').each(($row) => {
                if ($row.find('[data-cy="user-email"]').text() === this.testUser.email) {
                    cy.wrap($row).within(() => {
                        cy.get('[data-cy="delete-user-button"]').click()
                    })
                    return false
                }
            })

            // Should show confirmation dialog
            cy.get('[data-cy="delete-confirm-dialog"]').should('be.visible')
            cy.get('[data-cy="delete-confirm-message"]').should('have.text', `Are you sure you want to delete user: ${this.testUser.email}?`)
            cy.get('[data-cy="confirm-delete-button"]').should('be.visible')
            cy.get('[data-cy="cancel-delete-button"]').should('be.visible')
        })

        it('should cancel deletion when cancel is clicked', function() {
            // Click delete and then cancel
            cy.get('[data-cy="user-row"]').each(($row) => {
                if ($row.find('[data-cy="user-email"]').text() === this.testUser.email) {
                    cy.wrap($row).within(() => {
                        cy.get('[data-cy="delete-user-button"]').click()
                    })
                    return false
                }
            })

            cy.get('[data-cy="cancel-delete-button"]').click()

            // Dialog should close
            cy.get('[data-cy="delete-confirm-dialog"]').should('not.exist')

            // User should still exist
            cy.get('[data-cy="user-email"]').should('include.text', this.testUser.email)
        })

        it('should successfully delete user when confirmed', function() {
            // Click delete and confirm
            cy.get('[data-cy="user-row"]').each(($row) => {
                if ($row.find('[data-cy="user-email"]').text() === this.testUser.email) {
                    cy.wrap($row).within(() => {
                        cy.get('[data-cy="delete-user-button"]').click()
                    })
                    return false
                }
            })

            cy.get('[data-cy="confirm-delete-button"]').click()

            // Should show success message
            cy.get('[data-cy="success-message"]').should('be.visible')
            cy.get('[data-cy="success-message"]').should('have.text', 'User deleted successfully!')

            // User should no longer appear in table
            cy.get('[data-cy="user-email"]').should('not.include.text', this.testUser.email)

            // Verify via API
            cy.request({
                method: 'GET',
                url: `${Cypress.env('apiBaseUrl')}/users/${this.testUser.user_id}`,
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.eq(404)
            })
        })

        it('should prevent admin from deleting their own account', () => {
            // Find admin user row (test@t.ca)
            cy.get('[data-cy="user-row"]').each(($row) => {
                if ($row.find('[data-cy="user-email"]').text() === 'test@t.ca') {
                    cy.wrap($row).within(() => {
                        // Delete button should be disabled or not present
                        cy.get('[data-cy="delete-user-button"]').should('be.disabled')
                        // Or alternatively, show a tooltip/message
                        cy.get('[data-cy="cannot-delete-self"]').should('be.visible')
                    })
                    return false
                }
            })
        })
    })

    describe('User Self-Management', () => {
        beforeEach(() => {
            // Create a regular user and login as them
            cy.createTestUser({
                email: 'regularuser@test.com',
                password: 'RegularUser123',
                first_name: 'Regular',
                last_name: 'User',
                role: 'user'
            }).then((user) => {
                cy.wrap(user).as('regularUser')
                // Logout admin and login as regular user
                cy.request('POST', `${Cypress.env('apiBaseUrl')}/auth/logout`)
                cy.loginAsUser('regularuser@test.com', 'RegularUser123')
            })
        })

        it('should allow user to view and edit their own profile', function() {
            cy.visit('/profile')

            cy.get('h1').should('have.text', 'My Profile')

            // Check that form is populated with user data
            cy.get('[data-cy="profile-email-display"]').should('have.text', this.regularUser.email)
            cy.get('[data-cy="profile-first-name-input"]').should('have.value', this.regularUser.first_name)
            cy.get('[data-cy="profile-last-name-input"]').should('have.value', this.regularUser.last_name)

            // Role should be displayed but not editable
            cy.get('[data-cy="profile-role-display"]').should('have.text', 'user')
            cy.get('[data-cy="profile-role-select"]').should('not.exist')
        })

        it('should allow user to update their own information', function() {
            cy.visit('/profile')

            // Update profile information
            cy.get('[data-cy="profile-first-name-input"]').clear().type('Updated Regular')
            cy.get('[data-cy="profile-phone-input"]').clear().type('(555) 111-2222')

            cy.get('[data-cy="update-profile-button"]').click()

            cy.get('[data-cy="success-message"]').should('be.visible')
            cy.get('[data-cy="success-message"]').should('have.text', 'Profile updated successfully!')

            // Verify via API
            cy.request(`${Cypress.env('apiBaseUrl')}/auth/me`).then((response) => {
                expect(response.status).to.eq(200)
                expect(response.body.first_name).to.eq('Updated Regular')
                expect(response.body.phone).to.eq('(555) 111-2222')
            })
        })

        it('should prevent regular user from accessing user management', () => {
            cy.visit('/admin/users')

            // Should redirect or show access denied
            cy.url().should('not.include', '/admin/users')
            cy.get('[data-cy="access-denied-message"]').should('be.visible')
            cy.get('[data-cy="access-denied-message"]').should('have.text', 'Access denied. Admin privileges required.')
        })
    })

    describe('Role-Based Access Control', () => {
        it('should only allow admin users to access user management', () => {
            // Test that admin can access user management
            cy.login() // Login as admin
            cy.visit('/admin/users')
            cy.url().should('include', '/admin/users')
            cy.get('h1').should('have.text', 'User Management')
        })

        it('should show appropriate navigation based on user role', () => {
            // Admin navigation
            cy.login()
            cy.visit('/')

            cy.get('[data-cy="nav-admin"]').should('be.visible')
            cy.get('[data-cy="nav-user-management"]').should('be.visible')

            // Regular user navigation (would need to test with regular user)
            // This would require creating and logging in as a regular user
        })
    })

    describe('API Integration', () => {
        it('should fail when API server is unavailable', () => {
            // This test validates that tests fail if API server is not running
            cy.request(`${Cypress.env('apiBaseUrl')}/users`).then((response) => {
                expect(response.status).to.eq(200)
            })
        })
    })
})

/**
 * Custom command to clean up test users
 */
Cypress.Commands.add('cleanupTestUsers', () => {
    cy.request({
        method: 'GET',
        url: `${Cypress.env('apiBaseUrl')}/users`,
        failOnStatusCode: false
    }).then((response) => {
        if (response.status === 200) {
            response.body.forEach(user => {
                // Only delete test users (those with test email patterns)
                if (user.email && (
                    user.email.includes('test.com') ||
                    user.email.includes('edituser@') ||
                    user.email.includes('deleteuser@') ||
                    user.email.includes('newuser')
                )) {
                    cy.request({
                        method: 'DELETE',
                        url: `${Cypress.env('apiBaseUrl')}/users/${user.user_id}`,
                        failOnStatusCode: false
                    })
                }
            })
        }
    })
})