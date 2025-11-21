// pets.cy.js


const loginAsAdmin = () => {
    cy.visit('/login');
    cy.get('[data-cy="email-input"]').type('test@t.ca');
    cy.get('[data-cy="password-input"]').type('123456Pw');
    cy.get('[data-cy="login-button"]').click();
};

describe('Pet Management', () => {

    describe('Manage Pets Page', () => {
        beforeEach(() => {
            loginAsAdmin();
            cy.wait(3000)
            cy.visit('/add-pet'); // This route renders ManagePet
        });

        it('shows the manage pets page', () => {
            cy.get('h1').should('have.text', 'Manage Pets');
        });

        it('shows the "Add New Pet" button', () => {
            cy.get('[data-cy="add-new-pet-button"]').should('be.visible');
        });
    });

    describe('Add Pet Form (UI only)', () => {
        beforeEach(() => {
            loginAsAdmin();
            cy.wait(3000)
            cy.visit('/add-pet');
            cy.get('[data-cy="add-new-pet-button"]').click();
        });

        it('shows all form fields', () => {
            cy.get('[data-cy="pet-name-input"]').should('be.visible');
            cy.get('[data-cy="pet-species-input"]').should('be.visible');
            cy.get('[data-cy="pet-age-input"]').should('be.visible');
            cy.get('[data-cy="pet-location-select"]').should('be.visible');
            cy.get('[data-cy="pet-description-input"]').should('be.visible');
            cy.get('[data-cy="pet-photo-input"]').should('be.visible');
            cy.get('[data-cy="add-pet-button"]').should('be.visible');
            cy.get('[data-cy="cancel-button"]').should('be.visible');
        });

        it('stays on the form if required fields are empty', () => {
            cy.get('[data-cy="add-pet-button"]').click();
            cy.get('[data-cy="pet-name-input"]').should('be.visible');
        });
    });

    describe('Create Pet', () => {
        it('can create a pet using an existing location option', () => {
            loginAsAdmin();
            cy.wait(3000)
            cy.visit('/add-pet');
            cy.get('[data-cy="add-new-pet-button"]').click();

            const petName = `Test Pet ${Date.now()}`;

            cy.get('[data-cy="pet-name-input"]').type(petName);
            cy.get('[data-cy="pet-species-input"]').type('Dog');
            cy.get('[data-cy="pet-age-input"]').type('3');

            // Pick the first real option from the existing select instead of using an ID
            cy.get('[data-cy="pet-location-select"]').then(($select) => {
                const options = $select.find('option');
                // Expect at least one non-placeholder option
                expect(options.length).to.be.greaterThan(1);

                const value = options.eq(1).val();
                cy.wrap($select).select(value);
            });

            cy.get('[data-cy="pet-description-input"]').type('A friendly test dog.');
            cy.get('[data-cy="add-pet-button"]').click();

            // After submit, we should be back on the Manage Pets page
            cy.get('h1').should('have.text', 'Manage Pets');
        });
    });
});
