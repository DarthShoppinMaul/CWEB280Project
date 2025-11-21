// api.js
// This file contains all functions for communicating with the backend API
// Uses native fetch API with JWT authentication
// All functions return promises that resolve to data or throw errors

// Base URL for all API calls
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Export for use in components (e.g., for image URLs)
export { API_BASE_URL };

// Helper function: Handle fetch API responses
const handleResponse = async (response) => {
    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Request failed' }));
        throw { response: { status: response.status, data: error } };
    }
    return response.json();
};


// AUTHENTICATION API

export const authAPI = {
    login: async (email, password, rememberMe = false) => {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, password, remember_me: rememberMe }),
        });
        return handleResponse(response);
    },

    register: async (email, password, display_name) => {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, password, display_name }),
        });
        return handleResponse(response);
    },

    logout: async () => {
        const response = await fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            credentials: 'include',
        });
        return handleResponse(response);
    },

    me: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/me`, {
                credentials: 'include',
            });
            if (response.status === 401) {
                return null;
            }
            return handleResponse(response);
        } catch (error) {
            return null;
        }
    },
};


// USERS API

export const usersAPI = {
    list: async () => {
        const response = await fetch(`${API_BASE_URL}/users`, {
            credentials: 'include',
        });
        return handleResponse(response);
    },

    get: async (id) => {
        const response = await fetch(`${API_BASE_URL}/users/${id}`, {
            credentials: 'include',
        });
        return handleResponse(response);
    },

    update: async (id, data) => {
        const response = await fetch(`${API_BASE_URL}/users/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    },

    delete: async (id) => {
        const response = await fetch(`${API_BASE_URL}/users/${id}`, {
            method: 'DELETE',
            credentials: 'include',
        });
        return handleResponse(response);
    },

    create: async (data) => {
        const response = await fetch(`${API_BASE_URL}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    },
};


// LOCATIONS API

export const locationsAPI = {
    list: async () => {
        const response = await fetch(`${API_BASE_URL}/locations`, {
            credentials: 'include',
        });
        return handleResponse(response);
    },

    create: async (data) => {
        const response = await fetch(`${API_BASE_URL}/locations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    },

    update: async (id, data) => {
        const response = await fetch(`${API_BASE_URL}/locations/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    },

    delete: async (id) => {
        const response = await fetch(`${API_BASE_URL}/locations/${id}`, {
            method: 'DELETE',
            credentials: 'include',
        });
        return handleResponse(response);
    },
};


// PETS API

export const petsAPI = {
    list: async () => {
        const response = await fetch(`${API_BASE_URL}/pets`, {
            credentials: 'include',
        });
        return handleResponse(response);
    },

    get: async (id) => {
        const response = await fetch(`${API_BASE_URL}/pets/${id}`, {
            credentials: 'include',
        });
        return handleResponse(response);
    },

    create: async (formData) => {
        const response = await fetch(`${API_BASE_URL}/pets`, {
            method: 'POST',
            credentials: 'include',
            body: formData,
        });
        return handleResponse(response);
    },

    update: async (id, formData) => {
        const response = await fetch(`${API_BASE_URL}/pets/${id}`, {
            method: 'PUT',
            credentials: 'include',
            body: formData,
        });
        return handleResponse(response);
    },

    approve: async (id) => {
        const response = await fetch(`${API_BASE_URL}/pets/${id}/approve`, {
            method: 'PATCH',
            credentials: 'include',
        });
        return handleResponse(response);
    },

    delete: async (id) => {
        const response = await fetch(`${API_BASE_URL}/pets/${id}`, {
            method: 'DELETE',
            credentials: 'include',
        });
        return handleResponse(response);
    },
};


// APPLICATIONS API

export const applicationsAPI = {
    create: async (data) => {
        const response = await fetch(`${API_BASE_URL}/applications`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    },

    list: async (status = null) => {
        const url = status
            ? `${API_BASE_URL}/applications?status=${status}`
            : `${API_BASE_URL}/applications`;
        const response = await fetch(url, {
            credentials: 'include',
        });
        return handleResponse(response);
    },

    get: async (id) => {
        const response = await fetch(`${API_BASE_URL}/applications/${id}`, {
            credentials: 'include',
        });
        return handleResponse(response);
    },

    update: async (id, data) => {
        const response = await fetch(`${API_BASE_URL}/applications/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    },

    getStats: async () => {
        const response = await fetch(`${API_BASE_URL}/applications/stats`, {
            credentials: 'include',
        });
        return handleResponse(response);
    },

    delete: async (id) => {
        const response = await fetch(`${API_BASE_URL}/applications/${id}`, {
            method: 'DELETE',
            credentials: 'include',
        });
        return handleResponse(response);
    },
};


// FAVORITES API

export const favoritesAPI = {
    list: async () => {
        const response = await fetch(`${API_BASE_URL}/favorites`, {
            credentials: 'include',
        });
        return handleResponse(response);
    },

    listIds: async () => {
        const response = await fetch(`${API_BASE_URL}/favorites/list-ids`, {
            credentials: 'include',
        });
        return handleResponse(response);
    },

    add: async (petId) => {
        const response = await fetch(`${API_BASE_URL}/favorites/${petId}`, {
            method: 'POST',
            credentials: 'include',
        });
        return handleResponse(response);
    },

    remove: async (petId) => {
        const response = await fetch(`${API_BASE_URL}/favorites/${petId}`, {
            method: 'DELETE',
            credentials: 'include',
        });
        return handleResponse(response);
    },

    check: async (petId) => {
        const response = await fetch(`${API_BASE_URL}/favorites/check/${petId}`, {
            credentials: 'include',
        });
        return handleResponse(response);
    },
};