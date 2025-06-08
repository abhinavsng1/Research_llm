//components/stats/UsageStats.tsx
'use client';

import React, { useState, useEffect } from 'react';

interface UsageStats {
    total_queries: number;
    total_tokens: number;
    queries_by_model: Record<string, number>;
    tokens_by_model: Record<string, number>;
    daily_usage: Array<{
        date: string;
        queries: number;
        tokens: number;
    }>;
}

export default function UsageStats() {
    const [stats, setStats] = useState<UsageStats | null>(null);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8000/llm/usage/me', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Failed to fetch usage stats');
            }

            setStats(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <div>Loading usage statistics...</div>;
    }

    if (error) {
        return (
            <div className="text-red-600">
                Error loading usage statistics: {error}
            </div>
        );
    }

    if (!stats) {
        return <div>No usage statistics available</div>;
    }

    return (
        <div className="space-y-6">
            <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Usage Statistics
                    </h3>
                    <div className="mt-2 max-w-xl text-sm text-gray-500">
                        <p>Your LLM usage statistics for the last 30 days.</p>
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <dt className="text-sm font-medium text-gray-500 truncate">
                                    Total Queries
                                </dt>
                                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                                    {stats.total_queries}
                                </dd>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <dt className="text-sm font-medium text-gray-500 truncate">
                                    Total Tokens
                                </dt>
                                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                                    {stats.total_tokens.toLocaleString()}
                                </dd>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8">
                        <h4 className="text-lg font-medium text-gray-900">Usage by Model</h4>
                        <div className="mt-4">
                            <div className="flex flex-col">
                                <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                                    <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                                        <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Model
                                                        </th>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Queries
                                                        </th>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Tokens
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {Object.entries(stats.queries_by_model).map(([model, queries]) => (
                                                        <tr key={model}>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                                {model}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {queries}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {stats.tokens_by_model[model]?.toLocaleString() || 0}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8">
                        <h4 className="text-lg font-medium text-gray-900">Daily Usage</h4>
                        <div className="mt-4">
                            <div className="flex flex-col">
                                <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                                    <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                                        <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Date
                                                        </th>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Queries
                                                        </th>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Tokens
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {stats.daily_usage.map((day) => (
                                                        <tr key={day.date}>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                                {new Date(day.date).toLocaleDateString()}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {day.queries}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {day.tokens.toLocaleString()}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 