// Home.jsx
// Public home page that displays approved pets
// No authentication required - anyone can view this page

import React, {useEffect, useState} from 'react';
import {petsAPI, locationsAPI} from '../../services/api';

export default function Home() {
    //  STATE MANAGEMENT
    // Array of all pets from database
    const [pets, setPets] = useState([]);

    // Array of all locations from database
    const [locations, setLocations] = useState([]);

    // Loading state - true while fetching data
    const [loading, setLoading] = useState(true);

    // Error message if data fetch fails
    const [error, setError] = useState(null);

    //  LOAD DATA
    // useEffect runs when component first renders
    useEffect(() => {
        loadData();
    }, []); // Empty array means run only once on mount

    // Function: Load pets and locations from API
    const loadData = async () => {
        try {
            setLoading(true);  // Show loading state

            // Fetch both pets and locations in parallel (faster than sequential)
            const [petsData, locationsData] = await Promise.all([
                petsAPI.list(),      // Get all pets
                locationsAPI.list(), // Get all locations
            ]);

            // Update state with fetched data
            setPets(petsData);
            setLocations(locationsData);
        } catch (err) {
            // If API call fails, set error message
            setError('Failed to load data. Please make sure the API server is running.');
            console.error('Error loading data:', err);
        } finally {
            // Always set loading to false when done (success or error)
            setLoading(false);
        }
    };

    // Helper function: Get location name from location ID
    // Looks up location in locations array and returns name
    const getLocationName = (locationId) => {
        const location = locations.find(l => l.location_id === locationId);
        return location?.name || 'Unknown';
    };

    // Filter pets to only show approved ones (not pending)
    const approvedPets = pets.filter(p => p.status === 'approved');

    // LOADING STATE
    // Show loading message while data is being fetched
    if (loading) {
        return (
            <div className="text-center py-8">
                <div className="text-lg">Loading pets...</div>
            </div>
        );
    }

    //  ERROR STATE
    // Show error message if data fetch failed
    if (error) {
        return (
            <div className="text-center py-8">
                <div className="text-red-500 mb-4">{error}</div>
                {/* Try Again button to retry loading */}
                <button onClick={loadData} className="btn">
                    Try Again
                </button>
            </div>
        );
    }

    //  MAIN CONTENT
    return (
        <>
            <h1 className="text-3xl mb-2">Adoptable Pets</h1>

            {/* If no approved pets, show message */}
            {approvedPets.length === 0 ? (
                <div className="text-center py-8 text-gray-600">
                    No approved pets available for adoption yet.
                </div>
            ) : (
                // Show grid of pet cards
                <div className="grid-pets" data-cy="pets-grid">
                    {/* Map over approved pets and create a card for each */}
                    {approvedPets.map(pet => (
                        <div key={pet.pet_id} className="card" data-cy="pet-card">
                            {/* Pet photo (if available) */}
                            <div
                                className="card-img"
                                style={{
                                    // If pet has photo, use it as background image
                                    backgroundImage: pet.photo_url
                                        ? `url(http://localhost:8000/${pet.photo_url})`
                                        : undefined  // Otherwise use default from CSS
                                }}
                            />

                            {/* Pet info */}
                            <div className="card-body">
                                {/* Pet name */}
                                <div className="font-semibold" data-cy="pet-name">
                                    {pet.name}
                                </div>

                                {/* Species and age */}
                                <div className="meta">
                                    {pet.species} • {pet.age} {pet.age === 1 ? 'yr' : 'yrs'}
                                </div>

                                {/* Location (where pet can be adopted) */}
                                <div className="pill" title={getLocationName(pet.location_id)}>
                                    {getLocationName(pet.location_id)}
                                </div>

                                {/* Pet description */}
                                <div className="desc">
                                    {pet.description || ''}
                                </div>

                                {/* View button */}
                                <div className="card-actions">
                                    <button
                                        className="btn"
                                        onClick={() => alert(`${pet.name} — ${pet.description || 'No description'}`)}
                                    >
                                        View
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}