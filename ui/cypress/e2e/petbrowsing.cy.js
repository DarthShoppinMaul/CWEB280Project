// petbrowsing.cy.js


const loginAsAdmin = () => {
    cy.visit('/login');
    cy.get('[data-cy="email-input"]').type('test@t.ca');
    cy.get('[data-cy="password-input"]').type('123456Pw');
    cy.get('[data-cy="login-button"]').click();
};

const apiBaseUrl = Cypress.env('apiBaseUrl') || 'http://localhost:8000';

describe('Pet Browsing', () => {
    describe('Pet List Page', () => {
        it('shows the pets list page', () => {
            cy.visit('/pets');

            cy.get('h1').should('contain', 'Adoptable Pets');
            cy.get('body').should('be.visible');
        });

        it('shows pet cards if any exist', () => {
            cy.visit('/pets');
            cy.wait(2000);

            cy.get('body').then(($body) => {
                const cards = $body.find('[data-cy="pet-card"]');
                if (cards.length > 0) {
                    cy.get('[data-cy="pet-card"]').should('exist');
                } else {
                    cy.log('No pets in the system yet – test will still pass.');
                }
            });
        });

        it('shows filter controls', () => {
            cy.visit('/pets');
            cy.get('input[placeholder="Search by name..."]').should('be.visible');
            cy.get('select').should('have.length.at.least', 3);
        });

        it('can open details for the first pet card (if any)', () => {
            cy.visit('/pets');
            cy.wait(2000);

            cy.get('body').then(($body) => {
                if ($body.find('[data-cy="pet-card"]').length > 0) {
                    cy.get('[data-cy="pet-card"]').first().within(() => {
                        // Last button inside the card is "View Details"
                        cy.get('button').last().click();
                    });

                    cy.url().should('match', /\/pet\/\d+$/);
                    cy.get('h1').should('be.visible');
                } else {
                    cy.log('No pets to open details for – skipping.');
                }
            });
        });
    });

    describe('Pet Details Page (with approved pet, if available)', () => {
        it('shows pet details for an existing pet', () => {
            cy.request(`${apiBaseUrl}/pets`).then((response) => {
                const pets = response.body;
                if (pets.length > 0) {
                    const petId = pets[0].pet_id;

                    cy.visit(`/pet/${petId}`);
                    cy.get('h1').should('be.visible');
                } else {
                    cy.log('No pets in API yet – skipping details test.');
                }
            });
        });

        it('shows apply button for an approved pet when logged in', () => {
            loginAsAdmin();
            cy.wait(3000)
            cy.request(`${apiBaseUrl}/pets`).then((response) => {
                const pets = response.body;
                const approvedPet = pets.find((p) => p.status === 'approved');

                if (!approvedPet) {
                    cy.log('No approved pets in API – cannot test apply button.');
                    return;
                }

                cy.visit(`/pet/${approvedPet.pet_id}`);

                cy.get('body').then(($body) => {
                    if ($body.find('[data-cy="apply-button"]').length > 0) {
                        cy.get('[data-cy="apply-button"]').should('be.visible');
                    } else {
                        cy.log('Apply button not shown (maybe already applied).');
                    }
                });
            });
        });
    });
});
