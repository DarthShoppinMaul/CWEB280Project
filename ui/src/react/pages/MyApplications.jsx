// MyApplications.jsx
// Page for users to view their submitted adoption applications

import React, {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {useAuth} from '../../context/AuthContext';

export default function MyApplications() {
    const {user} = useAuth();
    const navigate = useNavigate();

    const [applications, setApplications] = useState([]);
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        // Simulate API call
        setTimeout(() => {
            setApplications([
                {
                    application_id: 1,
                    pet: {
                        pet_id: 1,
                        name: 'Max',
                        species: 'Dog',
                        breed: 'Golden Retriever',
                        age: 3,
                        photo_url: null
                    },
                    status: 'pending',
                    application_date: '2024-11-01',
                    application_message: 'I have a large backyard and love to go on walks.',
                    contact_phone: '(306) 555-0123',
                    living_situation: 'house',
                    has_other_pets: false
                },
                {
                    application_id: 2,
                    pet: {
                        pet_id: 3,
                        name: 'Charlie',
                        species: 'Dog',
                        breed: 'Beagle',
                        age: 5,
                        photo_url: null
                    },
                    status: 'approved',
                    application_date: '2024-10-15',
                    reviewed_at: '2024-10-18',
                    admin_notes: 'Great match! Please contact us to schedule a meet-and-greet.',
                    application_message: 'I work from home and can provide constant companionship.',
                    contact_phone: '(306) 555-0123',
                    living_situation: 'apartment',
                    has_other_pets: true
                },
                {
                    application_id: 3,
                    pet: {
                        pet_id: 5,
                        name: 'Rocky',
                        species: 'Dog',
                        breed: 'German Shepherd',
                        age: 6,
                        photo_url: null
                    },
                    status: 'rejected',
                    application_date: '2024-09-20',
                    reviewed_at: '2024-09-22',
                    admin_notes: 'Unfortunately, this pet needs an experienced owner with a larger space.',
                    application_message: 'I live in a small apartment but really love German Shepherds.',
                    contact_phone: '(306) 555-0123',
                    living_situation: 'apartment',
                    has_other_pets: false
                }
            ]);
            setLoading(false);
        }, 500);
    }, [user, navigate]);

    const getStatusBadge = (status) => {
        const styles = {
            pending: {
                bg: 'bg-yellow-900/30',
                text: 'text-yellow-400',
                border: 'border-yellow-500',
                label: 'Pending Review'
            },
            approved: {
                bg: 'bg-green-900/30',
                text: 'text-green-400',
                border: 'border-green-500',
                label: 'Approved'
            },
            rejected: {
                bg: 'bg-red-900/30',
                text: 'text-red-400',
                border: 'border-red-500',
                label: 'Not Approved'
            }
        };

        const style = styles[status];

        return (
            <span className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-full border ${style.bg} ${style.text} ${style.border}`}>
                <span className={`w-2 h-2 rounded-full ${status === 'pending' ? 'bg-yellow-400' : status === 'approved' ? 'bg-green-400' : 'bg-red-400'}`}></span>
                {style.label}
            </span>
        );
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const filteredApplications = filter === 'all'
        ? applications
        : applications.filter(app => app.status === filter);

    const statusCounts = {
        all: applications.length,
        pending: applications.filter(a => a.status === 'pending').length,
        approved: applications.filter(a => a.status === 'approved').length,
        rejected: applications.filter(a => a.status === 'rejected').length
    };

    if (loading) {
        return (
            <div className="container-narrow">
                <div className="text-center py-8">Loading applications...</div>
            </div>
        );
    }

    return (
        <div className="container-narrow">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl">My Applications</h1>
                <button onClick={() => navigate('/pets')} className="btn">
                    Browse Pets
                </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                        filter === 'all'
                            ? 'bg-[#64FFDA] text-[#081424] font-semibold'
                            : 'bg-[#233554] text-[#E6F1FF] hover:bg-[#2d4467]'
                    }`}
                >
                    All ({statusCounts.all})
                </button>
                <button
                    onClick={() => setFilter('pending')}
                    className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                        filter === 'pending'
                            ? 'bg-[#64FFDA] text-[#081424] font-semibold'
                            : 'bg-[#233554] text-[#E6F1FF] hover:bg-[#2d4467]'
                    }`}
                >
                    Pending ({statusCounts.pending})
                </button>
                <button
                    onClick={() => setFilter('approved')}
                    className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                        filter === 'approved'
                            ? 'bg-[#64FFDA] text-[#081424] font-semibold'
                            : 'bg-[#233554] text-[#E6F1FF] hover:bg-[#2d4467]'
                    }`}
                >
                    Approved ({statusCounts.approved})
                </button>
                <button
                    onClick={() => setFilter('rejected')}
                    className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                        filter === 'rejected'
                            ? 'bg-[#64FFDA] text-[#081424] font-semibold'
                            : 'bg-[#233554] text-[#E6F1FF] hover:bg-[#2d4467]'
                    }`}
                >
                    Not Approved ({statusCounts.rejected})
                </button>
            </div>

            {/* Applications List */}
            {filteredApplications.length === 0 ? (
                <div className="panel text-center py-12">
                    <svg className="w-16 h-16 mx-auto mb-4 text-[#B6C6DA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-[#B6C6DA] mb-4">
                        {filter === 'all'
                            ? 'You haven\'t submitted any applications yet.'
                            : `No ${filter} applications.`}
                    </p>
                    <button onClick={() => navigate('/pets')} className="btn">
                        Browse Available Pets
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredApplications.map(app => (
                        <div key={app.application_id} className="panel">
                            <div className="flex gap-4">
                                {/* Pet Photo */}
                                <div
                                    className="w-32 h-32 bg-[#152e56] rounded-xl bg-cover bg-center flex-shrink-0"
                                    style={{
                                        backgroundImage: app.pet.photo_url
                                            ? `url(http://localhost:8000/${app.pet.photo_url})`
                                            : undefined
                                    }}
                                />

                                {/* Application Details */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-4 mb-3">
                                        <div>
                                            <h3 className="text-xl font-semibold mb-1">{app.pet.name}</h3>
                                            <div className="text-[#B6C6DA] text-sm">
                                                {app.pet.species} • {app.pet.breed} • {app.pet.age} years old
                                            </div>
                                        </div>
                                        {getStatusBadge(app.status)}
                                    </div>

                                    <div className="text-sm text-[#B6C6DA] mb-3">
                                        Applied on {formatDate(app.application_date)}
                                        {app.reviewed_at && (
                                            <span> • Reviewed on {formatDate(app.reviewed_at)}</span>
                                        )}
                                    </div>

                                    {/* Admin Notes (if approved or rejected) */}
                                    {app.admin_notes && (
                                        <div className={`rounded-xl p-3 mb-3 border ${
                                            app.status === 'approved'
                                                ? 'bg-green-900/20 border-green-500/30 text-green-300'
                                                : 'bg-red-900/20 border-red-500/30 text-red-300'
                                        }`}>
                                            <div className="font-medium text-sm mb-1">
                                                {app.status === 'approved' ? 'Good news!' : 'Feedback from our team:'}
                                            </div>
                                            <div className="text-sm">{app.admin_notes}</div>
                                        </div>
                                    )}

                                    {/* View Details Button */}
                                    <button
                                        onClick={() => navigate(`/application/${app.application_id}`)}
                                        className="btn-secondary text-sm"
                                    >
                                        View Full Application
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