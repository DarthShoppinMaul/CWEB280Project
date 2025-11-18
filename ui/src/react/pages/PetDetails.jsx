// PetDetails.jsx
// Pet details page with favorite heart and apply to adopt functionality

import React, {useEffect, useState} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {useAuth} from '../../context/AuthContext';

export default function PetDetails() {
    const {id} = useParams();
    const {user} = useAuth();
    const navigate = useNavigate();

    const [pet, setPet] = useState(null);
    const [location, setLocation] = useState(null);
    const [isFavorited, setIsFavorited] = useState(false);
    const [hasApplied, setHasApplied] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate API call
        setTimeout(() => {
            // Sample pet data
            const petData = {
                pet_id: parseInt(id),
                name: 'Max',
                species: 'Dog',
                breed: 'Golden Retriever',
                age: 3,
                description: 'Max is a wonderful, friendly Golden Retriever who loves to play fetch and go for long walks. He is great with children and other dogs. Max is house-trained and knows basic commands. He would make a perfect addition to an active family who can give him plenty of exercise and attention. Max has been vaccinated, neutered, and is in excellent health.',
                photo_url: null,
                adoption_status: 'available',
                location_id: 1,
                created_at: '2024-10-15'
            };

            const locationData = {
                location_id: 1,
                name: 'Downtown Animal Shelter',
                address: '123 Main Street',
                city: 'Saskatoon',
                phone: '(306) 555-0123',
                email: 'info@downtownshelter.ca'
            };

            setPet(petData);
            setLocation(locationData);

            // Simulate checking if user has favorited or applied
            if (user) {
                setIsFavorited(Math.random() > 0.5);
                setHasApplied(Math.random() > 0.7);
            }

            setLoading(false);
        }, 500);
    }, [id, user]);

    const toggleFavorite = async () => {
        if (!user) {
            alert('Please login to favorite pets');
            navigate('/login');
            return;
        }

        setIsFavorited(!isFavorited);
        console.log('Toggled favorite');
    };

    const handleApplyToAdopt = () => {
        if (!user) {
            alert('Please login to apply for adoption');
            navigate('/login');
            return;
        }

        navigate(`/apply/${pet.pet_id}`);
    };

    const getStatusBadge = (status) => {
        const styles = {
            available: 'bg-green-900/30 text-green-400 border-green-500',
            pending: 'bg-yellow-900/30 text-yellow-400 border-yellow-500',
            adopted: 'bg-gray-600/30 text-gray-400 border-gray-500'
        };

        return (
            <span className={`inline-block px-4 py-2 text-sm rounded-full border ${styles[status]}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="container-narrow">
                <div className="text-center py-8">Loading pet details...</div>
            </div>
        );
    }

    if (!pet) {
        return (
            <div className="container-narrow">
                <div className="text-center py-8 text-red-400">Pet not found</div>
            </div>
        );
    }

    return (
        <div className="container-narrow">
            <button
                onClick={() => navigate(-1)}
                className="mb-4 text-[#64FFDA] hover:underline flex items-center gap-2"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to List
            </button>

            <div className="panel">
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Left column - Photo */}
                    <div className="relative">
                        <div
                            className="w-full h-96 bg-[#152e56] rounded-xl bg-cover bg-center"
                            style={{
                                backgroundImage: pet.photo_url
                                    ? `url(http://localhost:8000/${pet.photo_url})`
                                    : undefined
                            }}
                        />

                        {/* Favorite heart button */}
                        {user && (
                            <button
                                onClick={toggleFavorite}
                                className="absolute top-4 right-4 w-12 h-12 flex items-center justify-center bg-[#0A192F]/80 backdrop-blur-sm rounded-full border border-[#1b355e] hover:bg-[#112240] transition-colors"
                            >
                                {isFavorited ? (
                                    <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                                    </svg>
                                ) : (
                                    <svg className="w-6 h-6 text-[#64FFDA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                )}
                            </button>
                        )}
                    </div>

                    {/* Right column - Details */}
                    <div className="flex flex-col">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h1 className="text-3xl font-bold mb-2">{pet.name}</h1>
                                <div className="text-lg text-[#B6C6DA]">
                                    {pet.species} • {pet.breed} • {pet.age} {pet.age === 1 ? 'year' : 'years'} old
                                </div>
                            </div>
                            {getStatusBadge(pet.adoption_status)}
                        </div>

                        <div className="mb-6">
                            <h2 className="text-xl font-semibold mb-2">About {pet.name}</h2>
                            <p className="text-[#B6C6DA] leading-relaxed">
                                {pet.description}
                            </p>
                        </div>

                        {location && (
                            <div className="mb-6">
                                <h2 className="text-xl font-semibold mb-2">Location</h2>
                                <div className="bg-[#0A192F] rounded-xl p-4 border border-[#1b355e]">
                                    <div className="font-medium mb-1">{location.name}</div>
                                    <div className="text-[#B6C6DA] text-sm mb-1">
                                        {location.address}, {location.city}
                                    </div>
                                    <div className="text-[#B6C6DA] text-sm">
                                        Phone: {location.phone}
                                    </div>
                                    <div className="text-[#B6C6DA] text-sm">
                                        Email: {location.email}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Action buttons */}
                        <div className="mt-auto space-y-3">
                            {user && pet.adoption_status === 'available' && (
                                <>
                                    {hasApplied ? (
                                        <div className="bg-yellow-900/30 border border-yellow-500 rounded-xl p-4 text-yellow-400 text-center">
                                            You have already submitted an application for {pet.name}
                                        </div>
                                    ) : (
                                        <button
                                            onClick={handleApplyToAdopt}
                                            className="btn w-full text-lg py-3"
                                        >
                                            Apply to Adopt {pet.name}
                                        </button>
                                    )}
                                </>
                            )}

                            {!user && pet.adoption_status === 'available' && (
                                <button
                                    onClick={() => navigate('/login')}
                                    className="btn w-full text-lg py-3"
                                >
                                    Login to Apply
                                </button>
                            )}

                            {pet.adoption_status === 'pending' && (
                                <div className="bg-yellow-900/30 border border-yellow-500 rounded-xl p-4 text-yellow-400 text-center">
                                    This pet has a pending adoption application
                                </div>
                            )}

                            {pet.adoption_status === 'adopted' && (
                                <div className="bg-gray-600/30 border border-gray-500 rounded-xl p-4 text-gray-400 text-center">
                                    This pet has been adopted
                                </div>
                            )}

                            {user?.is_admin && (
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => navigate(`/edit-pet/${pet.pet_id}`)}
                                        className="btn-secondary flex-1"
                                    >
                                        Edit Pet
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (confirm(`Delete ${pet.name}?`)) {
                                                console.log('Delete pet');
                                                navigate('/pets');
                                            }
                                        }}
                                        className="btn-danger flex-1"
                                    >
                                        Delete Pet
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}