import { create } from 'zustand';
import { adminAuthAPI } from '../lib/api';
import toast from 'react-hot-toast';

interface AdminUser {
    id: string;
    name: string;
    email: string;
    role: 'officer' | 'manager' | 'super_admin';
}

interface AuthState {
    user: AdminUser | null;
    accessToken: string | null;
    refreshToken: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;

    // Actions
    login: (email: string, password: string) => Promise<void>;
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
            const user = localStorage.getItem('adminUser');
            const accessToken = localStorage.getItem('adminAccessToken');
            const refreshToken = localStorage.getItem('adminRefreshToken');

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
            const response = await adminAuthAPI.login({ email, password });
            const { admin, accessToken, refreshToken } = response.data;

            // Store in localStorage
            localStorage.setItem('adminUser', JSON.stringify(admin));
            localStorage.setItem('adminAccessToken', accessToken);
            localStorage.setItem('adminRefreshToken', refreshToken);

            set({
                user: admin,
                accessToken,
                refreshToken,
                isAuthenticated: true,
                isLoading: false,
            });

            toast.success(`Welcome back, ${admin.name}!`);
        } catch (error: any) {
            set({ isLoading: false });
            const message = error.response?.data?.message || 'Login failed';
            toast.error(message);
            throw error;
        }
    },

    logout: async () => {
        const { refreshToken } = get();
        try {
            if (refreshToken) {
                await adminAuthAPI.logout(refreshToken);
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Clear state and localStorage
            localStorage.removeItem('adminUser');
            localStorage.removeItem('adminAccessToken');
            localStorage.removeItem('adminRefreshToken');

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
