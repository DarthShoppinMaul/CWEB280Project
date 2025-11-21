// PetList.jsx
// Pet list page with favorite heart icons and filters
// Fetches data from backend API

import React, {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {useAuth} from '../../context/AuthContext.jsx';
import {petsAPI, locationsAPI} from '../../services/api.js';

export default function PetList() {
    const {user} = useAuth();
    const navigate = useNavigate();

    // State
    const [pets, setPets] = useState([]);
    const [locations, setLocations] = useState([]);
    const [favorites, setFavorites] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        species: '',
        location: '',
        status: '',
        search: ''
    });

    // Load data from API on mount
    useEffect(() => {
        loadData();
    }, []);

    // Function: Load pets and locations from API
    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch both pets and locations in parallel (faster than sequential)
            const [petsData, locationsData] = await Promise.all([
                petsAPI.list(),      // Get all pets
                locationsAPI.list(), // Get all locations
            ]);

            setPets(petsData);
            setLocations(locationsData);


            // For now, using localStorage to persist favorites
            if (user) {
                const savedFavorites = localStorage.getItem(`favorites_${user.user_id}`);
                if (savedFavorites) {
                    setFavorites(new Set(JSON.parse(savedFavorites)));
                }
            }
        } catch (err) {
            console.error('Error loading data:', err);
            setError('Failed to load pets. Please make sure the API server is running.');
        } finally {
            setLoading(false);
        }
    };

    // Get location name from location ID
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

        // Save favorites to localStorage (in real app, would save to backend)
        localStorage.setItem(`favorites_${user.user_id}`, JSON.stringify([...newFavorites]));
    };

    // Get status badge color
    const getStatusBadge = (status) => {
        const styles = {
            approved: 'bg-green-900/30 text-green-400 border-green-500',
            pending: 'bg-yellow-900/30 text-yellow-400 border-yellow-500',
            adopted: 'bg-gray-600/30 text-gray-400 border-gray-500'
        };

        const displayStatus = status.charAt(0).toUpperCase() + status.slice(1);

        return (
            <span className={`inline-block px-3 py-1 text-xs rounded-full border ${styles[status] || styles.pending}`}>
                {displayStatus}
            </span>
        );
    };

    // Filter pets based on selected filters
    const filteredPets = pets.filter(pet => {
        // Species filter
        if (filters.species && pet.species.toLowerCase() !== filters.species.toLowerCase()) return false;

        // Location filter
        if (filters.location && pet.location_id.toString() !== filters.location) return false;

        // Status filter
        if (filters.status && pet.status !== filters.status) return false;

        // Search filter (searches in pet name)
        if (filters.search && !pet.name.toLowerCase().includes(filters.search.toLowerCase())) return false;

        return true;
    });

    // Get unique species from pets for filter dropdown
    const uniqueSpecies = [...new Set(pets.map(p => p.species))].sort();

    // Loading state
    if (loading) {
        return (
            <div className="container-narrow">
                <div className="text-center py-8">Loading pets...</div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="container-narrow">
                <div className="text-center py-8">
                    <div className="text-red-500 mb-4">{error}</div>
                    <button onClick={loadData} className="btn">
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container-narrow">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl">Adoptable Pets</h1>
                {user?.is_admin && (
                    <button onClick={() => navigate('/admin/manage-pets')} className="btn">
                        Manage Pets
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
                        {uniqueSpecies.map(species => (
                            <option key={species} value={species}>
                                {species}
                            </option>
                        ))}
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
                        <option value="approved">Approved</option>
                        <option value="pending">Pending</option>
                    </select>
                </div>
            </div>

            {/* Pet Grid */}
            {filteredPets.length === 0 ? (
                <div className="text-center py-8 text-[#B6C6DA]">
                    {pets.length === 0
                        ? 'No pets available yet. Check back soon!'
                        : 'No pets found matching your filters.'}
                </div>
            ) : (
                <div className="grid-pets">
                    {filteredPets.map(pet => (
                        <div key={pet.pet_id} className="card relative" data-cy="pet-card">
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
                                        ? `url(${API_BASE_URL}/${pet.photo_url})`
                                        : undefined
                                }}
                            />

                            {/* Pet info */}
                            <div className="card-body">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="font-semibold text-lg">{pet.name}</div>
                                    {getStatusBadge(pet.status)}
                                </div>

                                <div className="meta mb-2">
                                    {pet.species} • {pet.age} {pet.age === 1 ? 'yr' : 'yrs'}
                                </div>

                                <div className="pill mb-2" title={getLocationName(pet.location_id)}>
                                    {getLocationName(pet.location_id)}
                                </div>

                                <div className="desc mb-3">
                                    {pet.description || 'No description available'}
                                </div>

                                <div className="card-actions">
                                    <button
                                        className="btn text-sm px-3 py-1.5"
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

// Import API_BASE_URL from api.js
const API_BASE_URL = 'http://localhost:8000';