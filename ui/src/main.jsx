// main.jsx
// Entry point for the React application
// Sets up routing and wraps app with authentication provider

import React from 'react';
import ReactDOM from 'react-dom/client';
import {createBrowserRouter, RouterProvider} from 'react-router-dom';
import './index.css';  // Import global styles (Tailwind CSS)

// Import authentication context provider
import {AuthProvider} from './context/AuthContext';
// Import route protection component
import ProtectedRoute from './components/ProtectedRoute';

// Import all page components
import App from './react/App';                    // Layout wrapper with navbar
import Home from './react/pages/Home';            // Public home page
import AddPet from './react/pages/AddPet';        // Add pet form (protected)
import AddLocation from './react/pages/AddLocation'; // Add location form (protected)

// NEW IMPORTS FOR PROJECT 2
import LoginEnhanced from './react/pages/Login';  // Enhanced login with Google + Remember Me
import Registration from './react/pages/Registration';     // User registration page
import PetListEnhanced from './react/pages/PetList'; // Pet list with favorites
import PetDetails from './react/pages/PetDetails';         // Pet details with Apply button
import AdoptionApplicationForm from './react/pages/AdoptionApplicationForm'; // Application form
import MyApplications from './react/pages/MyApplications'; // User's applications
import ApplicationReview from './react/pages/ApplicationReview'; // Admin review
import AdminDashboardEnhanced from './react/pages/AdminDashboard'; // Enhanced dashboard
import UserManagement from './react/pages/UserManagement'; // Admin: Manage all users
import UserProfile from './react/pages/UserProfile';       // User: Manage own profile

// Create the router configuration
// Defines all routes (URLs) and which components render for each
const router = createBrowserRouter([
    {
        path: '/',                    // Root path
        element: <App/>,              // App component wraps all pages (navbar, etc.)
        children: [                   // Nested routes that render inside App's <Outlet/>
            {
                index: true,          // This is the default route at '/'
                element: <Home/>,     // Home page (public - shows approved pets)
            },
            {
                path: 'login',        // Route: /login
                element: <LoginEnhanced/>,
            },
            {
                path: 'register',     // Route: /register
                element: <Registration/>,
            },
            {
                path: 'pets',         // Route: /pets
                element: <PetListEnhanced/>,
            },
            {
                path: 'pet/:id',      // Route: /pet/1, /pet/2, etc.
                element: <PetDetails/>,
            },
            {
                path: 'apply/:petId', // Route: /apply/1, /apply/2, etc.
                element: (
                    <ProtectedRoute>
                        <AdoptionApplicationForm/>
                    </ProtectedRoute>
                ),
            },
            {
                path: 'my-applications', // Route: /my-applications
                element: (
                    <ProtectedRoute>
                        <MyApplications/>
                    </ProtectedRoute>
                ),
            },
            {
                path: 'profile',      // Route: /profile
                element: (
                    <ProtectedRoute>
                        <UserProfile/>
                    </ProtectedRoute>
                ),
            },
            {
                path: 'admin/dashboard', // Route: /admin/dashboard
                element: (
                    <ProtectedRoute>
                        <AdminDashboardEnhanced/>
                    </ProtectedRoute>
                ),
            },
            {
                path: 'admin/application/:id', // Route: /admin/application/1
                element: (
                    <ProtectedRoute>
                        <ApplicationReview/>
                    </ProtectedRoute>
                ),
            },
            {
                path: 'admin/users',  // Route: /admin/users
                element: (
                    <ProtectedRoute>
                        <UserManagement/>
                    </ProtectedRoute>
                ),
            },
            {
                path: 'add-pet',      // Route: /add-pet
                element: (
                    <ProtectedRoute>
                        <AddPet/>
                    </ProtectedRoute>
                ),
            },
            {
                path: 'add-location', // Route: /add-location
                element: (
                    <ProtectedRoute>
                        <AddLocation/>
                    </ProtectedRoute>
                ),
            },
        ],
    },
]);

// Render the React app
// 1. Get the 'root' div from index.html
// 2. Create a React root
// 3. Render the app inside StrictMode (helps catch bugs during development)
ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        {/* AuthProvider wraps everything - provides auth state to all components */}
        <AuthProvider>
            {/* RouterProvider handles navigation and renders the right page */}
            <RouterProvider router={router}/>
        </AuthProvider>
    </React.StrictMode>
);