//components/llm/LLMInterface.tsx

'use client';

import { makeAuthenticatedRequest } from '@/utils/auth';
import React, { useState, useEffect } from 'react';

export default function LLMInterface() {
    const [prompt, setPrompt] = useState('');
    const [response, setResponse] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [models, setModels] = useState<string[]>([]); // Changed to string array
    const [selectedModel, setSelectedModel] = useState('');
    const [temperature, setTemperature] = useState(0.7);
    const [maxTokens, setMaxTokens] = useState(1000);

    useEffect(() => {
        fetchModels();
    }, []);

    const fetchModels = async () => {
        try {
            const response = await makeAuthenticatedRequest('http://localhost:8000/llm/models');

            if (!response.ok) {
                if (response.status === 401) {
                    setError('Authentication failed. Please log in again.');
                    // Redirect to login or refresh page
                    window.location.reload();
                    return;
                }
                throw new Error(`HTTP ${response.status}: Failed to fetch models`);
            }

            const data = await response.json();
            setModels(data);
            if (data.length > 0) {
                setSelectedModel(data[0]);
            }
        } catch (err) {
            console.error('Error fetching models:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch available models');
        }
    };

    // Or for the query submission:
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setResponse('');
        setIsLoading(true);

        try {
            const response = await makeAuthenticatedRequest('http://localhost:8000/llm/query', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: prompt.trim(),
                    model: selectedModel,
                    temperature: temperature,
                    max_tokens: maxTokens,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    setError('Authentication failed. Please log in again.');
                    window.location.reload();
                    return;
                }
                throw new Error(data.detail || 'Query failed');
            }

            setResponse(data.response);
            setPrompt('');
        } catch (err) {
            console.error('Error submitting query:', err);
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                        LLM Query Interface
                    </h3>
                    <div className="mt-2 max-w-xl text-sm text-gray-500">
                        <p>Enter your prompt and configure settings to interact with AI models.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div>
                                <label htmlFor="model" className="block text-sm font-medium text-gray-700">
                                    Model
                                </label>
                                <select
                                    id="model"
                                    name="model"
                                    value={selectedModel}
                                    onChange={(e) => setSelectedModel(e.target.value)}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                    disabled={models.length === 0}
                                >
                                    {models.length === 0 ? (
                                        <option value="">Loading models...</option>
                                    ) : (
                                        models.map((model) => (
                                            <option key={model} value={model}>
                                                {model}
                                            </option>
                                        ))
                                    )}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="temperature" className="block text-sm font-medium text-gray-700">
                                    Temperature
                                </label>
                                <input
                                    type="number"
                                    id="temperature"
                                    name="temperature"
                                    min="0"
                                    max="2"
                                    step="0.1"
                                    value={temperature}
                                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                            </div>

                            <div>
                                <label htmlFor="maxTokens" className="block text-sm font-medium text-gray-700">
                                    Max Tokens
                                </label>
                                <input
                                    type="number"
                                    id="maxTokens"
                                    name="maxTokens"
                                    min="1"
                                    max="4000"
                                    value={maxTokens}
                                    onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="prompt" className="block text-sm font-medium text-gray-700">
                                Prompt
                            </label>
                            <div className="mt-1">
                                <textarea
                                    id="prompt"
                                    name="prompt"
                                    rows={6}
                                    required
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                    placeholder="Enter your prompt here... Be specific and clear about what you want the AI to do."
                                />
                            </div>
                            <p className="mt-2 text-sm text-gray-500">
                                Character count: {prompt.length}
                            </p>
                        </div>

                        {error && (
                            <div className="rounded-md bg-red-50 p-4">
                                <div className="text-red-800 text-sm">
                                    <strong>Error:</strong> {error}
                                </div>
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading || !selectedModel || !prompt.trim()}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Processing...
                                    </>
                                ) : (
                                    'Submit Query'
                                )}
                            </button>

                            {prompt.trim() && (
                                <button
                                    type="button"
                                    onClick={() => setPrompt('')}
                                    className="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>

            {response && (
                <div className="bg-white shadow sm:rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                Response
                            </h3>
                            <button
                                onClick={() => navigator.clipboard.writeText(response)}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Copy
                            </button>
                        </div>
                        <div className="mt-4">
                            <div className="bg-gray-50 p-4 rounded-md border">
                                <pre className="whitespace-pre-wrap text-sm text-gray-900 font-mono">
                                    {response}
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}