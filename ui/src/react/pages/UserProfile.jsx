/**
 * User Profile Page
 * -----------------
 * Allows users to view and edit their own account information.
 * Users can update their display name, email, password, and delete their account.
 *
 * Features:
 * - View current profile information
 * - Edit profile (display name, email)
 * - Change password
 * - Delete account (with confirmation)
 * - Auto-logout after account deletion
 *
 * Security:
 * - Users can only edit their own profile
 * - Requires authentication (protected route)
 *
 * @component
 */

import React, { useState, useEffect } from 'react';
import { usersAPI } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

export default function UserProfile() {
    // Authentication context and navigation
    const { user: currentUser, logout } = useAuth();
    const navigate = useNavigate();

    // State management
    const [loading, setLoading] = useState(false);              // Loading indicator
    const [error, setError] = useState(null);                   // Error message
    const [isEditing, setIsEditing] = useState(false);          // Edit mode toggle
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); // Delete confirmation
    const [formData, setFormData] = useState({                  // Form data
        display_name: '',
        email: '',
        password: '',
        confirm_password: ''
    });
    const [formErrors, setFormErrors] = useState({});           // Form validation errors

    // Initialize form with current user data
    useEffect(() => {
        if (currentUser) {
            setFormData({
                display_name: currentUser.display_name || '',
                email: currentUser.email || '',
                password: '',
                confirm_password: ''
            });
        }
    }, [currentUser]);

    /**
     * Handle form input changes
     * @param {Event} e - Input change event
     */
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
        // Clear error for this field when user starts typing
        if (formErrors[name]) {
            setFormErrors({
                ...formErrors,
                [name]: null
            });
        }
    };

    /**
     * Validate form data
     * @returns {boolean} - True if form is valid
     */
    const validateForm = () => {
        const errors = {};

        // Validate display name
        if (!formData.display_name.trim()) {
            errors.display_name = 'Display name is required';
        }

        // Validate email
        if (!formData.email.trim()) {
            errors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            errors.email = 'Email is invalid';
        }

        // Validate password (only if user is changing it)
        if (formData.password) {
            if (formData.password.length < 6) {
                errors.password = 'Password must be at least 6 characters';
            }
            if (formData.password !== formData.confirm_password) {
                errors.confirm_password = 'Passwords do not match';
            }
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    /**
     * Save profile changes
     */
    const handleSave = async () => {
        // Validate form
        if (!validateForm()) {
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Prepare update data (only include changed fields)
            const updateData = {};
            if (formData.display_name !== currentUser.display_name) {
                updateData.display_name = formData.display_name;
            }
            if (formData.email !== currentUser.email) {
                updateData.email = formData.email;
            }
            if (formData.password) {
                updateData.password = formData.password;
            }

            // Make API call to update user
            await usersAPI.update(currentUser.user_id, updateData);

            // Exit edit mode and clear password fields
            setIsEditing(false);
            setFormData({
                ...formData,
                password: '',
                confirm_password: ''
            });

            // Show success message
            showToast('Profile updated successfully', 'success');

            // Reload the page to refresh user data in context
            window.location.reload();
        } catch (err) {
            console.error('Error updating profile:', err);
            const message = err.response?.data?.detail || 'Failed to update profile';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Cancel editing and revert changes
     */
    const handleCancel = () => {
        // Reset form to current user data
        setFormData({
            display_name: currentUser.display_name || '',
            email: currentUser.email || '',
            password: '',
            confirm_password: ''
        });
        setFormErrors({});
        setError(null);
        setIsEditing(false);
    };

    /**
     * Delete user account
     */
    const handleDeleteAccount = async () => {
        try {
            setLoading(true);

            // Delete account
            await usersAPI.delete(currentUser.user_id);

            // Logout and redirect to home
            await logout();
            navigate('/');

            showToast('Account deleted successfully', 'success');
        } catch (err) {
            console.error('Error deleting account:', err);
            const message = err.response?.data?.detail || 'Failed to delete account';
            setError(message);
            setLoading(false);
        }
    };

    /**
     * Show toast notification
     * @param {string} message - Message to display
     * @param {string} type - 'success' or 'error'
     */
    const showToast = (message, type) => {
        const toast = document.getElementById('toast');
        if (toast) {
            toast.textContent = message;
            toast.className = `toast ${type}`;
            toast.style.display = 'block';
            setTimeout(() => {
                toast.style.display = 'none';
            }, 3000);
        }
    };

    /**
     * Format date for display
     * @param {string} dateString - ISO date string
     * @returns {string} Formatted date
     */
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Main render
    return (
        <div className="container-narrow">
            <h1 className="text-3xl mb-6">My Profile</h1>

            {/* Error Message */}
            {error && (
                <div className="mb-4 p-3 bg-red-900/30 border border-red-500 text-red-400 rounded-xl" data-cy="profile-error">
                    {error}
                </div>
            )}

            {/* Profile Card */}
            <div className="panel max-w-2xl" data-cy="profile-card">
                {/* Display Mode */}
                {!isEditing ? (
                    <>
                        <div className="space-y-4 mb-6">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                <label className="font-medium text-[#B6C6DA] w-36">Email:</label>
                                <span className="text-[#E6F1FF]">{currentUser?.email}</span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                <label className="font-medium text-[#B6C6DA] w-36">Display Name:</label>
                                <span className="text-[#E6F1FF]">{currentUser?.display_name}</span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                <label className="font-medium text-[#B6C6DA] w-36">Account Type:</label>
                                <span className={`badge ${currentUser?.is_admin ? 'bg-[#64FFDA] text-[#081424]' : ''}`}>
                                    {currentUser?.is_admin ? 'Admin' : 'User'}
                                </span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                <label className="font-medium text-[#B6C6DA] w-36">Member Since:</label>
                                <span className="text-[#E6F1FF]">{formatDate(currentUser?.created_at)}</span>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsEditing(true)}
                                className="btn"
                                data-cy="edit-profile-button"
                            >
                                Edit Profile
                            </button>
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="btn-danger"
                                data-cy="delete-account-button"
                            >
                                Delete Account
                            </button>
                        </div>
                    </>
                ) : (
                    /* Edit Mode */
                    <>
                        <div className="space-y-4 mb-6">
                            <div>
                                <label htmlFor="email" className="block mb-2 text-sm font-medium">Email</label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className={`input w-full ${formErrors.email ? 'border-red-500' : ''}`}
                                    data-cy="profile-email-input"
                                />
                                {formErrors.email && (
                                    <div className="text-red-400 text-sm mt-1">{formErrors.email}</div>
                                )}
                            </div>

                            <div>
                                <label htmlFor="display_name" className="block mb-2 text-sm font-medium">Display Name</label>
                                <input
                                    id="display_name"
                                    name="display_name"
                                    type="text"
                                    value={formData.display_name}
                                    onChange={handleInputChange}
                                    className={`input w-full ${formErrors.display_name ? 'border-red-500' : ''}`}
                                    data-cy="profile-name-input"
                                />
                                {formErrors.display_name && (
                                    <div className="text-red-400 text-sm mt-1">{formErrors.display_name}</div>
                                )}
                            </div>

                            <div>
                                <label htmlFor="password" className="block mb-2 text-sm font-medium">New Password (optional)</label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    placeholder="Leave blank to keep current password"
                                    className={`input w-full ${formErrors.password ? 'border-red-500' : ''}`}
                                    data-cy="profile-password-input"
                                />
                                {formErrors.password && (
                                    <div className="text-red-400 text-sm mt-1">{formErrors.password}</div>
                                )}
                            </div>

                            {formData.password && (
                                <div>
                                    <label htmlFor="confirm_password" className="block mb-2 text-sm font-medium">Confirm New Password</label>
                                    <input
                                        id="confirm_password"
                                        name="confirm_password"
                                        type="password"
                                        value={formData.confirm_password}
                                        onChange={handleInputChange}
                                        placeholder="Re-enter new password"
                                        className={`input w-full ${formErrors.confirm_password ? 'border-red-500' : ''}`}
                                        data-cy="profile-confirm-password-input"
                                    />
                                    {formErrors.confirm_password && (
                                        <div className="text-red-400 text-sm mt-1">{formErrors.confirm_password}</div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="btn"
                                data-cy="save-profile-button"
                            >
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button
                                onClick={handleCancel}
                                disabled={loading}
                                className="btn-secondary"
                                data-cy="cancel-profile-button"
                            >
                                Cancel
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Delete Account Confirmation Dialog */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" data-cy="delete-account-modal">
                    <div className="panel max-w-md">
                        <h2 className="text-2xl mb-4">Delete Account</h2>
                        <p className="text-red-400 mb-4">
                            ⚠️ This action cannot be undone! Are you sure you want to delete your account?
                        </p>
                        <p className="text-[#B6C6DA] mb-6">
                            All your data will be permanently removed from the system.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={handleDeleteAccount}
                                disabled={loading}
                                className="btn-danger"
                                data-cy="confirm-delete-account"
                            >
                                {loading ? 'Deleting...' : 'Yes, Delete My Account'}
                            </button>
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={loading}
                                className="btn-secondary"
                                data-cy="cancel-delete-account"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}