// ManageLocations.jsx
// Admin page to manage all locations: view list, add new, edit existing, and delete
// Protected route - requires authentication

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { locationsAPI } from '../../services/api';

function isValidPhoneClient(raw) {
    const v = (raw ?? "").trim();
    if (v === "") return true;
    const digits = v.replace(/\D/g, "");
    return digits.length >= 10;
}

export default function ManageLocations() {
    const navigate = useNavigate();

    const [viewMode, setViewMode] = useState('list');
    const [locations, setLocations] = useState([]);
    const [loadingLocations, setLoadingLocations] = useState(true);

    const [editingLocationId, setEditingLocationId] = useState(null);
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

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

    const validateForm = () => {
        const newErrors = {};

        if (!name.trim()) {
            newErrors.name = 'Location name is required';
        } else if (name.trim().length < 3) {
            newErrors.name = 'Location name must be at least 3 characters';
        }

        if (!address.trim()) {
            newErrors.address = 'Address is required';
        }

        if (!isValidPhoneClient(phone)) {
            newErrors.phone = 'Please enter a valid phone number';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

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
                await locationsAPI.update(editingLocationId, data);
                setSuccessMessage('Location updated successfully!');
            } else {
                await locationsAPI.create(data);
                setSuccessMessage('Location added successfully!');
            }

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

    const handleEdit = (location) => {
        setEditingLocationId(location.location_id);
        setName(location.name);
        setAddress(location.address);
        setPhone(location.phone || '');
        setViewMode('edit');
        setSuccessMessage('');
        setErrors({});
    };

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

    const handleAddNew = () => {
        setViewMode('add');
        handleClearForm();
        setSuccessMessage('');
    };

    const handleCancel = () => {
        setViewMode('list');
        handleClearForm();
    };

    const handleClearForm = () => {
        setEditingLocationId(null);
        setName('');
        setAddress('');
        setPhone('');
        setErrors({});
    };

    if (loadingLocations) {
        return (
            <div className="container-narrow">
                <div className="text-center py-12">Loading...</div>
            </div>
        );
    }

    if (viewMode === 'list') {
        return (
            <div className="container-narrow">
                <h1 className="text-3xl mb-6">Manage Locations</h1>

                {successMessage && (
                    <div className="mb-4 p-3 bg-green-900/30 border border-green-500 text-green-400 rounded-xl">
                        {successMessage}
                    </div>
                )}

                {errors.submit && (
                    <div className="mb-4 p-3 bg-red-900/30 border border-red-500 text-red-400 rounded-xl">
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

                <div className="panel overflow-x-auto">
                    <h2 className="text-xl font-bold mb-4">All Locations ({locations.length})</h2>

                    {locations.length === 0 ? (
                        <p className="text-[#B6C6DA]">No locations found. Add your first location!</p>
                    ) : (
                        <table className="w-full">
                            <thead>
                            <tr className="border-b border-[#1b355e]">
                                <th className="text-left py-3 px-4 font-medium text-[#E6F1FF]">Name</th>
                                <th className="text-left py-3 px-4 font-medium text-[#E6F1FF]">Address</th>
                                <th className="text-left py-3 px-4 font-medium text-[#E6F1FF]">Phone</th>
                                <th className="text-right py-3 px-4 font-medium text-[#E6F1FF]">Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {locations.map(location => (
                                <tr key={location.location_id} className="border-b border-[#1b355e] last:border-b-0">
                                    <td className="py-3 px-4 font-medium">{location.name}</td>
                                    <td className="py-3 px-4">{location.address}</td>
                                    <td className="py-3 px-4">{location.phone || 'N/A'}</td>
                                    <td className="py-3 px-4 text-right">
                                        <button
                                            className="btn-sm bg-[#64FFDA] text-[#081424] mr-2"
                                            onClick={() => handleEdit(location)}
                                            data-cy={`edit-location-${location.location_id}`}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="btn-sm btn-danger"
                                            onClick={() => handleDelete(location.location_id)}
                                            data-cy={`delete-location-${location.location_id}`}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="container-narrow">
            <h1 className="text-3xl mb-6">{viewMode === 'edit' ? 'Edit Location' : 'Add Location'}</h1>

            <div className="panel">
                {errors.submit && (
                    <div className="mb-4 p-3 bg-red-900/30 border border-red-500 text-red-400 rounded-xl">
                        {errors.submit}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block mb-2 text-sm font-medium">Location Name *</label>
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
                            <div className="text-red-400 text-sm mt-1" data-cy="location-name-error">
                                {errors.name}
                            </div>
                        )}
                    </div>

                    <div className="mb-4">
                        <label className="block mb-2 text-sm font-medium">Address *</label>
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
                            <div className="text-red-400 text-sm mt-1" data-cy="location-address-error">
                                {errors.address}
                            </div>
                        )}
                    </div>

                    <div className="mb-4">
                        <label className="block mb-2 text-sm font-medium">Phone</label>
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
                            <div className="text-red-400 text-sm mt-1" data-cy="location-phone-error">
                                {errors.phone}
                            </div>
                        )}
                    </div>

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
        </div>
    );
}