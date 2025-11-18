/**
 * User Management Page (Admin Only)
 * ---------------------------------
 * Displays a list of all registered users with full CRUD capabilities.
 * Admins can view, edit, delete, and create new user accounts.
 *
 * Features:
 * - List all users in a table format
 * - Inline editing of user information
 * - Delete users with confirmation dialog
 * - Create new users (can set admin status)
 * - Display user role badges (Admin/User)
 * - Shows creation date for each user
 *
 * Security:
 * - Only accessible to admin users (protected route)
 * - Cannot delete your own account
 *
 * @component
 */

import React, { useState, useEffect } from 'react';
import { usersAPI } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

export default function UserManagement() {
    // Authentication context - get current user info
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();

    // State management
    const [users, setUsers] = useState([]);                    // List of all users
    const [loading, setLoading] = useState(true);              // Loading indicator
    const [error, setError] = useState(null);                  // Error message
    const [editingId, setEditingId] = useState(null);          // ID of user being edited
    const [editedUser, setEditedUser] = useState({});          // Edited user data
    const [deleteConfirm, setDeleteConfirm] = useState(null);  // User ID to delete
    const [showCreateForm, setShowCreateForm] = useState(false); // Toggle create form
    const [newUser, setNewUser] = useState({                   // New user form data
        email: '',
        password: '',
        display_name: '',
        is_admin: false
    });

    // Fetch all users when component loads
    useEffect(() => {
        // Redirect non-admin users
        if (currentUser && !currentUser.is_admin) {
            navigate('/');
            return;
        }

        loadUsers();
    }, [currentUser, navigate]);

    /**
     * Load all users from the API
     */
    const loadUsers = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await usersAPI.list();
            setUsers(data);
        } catch (err) {
            console.error('Error loading users:', err);
            setError('Failed to load users. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Start editing a user
     * @param {Object} user - User object to edit
     */
    const handleEditClick = (user) => {
        setEditingId(user.user_id);
        // Initialize edit form with current user data
        setEditedUser({
            display_name: user.display_name,
            email: user.email,
            password: '',  // Password is optional when editing
        });
    };

    /**
     * Cancel editing and discard changes
     */
    const handleCancelEdit = () => {
        setEditingId(null);
        setEditedUser({});
    };

    /**
     * Save edited user information
     * @param {number} userId - ID of user to update
     */
    const handleSaveEdit = async (userId) => {
        try {
            // Only send fields that have values
            const updateData = {};
            if (editedUser.display_name) updateData.display_name = editedUser.display_name;
            if (editedUser.email) updateData.email = editedUser.email;
            if (editedUser.password) updateData.password = editedUser.password;

            // Make API call to update user
            await usersAPI.update(userId, updateData);

            // Refresh user list
            await loadUsers();

            // Close edit form
            setEditingId(null);
            setEditedUser({});

            // Show success message
            showToast('User updated successfully', 'success');
        } catch (err) {
            console.error('Error updating user:', err);
            const message = err.response?.data?.detail || 'Failed to update user';
            showToast(message, 'error');
        }
    };

    /**
     * Delete a user (with confirmation)
     * @param {number} userId - ID of user to delete
     */
    const handleDelete = async (userId) => {
        try {
            await usersAPI.delete(userId);
            await loadUsers();
            setDeleteConfirm(null);
            showToast('User deleted successfully', 'success');
        } catch (err) {
            console.error('Error deleting user:', err);
            const message = err.response?.data?.detail || 'Failed to delete user';
            showToast(message, 'error');
        }
    };

    /**
     * Create a new user
     */
    const handleCreateUser = async () => {
        try {
            // Validate form
            if (!newUser.email || !newUser.password || !newUser.display_name) {
                showToast('Please fill in all fields', 'error');
                return;
            }

            // Make API call to create user
            await usersAPI.create(newUser);

            // Refresh user list
            await loadUsers();

            // Reset form and close
            setNewUser({
                email: '',
                password: '',
                display_name: '',
                is_admin: false
            });
            setShowCreateForm(false);

            // Show success message
            showToast('User created successfully', 'success');
        } catch (err) {
            console.error('Error creating user:', err);
            const message = err.response?.data?.detail || 'Failed to create user';
            showToast(message, 'error');
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
            month: 'short',
            day: 'numeric'
        });
    };

    // Loading state
    if (loading) {
        return (
            <div className="container-narrow">
                <div className="text-center py-12">Loading users...</div>
            </div>
        );
    }

    // Main render
    return (
        <div className="container-narrow">
            <h1 className="text-3xl mb-6">User Management</h1>

            {/* Error Message */}
            {error && (
                <div className="mb-4 p-3 bg-red-900/30 border border-red-500 text-red-400 rounded-xl">
                    {error}
                </div>
            )}

            {/* Create User Button */}
            <div className="mb-4">
                <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="btn"
                    data-cy="toggle-create-user"
                >
                    {showCreateForm ? 'Cancel' : 'Create New User'}
                </button>
            </div>

            {/* Create New User Form */}
            {showCreateForm && (
                <div className="panel mb-6" data-cy="create-user-form">
                    <h2 className="text-2xl mb-4">Create New User</h2>
                    <div className="space-y-4 mb-4">
                        <div>
                            <label htmlFor="new-email" className="block mb-2 text-sm font-medium">Email</label>
                            <input
                                id="new-email"
                                type="email"
                                value={newUser.email}
                                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                placeholder="user@example.com"
                                className="input w-full"
                                data-cy="new-user-email"
                            />
                        </div>
                        <div>
                            <label htmlFor="new-display-name" className="block mb-2 text-sm font-medium">Display Name</label>
                            <input
                                id="new-display-name"
                                type="text"
                                value={newUser.display_name}
                                onChange={(e) => setNewUser({ ...newUser, display_name: e.target.value })}
                                placeholder="John Doe"
                                className="input w-full"
                                data-cy="new-user-name"
                            />
                        </div>
                        <div>
                            <label htmlFor="new-password" className="block mb-2 text-sm font-medium">Password</label>
                            <input
                                id="new-password"
                                type="password"
                                value={newUser.password}
                                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                placeholder="Minimum 6 characters"
                                className="input w-full"
                                data-cy="new-user-password"
                            />
                        </div>
                        <div>
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={newUser.is_admin}
                                    onChange={(e) => setNewUser({ ...newUser, is_admin: e.target.checked })}
                                    className="w-4 h-4 rounded border-[#3a5a86] bg-[#143058] text-[#64FFDA] focus:ring-2 focus:ring-[#64FFDA] focus:ring-offset-0"
                                    data-cy="new-user-admin"
                                />
                                <span className="ml-2 text-sm">Grant Admin Privileges</span>
                            </label>
                        </div>
                    </div>
                    <button
                        onClick={handleCreateUser}
                        className="btn"
                        data-cy="submit-create-user"
                    >
                        Create User
                    </button>
                </div>
            )}

            {/* Users Table */}
            <div className="panel overflow-x-auto">
                <table className="w-full" data-cy="users-table">
                    <thead>
                    <tr className="border-b border-[#1b355e]">
                        <th className="text-left py-3 px-4 font-medium text-[#E6F1FF]">Email</th>
                        <th className="text-left py-3 px-4 font-medium text-[#E6F1FF]">Display Name</th>
                        <th className="text-left py-3 px-4 font-medium text-[#E6F1FF]">Role</th>
                        <th className="text-left py-3 px-4 font-medium text-[#E6F1FF]">Created</th>
                        <th className="text-right py-3 px-4 font-medium text-[#E6F1FF]">Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {users.map((user) => (
                        <tr key={user.user_id} className="border-b border-[#1b355e] last:border-b-0" data-cy={`user-row-${user.user_id}`}>
                            {/* Editing Mode */}
                            {editingId === user.user_id ? (
                                <>
                                    <td className="py-3 px-4">
                                        <input
                                            type="email"
                                            value={editedUser.email}
                                            onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })}
                                            className="input w-full text-sm"
                                            data-cy="edit-user-email"
                                        />
                                    </td>
                                    <td className="py-3 px-4">
                                        <input
                                            type="text"
                                            value={editedUser.display_name}
                                            onChange={(e) => setEditedUser({ ...editedUser, display_name: e.target.value })}
                                            className="input w-full text-sm"
                                            data-cy="edit-user-name"
                                        />
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className={`badge ${user.is_admin ? 'bg-[#64FFDA] text-[#081424]' : ''}`}>
                                            {user.is_admin ? 'Admin' : 'User'}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-[#B6C6DA]">{formatDate(user.created_at)}</td>
                                    <td className="py-3 px-4 text-right">
                                        <button
                                            onClick={() => handleSaveEdit(user.user_id)}
                                            className="btn-sm bg-green-600 hover:bg-green-700 text-white mr-2"
                                            data-cy="save-user-edit"
                                        >
                                            Save
                                        </button>
                                        <button
                                            onClick={handleCancelEdit}
                                            className="btn-sm btn-secondary"
                                            data-cy="cancel-user-edit"
                                        >
                                            Cancel
                                        </button>
                                    </td>
                                </>
                            ) : (
                                <>
                                    {/* Display Mode */}
                                    <td className="py-3 px-4">{user.email}</td>
                                    <td className="py-3 px-4">{user.display_name}</td>
                                    <td className="py-3 px-4">
                                        <span className={`badge ${user.is_admin ? 'bg-[#64FFDA] text-[#081424]' : ''}`}>
                                            {user.is_admin ? 'Admin' : 'User'}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-[#B6C6DA]">{formatDate(user.created_at)}</td>
                                    <td className="py-3 px-4 text-right">
                                        <button
                                            onClick={() => handleEditClick(user)}
                                            className="btn-sm bg-[#64FFDA] text-[#081424] mr-2"
                                            data-cy={`edit-user-${user.user_id}`}
                                        >
                                            Edit
                                        </button>
                                        {/* Prevent deleting own account */}
                                        {user.user_id !== currentUser.user_id && (
                                            <button
                                                onClick={() => setDeleteConfirm(user.user_id)}
                                                className="btn-sm btn-danger"
                                                data-cy={`delete-user-${user.user_id}`}
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </td>
                                </>
                            )}
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {/* Delete Confirmation Dialog */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" data-cy="delete-confirm-modal">
                    <div className="panel max-w-md">
                        <h2 className="text-2xl mb-4">Confirm Delete</h2>
                        <p className="text-[#B6C6DA] mb-6">
                            Are you sure you want to delete this user? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => handleDelete(deleteConfirm)}
                                className="btn-danger"
                                data-cy="confirm-delete-user"
                            >
                                Delete
                            </button>
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="btn-secondary"
                                data-cy="cancel-delete-user"
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