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
                try {
                    const data = await apiClient.post('/auth/login', { username, password });
                    set({ user: data.user, token: data.accessToken });
                    return true;
                } catch (error) {
                    console.error(error);
                    return false;
                }
            },

            register: async (username, password) => {
                try {
                    await apiClient.post('/auth/register', { username, password });
                    // Auto login after register
                    const data = await apiClient.post('/auth/login', { username, password });
                    set({ user: data.user, token: data.accessToken });
                    return true;
                } catch (error) {
                    console.error(error);
                    return false;
                }
            },

            logout: () => set({ user: null, token: null }),

            checkAuth: async () => {
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
