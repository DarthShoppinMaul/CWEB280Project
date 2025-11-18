// api.js
// This file contains all functions for communicating with the backend API
// Uses native fetch API
// All functions return promises that resolve to data or throw errors

// Base URL for all API calls
// Change this if your backend runs on a different port
const API_BASE_URL = 'http://localhost:8000';

// Helper function: Handle fetch API responses
// Converts response to JSON or throws an error if request failed
const handleResponse = async (response) => {
    // Check if response was successful (status 200-299)
    if (!response.ok) {
        // Try to parse error message from response
        const error = await response.json().catch(() => ({ detail: 'Request failed' }));
        // Throw error in a format similar to axios (for compatibility)
        throw { response: { status: response.status, data: error } };
    }
    // If successful, return the JSON data
    return response.json();
};

// ============================================================================
// AUTHENTICATION API
// Functions for login, logout, registration, and checking current user
// ============================================================================
export const authAPI = {
    // Function: Log in a user
    login: async (email, password) => {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',                              // HTTP POST request
            headers: {
                'Content-Type': 'application/json',      // Sending JSON data
            },
            credentials: 'include',                       // Important: send/receive cookies
            body: JSON.stringify({ email, password }),    // Convert data to JSON string
        });
        return handleResponse(response);
    },

    // Function: Register a new user
    register: async (email, password, display_name) => {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',                                          // HTTP POST request
            headers: {
                'Content-Type': 'application/json',                  // Sending JSON data
            },
            credentials: 'include',                                   // Important: send/receive cookies
            body: JSON.stringify({ email, password, display_name }), // Convert data to JSON string
        });
        return handleResponse(response);
    },

    // Function: Log out the current user
    logout: async () => {
        const response = await fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',            // HTTP POST request
            credentials: 'include',    // Send session cookie
        });
        return handleResponse(response);
    },

    // Function: Get current user info (check if logged in)
    me: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/me`, {
                credentials: 'include',    // Send session cookie
            });
            // If unauthorized (401), return null instead of throwing error
            if (response.status === 401) {
                return null;
            }
            return handleResponse(response);
        } catch (error) {
            // If any error, assume not logged in
            return null;
        }
    },
};

// ============================================================================
// USERS API
// Functions for managing user accounts (admin and self-management)
// ============================================================================
export const usersAPI = {
    // Function: Get all users (admin only)
    // Returns: Promise<User[]> - array of user objects
    list: async () => {
        const response = await fetch(`${API_BASE_URL}/users`, {
            credentials: 'include',    // Send session cookie
        });
        return handleResponse(response);
    },

    // Function: Get a single user by ID
    // Args: id - user ID
    // Returns: Promise<User> - user object
    get: async (id) => {
        const response = await fetch(`${API_BASE_URL}/users/${id}`, {
            credentials: 'include',    // Send session cookie
        });
        return handleResponse(response);
    },

    // Function: Update user information
    // Args:
    //   id - user ID
    //   data - object with fields to update (display_name, email, password)
    // Returns: Promise<User> - updated user object
    update: async (id, data) => {
        const response = await fetch(`${API_BASE_URL}/users/${id}`, {
            method: 'PUT',                           // HTTP PUT request
            headers: {
                'Content-Type': 'application/json',  // Sending JSON
            },
            credentials: 'include',                  // Send session cookie
            body: JSON.stringify(data),              // Convert data to JSON
        });
        return handleResponse(response);
    },

    // Function: Delete user account
    // Args: id - user ID
    // Returns: Promise<Object> - success message
    delete: async (id) => {
        const response = await fetch(`${API_BASE_URL}/users/${id}`, {
            method: 'DELETE',          // HTTP DELETE request
            credentials: 'include',    // Send session cookie
        });
        return handleResponse(response);
    },

    // Function: Create new user (admin only)
    // Args: data - object with email, password, display_name, is_admin
    // Returns: Promise<User> - created user object
    create: async (data) => {
        const response = await fetch(`${API_BASE_URL}/users`, {
            method: 'POST',                          // HTTP POST request
            headers: {
                'Content-Type': 'application/json',  // Sending JSON
            },
            credentials: 'include',                  // Send session cookie
            body: JSON.stringify(data),              // Convert data to JSON
        });
        return handleResponse(response);
    },
};

// ============================================================================
// LOCATIONS API
// Functions for managing pet adoption locations
// ============================================================================
export const locationsAPI = {
    // Function: Get all locations
    list: async () => {
        const response = await fetch(`${API_BASE_URL}/locations`, {
            credentials: 'include',    // Send session cookie
        });
        return handleResponse(response);
    },

    // Function: Create a new location
    create: async (data) => {
        const response = await fetch(`${API_BASE_URL}/locations`, {
            method: 'POST',                          // HTTP POST request
            headers: {
                'Content-Type': 'application/json',  // Sending JSON
            },
            credentials: 'include',                  // Send session cookie
            body: JSON.stringify(data),              // Convert data to JSON
        });
        return handleResponse(response);
    },
};

// ============================================================================
// PETS API
// Functions for managing pets
// ============================================================================
export const petsAPI = {
    // Function: Get all pets
    // Returns: Promise<Pet[]> - array of pet objects
    list: async () => {
        const response = await fetch(`${API_BASE_URL}/pets`, {
            credentials: 'include',    // Send session cookie
        });
        return handleResponse(response);
    },

    // Function: Get a single pet by ID
    get: async (id) => {
        const response = await fetch(`${API_BASE_URL}/pets/${id}`, {
            credentials: 'include',    // Send session cookie
        });
        return handleResponse(response);
    },

    // Function: Create a new pet (with optional photo upload)
    create: async (formData) => {
        // formData should be a FormData object with:
        // - name, species, age, location_id, description
        // - photo (optional file)
        const response = await fetch(`${API_BASE_URL}/pets`, {
            method: 'POST',                // HTTP POST request
            credentials: 'include',        // Send session cookie
            body: formData,                // Send FormData directly
            // DON'T set Content-Type header - browser sets it automatically
            // with the correct multipart boundary
        });
        return handleResponse(response);
    },

    // Function: Approve a pet (change status from pending to approved)
    approve: async (id) => {
        const response = await fetch(`${API_BASE_URL}/pets/${id}/approve`, {
            method: 'PATCH',           // HTTP PATCH request (partial update)
            credentials: 'include',    // Send session cookie
        });
        return handleResponse(response);
    },

    // Function: Delete a pet
    delete: async (id) => {
        const response = await fetch(`${API_BASE_URL}/pets/${id}`, {
            method: 'DELETE',          // HTTP DELETE request
            credentials: 'include',    // Send session cookie
        });
        return handleResponse(response);
    },
};