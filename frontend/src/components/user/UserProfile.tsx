//components/user/UserProfile.tsx

'use client';

import React, { useState, useEffect } from 'react';

interface UserProfile {
    id: string;
    email: string;
    full_name: string | null;
    company: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string | null;
}

export default function UserProfile() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        company: '',
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8000/auth/me', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            const data = await response.json();
            setProfile(data);
            setFormData({
                full_name: data.full_name || '',
                company: data.company || '',
            });
        } catch (err) {
            setError('Failed to fetch profile');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setIsLoading(true);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8000/auth/me', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Update failed');
            }

            setProfile(data.data.user);
            setSuccessMessage('Profile updated successfully');
            setIsEditing(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    if (!profile) {
        return <div>Loading...</div>;
    }

    return (
        <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                    User Profile
                </h3>
                <div className="mt-2 max-w-xl text-sm text-gray-500">
                    <p>Manage your account information and preferences.</p>
                </div>

                {!isEditing ? (
                    <div className="mt-5">
                        <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                            <div className="sm:col-span-1">
                                <dt className="text-sm font-medium text-gray-500">Email</dt>
                                <dd className="mt-1 text-sm text-gray-900">{profile.email}</dd>
                            </div>
                            <div className="sm:col-span-1">
                                <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                                <dd className="mt-1 text-sm text-gray-900">{profile.full_name || 'Not set'}</dd>
                            </div>
                            <div className="sm:col-span-1">
                                <dt className="text-sm font-medium text-gray-500">Company</dt>
                                <dd className="mt-1 text-sm text-gray-900">{profile.company || 'Not set'}</dd>
                            </div>
                            <div className="sm:col-span-1">
                                <dt className="text-sm font-medium text-gray-500">Member Since</dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    {new Date(profile.created_at).toLocaleDateString()}
                                </dd>
                            </div>
                        </dl>
                        <div className="mt-5">
                            <button
                                type="button"
                                onClick={() => setIsEditing(true)}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Edit Profile
                            </button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                        <div>
                            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                                Full Name
                            </label>
                            <div className="mt-1">
                                <input
                                    type="text"
                                    name="full_name"
                                    id="full_name"
                                    value={formData.full_name}
                                    onChange={handleChange}
                                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                                Company
                            </label>
                            <div className="mt-1">
                                <input
                                    type="text"
                                    name="company"
                                    id="company"
                                    value={formData.company}
                                    onChange={handleChange}
                                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="text-red-600 text-sm">
                                {error}
                            </div>
                        )}

                        {successMessage && (
                            <div className="text-green-600 text-sm">
                                {successMessage}
                            </div>
                        )}

                        <div className="flex space-x-3">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                            >
                                {isLoading ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsEditing(false);
                                    setFormData({
                                        full_name: profile.full_name || '',
                                        company: profile.company || '',
                                    });
                                }}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
} 