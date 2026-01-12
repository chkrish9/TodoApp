const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

export const apiClient = {
    get: async (endpoint: string) => {
        const token = localStorage.getItem('auth-storage')
            ? JSON.parse(localStorage.getItem('auth-storage')!).state.token
            : null;

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'GET',
            headers,
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                // Optional: Handle logout
            }
            throw new Error(`API Error: ${response.statusText}`);
        }

        return response.json();
    },

    post: async (endpoint: string, data: any) => {
        const token = localStorage.getItem('auth-storage')
            ? JSON.parse(localStorage.getItem('auth-storage')!).state.token
            : null;

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        return response.json();
    },

    delete: async (endpoint: string) => {
        const token = localStorage.getItem('auth-storage')
            ? JSON.parse(localStorage.getItem('auth-storage')!).state.token
            : null;

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'DELETE',
            headers,
        });

        if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
        return response.json();
    },

    patch: async (endpoint: string, data: any) => {
        const token = localStorage.getItem('auth-storage')
            ? JSON.parse(localStorage.getItem('auth-storage')!).state.token
            : null;

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(data),
        });

        if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
        return response.json();
    }
};
