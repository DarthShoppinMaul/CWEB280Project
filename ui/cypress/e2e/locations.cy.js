// Location management tests

const loginAsAdmin = () => {
    cy.visit('/login');
    cy.get('[data-cy="email-input"]').type('test@t.ca');
    cy.get('[data-cy="password-input"]').type('123456Pw');
    cy.get('[data-cy="login-button"]').click();
    cy.wait(2000);
};

describe('Location Management Tests', () => {
    beforeEach(() => {
        loginAsAdmin();
    });

    it('displays the manage locations page', () => {
        cy.visit('/add-location');
        cy.get('h1').should('have.text', 'Manage Locations');
    });

    it('shows the Add New Location button', () => {
        cy.visit('/add-location');
        cy.get('[data-cy="add-new-location-button"]').should('be.visible');
    });

    it('can add a new location through the form', () => {
        cy.visit('/add-location');

        cy.get('[data-cy="add-new-location-button"]').click();

        const uniqueName = `Cypress Test Location ${Date.now()}`;

        cy.get('[data-cy="location-name-input"]').clear().type(uniqueName);
        cy.get('[data-cy="location-address-input"]').clear().type('123 Cypress Street, Test City');
        cy.get('[data-cy="location-phone-input"]').clear().type('(555) 123-4567');

        cy.get('[data-cy="add-location-button"]').click();

        // After submit, the page should return to the main Manage Locations view
        cy.get('h1').should('have.text', 'Manage Locations');

        // The new location name should appear somewhere in the table
        cy.get('body').then(($body) => {
            const text = $body.text();
            expect(text).to.include(uniqueName);
        });
    });

    it('shows validation errors when required fields are missing', () => {
        cy.visit('/add-location');
        cy.get('[data-cy="add-new-location-button"]').click();

        // Leave all fields empty and submit
        cy.get('[data-cy="add-location-button"]').click();

        // Name and address errors should be shown
        cy.get('[data-cy="location-name-error"]').should('be.visible');
        cy.get('[data-cy="location-address-error"]').should('be.visible');
    });
});
