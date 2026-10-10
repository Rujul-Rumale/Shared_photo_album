import axios, { AxiosError } from 'axios';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sa_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('sa_token');
      localStorage.removeItem('sa_user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Auth API
// NOTE: googleAuth posts a Google ID token. The bundled AuthModal sends a
// mock token for local development - wire up Google Identity Services
// (https://developers.google.com/identity) for production use.
export const authApi = {
  googleAuth: (token: string, inviteCode?: string) =>
    api.post('/auth/google', { token, invite_code: inviteCode }),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data: { name?: string; avatar_url?: string }) =>
    api.patch('/auth/me', data),
  linkPersonalEmail: (personalEmail: string) =>
    api.post('/auth/link-personal-email', { personal_email: personalEmail }),
  refresh: () => api.post('/auth/refresh'),
};

// Albums API
export const albumsApi = {
  list: (params?: { tag?: string; search?: string }) =>
    api.get('/albums', { params }),
  getBySlug: (slug: string) => api.get(`/albums/${slug}`),
  create: (data: unknown) => api.post('/albums', data),
  update: (id: string, data: unknown) => api.patch(`/albums/${id}`, data),
  delete: (id: string) => api.delete(`/albums/${id}`),
};

// Media API
export const mediaApi = {
  upload: (formData: FormData) =>
    api.post('/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  initUpload: (data: unknown) => api.post('/media/upload/init', data),
  list: (params?: { album_id?: string; contributor_id?: string; status?: string; page?: number; per_page?: number }) =>
    api.get('/media', { params }),
  listPending: (params?: { page?: number; per_page?: number }) =>
    api.get('/media/pending', { params }),
  moderate: (id: string, data: { status: string; album_id?: string; reason?: string }) =>
    api.post(`/media/${id}/moderate`, data),
  delete: (id: string) => api.delete(`/media/${id}`),
};

// Capsule API
export const capsuleApi = {
  getStatus: () => api.get('/capsule/status'),
  list: (includeSealed?: boolean) =>
    api.get('/capsule', { params: { include_sealed: includeSealed } }),
  create: (data: unknown) => api.post('/capsule', data),
  update: (id: string, data: unknown) => api.patch(`/capsule/${id}`, data),
  seal: () => api.post('/capsule/seal'),
  reveal: () => api.post('/capsule/reveal'),
};

// Admin API
export const adminApi = {
  getStats: () => api.get('/admin/stats'),
  listUsers: () => api.get('/admin/users'),
  getStorageHealth: () => api.get('/admin/storage/health'),
  promoteUser: (userId: string, role: string) =>
    api.post(`/admin/users/${userId}/promote`, { role }),
};

// Invites API
export const invitesApi = {
  generate: (count: number) => api.post('/invites/generate', { count }),
  list: () => api.get('/invites'),
};
