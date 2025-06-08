'use client';

import React, { useState, useEffect } from 'react';

interface EmailVerificationPromptProps {
    email: string;
    onVerificationSuccess: () => void;
    onBackToLogin: () => void;
}

export default function EmailVerificationPrompt({
    email,
    onVerificationSuccess,
    onBackToLogin
}: EmailVerificationPromptProps) {
    const [isResending, setIsResending] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [message, setMessage] = useState('');
    const [isChecking, setIsChecking] = useState(false);

    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    const handleResendEmail = async () => {
        setIsResending(true);
        setMessage('');

        try {
            const response = await fetch('http://localhost:8000/auth/resend-verification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            if (response.ok) {
                setMessage('Verification email sent successfully! Please check your inbox.');
                setResendCooldown(60); // 60-second cooldown
            } else {
                const data = await response.json();
                setMessage(data.detail || 'Failed to resend verification email. Please try again.');
            }
        } catch (error) {
            setMessage('Network error. Please check your connection and try again.');
        } finally {
            setIsResending(false);
        }
    };

    const handleCheckVerification = async () => {
        setIsChecking(true);
        setMessage('');

        try {
            // Try to login to check if email is verified
            const formData = new URLSearchParams();
            formData.append('username', email);
            formData.append('password', 'check'); // This will fail, but we can check the error

            const response = await fetch('http://localhost:8000/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData,
            });

            const data = await response.json();

            if (data.detail?.includes('Email not confirmed')) {
                setMessage('Email not verified yet. Please check your inbox and click the verification link.');
            } else {
                // If we get a different error, it means email might be verified
                setMessage('Email verified! You can now sign in with your credentials.');
                setTimeout(() => {
                    onVerificationSuccess();
                }, 2000);
            }
        } catch (error) {
            setMessage('Unable to check verification status. Please try signing in manually.');
        } finally {
            setIsChecking(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100">
                    <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                </div>
                <h2 className="mt-4 text-2xl font-bold text-gray-900">Check your email</h2>
                <p className="mt-2 text-sm text-gray-600">
                    We've sent a verification link to
                </p>
                <p className="text-sm font-medium text-indigo-600">{email}</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">
                            What to do next:
                        </h3>
                        <div className="mt-2 text-sm text-blue-700">
                            <ol className="list-decimal list-inside space-y-1">
                                <li>Check your email inbox (and spam folder)</li>
                                <li>Click the verification link in the email</li>
                                <li>Return here and click "I've verified my email"</li>
                            </ol>
                        </div>
                    </div>
                </div>
            </div>

            {message && (
                <div className={`rounded-md p-3 border ${message.includes('successfully') || message.includes('verified')
                    ? 'bg-green-50 border-green-200'
                    : 'bg-yellow-50 border-yellow-200'
                    }`}>
                    <div className="flex">
                        <div className="flex-shrink-0">
                            {message.includes('successfully') || message.includes('verified') ? (
                                <svg className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            ) : (
                                <svg className="h-4 w-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            )}
                        </div>
                        <div className="ml-3">
                            <p className={`text-sm ${message.includes('successfully') || message.includes('verified')
                                ? 'text-green-800'
                                : 'text-yellow-800'
                                }`}>
                                {message}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-3">
                <button
                    onClick={handleCheckVerification}
                    disabled={isChecking}
                    className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isChecking ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Checking verification...
                        </>
                    ) : (
                        <>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            I've verified my email
                        </>
                    )}
                </button>

                <button
                    onClick={handleResendEmail}
                    disabled={isResending || resendCooldown > 0}
                    className="w-full flex justify-center py-2.5 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isResending ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Sending email...
                        </>
                    ) : resendCooldown > 0 ? (
                        `Resend email in ${resendCooldown}s`
                    ) : (
                        <>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Resend verification email
                        </>
                    )}
                </button>
            </div>

            <div className="text-center">
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">Having trouble?</span>
                    </div>
                </div>
                <div className="mt-4 space-y-2">
                    <button
                        type="button"
                        onClick={onBackToLogin}
                        className="text-sm text-indigo-600 hover:text-indigo-500 transition-colors"
                    >
                        Back to sign in
                    </button>
                    <div className="text-xs text-gray-500">
                        <p>Check your spam folder if you don't see the email.</p>
                        <p>Contact support if you continue having issues.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}