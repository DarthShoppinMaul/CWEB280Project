// login.cy.js


const loginAsAdmin = () => {
    cy.visit('/login');
    cy.get('[data-cy="email-input"]').type('test@t.ca');
    cy.get('[data-cy="password-input"]').type('123456Pw');
    cy.get('[data-cy="login-button"]').click();
};

describe('Login', () => {

    beforeEach(() => {
        cy.visit('/login');
    });

    it('shows the login form', () => {
        cy.get('h1').should('be.visible');

        cy.get('[data-cy="email-input"]').should('be.visible');
        cy.get('[data-cy="password-input"]').should('be.visible');
        cy.get('[data-cy="remember-me-checkbox"]').should('be.visible');
        cy.get('[data-cy="login-button"]').should('be.visible');
        cy.get('[data-cy="google-signin-button"]').should('be.visible');
        cy.get('[data-cy="register-link"]')
            .should('have.attr', 'href', '/register');
    });

    it('does not submit when fields are empty', () => {
        cy.get('[data-cy="login-button"]').click();
        cy.url().should('include', '/login');
    });

    it('stays on login for invalid credentials', () => {
        cy.get('[data-cy="email-input"]').type('wrong@user.com');
        cy.get('[data-cy="password-input"]').type('wrongpass');
        cy.get('[data-cy="login-button"]').click();

        cy.wait(1000);
        cy.url().should('include', '/login');
    });

    it('logs in with valid credentials', () => {
        loginAsAdmin();

        // After a successful login you should land on the pets list page
        cy.url().should('include', '/pets');
    });
});
