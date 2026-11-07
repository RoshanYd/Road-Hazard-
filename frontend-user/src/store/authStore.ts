import { create } from 'zustand';
import { authAPI } from '../lib/api';
import toast from 'react-hot-toast';

interface User {
    id: string;
    name: string;
    email: string;
    phone?: string;
}

interface AuthState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;

    // Actions
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string, phone: string) => Promise<void>;
    logout: () => Promise<void>;
    loadUser: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    accessToken: null,
    refreshToken: null,
    isLoading: false,
    isAuthenticated: false,

    loadUser: () => {
        if (typeof window !== 'undefined') {
            const user = localStorage.getItem('user');
            const accessToken = localStorage.getItem('accessToken');
            const refreshToken = localStorage.getItem('refreshToken');

            if (user && accessToken) {
                set({
                    user: JSON.parse(user),
                    accessToken,
                    refreshToken,
                    isAuthenticated: true,
                });
            }
        }
    },

    login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
            const response = await authAPI.login({ email, password });
            const { user, accessToken, refreshToken } = response.data;

            // Store in localStorage
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);

            set({
                user,
                accessToken,
                refreshToken,
                isAuthenticated: true,
                isLoading: false,
            });

            toast.success('Login successful!');
        } catch (error: any) {
            set({ isLoading: false });
            const message = error.response?.data?.message || 'Login failed';
            toast.error(message);
            throw error;
        }
    },

    register: async (name: string, email: string, password: string, phone: string) => {
        set({ isLoading: true });
        try {
            const response = await authAPI.register({ name, email, password, phone });
            set({ isLoading: false });
            toast.success('Registration successful! Please login.');
        } catch (error: any) {
            set({ isLoading: false });
            const message = error.response?.data?.message || error.response?.data?.errors?.[0]?.message || 'Registration failed';
            toast.error(message);
            throw error;
        }
    },

    logout: async () => {
        const { refreshToken } = get();
        try {
            if (refreshToken) {
                await authAPI.logout(refreshToken);
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Clear state and localStorage
            localStorage.removeItem('user');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');

            set({
                user: null,
                accessToken: null,
                refreshToken: null,
                isAuthenticated: false,
            });

            toast.success('Logged out successfully');
        }
    },
}));
