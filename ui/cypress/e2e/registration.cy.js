// Registration page tests

describe('Registration Tests', () => {
    beforeEach(() => {
        cy.visit('/register');
    });

    it('displays the registration form fields', () => {
        cy.get('h1').should('be.visible');

        cy.get('[data-cy="email-input"]').should('be.visible');
        cy.get('[data-cy="displayName-input"]').should('be.visible');
        cy.get('[data-cy="phone-input"]').should('be.visible');
        cy.get('[data-cy="password-input"]').should('be.visible');
        cy.get('[data-cy="confirm-password-input"]').should('be.visible');
        cy.get('[data-cy="register-button"]').should('be.visible');
        cy.get('[data-cy="login-link"]').should('have.attr', 'href', '/login');
    });

    it('shows validation messages when submitting empty form', () => {
        cy.get('[data-cy="register-button"]').click();

        cy.url().should('include', '/register');

        cy.get('body').then(($body) => {
            const text = $body.text();
            expect(text).to.include('Email is required');
            expect(text).to.include('Display name is required');
            expect(text).to.include('Password is required');
        });
    });

    it('successfully registers a new user with valid data', () => {
        const timestamp = Date.now();
        const testEmail = `newuser+${timestamp}@test.com`;

        cy.get('[data-cy="displayName-input"]').type('Cypress Test User');
        cy.get('[data-cy="email-input"]').type(testEmail);
        cy.get('[data-cy="password-input"]').type('StrongPass123!');
        cy.get('[data-cy="confirm-password-input"]').type('StrongPass123!');
        cy.get('[data-cy="phone-input"]').type('5551234567');

        // Agree to terms checkbox (by name)
        cy.get('input[name="agreeToTerms"]').check();

        cy.get('[data-cy="register-button"]').click();

        cy.wait(2000);
        // After successful registration we should not remain on /register
        cy.url().should('not.include', '/register');
    });
});
