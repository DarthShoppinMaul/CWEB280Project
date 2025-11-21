// ManagePets.jsx
// Admin page to manage all pets: view list, add new, edit existing, and delete
// Includes photo upload with file validation
// Protected route - requires authentication

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { petsAPI, locationsAPI, API_BASE_URL } from '../../services/api.js';

const MAX_FILE_SIZE_MB = 2;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export default function ManagePets() {
    const navigate = useNavigate();

    const [viewMode, setViewMode] = useState('list');
    const [pets, setPets] = useState([]);
    const [loadingPets, setLoadingPets] = useState(true);

    const [editingPetId, setEditingPetId] = useState(null);
    const [name, setName] = useState('');
    const [species, setSpecies] = useState('');
    const [age, setAge] = useState('');
    const [locationId, setLocationId] = useState('');
    const [description, setDescription] = useState('');
    const [photo, setPhoto] = useState(null);
    const [currentPhotoUrl, setCurrentPhotoUrl] = useState('');

    const [locations, setLocations] = useState([]);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loadingLocations, setLoadingLocations] = useState(true);
    const [successMessage, setSuccessMessage] = useState('');

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

    const validateForm = () => {
        const newErrors = {};

        if (!name.trim()) {
            newErrors.name = 'Pet name is required';
        } else if (name.trim().length < 2) {
            newErrors.name = 'Pet name must be at least 2 characters';
        }

        if (!species.trim()) {
            newErrors.species = 'Species is required';
        }

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

        if (!locationId) {
            newErrors.locationId = 'Please select a location';
        }

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
                await petsAPI.update(editingPetId, formData);
                setSuccessMessage('Pet updated successfully!');
            } else {
                await petsAPI.create(formData);
                setSuccessMessage('Pet added successfully!');
            }

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

    const handleDelete = async (petId) => {
        const pet = pets.find(p => p.pet_id === petId);
        if (!window.confirm(`Are you sure you want to delete ${pet?.name || 'this pet'}? This action cannot be undone.`)) {
            return;
        }

        try {
            await petsAPI.delete(petId);
            setSuccessMessage('Pet deleted successfully!');
            await loadPets();
        } catch (err) {
            console.error('Error deleting pet:', err);
            const errorMessage = err.response?.data?.detail || 'Failed to delete pet. Please try again.';
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
        setEditingPetId(null);
        setName('');
        setSpecies('');
        setAge('');
        setLocationId('');
        setDescription('');
        setPhoto(null);
        setCurrentPhotoUrl('');
        setErrors({});
    };

    const getLocationName = (locationId) => {
        const location = locations.find(l => l.location_id === locationId);
        return location?.name || 'Unknown';
    };

    if (loadingPets || loadingLocations) {
        return (
            <div className="container-narrow">
                <div className="text-center py-12">Loading...</div>
            </div>
        );
    }

    if (viewMode === 'list') {
        return (
            <div className="container-narrow">
                <h1 className="text-3xl mb-6">Manage Pets</h1>

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
                        data-cy="add-new-pet-button"
                    >
                        Add New Pet
                    </button>
                </div>

                <div className="panel overflow-x-auto">
                    <h2 className="text-xl font-bold mb-4">All Pets ({pets.length})</h2>

                    {pets.length === 0 ? (
                        <p className="text-[#B6C6DA]">No pets found. Add your first pet!</p>
                    ) : (
                        <table className="w-full">
                            <thead>
                            <tr className="border-b border-[#1b355e]">
                                <th className="text-left py-3 px-4 font-medium text-[#E6F1FF]">Photo</th>
                                <th className="text-left py-3 px-4 font-medium text-[#E6F1FF]">Name</th>
                                <th className="text-left py-3 px-4 font-medium text-[#E6F1FF]">Species</th>
                                <th className="text-left py-3 px-4 font-medium text-[#E6F1FF]">Age</th>
                                <th className="text-left py-3 px-4 font-medium text-[#E6F1FF]">Location</th>
                                <th className="text-left py-3 px-4 font-medium text-[#E6F1FF]">Status</th>
                                <th className="text-right py-3 px-4 font-medium text-[#E6F1FF]">Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {pets.map(pet => (
                                <tr key={pet.pet_id} className="border-b border-[#1b355e] last:border-b-0">
                                    <td className="py-3 px-4">
                                        {pet.photo_url ? (
                                            <img
                                                src={`${API_BASE_URL}/${pet.photo_url}`}
                                                alt={pet.name}
                                                className="w-16 h-16 object-cover rounded"
                                            />
                                        ) : (
                                            <div className="w-16 h-16 bg-[#152e56] rounded flex items-center justify-center text-[#B6C6DA] text-xs">
                                                No photo
                                            </div>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 font-medium">{pet.name}</td>
                                    <td className="py-3 px-4">{pet.species}</td>
                                    <td className="py-3 px-4">{pet.age} {pet.age === 1 ? 'yr' : 'yrs'}</td>
                                    <td className="py-3 px-4">{getLocationName(pet.location_id)}</td>
                                    <td className="py-3 px-4">
                                        <span className={`badge ${pet.status === 'approved' ? 'bg-green-900/30 text-green-400' : 'bg-yellow-900/30 text-yellow-400'}`}>
                                            {pet.status.charAt(0).toUpperCase() + pet.status.slice(1)}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        <button
                                            className="btn-sm bg-[#64FFDA] text-[#081424] mr-2"
                                            onClick={() => handleEdit(pet)}
                                            data-cy={`edit-pet-${pet.pet_id}`}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="btn-sm btn-danger"
                                            onClick={() => handleDelete(pet.pet_id)}
                                            data-cy={`delete-pet-${pet.pet_id}`}
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
            <h1 className="text-3xl mb-6">{viewMode === 'edit' ? 'Edit Pet' : 'Add Pet'}</h1>

            <div className="panel">
                {errors.submit && (
                    <div className="mb-4 p-3 bg-red-900/30 border border-red-500 text-red-400 rounded-xl">
                        {errors.submit}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="flex flex-wrap gap-4">
                        <div className="min-w-[240px] flex-1">
                            <label className="block mb-2 text-sm font-medium">Pet Name *</label>
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
                                <div className="text-red-400 text-sm mt-1" data-cy="pet-name-error">
                                    {errors.name}
                                </div>
                            )}
                        </div>

                        <div className="min-w-[240px] flex-1">
                            <label className="block mb-2 text-sm font-medium">Species *</label>
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
                                <div className="text-red-400 text-sm mt-1" data-cy="pet-species-error">
                                    {errors.species}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4 mt-4">
                        <div className="max-w-[200px] flex-1">
                            <label className="block mb-2 text-sm font-medium">Age (years) *</label>
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
                                <div className="text-red-400 text-sm mt-1" data-cy="pet-age-error">
                                    {errors.age}
                                </div>
                            )}
                        </div>

                        <div className="min-w-[240px] flex-1">
                            <label className="block mb-2 text-sm font-medium">Location *</label>
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
                                <div className="text-red-400 text-sm mt-1" data-cy="pet-location-error">
                                    {errors.locationId}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-4">
                        <label className="block mb-2 text-sm font-medium">Description</label>
                        <textarea
                            className="textarea"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows="4"
                            data-cy="pet-description-input"
                        />
                    </div>

                    <div className="flex flex-wrap gap-4 mt-4">
                        <div className="max-w-[400px] flex-1">
                            <label className="block mb-2 text-sm font-medium">Photo (Max {MAX_FILE_SIZE_MB}MB) {viewMode === 'edit' && '- Leave empty to keep current photo'}</label>
                            {viewMode === 'edit' && currentPhotoUrl && (
                                <div className="mb-2">
                                    <img
                                        src={`${API_BASE_URL}/${currentPhotoUrl}`}
                                        alt="Current"
                                        className="w-32 h-32 object-cover rounded border border-[#1b355e]"
                                    />
                                    <p className="text-sm text-[#B6C6DA] mt-1">Current photo</p>
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
                                <div className="text-red-400 text-sm mt-1" data-cy="pet-photo-error">
                                    {errors.photo}
                                </div>
                            )}
                            {photo && !errors.photo && (
                                <div className="text-sm text-[#B6C6DA] mt-1">
                                    Selected: {photo.name} ({(photo.size / 1024 / 1024).toFixed(2)}MB)
                                </div>
                            )}
                        </div>
                    </div>

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
        </div>
    );
}