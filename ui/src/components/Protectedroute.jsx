// ProtectedRoute.jsx
// This component wraps around pages that require authentication
// If user is not logged in, they get redirected to the login page

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute({ children }) {
    // Get authentication state from AuthContext
    // isAuthenticated: boolean - true if user is logged in
    // loading: boolean - true while checking authentication status
    const { isAuthenticated, loading } = useAuth();

    // While checking auth status, show a loading screen
    // This prevents flashing content or incorrect redirects
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-lg">Loading...</div>
            </div>
        );
    }

    // If user is not authenticated, redirect them to login page
    // replace: true means this replaces current history entry (can't go back)
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // If authenticated, render the protected page (children)
    // children = whatever component was wrapped in <ProtectedRoute>
    return children;
}