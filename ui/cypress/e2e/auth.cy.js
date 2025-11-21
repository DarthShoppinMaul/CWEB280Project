// Authentication and session tests

const apiBaseUrl = Cypress.env('apiBaseUrl') || 'http://localhost:8000';

const loginAsAdmin = () => {
    cy.visit('/login');
    cy.get('[data-cy="email-input"]').type('test@t.ca');
    cy.get('[data-cy="password-input"]').type('123456Pw');
    cy.get('[data-cy="login-button"]').click();
    cy.wait(2000);
};

const loginAsRegularUser = () => {
    cy.visit('/login');
    cy.get('[data-cy="email-input"]').type('ebasotest@gmail.com');
    cy.get('[data-cy="password-input"]').type('123456Pw');
    cy.get('[data-cy="login-button"]').click();
    cy.wait(2000);
};

describe('Authentication Tests ', () => {
    describe('Basic login behaviour', () => {
        beforeEach(() => {
            cy.visit('/login');
        });

        it('does not log in with invalid credentials', () => {
            cy.get('[data-cy="email-input"]').type('wrong@example.com');
            cy.get('[data-cy="password-input"]').type('WrongPass123');
            cy.get('[data-cy="login-button"]').click();
            cy.wait(2000);

            cy.url().should('include', '/login');
        });

        it('logs in as admin with valid credentials and reaches pets page', () => {
            loginAsAdmin();
            cy.url().should('include', '/pets');
        });
    });

    describe('Session and logout', () => {
        it('keeps the user logged in across simple navigation', () => {
            loginAsAdmin();

            cy.visit('/profile');
            cy.url().should('include', '/profile');

            // Verify via API that the user is still authenticated
            cy.request(`${apiBaseUrl}/auth/me`).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.email).to.eq('test@t.ca');
            });
        });

        it('logs out and clears the session', () => {
            loginAsAdmin();

            // Navbar logout link is used across the app
            cy.get('[data-cy="logout-link"]').click();
            cy.wait(2000);

            cy.url().should('match', /(\/login|\/home|\/$)/);

            cy.request({
                method: 'GET',
                url: `${apiBaseUrl}/auth/me`,
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.eq(401);
            });
        });
    });

    describe('Role-based access', () => {
        it('prevents non-admin users from accessing the admin dashboard', () => {
            loginAsRegularUser();

            cy.visit('/admin/dashboard');

            // User should be redirected away from admin dashboard
            cy.url().should('not.include', '/admin/dashboard');
        });
    });
});
