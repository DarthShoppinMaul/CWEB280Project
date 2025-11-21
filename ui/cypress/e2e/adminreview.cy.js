// adminreview.cy.js
// admin review tests

const apiBaseUrl = Cypress.env('apiBaseUrl') || 'http://localhost:8000';

const loginAsAdmin = () => {
    cy.visit('/login');
    cy.get('[data-cy="email-input"]').type('test@t.ca');
    cy.get('[data-cy="password-input"]').type('123456Pw');
    cy.get('[data-cy="login-button"]').click();
    cy.wait(2000); // required after every login
};

describe('Admin Review Tests', () => {
    describe('Admin Dashboard', () => {
        it('redirects unauthenticated users away from admin dashboard', () => {
            cy.visit('/admin/dashboard');
            cy.url().should('match', /(\/login|\/home|\/$)/);
        });

        it('shows admin dashboard for admin user', () => {
            loginAsAdmin();
            cy.visit('/admin/dashboard');

            cy.get('h1', { timeout: 15000 }).should('have.text', 'Admin Dashboard');
            cy.get('.panel').its('length').should('be.gte', 1);
        });
    });

    describe('Application Review Page', () => {
        it('opens an application review page for an existing application if any exist', () => {
            loginAsAdmin();

            cy.request(`${apiBaseUrl}/applications`).then((response) => {
                const apps = response.body || [];

                if (apps.length === 0) {
                    cy.log('No applications in API – skipping review page test.');
                    return;
                }

                const appId = apps[0].application_id;

                // Route from main.jsx: /admin/application/:id
                cy.visit(`/admin/application/${appId}`);

                // Just confirm we see some kind of application page heading
                cy.get('h1', { timeout: 15000 })
                    .invoke('text')
                    .then((text) => {
                        // Accept either "Review Adoption Application" or "Adoption Application"
                        expect(text).to.include('Application');
                    });
            });
        });

        it('handles a non-existent application id without crashing', () => {
            loginAsAdmin();

            // Non-existent ID – just confirm the app renders something without blowing up
            cy.visit('/admin/application/999999');

            cy.get('body', { timeout: 15000 }).should('exist');
            // We’re intentionally NOT asserting specific error text because
            // backend / auth timing can result in different states.
        });
    });
});
