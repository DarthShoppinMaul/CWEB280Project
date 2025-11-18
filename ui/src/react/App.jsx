// App.jsx
// Main layout component with navigation bar
// Provides the overall structure for the application including navigation menu

import React from 'react';
import {Outlet, NavLink, useNavigate} from 'react-router-dom';
import {useAuth} from '../context/AuthContext';

export default function App() {
    // Get authentication state and logout function from context
    const {isAuthenticated, user, logout} = useAuth();

    // Get navigation function to programmatically change routes
    const navigate = useNavigate();

    // Handle logout button click
    const handleLogout = async (e) => {
        e.preventDefault();         // Prevent default link behavior
        await logout();             // Call logout function (clears session)
        navigate('/');              // Redirect to home page after logout
    };

    return (
        <>
            {/* Navigation Bar */}
            <nav className="navbar">
                {/* Left side: App title/logo */}
                <div className="nav-left">Pet Gallery</div>

                {/* Right side: Navigation links */}
                <div className="nav-right">
                    {/* Home link - always visible */}
                    <NavLink
                        to="/"
                        className={({isActive}) => isActive ? 'nav-active' : ''}
                    >
                        Home
                    </NavLink>

                    {/* Pets link - always visible */}
                    <NavLink
                        to="/pets"
                        className={({isActive}) => isActive ? 'nav-active' : ''}
                    >
                        Browse Pets
                    </NavLink>

                    {/* Links only visible when user is logged in */}
                    {isAuthenticated && (
                        <>
                            {/* My Applications - regular users */}
                            <NavLink
                                to="/my-applications"
                                className={({isActive}) => isActive ? 'nav-active' : ''}
                            >
                                My Applications
                            </NavLink>

                            {/* Profile link - all authenticated users */}
                            <NavLink
                                to="/profile"
                                className={({isActive}) => isActive ? 'nav-active' : ''}
                                data-cy="profile-link"
                            >
                                Profile
                            </NavLink>

                            {/* Admin links - only for admins */}
                            {user?.is_admin && (
                                <>
                                    <NavLink
                                        to="/admin/dashboard"
                                        className={({isActive}) => isActive ? 'nav-active' : ''}
                                    >
                                        Dashboard
                                    </NavLink>
                                    <NavLink
                                        to="/admin/users"
                                        className={({isActive}) => isActive ? 'nav-active' : ''}
                                        data-cy="user-management-link"
                                    >
                                        Manage Users
                                    </NavLink>
                                    <NavLink
                                        to="/add-pet"
                                        className={({isActive}) => isActive ? 'nav-active' : ''}
                                    >
                                        Manage Pet
                                    </NavLink>
                                    <NavLink
                                        to="/add-location"
                                        className={({isActive}) => isActive ? 'nav-active' : ''}
                                    >
                                        Manage Location
                                    </NavLink>
                                </>
                            )}
                        </>
                    )}

                    {/* Login/Register links - only visible when NOT logged in */}
                    {!isAuthenticated && (
                        <>
                            <NavLink
                                to="/login"
                                className={({isActive}) => isActive ? 'nav-active' : ''}
                            >
                                Login
                            </NavLink>
                            <NavLink
                                to="/register"
                                className={({isActive}) => isActive ? 'nav-active' : ''}
                            >
                                Sign Up
                            </NavLink>
                        </>
                    )}

                    {/* Logout link - only visible when logged in */}
                    {isAuthenticated && (
                        <a href="/" onClick={handleLogout} data-cy="logout-link">
                            Logout
                        </a>
                    )}
                </div>
            </nav>

            {/* Main content area */}
            <main className="container-narrow">
                {/* Outlet renders the current page (Home, Login, Dashboard, etc.) */}
                {/* This is where child routes from main.jsx are displayed */}
                <Outlet/>
            </main>

            {/* Toast notification container (for success/error messages) */}
            <div id="toast" className="toast"/>
        </>
    );
}