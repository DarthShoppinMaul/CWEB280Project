// Admin user management page tests

const loginAsAdmin = () => {
    cy.visit('/login');
    cy.get('[data-cy="email-input"]').type('test@t.ca');
    cy.get('[data-cy="password-input"]').type('123456Pw');
    cy.get('[data-cy="login-button"]').click();
    cy.wait(2000);
};

describe('User Management Tests', () => {
    beforeEach(() => {
        loginAsAdmin();
    });

    it('displays the user management page and users table', () => {
        cy.visit('/admin/users');

        cy.get('h1').should('have.text', 'User Management');
        cy.get('[data-cy="users-table"]').should('be.visible');
    });

    it('can toggle the create user form', () => {
        cy.visit('/admin/users');

        cy.get('[data-cy="toggle-create-user"]').should('be.visible').click();
        cy.get('[data-cy="create-user-form"]').should('be.visible');

        // Toggle off again
        cy.get('[data-cy="toggle-create-user"]').click();
        cy.get('[data-cy="create-user-form"]').should('not.exist');
    });
});
