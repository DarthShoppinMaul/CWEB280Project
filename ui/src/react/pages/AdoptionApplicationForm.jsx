// AdoptionApplicationForm.jsx
// Form for users to apply to adopt a pet

import React, {useEffect, useState} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {useAuth} from '../../context/AuthContext';
import {applicationsAPI} from '../../services/api';

export default function AdoptionApplicationForm() {
    const {petId} = useParams();
    const {user} = useAuth();
    const navigate = useNavigate();

    const [pet, setPet] = useState(null);
    const [formData, setFormData] = useState({
        applicationMessage: '',
        contactPhone: user?.phone || '',
        livingSituation: '',
        hasOtherPets: false,
        otherPetsDetails: ''
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        // Load pet data
        setTimeout(() => {
            setPet({
                pet_id: parseInt(petId),
                name: 'Max',
                species: 'Dog',
                breed: 'Golden Retriever',
                age: 3,
                photo_url: null
            });
            setLoading(false);
        }, 300);
    }, [petId, user, navigate]);

    const handleChange = (e) => {
        const {name, value, type, checked} = e.target;
        const newValue = type === 'checkbox' ? checked : value;

        setFormData(prev => ({...prev, [name]: newValue}));

        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({...prev, [name]: undefined}));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.applicationMessage.trim()) {
            newErrors.applicationMessage = 'Please tell us why you want to adopt this pet';
        } else if (formData.applicationMessage.length < 50) {
            newErrors.applicationMessage = 'Please provide more details (at least 50 characters)';
        }

        if (!formData.contactPhone.trim()) {
            newErrors.contactPhone = 'Contact phone is required';
        } else if (!/^\+?[\d\s\-()]+$/.test(formData.contactPhone)) {
            newErrors.contactPhone = 'Please enter a valid phone number';
        }

        if (!formData.livingSituation) {
            newErrors.livingSituation = 'Please select your living situation';
        }

        if (formData.hasOtherPets && !formData.otherPetsDetails.trim()) {
            newErrors.otherPetsDetails = 'Please provide details about your other pets';
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
            // Prepare application data
            const applicationData = {
                pet_id: parseInt(petId),
                application_message: formData.applicationMessage,
                contact_phone: formData.contactPhone,
                living_situation: formData.livingSituation,
                has_other_pets: formData.hasOtherPets,
                other_pets_details: formData.hasOtherPets ? formData.otherPetsDetails : null
            };

            // Submit application to backend
            await applicationsAPI.create(applicationData);

            // Show success and redirect
            alert('Application submitted successfully!');
            navigate('/my-applications');
        } catch (error) {
            console.error('Error submitting application:', error);
            const errorMessage = error.response?.data?.detail || 'Failed to submit application. Please try again.';
            setErrors({submit: errorMessage});
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="container-narrow">
                <div className="text-center py-8">Loading...</div>
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
        <div className="container-narrow max-w-3xl">
            <button
                onClick={() => navigate(-1)}
                className="mb-4 text-[#64FFDA] hover:underline flex items-center gap-2"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back
            </button>

            <h1 className="text-3xl mb-6">Adoption Application</h1>

            {/* Pet Summary */}
            <div className="panel mb-6">
                <div className="flex items-center gap-4">
                    <div
                        className="w-24 h-24 bg-[#152e56] rounded-xl bg-cover bg-center flex-shrink-0"
                        style={{
                            backgroundImage: pet.photo_url
                                ? `url(http://localhost:8000/${pet.photo_url})`
                                : undefined
                        }}
                    />
                    <div>
                        <h2 className="text-xl font-semibold mb-1">{pet.name}</h2>
                        <div className="text-[#B6C6DA]">
                            {pet.species} • {pet.breed} • {pet.age} {pet.age === 1 ? 'year' : 'years'} old
                        </div>
                    </div>
                </div>
            </div>

            {/* Application Form */}
            <div className="panel">
                {/* Submit Error */}
                {errors.submit && (
                    <div className="mb-4 p-3 bg-red-900/30 border border-red-500 text-red-400 rounded-xl">
                        {errors.submit}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* Why adopt */}
                    <div className="mb-6">
                        <label className="block mb-2 text-sm font-medium">
                            Why do you want to adopt {pet.name}? *
                        </label>
                        <textarea
                            name="applicationMessage"
                            className={`textarea w-full ${errors.applicationMessage ? 'border-red-500' : ''}`}
                            rows="6"
                            value={formData.applicationMessage}
                            onChange={handleChange}
                            disabled={isSubmitting}
                            placeholder="Tell us about yourself, your home environment, and why you think you'd be a great match for this pet..."
                        />
                        <div className="flex justify-between items-center mt-1">
                            {errors.applicationMessage && (
                                <div className="text-red-400 text-sm">{errors.applicationMessage}</div>
                            )}
                            <div className="text-xs text-[#B6C6DA] ml-auto">
                                {formData.applicationMessage.length} characters (minimum 50)
                            </div>
                        </div>
                    </div>

                    {/* Contact Phone */}
                    <div className="mb-6">
                        <label className="block mb-2 text-sm font-medium">
                            Contact Phone Number *
                        </label>
                        <input
                            type="tel"
                            name="contactPhone"
                            className={`input w-full ${errors.contactPhone ? 'border-red-500' : ''}`}
                            value={formData.contactPhone}
                            onChange={handleChange}
                            disabled={isSubmitting}
                            placeholder="+1 (555) 123-4567"
                            data-cy="applicant-phone-input"
                        />
                        {errors.contactPhone && (
                            <div className="text-red-400 text-sm mt-1">{errors.contactPhone}</div>
                        )}
                    </div>

                    {/* Living Situation */}
                    <div className="mb-6">
                        <label className="block mb-2 text-sm font-medium">
                            Living Situation *
                        </label>
                        <select
                            name="livingSituation"
                            className={`input w-full ${errors.livingSituation ? 'border-red-500' : ''}`}
                            value={formData.livingSituation}
                            onChange={handleChange}
                            disabled={isSubmitting}
                            data-cy="housing-type-select"
                        >
                            <option value="">Select your living situation</option>
                            <option value="house">House (owned)</option>
                            <option value="house-rented">House (rented)</option>
                            <option value="apartment">Apartment</option>
                            <option value="condo">Condo</option>
                            <option value="townhouse">Townhouse</option>
                            <option value="other">Other</option>
                        </select>
                        {errors.livingSituation && (
                            <div className="text-red-400 text-sm mt-1">{errors.livingSituation}</div>
                        )}
                    </div>

                    {/* Has Other Pets */}
                    <div className="mb-6">
                        <label className="flex items-center cursor-pointer mb-3">
                            <input
                                type="checkbox"
                                name="hasOtherPets"
                                checked={formData.hasOtherPets}
                                onChange={handleChange}
                                className="w-4 h-4 rounded border-[#3a5a86] bg-[#143058] text-[#64FFDA] focus:ring-2 focus:ring-[#64FFDA] focus:ring-offset-0"
                                disabled={isSubmitting}
                            />
                            <span className="ml-2 text-sm font-medium">
                                I currently have other pets
                            </span>
                        </label>

                        {formData.hasOtherPets && (
                            <div>
                                <label className="block mb-2 text-sm">
                                    Please provide details about your other pets *
                                </label>
                                <textarea
                                    name="otherPetsDetails"
                                    className={`textarea w-full ${errors.otherPetsDetails ? 'border-red-500' : ''}`}
                                    rows="3"
                                    value={formData.otherPetsDetails}
                                    onChange={handleChange}
                                    disabled={isSubmitting}
                                    placeholder="Tell us about your current pets (type, age, temperament, etc.)"
                                />
                                {errors.otherPetsDetails && (
                                    <div className="text-red-400 text-sm mt-1">{errors.otherPetsDetails}</div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Info Notice */}
                    <div className="bg-[#233554] border border-[#3a5a86] rounded-xl p-4 mb-6">
                        <div className="flex gap-3">
                            <svg className="w-5 h-5 text-[#64FFDA] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="text-sm text-[#E6F1FF]">
                                <p className="font-medium mb-1">What happens next?</p>
                                <p className="text-[#B6C6DA]">
                                    After you submit this application, our team will review it and contact you within 2-3 business days.
                                    We may arrange a meet-and-greet with {pet.name} if your application is approved.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="btn-secondary flex-1"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn flex-1"
                            disabled={isSubmitting}
                            data-cy="submit-application-button"
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Application'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}