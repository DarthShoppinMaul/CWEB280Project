// AdminDashboard.jsx
// Enhanced admin dashboard with pending applications management

import React, {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {useAuth} from '../../context/AuthContext';

export default function AdminDashboard() {
    const {user} = useAuth();
    const navigate = useNavigate();

    const [stats, setStats] = useState({
        totalPets: 0,
        totalLocations: 0,
        totalUsers: 0,
        pendingApplications: 0
    });
    const [pendingApplications, setPendingApplications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.is_admin) {
            navigate('/');
            return;
        }

        // Simulate API call
        setTimeout(() => {
            setStats({
                totalPets: 15,
                totalLocations: 3,
                totalUsers: 42,
                pendingApplications: 5
            });

            setPendingApplications([
                {
                    application_id: 1,
                    user: {
                        display_name: 'John Smith',
                        email: 'john.smith@email.com'
                    },
                    pet: {
                        pet_id: 1,
                        name: 'Max',
                        species: 'Dog',
                        breed: 'Golden Retriever',
                        photo_url: null
                    },
                    application_date: '2024-11-05',
                    days_waiting: 3
                },
                {
                    application_id: 2,
                    user: {
                        display_name: 'Sarah Johnson',
                        email: 'sarah.j@email.com'
                    },
                    pet: {
                        pet_id: 2,
                        name: 'Luna',
                        species: 'Cat',
                        breed: 'Siamese',
                        photo_url: null
                    },
                    application_date: '2024-11-04',
                    days_waiting: 4
                },
                {
                    application_id: 3,
                    user: {
                        display_name: 'Michael Chen',
                        email: 'mchen@email.com'
                    },
                    pet: {
                        pet_id: 5,
                        name: 'Rocky',
                        species: 'Dog',
                        breed: 'German Shepherd',
                        photo_url: null
                    },
                    application_date: '2024-11-03',
                    days_waiting: 5
                },
                {
                    application_id: 4,
                    user: {
                        display_name: 'Emma Wilson',
                        email: 'ewilson@email.com'
                    },
                    pet: {
                        pet_id: 4,
                        name: 'Bella',
                        species: 'Cat',
                        breed: 'Persian',
                        photo_url: null
                    },
                    application_date: '2024-11-02',
                    days_waiting: 6
                },
                {
                    application_id: 5,
                    user: {
                        display_name: 'David Brown',
                        email: 'dbrown@email.com'
                    },
                    pet: {
                        pet_id: 1,
                        name: 'Max',
                        species: 'Dog',
                        breed: 'Golden Retriever',
                        photo_url: null
                    },
                    application_date: '2024-11-01',
                    days_waiting: 7
                }
            ]);

            setLoading(false);
        }, 500);
    }, [user, navigate]);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="container-narrow">
                <div className="text-center py-8">Loading dashboard...</div>
            </div>
        );
    }

    return (
        <div className="container-narrow">
            <h1 className="text-3xl mb-6">Admin Dashboard</h1>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="panel">
                    <div className="text-[#B6C6DA] text-sm mb-1">Total Pets</div>
                    <div className="text-3xl font-bold text-[#64FFDA]">{stats.totalPets}</div>
                </div>
                <div className="panel">
                    <div className="text-[#B6C6DA] text-sm mb-1">Locations</div>
                    <div className="text-3xl font-bold text-[#64FFDA]">{stats.totalLocations}</div>
                </div>
                <div className="panel">
                    <div className="text-[#B6C6DA] text-sm mb-1">Registered Users</div>
                    <div className="text-3xl font-bold text-[#64FFDA]">{stats.totalUsers}</div>
                </div>
                <div className="panel bg-yellow-900/20 border-yellow-500/30">
                    <div className="text-yellow-300 text-sm mb-1">Pending Applications</div>
                    <div className="text-3xl font-bold text-yellow-400">{stats.pendingApplications}</div>
                </div>
            </div>

            {/* Pending Applications Section */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-semibold">Pending Applications</h2>
                    <button
                        onClick={() => navigate('/admin/applications')}
                        className="btn-secondary text-sm"
                    >
                        View All Applications
                    </button>
                </div>

                {pendingApplications.length === 0 ? (
                    <div className="panel text-center py-12">
                        <svg className="w-16 h-16 mx-auto mb-4 text-[#B6C6DA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-[#B6C6DA]">No pending applications to review</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {pendingApplications.map(app => (
                            <div key={app.application_id} className="panel hover:border-[#64FFDA] transition-colors">
                                <div className="flex items-center gap-4">
                                    {/* Pet Photo */}
                                    <div
                                        className="w-20 h-20 bg-[#152e56] rounded-xl bg-cover bg-center flex-shrink-0"
                                        style={{
                                            backgroundImage: app.pet.photo_url
                                                ? `url(http://localhost:8000/${app.pet.photo_url})`
                                                : undefined
                                        }}
                                    />

                                    {/* Application Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4 mb-2">
                                            <div>
                                                <h3 className="font-semibold text-lg mb-1">
                                                    {app.user.display_name}
                                                    <span className="text-[#B6C6DA] font-normal"> applied for </span>
                                                    {app.pet.name}
                                                </h3>
                                                <div className="text-sm text-[#B6C6DA]">
                                                    {app.pet.species} • {app.pet.breed}
                                                </div>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <div className="text-sm text-[#B6C6DA]">{formatDate(app.application_date)}</div>
                                                <div className={`text-xs mt-1 ${
                                                    app.days_waiting > 5
                                                        ? 'text-red-400'
                                                        : app.days_waiting > 3
                                                            ? 'text-yellow-400'
                                                            : 'text-[#B6C6DA]'
                                                }`}>
                                                    {app.days_waiting} {app.days_waiting === 1 ? 'day' : 'days'} waiting
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-sm text-[#B6C6DA] mb-3">
                                            {app.user.email}
                                        </div>

                                        <button
                                            onClick={() => navigate(`/admin/application/${app.application_id}`)}
                                            className="btn text-sm px-4 py-1.5"
                                        >
                                            Review Application
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                        onClick={() => navigate('/add-pet')}
                        className="panel hover:border-[#64FFDA] transition-colors text-center py-8"
                    >
                        <svg className="w-12 h-12 mx-auto mb-3 text-[#64FFDA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <div className="font-semibold text-lg">Add New Pet</div>
                    </button>

                    <button
                        onClick={() => navigate('/add-location')}
                        className="panel hover:border-[#64FFDA] transition-colors text-center py-8"
                    >
                        <svg className="w-12 h-12 mx-auto mb-3 text-[#64FFDA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <div className="font-semibold text-lg">Add New Location</div>
                    </button>

                    <button
                        onClick={() => navigate('/admin/pets')}
                        className="panel hover:border-[#64FFDA] transition-colors text-center py-8"
                    >
                        <svg className="w-12 h-12 mx-auto mb-3 text-[#64FFDA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                        <div className="font-semibold text-lg">Manage All Pets</div>
                    </button>
                </div>
            </div>

            {/* Recent Activity (Optional - can be commented out) */}
            <div>
                <h2 className="text-2xl font-semibold mb-4">Recent Activity</h2>
                <div className="panel">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 pb-4 border-b border-[#1b355e]">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <div className="flex-1">
                                <div className="text-sm">New user registration</div>
                                <div className="text-xs text-[#B6C6DA]">Emma Wilson joined • 2 hours ago</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 pb-4 border-b border-[#1b355e]">
                            <div className="w-2 h-2 bg-[#64FFDA] rounded-full"></div>
                            <div className="flex-1">
                                <div className="text-sm">Pet added</div>
                                <div className="text-xs text-[#B6C6DA]">New dog "Buddy" added to Downtown Shelter • 5 hours ago</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                            <div className="flex-1">
                                <div className="text-sm">New adoption application</div>
                                <div className="text-xs text-[#B6C6DA]">Sarah Johnson applied for Luna • 1 day ago</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}