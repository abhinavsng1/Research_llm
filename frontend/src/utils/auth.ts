//utils/auth.ts

export const getAuthToken = (): string | null => {
    if (typeof window === 'undefined') return null;

    const token = localStorage.getItem('token');

    // Check for invalid token values
    if (!token || token === 'null' || token === 'undefined' || token.trim() === '') {
        return null;
    }

    return token;
};

export const clearAuthData = (): void => {
    if (typeof window === 'undefined') return;

    localStorage.removeItem('token');
    localStorage.removeItem('user');
};

export const isValidToken = (token: string | null): boolean => {
    if (!token || token === 'null' || token === 'undefined') return false;

    // Basic JWT format check (should have 3 parts separated by dots)
    const parts = token.split('.');
    return parts.length === 3;
};

// Use this in your components instead of direct localStorage access
export const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const token = getAuthToken();

    if (!isValidToken(token)) {
        clearAuthData();
        throw new Error('No valid authentication token found. Please log in.');
    }

    const headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
    };

    return fetch(url, {
        ...options,
        headers,
    });
};