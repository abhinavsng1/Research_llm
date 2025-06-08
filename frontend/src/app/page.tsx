'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoginForm from '@/components/auth/LoginForm';
import RegisterForm from '@/components/auth/RegisterForm';
import LLMInterface from '@/components/llm/LLMInterface';
import UserProfile from '@/components/user/UserProfile';
import UsageStats from '@/components/stats/UsageStats';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';
import EmailVerificationPrompt from '@/components/auth/EmailVerificationPrompt';
import { clearAuthData, getAuthToken } from '@/utils/auth';

type AuthMode = 'login' | 'register' | 'forgot-password' | 'email-verification';

export default function Home() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [activeTab, setActiveTab] = useState('llm');
    const [authMode, setAuthMode] = useState<AuthMode>('login');
    const [userEmail, setUserEmail] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        const token = getAuthToken();
        if (token) {
            try {
                // Verify token is still valid by making a request
                const response = await fetch('http://localhost:8000/auth/me', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (response.ok) {
                    setIsAuthenticated(true);
                } else {
                    clearAuthData();
                    setIsAuthenticated(false);
                }
            } catch (error) {
                clearAuthData();
                setIsAuthenticated(false);
            }
        }
        setIsLoading(false);
    };

    const handleLoginSuccess = () => {
        setIsAuthenticated(true);
        setAuthMode('login');
    };

    const handleRegisterSuccess = (email: string, needsVerification: boolean = false) => {
        if (needsVerification) {
            setUserEmail(email);
            setAuthMode('email-verification');
        } else {
            setIsAuthenticated(true);
            setAuthMode('login');
        }
    };

    const handleEmailVerified = () => {
        setIsAuthenticated(true);
        setAuthMode('login');
    };

    const handleLogout = () => {
        clearAuthData();
        setIsAuthenticated(false);
        setActiveTab('llm');
        router.push('/');
    };

    const handleForgotPasswordSuccess = () => {
        setAuthMode('login');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading ResearchLLM Pro...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
                <div className="flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                    <div className="sm:mx-auto sm:w-full sm:max-w-md">
                        <div className="text-center">
                            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-indigo-100">
                                <svg className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                            </div>
                            <h1 className="mt-6 text-3xl font-extrabold text-gray-900">ResearchLLM Pro</h1>
                            <p className="mt-2 text-sm text-gray-600">
                                Enterprise-grade AI research platform with advanced LLM capabilities
                            </p>
                        </div>
                    </div>

                    <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10 border border-gray-100">
                            {authMode === 'login' && (
                                <LoginForm
                                    onLoginSuccess={handleLoginSuccess}
                                    onSwitchToRegister={() => setAuthMode('register')}
                                    onSwitchToForgotPassword={() => setAuthMode('forgot-password')}
                                />
                            )}

                            {authMode === 'register' && (
                                <RegisterForm
                                    onRegisterSuccess={handleRegisterSuccess}
                                    onSwitchToLogin={() => setAuthMode('login')}
                                />
                            )}

                            {authMode === 'email-verification' && (
                                <EmailVerificationPrompt
                                    email={userEmail}
                                    onVerificationSuccess={handleEmailVerified}
                                    onBackToLogin={() => setAuthMode('login')}
                                />
                            )}

                            {authMode === 'forgot-password' && (
                                <ForgotPasswordForm
                                    onSuccess={handleForgotPasswordSuccess}
                                    onBackToLogin={() => setAuthMode('login')}
                                />
                            )}
                        </div>
                    </div>

                    <div className="mt-8 text-center">
                        <div className="text-xs text-gray-500">
                            <p>Secure • Reliable • Enterprise-Ready</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Enhanced Navigation */}
            <nav className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            <div className="flex-shrink-0 flex items-center">
                                <div className="h-8 w-8 flex items-center justify-center rounded-full bg-indigo-100 mr-3">
                                    <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                </div>
                                <h1 className="text-xl font-bold text-gray-900">ResearchLLM Pro</h1>
                            </div>

                            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                                <button
                                    onClick={() => setActiveTab('llm')}
                                    className={`${activeTab === 'llm'
                                        ? 'border-indigo-500 text-gray-900 bg-indigo-50'
                                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                        } inline-flex items-center px-3 py-1 border-b-2 text-sm font-medium rounded-t-md transition-colors`}
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                    LLM Interface
                                </button>
                                <button
                                    onClick={() => setActiveTab('profile')}
                                    className={`${activeTab === 'profile'
                                        ? 'border-indigo-500 text-gray-900 bg-indigo-50'
                                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                        } inline-flex items-center px-3 py-1 border-b-2 text-sm font-medium rounded-t-md transition-colors`}
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    Profile
                                </button>
                                <button
                                    onClick={() => setActiveTab('stats')}
                                    className={`${activeTab === 'stats'
                                        ? 'border-indigo-500 text-gray-900 bg-indigo-50'
                                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                        } inline-flex items-center px-3 py-1 border-b-2 text-sm font-medium rounded-t-md transition-colors`}
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    Usage Stats
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="text-sm text-gray-500">
                                Welcome back!
                            </div>
                            <button
                                onClick={handleLogout}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Navigation */}
            <div className="sm:hidden bg-white border-b border-gray-200">
                <div className="flex justify-around py-2">
                    {[
                        { key: 'llm', label: 'LLM', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
                        { key: 'profile', label: 'Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
                        { key: 'stats', label: 'Stats', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' }
                    ].map(({ key, label, icon }) => (
                        <button
                            key={key}
                            onClick={() => setActiveTab(key)}
                            className={`flex flex-col items-center px-3 py-2 text-xs font-medium rounded-md transition-colors ${activeTab === key
                                ? 'text-indigo-600 bg-indigo-50'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                            </svg>
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 sm:px-0">
                    {activeTab === 'llm' && <LLMInterface />}
                    {activeTab === 'profile' && <UserProfile />}
                    {activeTab === 'stats' && <UsageStats />}
                </div>
            </main>
        </div>
    );
}