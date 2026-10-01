/**
 * Sangam - Centralized REST API Service
 * Connects React frontend directly to Express + SQLite backend
 */

const BASE_URL = '/api';

export async function request(endpoint, options = {}) {
  const token = localStorage.getItem('sangam_token');
  const currentUserId = localStorage.getItem('sangam_current_user_id');

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (currentUserId) {
    headers['x-user-id'] = currentUserId;
  }

  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    const contentType = response.headers.get('content-type');
    let data = null;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const errorMsg = data && data.error && (data.error.message || data.error)
        ? (data.error.message || data.error)
        : (data && data.message ? data.message : `Request failed (${response.status})`);
      throw new Error(errorMsg);
    }

    // Standard JSON unpacker for { success: true, data: ... }
    let result = data;
    if (data && typeof data === 'object' && 'success' in data) {
      if (!data.success) {
        throw new Error(data.error?.message || 'Request failed');
      }
      result = data.data !== undefined ? data.data : data;
      if (result && typeof result === 'object' && !Array.isArray(result)) {
        if (data.summary && !result.summary) result.summary = data.summary;
        if (data.byCollege && !result.byCollege) result.byCollege = data.byCollege;
        if (data.grouped && !result.grouped) result.grouped = data.grouped;
        if (data.token && !result.token) result.token = data.token;
      }
    }

    return result;
  } catch (err) {
    console.error(`API Error [${endpoint}]:`, err);
    throw err;
  }
}

export const api = {
  get: (endpoint, params = {}) => {
    let url = endpoint;
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        query.append(k, v);
      }
    });
    const queryString = query.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
    return request(url, { method: 'GET' });
  },
  post: (endpoint, body = {}) => request(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  patch: (endpoint, body = {}) => request(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (endpoint) => request(endpoint, { method: 'DELETE' })
};

// High-Level Domain API Helper Functions
export const authApi = {
  register: (payload) => api.post('/auth/register', payload),
  login: (credentials) => api.post('/auth/login', credentials),
  getCurrentUser: () => api.get('/auth/me'),
  getDemoUsers: () => api.get('/auth/demo-users')
};

export const referenceApi = {
  getColleges: (params = {}) => api.get('/colleges', params),
  getCities: () => api.get('/cities')
};

export const opportunitiesApi = {
  getOpportunities: (filters = {}) => api.get('/opportunities', filters),
  getOpportunity: (id) => api.get(`/opportunities/${id}`),
  createOpportunity: (data) => api.post('/opportunities', data),
  updateOpportunity: (id, updates) => api.patch(`/opportunities/${id}`, updates),
  deleteOpportunity: (id) => api.delete(`/opportunities/${id}`),
  getOpportunityTeams: (id) => api.get(`/opportunities/${id}/teams`),
  getOpportunityTeamByCollege: (id, college) => api.get(`/opportunities/${id}/teams/${encodeURIComponent(college)}`),
  getApplicants: (id) => api.get(`/opportunities/${id}/applicants`)
};

export const applicationsApi = {
  applyToOpportunity: (opportunityId, statement = '') => api.post('/applications', { opportunityId, statement }),
  getMyApplications: () => api.get('/applications/me'),
  getApplication: (id) => api.get(`/applications/${id}`),
  withdrawApplication: (id) => api.patch(`/applications/${id}/withdraw`),
  completeApplication: (id, volunteerHours) => api.patch(`/applications/${id}/complete`, { volunteerHours }),
  getCertificate: (id) => api.get(`/applications/${id}/certificate`)
};

export const teamsApi = {
  getTeam: (id) => api.get(`/teams/${id}`),
  getMyTeams: () => api.get('/teams/me'),
  getNetwork: () => api.get('/teams/network'),
  getTeamMessages: (id) => api.get(`/teams/${id}/messages`),
  postTeamMessage: (id, message) => api.post(`/teams/${id}/messages`, { message })
};

export const organizationApi = {
  getStats: () => api.get('/organizations/me/stats'),
  getOpportunities: () => api.get('/organizations/me/opportunities'),
  getApplications: () => api.get('/organizations/me/applications'),
  getTeams: () => api.get('/organizations/me/teams'),
  getVerification: () => api.get('/organizations/me/verification'),
  submitVerification: (data) => api.post('/organizations/me/verify-submit', data)
};

export const userApi = {
  getMe: () => api.get('/users/me'),
  updateMe: (data) => api.patch('/users/me', data),
  getMyApplications: () => api.get('/users/me/applications'),
  getMyTeams: () => api.get('/users/me/teams'),
  getMyCertificates: () => api.get('/users/me/certificates'),
  getLeaderboard: () => api.get('/users/leaderboard')
};

export default api;
