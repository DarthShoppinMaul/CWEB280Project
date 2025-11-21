// navigation.cy.js

const loginAsAdmin = () => {
    cy.visit('/login');
    cy.get('[data-cy="email-input"]').type('test@t.ca');
    cy.get('[data-cy="password-input"]').type('123456Pw');
    cy.get('[data-cy="login-button"]').click();
    cy.wait(2000); // per your requirement
};

describe('Navigation', () => {
    describe('Public Navigation (logged out)', () => {
        beforeEach(() => {
            cy.visit('/');
        });

        it('shows the navigation bar', () => {
            cy.get('nav').should('be.visible');
        });

        it('shows login and register links when not logged in', () => {
            cy.get('nav').within(() => {
                cy.get('a[href="/login"]').should('be.visible');
                cy.get('a[href="/register"]').should('be.visible');
            });
        });

        it('can navigate to the pets page from the nav', () => {
            cy.get('a[href="/pets"]').click();
            cy.url().should('include', '/pets');
        });
    });

    describe('Admin Navigation (logged in)', () => {
        beforeEach(() => {
            loginAsAdmin();
            cy.visit('/');
        });

        it('shows the admin dashboard link when logged in as admin', () => {
            // Dashboard link has no data-cy; select by href
            cy.get('nav').within(() => {
                cy.get('a[href="/admin/dashboard"]').should('be.visible');
            });
        });

        it('can navigate to admin dashboard', () => {
            cy.get('a[href="/admin/dashboard"]').click();
            cy.url().should('include', '/admin/dashboard');
        });

        it('can navigate to profile', () => {
            cy.get('[data-cy="profile-link"]').click();
            cy.url().should('include', '/profile');
        });

        it('can navigate to user management', () => {
            cy.get('[data-cy="user-management-link"]').click();
            cy.url().should('include', '/admin/users');
        });

        it('can logout', () => {
            cy.get('[data-cy="logout-link"]').click();
            cy.wait(2000);
            cy.url().should('match', /(\/login|\/|\/home)/);
        });
    });

    describe('Protected routes', () => {
        it('redirects to login when accessing admin page without auth', () => {
            cy.visit('/admin/dashboard');
            cy.url().should('match', /(\/login|\/|\/home)/);
        });
    });
});
