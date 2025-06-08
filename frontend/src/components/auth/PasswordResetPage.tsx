'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function PasswordResetPage() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [accessToken, setAccessToken] = useState('');
    const [refreshToken, setRefreshToken] = useState('');

    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        // Extract tokens from URL hash (Supabase auth redirect)
        const hash = window.location.hash;
        if (hash) {
            const params = new URLSearchParams(hash.substring(1));
            const access_token = params.get('access_token');
            const refresh_token = params.get('refresh_token');
            const type = params.get('type');

            if (type === 'recovery' && access_token) {
                setAccessToken(access_token);
                if (refresh_token) {
                    setRefreshToken(refresh_token);
                }
            } else {
                setError('Invalid or expired reset link. Please request a new password reset.');
            }
        } else {
            setError('Invalid reset link. Please request a new password reset.');
        }
    }, []);

    const validatePassword = (password: string) => {
        let strength = 0;
        if (password.length >= 8) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;
        return strength;
    };

    const getPasswordStrengthText = (strength: number) => {
        switch (strength) {
            case 0:
            case 1: return { text: 'Very Weak', color: 'text-red-600' };
            case 2: return { text: 'Weak', color: 'text-orange-600' };
            case 3: return { text: 'Fair', color: 'text-yellow-600' };
            case 4: return { text: 'Good', color: 'text-blue-600' };
            case 5: return { text: 'Strong', color: 'text-green-600' };
            default: return { text: '', color: '' };
        }
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newPassword = e.target.value;
        setPassword(newPassword);
        setPasswordStrength(validatePassword(newPassword));

        // Clear error when user starts typing
        if (error) setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!password.trim()) {
            setError('Password is required');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (!accessToken) {
            setError('Invalid reset session. Please request a new password reset.');
            return;
        }

        setIsLoading(true);

        try {
            // Use Supabase client to update password
            const response = await fetch('http://localhost:8000/auth/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    token: accessToken,
                    new_password: password,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(true);
                // Redirect to login after 3 seconds
                setTimeout(() => {
                    router.push('/');
                }, 3000);
            } else {
                setError(data.detail || 'Failed to reset password. Please try again.');
            }

        } catch (err) {
            console.error('Password reset error:', err);
            setError('Network error. Please check your connection and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const passwordStrengthInfo = getPasswordStrengthText(passwordStrength);

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
                <div className="max-w-md w-full mx-auto">
                    <div className="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10 border border-gray-100">
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
                                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h2 className="mt-4 text-2xl font-bold text-gray-900">Password Reset Successful!</h2>
                            <p className="mt-2 text-sm text-gray-600">
                                Your password has been updated successfully.
                            </p>
                            <p className="mt-2 text-sm text-gray-600">
                                Redirecting you to the login page...
                            </p>

                            <div className="mt-6">
                                <button
                                    onClick={() => router.push('/')}
                                    className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                                >
                                    Continue to Login
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
            <div className="max-w-md w-full mx-auto">
                <div className="text-center mb-8">
                    <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-indigo-100">
                        <svg className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                    </div>
                    <h1 className="mt-6 text-3xl font-extrabold text-gray-900">ResearchLLM Pro</h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Reset your password
                    </p>
                </div>

                <div className="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10 border border-gray-100">
                    <div className="space-y-6">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-gray-900">Create New Password</h2>
                            <p className="mt-2 text-sm text-gray-600">
                                Enter your new password below
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                    New Password <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="new-password"
                                        required
                                        minLength={6}
                                        value={password}
                                        onChange={handlePasswordChange}
                                        className="block w-full px-3 py-2 pl-10 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                                        placeholder="Enter your new password"
                                    />
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? (
                                            <svg className="h-4 w-4 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                            </svg>
                                        ) : (
                                            <svg className="h-4 w-4 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>

                                {password && (
                                    <div className="mt-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-500">Password strength:</span>
                                            <span className={`text-xs font-medium ${passwordStrengthInfo.color}`}>
                                                {passwordStrengthInfo.text}
                                            </span>
                                        </div>
                                        <div className="mt-1 bg-gray-200 rounded-full h-1">
                                            <div
                                                className={`h-1 rounded-full transition-all duration-300 ${passwordStrength <= 1 ? 'bg-red-500' :
                                                    passwordStrength === 2 ? 'bg-orange-500' :
                                                        passwordStrength === 3 ? 'bg-yellow-500' :
                                                            passwordStrength === 4 ? 'bg-blue-500' :
                                                                'bg-green-500'
                                                    }`}
                                                style={{ width: `${(passwordStrength / 5) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                    Confirm New Password <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        autoComplete="new-password"
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => {
                                            setConfirmPassword(e.target.value);
                                            if (error) setError('');
                                        }}
                                        className="block w-full px-3 py-2 pl-10 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                                        placeholder="Confirm your new password"
                                    />
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        {showConfirmPassword ? (
                                            <svg className="h-4 w-4 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                            </svg>
                                        ) : (
                                            <svg className="h-4 w-4 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>

                                {confirmPassword && password !== confirmPassword && (
                                    <p className="mt-1 text-xs text-red-600">Passwords do not match</p>
                                )}
                            </div>

                            {error && (
                                <div className="rounded-md bg-red-50 p-3 border border-red-200">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <svg className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm text-red-800">{error}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading || !password || !confirmPassword || password !== confirmPassword}
                                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Resetting Password...
                                    </>
                                ) : (
                                    'Reset Password'
                                )}
                            </button>
                        </form>

                        <div className="text-center">
                            <button
                                type="button"
                                onClick={() => router.push('/')}
                                className="text-sm text-indigo-600 hover:text-indigo-500 transition-colors"
                            >
                                Back to Login
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}