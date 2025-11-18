// AuthContext.jsx
// This file manages global authentication state for the entire app
// It provides login, logout, registration, and current user information to all components

import React, {createContext, useContext, useState, useEffect} from 'react';
import {authAPI} from '../services/api.js';

// Create a Context to share auth state across the app
// null is the default value (no auth data)
const AuthContext = createContext(null);

// AuthProvider wraps the entire app and provides auth functionality
export function AuthProvider({children}) {
    // State: user object (contains email, name, etc.) or null if not logged in
    const [user, setUser] = useState(null);

    // State: loading flag - true while checking if user is authenticated
    const [loading, setLoading] = useState(true);

    // On component mount (app startup), check if user is already logged in
    // This runs once when the app first loads
    useEffect(() => {
        checkAuth();
    }, []); // Empty dependency array = run once on mount

    // Function: Check if user is authenticated (has valid session cookie)
    const checkAuth = async () => {
        try {
            // Call backend API to get current user info
            const userData = await authAPI.me();
            // If successful, set the user data
            setUser(userData);
        } catch (error) {
            // If error (not logged in), set user to null
            setUser(null);
        } finally {
            // Always set loading to false when done checking
            setLoading(false);
        }
    };

    // Function: Log in a user
    // Parameters: email (string), password (string)
    // Returns: {success: boolean, error?: string}
    const login = async (email, password) => {
        try {
            // Call backend login endpoint
            const userData = await authAPI.login(email, password);
            // If successful, save user data
            setUser(userData);
            // Return success
            return {success: true};
        } catch (error) {
            // If error, return failure with error message
            return {
                success: false,
                error: error.response?.data?.detail || 'Login failed'
            };
        }
    };

    // Function: Register a new user
    // Parameters: formData (object with email, password, displayName, etc.)
    // Returns: {success: boolean, error?: string}
    const register = async (formData) => {
        try {
            // Call backend registration endpoint
            // The backend will create the user and auto-login
            const userData = await authAPI.register(
                formData.email,
                formData.password,
                formData.displayName
            );
            // If successful, save user data (user is now logged in)
            setUser(userData);
            // Return success
            return {success: true};
        } catch (error) {
            // If error, return failure with error message
            return {
                success: false,
                error: error.response?.data?.detail || 'Registration failed'
            };
        }
    };

    // Function: Log out the current user
    const logout = async () => {
        try {
            // Call backend logout endpoint (clears session cookie)
            await authAPI.logout();
            // Clear user data from state
            setUser(null);
        } catch (error) {
            // Log error but still clear user (logout client-side)
            console.error('Logout error:', error);
            // Still clear user data even if API call fails
            setUser(null);
        }
    };

    // Create the value object that will be provided to all child components
    const value = {
        user,                          // User object or null
        isAuthenticated: !!user,       // Boolean: true if user exists
        loading,                       // Boolean: true while checking auth
        login,                         // Function to log in
        register,                      // Function to register new user
        logout,                        // Function to log out
    };

    // While checking authentication status, show loading screen
    // This prevents the app from rendering before we know if user is logged in
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-lg">Loading...</div>
            </div>
        );
    }

    // Provide the auth value to all child components
    // Any component can now access auth state via useAuth()
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook: useAuth()
// Use this in any component to access authentication state/functions
// Example: const { user, login, logout, register } = useAuth();
export const useAuth = () => {
    const context = useContext(AuthContext);

    // Error if useAuth is called outside of AuthProvider
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return context;
};