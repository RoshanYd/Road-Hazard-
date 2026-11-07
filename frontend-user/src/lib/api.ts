import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - attach token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
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
                    const refreshToken = localStorage.getItem('refreshToken');
                    if (!refreshToken) {
                        throw new Error('No refresh token');
                    }

                    // Refresh the token
                    const response = await axios.post(`${API_URL}/auth/refresh`, {
                        refreshToken,
                    });

                    const { accessToken } = response.data;
                    localStorage.setItem('accessToken', accessToken);

                    // Retry original request with new token
                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                    return api(originalRequest);
                } catch (refreshError) {
                    // Refresh failed, clear tokens and redirect to login
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                    return Promise.reject(refreshError);
                }
            }
        }

        return Promise.reject(error);
    }
);

// API methods
export const authAPI = {
    register: (data: any) => api.post('/auth/register', data),
    login: (data: any) => api.post('/auth/login', data),
    logout: (refreshToken: string) => api.post('/auth/logout', { refreshToken }),
};

export const reportAPI = {
    submit: (formData: FormData) =>
        api.post('/reports', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
    getMyReports: (params?: any) => api.get('/reports/my', { params }),
    getReport: (id: string) => api.get(`/reports/${id}`),
    getPublicReports: (params?: any) => api.get('/reports/public/map', { params }),
};

export const notificationAPI = {
    getNotifications: (params?: any) => api.get('/notifications', { params }),
    getUnreadCount: () => api.get('/notifications/unread-count'),
    markAsRead: (id: string) => api.put(`/notifications/${id}/read`),
    markAllAsRead: () => api.put('/notifications/mark-all-read'),
};

export const aiAPI = {
    classifyImage: (image: string) => api.post('/ai/classify', { image }),
};

export default api;
