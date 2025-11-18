// ManagePets.jsx
// Admin page to manage all pets: view list, add new, edit existing, and delete
// Includes photo upload with file validation
// Protected route - requires authentication

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { petsAPI, locationsAPI } from '../../services/api';

// File upload constraints
const MAX_FILE_SIZE_MB = 2;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export default function ManagePets() {
    const navigate = useNavigate();

    // VIEW MODE STATE
    const [viewMode, setViewMode] = useState('list'); // 'list', 'add', 'edit'
    const [pets, setPets] = useState([]);
    const [loadingPets, setLoadingPets] = useState(true);

    // FORM FIELDS
    const [editingPetId, setEditingPetId] = useState(null);
    const [name, setName] = useState('');
    const [species, setSpecies] = useState('');
    const [age, setAge] = useState('');
    const [locationId, setLocationId] = useState('');
    const [description, setDescription] = useState('');
    const [photo, setPhoto] = useState(null);
    const [currentPhotoUrl, setCurrentPhotoUrl] = useState('');

    // ADDITIONAL STATE
    const [locations, setLocations] = useState([]);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loadingLocations, setLoadingLocations] = useState(true);
    const [successMessage, setSuccessMessage] = useState('');

    // LOAD DATA ON MOUNT
    useEffect(() => {
        loadLocations();
        loadPets();
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

    const loadPets = async () => {
        try {
            const data = await petsAPI.list();
            setPets(data);
        } catch (err) {
            console.error('Error loading pets:', err);
            setErrors({ submit: 'Failed to load pets' });
        } finally {
            setLoadingPets(false);
        }
    };

    // VALIDATION FUNCTION
    const validateForm = () => {
        const newErrors = {};

        // Name validation
        if (!name.trim()) {
            newErrors.name = 'Pet name is required';
        } else if (name.trim().length < 2) {
            newErrors.name = 'Pet name must be at least 2 characters';
        }

        // Species validation
        if (!species.trim()) {
            newErrors.species = 'Species is required';
        }

        // Age validation
        if (!age) {
            newErrors.age = 'Age is required';
        } else {
            const ageNum = parseInt(age, 10);
            if (isNaN(ageNum) || ageNum < 0) {
                newErrors.age = 'Age must be 0 or greater';
            } else if (ageNum > 30) {
                newErrors.age = 'Age seems too high (max 30 years)';
            }
        }

        // Location validation
        if (!locationId) {
            newErrors.locationId = 'Please select a location';
        }

        // Photo validation (optional field for edit, but must be valid if provided)
        if (photo) {
            if (photo.size > MAX_FILE_SIZE_BYTES) {
                newErrors.photo = `File size must be less than ${MAX_FILE_SIZE_MB}MB`;
            }

            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
            if (!allowedTypes.includes(photo.type)) {
                newErrors.photo = 'File must be an image (JPEG, PNG, GIF, or WebP)';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // FILE INPUT HANDLER
    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setPhoto(file);
            if (errors.photo) {
                setErrors({ ...errors, photo: undefined });
            }
        } else {
            setPhoto(null);
        }
    };

    // FORM SUBMISSION HANDLER
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        if (errors.submit) {
            setErrors({ ...errors, submit: undefined });
        }

        setIsSubmitting(true);

        try {
            // Create FormData for multipart/form-data upload
            const formData = new FormData();
            formData.append('name', name.trim());
            formData.append('species', species.trim());
            formData.append('age', parseInt(age, 10));
            formData.append('location_id', parseInt(locationId, 10));

            if (description.trim()) {
                formData.append('description', description.trim());
            }

            if (photo) {
                formData.append('photo', photo);
            }

            if (viewMode === 'edit') {
                // Update existing pet
                await petsAPI.update(editingPetId, formData);
                setSuccessMessage('Pet updated successfully!');
            } else {
                // Create new pet
                await petsAPI.create(formData);
                setSuccessMessage('Pet added successfully!');
            }

            // Reload pets and switch to list view
            await loadPets();
            handleCancel();
        } catch (err) {
            console.error('Error saving pet:', err);
            const errorMessage = err.response?.data?.detail || 'Failed to save pet. Please try again.';
            setErrors({ ...errors, submit: errorMessage });
        } finally {
            setIsSubmitting(false);
        }
    };

    // EDIT BUTTON HANDLER
    const handleEdit = (pet) => {
        setEditingPetId(pet.pet_id);
        setName(pet.name);
        setSpecies(pet.species);
        setAge(pet.age.toString());
        setLocationId(pet.location_id.toString());
        setDescription(pet.description || '');
        setCurrentPhotoUrl(pet.photo_url || '');
        setPhoto(null);
        setViewMode('edit');
        setSuccessMessage('');
        setErrors({});
    };

    // DELETE BUTTON HANDLER
    const handleDelete = async (petId) => {
        if (!window.confirm('Are you sure you want to delete this pet?')) {
            return;
        }

        try {
            await petsAPI.delete(petId);
            setSuccessMessage('Pet deleted successfully!');
            await loadPets();
        } catch (err) {
            console.error('Error deleting pet:', err);
            setErrors({ submit: 'Failed to delete pet. Please try again.' });
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
        setEditingPetId(null);
        setName('');
        setSpecies('');
        setAge('');
        setLocationId('');
        setDescription('');
        setPhoto(null);
        setCurrentPhotoUrl('');
        setErrors({});

        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) fileInput.value = '';
    };

    // LOADING STATE
    if (loadingLocations || loadingPets) {
        return <div className="text-center py-8">Loading...</div>;
    }

    // RENDER LIST VIEW
    if (viewMode === 'list') {
        return (
            <>
                <h1>Manage Pets</h1>

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
                        data-cy="add-new-pet-button"
                    >
                        Add New Pet
                    </button>
                </div>

                <div className="panel">
                    <h2 className="text-xl font-bold mb-4">All Pets ({pets.length})</h2>

                    {pets.length === 0 ? (
                        <p className="text-gray-600">No pets found. Add your first pet!</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                <tr>
                                    <th className="border p-2 text-left">Photo</th>
                                    <th className="border p-2 text-left">Name</th>
                                    <th className="border p-2 text-left">Species</th>
                                    <th className="border p-2 text-left">Age</th>
                                    <th className="border p-2 text-left">Location</th>
                                    <th className="border p-2 text-left">Status</th>
                                    <th className="border p-2 text-center">Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {pets.map(pet => {
                                    const location = locations.find(l => l.location_id === pet.location_id);
                                    return (
                                        <tr key={pet.pet_id} className="hover:bg-gray-50">
                                            <td className="border p-2">
                                                {pet.photo_url ? (
                                                    <img
                                                        src={`http://localhost:8000/${pet.photo_url}`}
                                                        alt={pet.name}
                                                        className="w-16 h-16 object-cover rounded"
                                                    />
                                                ) : (
                                                    <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
                                                        No photo
                                                    </div>
                                                )}
                                            </td>
                                            <td className="border p-2">{pet.name}</td>
                                            <td className="border p-2">{pet.species}</td>
                                            <td className="border p-2">{pet.age} years</td>
                                            <td className="border p-2">{location?.name || 'Unknown'}</td>
                                            <td className="border p-2">
                                                    <span className={`px-2 py-1 rounded text-sm ${
                                                        pet.status === 'approved'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                        {pet.status}
                                                    </span>
                                            </td>
                                            <td className="border p-2">
                                                <div className="flex gap-2 justify-center">
                                                    <button
                                                        className="btn-secondary text-sm px-3 py-1"
                                                        onClick={() => handleEdit(pet)}
                                                        data-cy={`edit-pet-${pet.pet_id}`}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm"
                                                        onClick={() => handleDelete(pet.pet_id)}
                                                        data-cy={`delete-pet-${pet.pet_id}`}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
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
            <h1>{viewMode === 'edit' ? 'Edit Pet' : 'Add Pet'}</h1>

            <div className="panel">
                {errors.submit && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                        {errors.submit}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* NAME & SPECIES ROW */}
                    <div className="flex flex-wrap gap-4">
                        {/* Pet Name Field */}
                        <div className="min-w-[240px] flex-1">
                            <label>Pet Name *</label>
                            <input
                                className={`input ${errors.name ? 'border-red-500' : ''}`}
                                value={name}
                                onChange={(e) => {
                                    setName(e.target.value);
                                    if (errors.name) setErrors({ ...errors, name: undefined });
                                }}
                                data-cy="pet-name-input"
                            />
                            {errors.name && (
                                <div className="text-red-500 text-sm mt-1" data-cy="pet-name-error">
                                    {errors.name}
                                </div>
                            )}
                        </div>

                        {/* Species Field */}
                        <div className="min-w-[240px] flex-1">
                            <label>Species *</label>
                            <input
                                className={`input ${errors.species ? 'border-red-500' : ''}`}
                                value={species}
                                onChange={(e) => {
                                    setSpecies(e.target.value);
                                    if (errors.species) setErrors({ ...errors, species: undefined });
                                }}
                                data-cy="pet-species-input"
                            />
                            {errors.species && (
                                <div className="text-red-500 text-sm mt-1" data-cy="pet-species-error">
                                    {errors.species}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* AGE & LOCATION ROW */}
                    <div className="flex flex-wrap gap-4 mt-4">
                        {/* Age Field */}
                        <div className="max-w-[200px] flex-1">
                            <label>Age (years) *</label>
                            <input
                                className={`input ${errors.age ? 'border-red-500' : ''}`}
                                type="number"
                                min="0"
                                step="1"
                                value={age}
                                onChange={(e) => {
                                    setAge(e.target.value);
                                    if (errors.age) setErrors({ ...errors, age: undefined });
                                }}
                                data-cy="pet-age-input"
                            />
                            {errors.age && (
                                <div className="text-red-500 text-sm mt-1" data-cy="pet-age-error">
                                    {errors.age}
                                </div>
                            )}
                        </div>

                        {/* Location Dropdown */}
                        <div className="min-w-[240px] flex-1">
                            <label>Location *</label>
                            <select
                                className={`input ${errors.locationId ? 'border-red-500' : ''}`}
                                value={locationId}
                                onChange={(e) => {
                                    setLocationId(e.target.value);
                                    if (errors.locationId) setErrors({ ...errors, locationId: undefined });
                                }}
                                data-cy="pet-location-select"
                            >
                                <option value="">Select a location</option>
                                {locations.map(loc => (
                                    <option key={loc.location_id} value={loc.location_id}>
                                        {loc.name}
                                    </option>
                                ))}
                            </select>
                            {errors.locationId && (
                                <div className="text-red-500 text-sm mt-1" data-cy="pet-location-error">
                                    {errors.locationId}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* DESCRIPTION FIELD */}
                    <div className="mt-4">
                        <label>Description</label>
                        <textarea
                            className="textarea"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows="4"
                            data-cy="pet-description-input"
                        />
                    </div>

                    {/* PHOTO UPLOAD FIELD */}
                    <div className="flex flex-wrap gap-4 mt-4">
                        <div className="max-w-[400px] flex-1">
                            <label>Photo (Max {MAX_FILE_SIZE_MB}MB) {viewMode === 'edit' && '- Leave empty to keep current photo'}</label>
                            {viewMode === 'edit' && currentPhotoUrl && (
                                <div className="mb-2">
                                    <img
                                        src={`http://localhost:8000/${currentPhotoUrl}`}
                                        alt="Current"
                                        className="w-32 h-32 object-cover rounded border"
                                    />
                                    <p className="text-sm text-gray-600 mt-1">Current photo</p>
                                </div>
                            )}
                            <input
                                type="file"
                                className={`input ${errors.photo ? 'border-red-500' : ''}`}
                                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                onChange={handleFileChange}
                                data-cy="pet-photo-input"
                            />
                            {errors.photo && (
                                <div className="text-red-500 text-sm mt-1" data-cy="pet-photo-error">
                                    {errors.photo}
                                </div>
                            )}
                            {photo && !errors.photo && (
                                <div className="text-sm text-gray-600 mt-1">
                                    Selected: {photo.name} ({(photo.size / 1024 / 1024).toFixed(2)}MB)
                                </div>
                            )}
                        </div>
                    </div>

                    {/* FORM BUTTONS */}
                    <div className="h-4"/>
                    <button
                        type="submit"
                        className="btn"
                        disabled={isSubmitting}
                        data-cy={viewMode === 'edit' ? 'update-pet-button' : 'add-pet-button'}
                    >
                        {isSubmitting
                            ? (viewMode === 'edit' ? 'Updating Pet...' : 'Adding Pet...')
                            : (viewMode === 'edit' ? 'Update Pet' : 'Add Pet')
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