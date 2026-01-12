const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

const request = async (method: string, endpoint: string, body?: any) => {
    const token = localStorage.getItem('auth-storage')
        ? JSON.parse(localStorage.getItem('auth-storage')!).state.token
        : null;

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    console.log(`[API] ${method} ${endpoint}`, body ? body : '');

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error(`[API Error] ${response.status} ${endpoint}`, errorData);

            if (response.status === 401 || response.status === 403) {
                // Optional: Trigger logout
            }
            throw new Error(errorData.error || errorData.message || `API Error: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`[API Response] ${endpoint}`, data);
        return data;
    } catch (error) {
        console.error(`[Network Error] ${endpoint}`, error);
        throw error;
    }
};

export const apiClient = {
    get: (endpoint: string) => request('GET', endpoint),
    post: (endpoint: string, body: any) => request('POST', endpoint, body),
    put: (endpoint: string, body: any) => request('PUT', endpoint, body),
    patch: (endpoint: string, body: any) => request('PATCH', endpoint, body),
    delete: (endpoint: string) => request('DELETE', endpoint),
};
