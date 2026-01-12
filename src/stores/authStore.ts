import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '../api/client';

export interface User {
    id: string;
    username: string;
}

interface AuthState {
    user: User | null;
    token: string | null;

    login: (username: string, password: string) => Promise<boolean>;
    register: (username: string, password: string) => Promise<boolean>;
    logout: () => void;
    checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,

            login: async (username, password) => {
                console.log('[Store] Logging in:', username);
                try {
                    const data = await apiClient.post('/auth/login', { username, password });
                    set({ user: data.user, token: data.accessToken });
                    return true;
                } catch (error) {
                    console.error('Login action failed:', error);
                    // Re-throw so component can show specific message
                    throw error;
                }
            },

            register: async (username, password) => {
                console.log('[Store] Registering user:', username);
                try {
                    await apiClient.post('/auth/register', { username, password });
                    // Auto login after register
                    console.log('[Store] Auto-logging in after registration');
                    const data = await apiClient.post('/auth/login', { username, password });
                    set({ user: data.user, token: data.accessToken });
                    return true;
                } catch (error) {
                    console.error(error);
                    return false;
                }
            },

            logout: () => {
                console.log('[Store] Logging out');
                set({ user: null, token: null });
            },

            checkAuth: async () => {
                console.log('[Store] Checking auth state');
                try {
                    const user = await apiClient.get('/auth/me');
                    set({ user });
                } catch (error) {
                    set({ user: null, token: null });
                }
            }
        }),
        {
            name: 'auth-storage'
        }
    )
);
