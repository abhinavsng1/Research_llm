'use client';

import { useState } from 'react';

export default function Home() {
    const [prompt, setPrompt] = useState('');
    const [response, setResponse] = useState(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Submitting prompt:', prompt); // Debug log

        try {
            const res = await fetch('http://localhost:8000/llm/query', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ prompt: prompt })
            });
            console.log('Response status:', res.status); // Debug log
            const data = await res.json();
            console.log('Response data:', data); // Debug log
            setResponse(data);
        } catch (error) {
            console.error('Error:', error); // Debug log
            setResponse({ error: 'Failed to get response' });
        }
    };

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">ResearchLLM Pro Demo</h1>
            <form onSubmit={handleSubmit} className="mb-4">
                <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Enter your prompt"
                    className="border p-2 mr-2"
                />
                <button type="submit" className="bg-blue-500 text-white p-2 rounded">Submit</button>
            </form>
            {response && (
                <div className="border p-4 rounded">
                    <h2 className="font-bold">Response:</h2>
                    <pre>{JSON.stringify(response, null, 2)}</pre>
                </div>
            )}
        </div>
    );
} 