/**
 * Sangam - Authentication Service Bridge
 * Communicates strictly with backend Express API (/api/auth) with JWT session management
 */
import { api, authApi } from '../services/api.js';

const listeners = new Set();
let cachedUser = null;

function notifyListeners(user) {
  cachedUser = user;
  listeners.forEach(cb => {
    try {
      cb(user);
    } catch (e) {
      console.error('Auth listener error:', e);
    }
  });
}

export function onAuthStateChanged(callback) {
  listeners.add(callback);
  getCurrentUser().then(user => callback(user));

  return () => {
    listeners.delete(callback);
  };
}

export async function getCurrentUser() {
  const token = localStorage.getItem('sangam_token');
  const currentId = localStorage.getItem('sangam_current_user_id');

  if (!token && !currentId) {
    cachedUser = null;
    return null;
  }

  try {
    const res = await authApi.getCurrentUser();
    const user = res?.user || res;
    if (user && user.id) {
      cachedUser = user;
      return user;
    }
  } catch (err) {
    console.warn('Session check note:', err.message);
  }

  return cachedUser;
}

export async function signup(userData) {
  const res = await authApi.register(userData);
  const user = res?.user || res;
  if (res?.token) {
    localStorage.setItem('sangam_token', res.token);
  }
  if (user?.id) {
    localStorage.setItem('sangam_current_user_id', user.id);
  }
  notifyListeners(user);
  return user;
}

export async function login(email, password) {
  const res = await authApi.login({ email, password });
  const user = res?.user || res;
  if (res?.token) {
    localStorage.setItem('sangam_token', res.token);
  }
  if (user?.id) {
    localStorage.setItem('sangam_current_user_id', user.id);
  }
  notifyListeners(user);
  return user;
}

export async function logout() {
  localStorage.removeItem('sangam_token');
  localStorage.removeItem('sangam_current_user_id');
  cachedUser = null;
  notifyListeners(null);
}

export async function switchDemoUser(userId) {
  const demoUsers = await authApi.getDemoUsers();
  const user = demoUsers.find(u => u.id === userId);
  if (user) {
    if (user.token) {
      localStorage.setItem('sangam_token', user.token);
    }
    localStorage.setItem('sangam_current_user_id', user.id);
    notifyListeners(user);
    return user;
  }
  throw new Error('Demo persona not found');
}
