// ApplicationReview.jsx
// Admin page to review and approve/reject adoption applications

import React, {useEffect, useState} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {useAuth} from '../../context/AuthContext';

export default function ApplicationReview() {
    const {id} = useParams();
    const {user} = useAuth();
    const navigate = useNavigate();

    const [application, setApplication] = useState(null);
    const [adminNotes, setAdminNotes] = useState('');
    const [updatePetStatus, setUpdatePetStatus] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.is_admin) {
            navigate('/');
            return;
        }

        // Simulate API call
        setTimeout(() => {
            setApplication({
                application_id: parseInt(id),
                user: {
                    user_id: 5,
                    display_name: 'John Smith',
                    email: 'john.smith@email.com',
                    phone: '(306) 555-0123'
                },
                pet: {
                    pet_id: 1,
                    name: 'Max',
                    species: 'Dog',
                    breed: 'Golden Retriever',
                    age: 3,
                    adoption_status: 'available',
                    photo_url: null
                },
                status: 'pending',
                application_message: 'I have always wanted a Golden Retriever. I have a large backyard with a secure fence, and I work from home so I can provide constant companionship. I have experience with dogs and understand the time and financial commitment required. Max would be joining a loving home where he would get plenty of exercise, training, and affection.',
                contact_phone: '(306) 555-0123',
                living_situation: 'house',
                has_other_pets: false,
                other_pets_details: '',
                application_date: '2024-11-01',
                admin_notes: ''
            });

            setAdminNotes('');
            setLoading(false);
        }, 500);
    }, [id, user, navigate]);

    const handleApprove = async () => {
        if (!confirm(`Approve application for ${application.pet.name}?`)) {
            return;
        }

        setIsSubmitting(true);

        // Simulate API call
        setTimeout(() => {
            console.log('Approved application', id);
            console.log('Admin notes:', adminNotes);
            console.log('Update pet status:', updatePetStatus);
            alert('Application approved successfully!');
            navigate('/admin/dashboard');
        }, 1000);
    };

    const handleReject = async () => {
        if (!adminNotes.trim()) {
            alert('Please add admin notes explaining the rejection reason.');
            return;
        }

        if (!confirm(`Reject application for ${application.pet.name}?`)) {
            return;
        }

        setIsSubmitting(true);

        // Simulate API call
        setTimeout(() => {
            console.log('Rejected application', id);
            console.log('Admin notes:', adminNotes);
            alert('Application rejected.');
            navigate('/admin/dashboard');
        }, 1000);
    };

    const handleSaveNotes = async () => {
        setIsSubmitting(true);

        // Simulate API call
        setTimeout(() => {
            console.log('Saved notes:', adminNotes);
            alert('Notes saved successfully!');
            setIsSubmitting(false);
        }, 500);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getStatusBadge = (status) => {
        const styles = {
            available: 'bg-green-900/30 text-green-400 border-green-500',
            pending: 'bg-yellow-900/30 text-yellow-400 border-yellow-500',
            adopted: 'bg-gray-600/30 text-gray-400 border-gray-500'
        };

        return (
            <span className={`inline-block px-3 py-1.5 text-sm rounded-full border ${styles[status]}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="container-narrow">
                <div className="text-center py-8">Loading application...</div>
            </div>
        );
    }

    if (!application) {
        return (
            <div className="container-narrow">
                <div className="text-center py-8 text-red-400">Application not found</div>
            </div>
        );
    }

    return (
        <div className="container-narrow max-w-4xl">
            <button
                onClick={() => navigate('/admin/dashboard')}
                className="mb-4 text-[#64FFDA] hover:underline flex items-center gap-2"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Dashboard
            </button>

            <h1 className="text-3xl mb-6">Review Adoption Application</h1>

            {/* Application Status */}
            {application.status !== 'pending' && (
                <div className={`panel mb-6 border-2 ${
                    application.status === 'approved' ? 'border-green-500' : 'border-red-500'
                }`}>
                    <div className="text-center">
                        <div className={`text-lg font-semibold mb-2 ${
                            application.status === 'approved' ? 'text-green-400' : 'text-red-400'
                        }`}>
                            This application has been {application.status}
                        </div>
                        {application.reviewed_at && (
                            <div className="text-sm text-[#B6C6DA]">
                                Reviewed on {formatDate(application.reviewed_at)}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
                {/* Left Column - Pet & Applicant Info */}
                <div className="space-y-6">
                    {/* Pet Information */}
                    <div className="panel">
                        <h2 className="text-xl font-semibold mb-4">Pet Information</h2>
                        <div className="flex gap-4">
                            <div
                                className="w-24 h-24 bg-[#152e56] rounded-xl bg-cover bg-center flex-shrink-0"
                                style={{
                                    backgroundImage: application.pet.photo_url
                                        ? `url(http://localhost:8000/${application.pet.photo_url})`
                                        : undefined
                                }}
                            />
                            <div>
                                <h3 className="text-lg font-semibold mb-1">{application.pet.name}</h3>
                                <div className="text-[#B6C6DA] text-sm mb-2">
                                    {application.pet.species} • {application.pet.breed} • {application.pet.age} years old
                                </div>
                                {getStatusBadge(application.pet.adoption_status)}
                            </div>
                        </div>
                        <button
                            onClick={() => navigate(`/pet/${application.pet.pet_id}`)}
                            className="btn-secondary w-full mt-4 text-sm"
                        >
                            View Full Pet Profile
                        </button>
                    </div>

                    {/* Applicant Information */}
                    <div className="panel">
                        <h2 className="text-xl font-semibold mb-4">Applicant Information</h2>
                        <div className="space-y-3">
                            <div>
                                <div className="text-sm text-[#B6C6DA] mb-1">Name</div>
                                <div className="font-medium">{application.user.display_name}</div>
                            </div>
                            <div>
                                <div className="text-sm text-[#B6C6DA] mb-1">Email</div>
                                <div className="font-medium">{application.user.email}</div>
                            </div>
                            <div>
                                <div className="text-sm text-[#B6C6DA] mb-1">Phone</div>
                                <div className="font-medium">{application.contact_phone}</div>
                            </div>
                            <div>
                                <div className="text-sm text-[#B6C6DA] mb-1">Living Situation</div>
                                <div className="font-medium capitalize">{application.living_situation.replace('-', ' ')}</div>
                            </div>
                            <div>
                                <div className="text-sm text-[#B6C6DA] mb-1">Other Pets</div>
                                <div className="font-medium">{application.has_other_pets ? 'Yes' : 'No'}</div>
                                {application.has_other_pets && application.other_pets_details && (
                                    <div className="text-sm text-[#B6C6DA] mt-1">{application.other_pets_details}</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Application Details & Actions */}
                <div className="space-y-6">
                    {/* Application Message */}
                    <div className="panel">
                        <h2 className="text-xl font-semibold mb-4">Why They Want to Adopt</h2>
                        <div className="text-[#B6C6DA] leading-relaxed">
                            {application.application_message}
                        </div>
                        <div className="text-sm text-[#B6C6DA] mt-4">
                            Applied on {formatDate(application.application_date)}
                        </div>
                    </div>

                    {/* Admin Notes */}
                    <div className="panel">
                        <h2 className="text-xl font-semibold mb-4">Admin Notes (Internal)</h2>
                        <textarea
                            className="textarea w-full"
                            rows="4"
                            value={adminNotes}
                            onChange={(e) => setAdminNotes(e.target.value)}
                            placeholder="Add internal notes about this application..."
                            disabled={isSubmitting}
                        />
                        <button
                            onClick={handleSaveNotes}
                            className="btn-secondary w-full mt-3"
                            disabled={isSubmitting}
                        >
                            Save Notes
                        </button>
                    </div>

                    {/* Actions */}
                    {application.status === 'pending' && (
                        <div className="panel">
                            <h2 className="text-xl font-semibold mb-4">Review Actions</h2>

                            {/* Update Pet Status Option */}
                            <label className="flex items-start cursor-pointer mb-4 p-3 bg-[#0A192F] rounded-xl">
                                <input
                                    type="checkbox"
                                    checked={updatePetStatus}
                                    onChange={(e) => setUpdatePetStatus(e.target.checked)}
                                    className="w-4 h-4 mt-1 rounded border-[#3a5a86] bg-[#143058] text-[#64FFDA] focus:ring-2 focus:ring-[#64FFDA] focus:ring-offset-0"
                                    disabled={isSubmitting}
                                />
                                <span className="ml-3">
                                    <div className="font-medium mb-1">Update pet status to "Pending"</div>
                                    <div className="text-sm text-[#B6C6DA]">
                                        Mark {application.pet.name} as pending adoption when approving
                                    </div>
                                </span>
                            </label>

                            <div className="space-y-3">
                                <button
                                    onClick={handleApprove}
                                    className="btn w-full"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Processing...' : 'Approve Application'}
                                </button>
                                <button
                                    onClick={handleReject}
                                    className="btn-danger w-full"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Processing...' : 'Reject Application'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}