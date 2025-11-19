// ApplicationReview.jsx
// Admin page to review and approve/reject adoption applications

import React, {useEffect, useState} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {useAuth} from '../../context/AuthContext';
import {applicationsAPI, API_BASE_URL} from '../../services/api';

export default function ApplicationReview() {
    const {id} = useParams();
    const {user} = useAuth();
    const navigate = useNavigate();

    const [application, setApplication] = useState(null);
    const [adminNotes, setAdminNotes] = useState('');
    const [updatePetStatus, setUpdatePetStatus] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!user?.is_admin) {
            navigate('/');
            return;
        }

        loadApplication();
    }, [id, user, navigate]);

    const loadApplication = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch application details from backend
            const applicationData = await applicationsAPI.get(parseInt(id));
            setApplication(applicationData);
            setAdminNotes(applicationData.admin_notes || '');
        } catch (err) {
            console.error('Error loading application:', err);
            setError('Failed to load application. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!confirm(`Approve application for ${application.pet_name}?`)) {
            return;
        }

        setIsSubmitting(true);

        try {
            // Update application status to approved
            await applicationsAPI.update(parseInt(id), {
                status: 'approved',
                admin_notes: adminNotes
            });

            alert('Application approved successfully!');
            navigate('/admin/dashboard');
        } catch (error) {
            console.error('Error approving application:', error);
            const errorMessage = error.response?.data?.detail || 'Failed to approve application. Please try again.';
            setError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReject = async () => {
        if (!adminNotes.trim()) {
            alert('Please add admin notes explaining the rejection reason.');
            return;
        }

        if (!confirm(`Reject application for ${application.pet_name}?`)) {
            return;
        }

        setIsSubmitting(true);

        try {
            // Update application status to rejected
            await applicationsAPI.update(parseInt(id), {
                status: 'rejected',
                admin_notes: adminNotes
            });

            alert('Application rejected.');
            navigate('/admin/dashboard');
        } catch (error) {
            console.error('Error rejecting application:', error);
            const errorMessage = error.response?.data?.detail || 'Failed to reject application. Please try again.';
            setError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSaveNotes = async () => {
        setIsSubmitting(true);

        try {
            // Save admin notes without changing status
            await applicationsAPI.update(parseInt(id), {
                admin_notes: adminNotes
            });

            alert('Notes saved successfully!');
        } catch (error) {
            console.error('Error saving notes:', error);
            const errorMessage = error.response?.data?.detail || 'Failed to save notes. Please try again.';
            setError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
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

    if (error) {
        return (
            <div className="container-narrow">
                <div className="text-center py-8">
                    <div className="text-red-400 mb-4">{error}</div>
                    <button onClick={loadApplication} className="btn">
                        Try Again
                    </button>
                </div>
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
                                    backgroundImage: application.pet_photo_url
                                        ? `url(${API_BASE_URL}/${application.pet_photo_url})`
                                        : undefined
                                }}
                            />
                            <div>
                                <h3 className="text-lg font-semibold mb-1">{application.pet_name}</h3>
                                <div className="text-[#B6C6DA] text-sm mb-2">
                                    {application.pet_species} • {application.pet_age} years old
                                </div>
                                {getStatusBadge('available')}
                            </div>
                        </div>
                        <button
                            onClick={() => navigate(`/pet/${application.pet_id}`)}
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
                                <div className="font-medium">{application.user_name}</div>
                            </div>
                            <div>
                                <div className="text-sm text-[#B6C6DA] mb-1">Email</div>
                                <div className="font-medium">{application.user_email}</div>
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