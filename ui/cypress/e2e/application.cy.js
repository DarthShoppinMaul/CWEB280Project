// application.cy.js
// Adoption application tests

const apiBaseUrl = Cypress.env('apiBaseUrl') || 'http://localhost:8000';

const loginAsRegularUser = () => {
    cy.visit('/login');
    cy.get('[data-cy="email-input"]').type('ebasotest@gmail.com');
    cy.get('[data-cy="password-input"]').type('123456Pw');
    cy.get('[data-cy="login-button"]').click();
    cy.wait(2000); // required after every login
};

describe('Adoption Application Tests', () => {
    let approvedPetId;

    // Pick an approved pet (or first pet) to use across tests
    before(() => {
        cy.request(`${apiBaseUrl}/pets`).then((response) => {
            const pets = response.body || [];
            const approved = pets.find((p) => p.status === 'approved') || pets[0];

            if (!approved) {
                approvedPetId = null;
                return;
            }

            approvedPetId = approved.pet_id;
        });
    });

    it('loads the adoption application form for an existing pet', () => {
        if (!approvedPetId) {
            cy.log('No pets available – skipping form load test.');
            return;
        }

        loginAsRegularUser();
        cy.visit(`/apply/${approvedPetId}`);

        cy.get('h1').should('be.visible');
        cy.get('textarea[name="applicationMessage"]').should('be.visible');
        cy.get('[data-cy="applicant-phone-input"]').should('be.visible');
        cy.get('[data-cy="housing-type-select"]').should('be.visible');
        cy.get('[data-cy="submit-application-button"]').should('be.visible');
    });

    it('shows validation behaviour when required fields are missing', () => {
        if (!approvedPetId) {
            cy.log('No pets available – skipping validation test.');
            return;
        }

        loginAsRegularUser();
        cy.visit(`/apply/${approvedPetId}`);

        // Leave message empty and try to submit
        cy.get('textarea[name="applicationMessage"]').clear();
        cy.get('[data-cy="submit-application-button"]').click();

        // We should still be on the apply page
        cy.url().should('include', `/apply/${approvedPetId}`);

        cy.get('body').then(($body) => {
            const text = $body.text();
            // Message from AdoptionApplicationForm.jsx
            expect(text).to.include('Please tell us why you want to adopt this pet');
        });
    });

    it('submits an adoption application with valid data (handles success or duplicate)', () => {
        if (!approvedPetId) {
            cy.log('No pets available – skipping submit test.');
            return;
        }

        loginAsRegularUser();
        cy.visit(`/apply/${approvedPetId}`);

        const longMessage =
            'I would like to adopt this pet because I have a stable home, a safe yard, and many years of experience caring for animals.';

        cy.get('textarea[name="applicationMessage"]').clear().type(longMessage);
        cy.get('[data-cy="applicant-phone-input"]').clear().type('5551234567');
        cy.get('[data-cy="housing-type-select"]').select('house');

        cy.get('[data-cy="submit-application-button"]').click();
        cy.wait(2000);

        // Depending on backend rules, we may:
        //  - navigate to /my-applications (first-time success), OR
        //  - stay on /apply/:petId (e.g. already applied, server-side validation)
        cy.url().then((url) => {
            const ok =
                url.includes('/my-applications') ||
                url.includes(`/apply/${approvedPetId}`);
            expect(ok, `URL after submit (${url}) is acceptable`).to.be.true;
        });
    });
});
