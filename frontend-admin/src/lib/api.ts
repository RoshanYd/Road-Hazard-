import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create axios instance for admin
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - attach admin token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('adminAccessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - handle token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If error is 401 and we haven't retried yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            // Check if it's a token expiration
            if (error.response?.data?.code === 'TOKEN_EXPIRED') {
                try {
                    const refreshToken = localStorage.getItem('adminRefreshToken');
                    if (!refreshToken) {
                        throw new Error('No refresh token');
                    }

                    // Refresh the admin token
                    const response = await axios.post(`${API_URL}/admin/auth/refresh`, {
                        refreshToken,
                    });

                    const { accessToken } = response.data;
                    localStorage.setItem('adminAccessToken', accessToken);

                    // Retry original request with new token
                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                    return api(originalRequest);
                } catch (refreshError) {
                    // Refresh failed, clear tokens and redirect to login
                    localStorage.removeItem('adminAccessToken');
                    localStorage.removeItem('adminRefreshToken');
                    localStorage.removeItem('adminUser');
                    window.location.href = '/login';
                    return Promise.reject(refreshError);
                }
            }
        }

        return Promise.reject(error);
    }
);

// Admin API methods
export const adminAuthAPI = {
    login: (data: any) => api.post('/admin/auth/login', data),
    logout: (refreshToken: string) => api.post('/admin/auth/logout', { refreshToken }),
};

export const adminDashboardAPI = {
    getStats: () => api.get('/admin/dashboard/stats'),
    getTrends: (params?: any) => api.get('/admin/dashboard/trends', { params }),
};

export const adminReportAPI = {
    getReports: (params?: any) => api.get('/admin/reports', { params }),
    getReport: (id: string) => api.get(`/admin/reports/${id}`),
    updateStatus: (id: string, data: any) => api.put(`/admin/reports/${id}/status`, data),
    assignReport: (id: string, data: any) => api.put(`/admin/reports/${id}/assign`, data),
    addResponse: (id: string, data: any) => api.post(`/admin/reports/${id}/respond`, data),
    deleteReport: (id: string) => api.delete(`/admin/reports/${id}`),
};

export const adminAuditAPI = {
    getAuditLogs: (params?: any) => api.get('/admin/audit', { params }),
};

export default api;
