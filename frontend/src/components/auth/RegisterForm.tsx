'use client';

import React, { useState } from 'react';

interface RegisterFormProps {
    onRegisterSuccess: (email: string, needsVerification?: boolean) => void;
    onSwitchToLogin: () => void;
}

export default function RegisterForm({ onRegisterSuccess, onSwitchToLogin }: RegisterFormProps) {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        full_name: '',
        company: '',
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);

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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        if (name === 'password') {
            setPasswordStrength(validatePassword(value));
        }

        // Clear error when user starts typing
        if (error) setError('');
    };

    const validateForm = () => {
        if (!formData.email.trim()) {
            setError('Email is required');
            return false;
        }

        if (!formData.password.trim()) {
            setError('Password is required');
            return false;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long');
            return false;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return false;
        }

        if (!formData.full_name.trim()) {
            setError('Full name is required');
            return false;
        }

        if (!formData.company.trim()) {
            setError('Company is required');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            // Step 1: Register the user
            const registerResponse = await fetch('http://localhost:8000/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    full_name: formData.full_name,
                    company: formData.company,
                }),
            });

            const registerData = await registerResponse.json();

            if (!registerResponse.ok) {
                setError(registerData.detail || 'Registration failed');
                return;
            }

            // Step 2: Try to automatically log in
            const loginFormData = new URLSearchParams();
            loginFormData.append('username', formData.email);
            loginFormData.append('password', formData.password);

            const loginResponse = await fetch('http://localhost:8000/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: loginFormData,
            });

            const loginData = await loginResponse.json();

            if (loginResponse.ok && loginData.access_token) {
                // Auto-login successful
                localStorage.setItem('token', loginData.access_token);
                localStorage.setItem('user', JSON.stringify(loginData.user));
                onRegisterSuccess(formData.email, false);
            } else if (loginData.detail?.includes('Email not confirmed')) {
                // Email verification required
                onRegisterSuccess(formData.email, true);
            } else {
                // Registration succeeded but login failed for other reasons
                onRegisterSuccess(formData.email, false);
            }

        } catch (err) {
            console.error('Registration error:', err);
            setError('Network error. Please check your connection and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const passwordStrengthInfo = getPasswordStrengthText(passwordStrength);

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900">Create your account</h2>
                <p className="mt-2 text-sm text-gray-600">
                    Join ResearchLLM Pro and unlock the power of AI
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                            Full Name <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                id="full_name"
                                name="full_name"
                                type="text"
                                autoComplete="name"
                                required
                                value={formData.full_name}
                                onChange={handleChange}
                                className="block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                                placeholder="John Doe"
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                            Company <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                id="company"
                                name="company"
                                type="text"
                                autoComplete="organization"
                                required
                                value={formData.company}
                                onChange={handleChange}
                                className="block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                                placeholder="Your Company Inc."
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            className="block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                            placeholder="you@company.com"
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                        Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <input
                            id="password"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            required
                            minLength={6}
                            value={formData.password}
                            onChange={handleChange}
                            className="block w-full px-3 py-2 pl-10 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                            placeholder="Minimum 6 characters"
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

                    {formData.password && (
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
                        Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type={showConfirmPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            required
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className="block w-full px-3 py-2 pl-10 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                            placeholder="Confirm your password"
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

                    {formData.confirmPassword && formData.password !== formData.confirmPassword && (
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

                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-xs text-blue-800">
                                By creating an account, you agree to our{' '}
                                <a href="#" className="underline hover:text-blue-900">Terms of Service</a>{' '}
                                and{' '}
                                <a href="#" className="underline hover:text-blue-900">Privacy Policy</a>.
                            </p>
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading || !formData.email || !formData.password || !formData.confirmPassword || !formData.full_name || !formData.company || formData.password !== formData.confirmPassword}
                    className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isLoading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Creating account...
                        </>
                    ) : (
                        'Create account'
                    )}
                </button>
            </form>

            <div className="text-center">
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">Already have an account?</span>
                    </div>
                </div>
                <div className="mt-4">
                    <button
                        type="button"
                        onClick={onSwitchToLogin}
                        className="w-full flex justify-center py-2.5 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                    >
                        Sign in to existing account
                    </button>
                </div>
            </div>
        </div>
    );
}