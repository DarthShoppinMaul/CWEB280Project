// PetList.jsx
// Pet list page with favorite heart icons and filters

import React, {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {useAuth} from '../../context/AuthContext';

export default function PetList() {
    const {user} = useAuth();
    const navigate = useNavigate();

    // State
    const [pets, setPets] = useState([]);
    const [locations, setLocations] = useState([]);
    const [favorites, setFavorites] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        species: '',
        location: '',
        status: 'available',
        search: ''
    });

    // Sample data
    useEffect(() => {
        // Simulate API call
        setTimeout(() => {
            setPets([
                {
                    pet_id: 1,
                    name: 'Max',
                    species: 'Dog',
                    breed: 'Golden Retriever',
                    age: 3,
                    description: 'Friendly and energetic dog looking for an active family.',
                    photo_url: null,
                    adoption_status: 'available',
                    location_id: 1
                },
                {
                    pet_id: 2,
                    name: 'Luna',
                    species: 'Cat',
                    breed: 'Siamese',
                    age: 2,
                    description: 'Sweet and playful cat who loves cuddles.',
                    photo_url: null,
                    adoption_status: 'available',
                    location_id: 2
                },
                {
                    pet_id: 3,
                    name: 'Charlie',
                    species: 'Dog',
                    breed: 'Beagle',
                    age: 5,
                    description: 'Calm and gentle dog, great with kids.',
                    photo_url: null,
                    adoption_status: 'pending',
                    location_id: 1
                },
                {
                    pet_id: 4,
                    name: 'Bella',
                    species: 'Cat',
                    breed: 'Persian',
                    age: 4,
                    description: 'Elegant cat who enjoys quiet environments.',
                    photo_url: null,
                    adoption_status: 'available',
                    location_id: 2
                },
                {
                    pet_id: 5,
                    name: 'Rocky',
                    species: 'Dog',
                    breed: 'German Shepherd',
                    age: 6,
                    description: 'Loyal and protective, needs experienced owner.',
                    photo_url: null,
                    adoption_status: 'available',
                    location_id: 1
                },
                {
                    pet_id: 6,
                    name: 'Whiskers',
                    species: 'Cat',
                    breed: 'Tabby',
                    age: 1,
                    description: 'Young and curious kitten full of energy.',
                    photo_url: null,
                    adoption_status: 'adopted',
                    location_id: 2
                }
            ]);

            setLocations([
                {location_id: 1, name: 'Downtown Animal Shelter', city: 'Saskatoon'},
                {location_id: 2, name: 'Riverside Pet Adoption Center', city: 'Regina'}
            ]);

            // Simulate some favorites for logged-in users
            if (user) {
                setFavorites(new Set([1, 3]));
            }

            setLoading(false);
        }, 500);
    }, [user]);

    // Get location name
    const getLocationName = (locationId) => {
        const location = locations.find(l => l.location_id === locationId);
        return location ? location.name : 'Unknown';
    };

    // Toggle favorite
    const toggleFavorite = async (petId) => {
        if (!user) {
            alert('Please login to favorite pets');
            navigate('/login');
            return;
        }

        const newFavorites = new Set(favorites);
        if (newFavorites.has(petId)) {
            newFavorites.delete(petId);
        } else {
            newFavorites.add(petId);
        }
        setFavorites(newFavorites);

        // In real app, would call API here
        console.log('Toggled favorite for pet', petId);
    };

    // Get status badge color
    const getStatusBadge = (status) => {
        const styles = {
            available: 'bg-green-900/30 text-green-400 border-green-500',
            pending: 'bg-yellow-900/30 text-yellow-400 border-yellow-500',
            adopted: 'bg-gray-600/30 text-gray-400 border-gray-500'
        };

        return (
            <span className={`inline-block px-3 py-1 text-xs rounded-full border ${styles[status]}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    // Filter pets
    const filteredPets = pets.filter(pet => {
        if (filters.species && pet.species !== filters.species) return false;
        if (filters.location && pet.location_id.toString() !== filters.location) return false;
        if (filters.status && pet.adoption_status !== filters.status) return false;
        if (filters.search && !pet.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
        return true;
    });

    if (loading) {
        return (
            <div className="container-narrow">
                <div className="text-center py-8">Loading pets...</div>
            </div>
        );
    }

    return (
        <div className="container-narrow">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl">Adoptable Pets</h1>
                {user?.is_admin && (
                    <button onClick={() => navigate('/add-pet')} className="btn">
                        Add New Pet
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="panel mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Search */}
                    <input
                        type="text"
                        placeholder="Search by name..."
                        className="input"
                        value={filters.search}
                        onChange={(e) => setFilters({...filters, search: e.target.value})}
                    />

                    {/* Species filter */}
                    <select
                        className="input"
                        value={filters.species}
                        onChange={(e) => setFilters({...filters, species: e.target.value})}
                    >
                        <option value="">All Species</option>
                        <option value="Dog">Dogs</option>
                        <option value="Cat">Cats</option>
                    </select>

                    {/* Location filter */}
                    <select
                        className="input"
                        value={filters.location}
                        onChange={(e) => setFilters({...filters, location: e.target.value})}
                    >
                        <option value="">All Locations</option>
                        {locations.map(loc => (
                            <option key={loc.location_id} value={loc.location_id}>
                                {loc.name}
                            </option>
                        ))}
                    </select>

                    {/* Status filter */}
                    <select
                        className="input"
                        value={filters.status}
                        onChange={(e) => setFilters({...filters, status: e.target.value})}
                    >
                        <option value="">All Statuses</option>
                        <option value="available">Available</option>
                        <option value="pending">Pending</option>
                        <option value="adopted">Adopted</option>
                    </select>
                </div>
            </div>

            {/* Pet Grid */}
            {filteredPets.length === 0 ? (
                <div className="text-center py-8 text-[#B6C6DA]">
                    No pets found matching your filters.
                </div>
            ) : (
                <div className="grid-pets">
                    {filteredPets.map(pet => (
                        <div key={pet.pet_id} className="card relative">
                            {/* Favorite heart icon - top right corner */}
                            {user && (
                                <button
                                    onClick={() => toggleFavorite(pet.pet_id)}
                                    className="absolute top-3 right-3 z-10 w-10 h-10 flex items-center justify-center bg-[#0A192F]/80 backdrop-blur-sm rounded-full border border-[#1b355e] hover:bg-[#112240] transition-colors"
                                    title={favorites.has(pet.pet_id) ? 'Remove from favorites' : 'Add to favorites'}
                                >
                                    {favorites.has(pet.pet_id) ? (
                                        // Filled heart
                                        <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                                        </svg>
                                    ) : (
                                        // Outline heart
                                        <svg className="w-5 h-5 text-[#64FFDA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                        </svg>
                                    )}
                                </button>
                            )}

                            {/* Pet photo */}
                            <div
                                className="card-img"
                                style={{
                                    backgroundImage: pet.photo_url
                                        ? `url(http://localhost:8000/${pet.photo_url})`
                                        : undefined
                                }}
                            />

                            {/* Pet info */}
                            <div className="card-body">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="font-semibold text-lg">{pet.name}</div>
                                    {getStatusBadge(pet.adoption_status)}
                                </div>

                                <div className="meta mb-2">
                                    {pet.species} • {pet.breed} • {pet.age} {pet.age === 1 ? 'yr' : 'yrs'}
                                </div>

                                <div className="pill mb-2" title={getLocationName(pet.location_id)}>
                                    {getLocationName(pet.location_id)}
                                </div>

                                <div className="desc mb-3">
                                    {pet.description}
                                </div>

                                <div className="card-actions">
                                    {user?.is_admin && (
                                        <>
                                            <button
                                                className="btn-secondary text-sm px-3 py-1.5"
                                                onClick={() => navigate(`/edit-pet/${pet.pet_id}`)}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                className="btn-danger text-sm px-3 py-1.5 ml-2"
                                                onClick={() => {
                                                    if (confirm(`Delete ${pet.name}?`)) {
                                                        console.log('Delete pet', pet.pet_id);
                                                    }
                                                }}
                                            >
                                                Delete
                                            </button>
                                        </>
                                    )}
                                    <button
                                        className="btn text-sm px-3 py-1.5 ml-auto"
                                        onClick={() => navigate(`/pet/${pet.pet_id}`)}
                                    >
                                        View Details
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}