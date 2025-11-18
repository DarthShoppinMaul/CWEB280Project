// ManageLocations.jsx
// Admin page to manage all locations: view list, add new, edit existing, and delete
// Protected route - requires authentication

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { locationsAPI } from '../../services/api';

// Helper for phone validation
function isValidPhoneClient(raw) {
    const v = (raw ?? "").trim();
    if (v === "") return true;                 // optional field
    const digits = v.replace(/\D/g, "");       // strip all non-digits
    return digits.length >= 10;                // accept if 10+ digits (exts are fine)
}

export default function ManageLocations() {
    const navigate = useNavigate();

    // VIEW MODE STATE
    const [viewMode, setViewMode] = useState('list'); // 'list', 'add', 'edit'
    const [locations, setLocations] = useState([]);
    const [loadingLocations, setLoadingLocations] = useState(true);

    // FORM FIELDS
    const [editingLocationId, setEditingLocationId] = useState(null);
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');

    // VALIDATION & SUBMISSION
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // LOAD DATA ON MOUNT
    useEffect(() => {
        loadLocations();
    }, []);

    const loadLocations = async () => {
        try {
            const data = await locationsAPI.list();
            setLocations(data);
        } catch (err) {
            console.error('Error loading locations:', err);
            setErrors({ submit: 'Failed to load locations' });
        } finally {
            setLoadingLocations(false);
        }
    };

    // VALIDATION FUNCTION
    const validateForm = () => {
        const newErrors = {};

        // Name validation
        if (!name.trim()) {
            newErrors.name = 'Location name is required';
        } else if (name.trim().length < 3) {
            newErrors.name = 'Location name must be at least 3 characters';
        }

        // Address validation
        if (!address.trim()) {
            newErrors.address = 'Address is required';
        }

        // Phone validation (optional field)
        if (!isValidPhoneClient(phone)) {
            newErrors.phone = 'Please enter a valid phone number';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // FORM SUBMISSION HANDLER
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            const data = {
                name: name.trim(),
                address: address.trim(),
                phone: (phone || '').trim(),
            };

            if (viewMode === 'edit') {
                // Update existing location
                await locationsAPI.update(editingLocationId, data);
                setSuccessMessage('Location updated successfully!');
            } else {
                // Create new location
                await locationsAPI.create(data);
                setSuccessMessage('Location added successfully!');
            }

            // Reload locations and switch to list view
            await loadLocations();
            handleCancel();
        } catch (err) {
            console.error('Error saving location:', err);
            let msg = 'Failed to save location. Please try again.';
            const detail = err?.response?.data?.detail;
            if (Array.isArray(detail)) msg = detail.map(d => d.msg ?? String(d)).join(', ');
            else if (typeof detail === 'string') msg = detail;
            setErrors({ submit: msg });
        } finally {
            setIsSubmitting(false);
        }
    };

    // EDIT BUTTON HANDLER
    const handleEdit = (location) => {
        setEditingLocationId(location.location_id);
        setName(location.name);
        setAddress(location.address);
        setPhone(location.phone || '');
        setViewMode('edit');
        setSuccessMessage('');
        setErrors({});
    };

    // DELETE BUTTON HANDLER
    const handleDelete = async (locationId) => {
        if (!window.confirm('Are you sure you want to delete this location? This may affect pets assigned to this location.')) {
            return;
        }

        try {
            await locationsAPI.delete(locationId);
            setSuccessMessage('Location deleted successfully!');
            await loadLocations();
        } catch (err) {
            console.error('Error deleting location:', err);
            const errorMessage = err.response?.data?.detail || 'Failed to delete location. It may be in use by pets.';
            setErrors({ submit: errorMessage });
        }
    };

    // ADD NEW BUTTON HANDLER
    const handleAddNew = () => {
        setViewMode('add');
        handleClearForm();
        setSuccessMessage('');
    };

    // CANCEL BUTTON HANDLER
    const handleCancel = () => {
        setViewMode('list');
        handleClearForm();
    };

    // CLEAR FORM HANDLER
    const handleClearForm = () => {
        setEditingLocationId(null);
        setName('');
        setAddress('');
        setPhone('');
        setErrors({});
    };

    // LOADING STATE
    if (loadingLocations) {
        return <div className="text-center py-8">Loading...</div>;
    }

    // RENDER LIST VIEW
    if (viewMode === 'list') {
        return (
            <>
                <h1>Manage Locations</h1>

                {successMessage && (
                    <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                        {successMessage}
                    </div>
                )}

                {errors.submit && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                        {errors.submit}
                    </div>
                )}

                <div className="mb-4">
                    <button
                        className="btn"
                        onClick={handleAddNew}
                        data-cy="add-new-location-button"
                    >
                        Add New Location
                    </button>
                </div>

                <div className="panel">
                    <h2 className="text-xl font-bold mb-4">All Locations ({locations.length})</h2>

                    {locations.length === 0 ? (
                        <p className="text-gray-600">No locations found. Add your first location!</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                <tr>
                                    <th className="border p-2 text-left">Name</th>
                                    <th className="border p-2 text-left">Address</th>
                                    <th className="border p-2 text-left">Phone</th>
                                    <th className="border p-2 text-center">Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {locations.map(location => (
                                    <tr key={location.location_id} className="hover:bg-gray-50">
                                        <td className="border p-2 font-medium">{location.name}</td>
                                        <td className="border p-2">{location.address}</td>
                                        <td className="border p-2">{location.phone || 'N/A'}</td>
                                        <td className="border p-2">
                                            <div className="flex gap-2 justify-center">
                                                <button
                                                    className="btn-secondary text-sm px-3 py-1"
                                                    onClick={() => handleEdit(location)}
                                                    data-cy={`edit-location-${location.location_id}`}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm"
                                                    onClick={() => handleDelete(location.location_id)}
                                                    data-cy={`delete-location-${location.location_id}`}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </>
        );
    }

    // RENDER ADD/EDIT FORM VIEW
    return (
        <>
            <h1>{viewMode === 'edit' ? 'Edit Location' : 'Add Location'}</h1>

            <div className="panel">
                {errors.submit && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                        {errors.submit}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* LOCATION NAME FIELD */}
                    <div className="mb-4">
                        <label>Location Name *</label>
                        <input
                            className={`input w-full ${errors.name ? 'border-red-500' : ''}`}
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                if (errors.name) setErrors({ ...errors, name: undefined });
                            }}
                            placeholder="e.g., Downtown Adoption Center"
                            data-cy="location-name-input"
                        />
                        {errors.name && (
                            <div className="text-red-500 text-sm mt-1" data-cy="location-name-error">
                                {errors.name}
                            </div>
                        )}
                    </div>

                    {/* ADDRESS FIELD */}
                    <div className="mb-4">
                        <label>Address *</label>
                        <input
                            className={`input w-full ${errors.address ? 'border-red-500' : ''}`}
                            value={address}
                            onChange={(e) => {
                                setAddress(e.target.value);
                                if (errors.address) setErrors({ ...errors, address: undefined });
                            }}
                            placeholder="e.g., 123 Main St, Toronto, ON"
                            data-cy="location-address-input"
                        />
                        {errors.address && (
                            <div className="text-red-500 text-sm mt-1" data-cy="location-address-error">
                                {errors.address}
                            </div>
                        )}
                    </div>

                    {/* PHONE FIELD */}
                    <div className="mb-4">
                        <label>Phone</label>
                        <input
                            className={`input w-full ${errors.phone ? 'border-red-500' : ''}`}
                            value={phone}
                            onChange={(e) => {
                                setPhone(e.target.value);
                                if (errors.phone) setErrors({ ...errors, phone: undefined });
                            }}
                            placeholder="e.g., (416) 555-0123"
                            data-cy="location-phone-input"
                        />
                        {errors.phone && (
                            <div className="text-red-500 text-sm mt-1" data-cy="location-phone-error">
                                {errors.phone}
                            </div>
                        )}
                    </div>

                    {/* FORM BUTTONS */}
                    <div className="h-4"/>
                    <button
                        type="submit"
                        className="btn"
                        disabled={isSubmitting}
                        data-cy={viewMode === 'edit' ? 'update-location-button' : 'add-location-button'}
                    >
                        {isSubmitting
                            ? (viewMode === 'edit' ? 'Updating Location...' : 'Adding Location...')
                            : (viewMode === 'edit' ? 'Update Location' : 'Add Location')
                        }
                    </button>
                    <button
                        type="button"
                        className="btn-secondary ml-2"
                        onClick={handleCancel}
                        disabled={isSubmitting}
                        data-cy="cancel-button"
                    >
                        Cancel
                    </button>
                </form>
            </div>
        </>
    );
}