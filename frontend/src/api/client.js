// Centralized API client with JWT authorization and error handling
const RAW_API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
const API_BASE = RAW_API_BASE.replace(/\/+$/, '');

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('zentra_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  // If body is FormData, delete Content-Type to let browser set boundary
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage = data?.error || response.statusText || 'An unexpected error occurred.';
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    console.error(`API Error [${endpoint}]:`, err);
    throw err;
  }
}

export const api = {
  get: (endpoint, params = {}) => {
    const queryString = new URLSearchParams(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    ).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return apiRequest(url, { method: 'GET' });
  },
  post: (endpoint, body) => apiRequest(endpoint, {
    method: 'POST',
    body: body instanceof FormData ? body : JSON.stringify(body)
  }),
  put: (endpoint, body) => apiRequest(endpoint, {
    method: 'PUT',
    body: body instanceof FormData ? body : JSON.stringify(body)
  }),
  delete: (endpoint) => apiRequest(endpoint, { method: 'DELETE' })
};

export default api;
