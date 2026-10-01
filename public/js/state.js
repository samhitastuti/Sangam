// public/js/state.js
// Client-side authentication and session store

import { api } from './api.js';

let currentUser = null;
try {
  const stored = localStorage.getItem('sangam_user');
  if (stored) currentUser = JSON.parse(stored);
} catch (e) {
  // ignore
}

const listeners = new Set();

export function getCurrentUser() {
  return currentUser;
}

export function setCurrentUser(user) {
  currentUser = user;
  if (user) {
    localStorage.setItem('sangam_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('sangam_user');
    localStorage.removeItem('sangam_token');
  }
  listeners.forEach(fn => fn(currentUser));
}

export function onUserChange(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export async function refreshUser() {
  const token = localStorage.getItem('sangam_token');
  if (!token) {
    setCurrentUser(null);
    return null;
  }
  try {
    const user = await api.get('/users/me');
    setCurrentUser(user);
    return user;
  } catch (err) {
    setCurrentUser(null);
    return null;
  }
}

export async function switchDemoUser(userId) {
  const { token, user } = await api.post('/auth/demo-switch', { userId });
  localStorage.setItem('sangam_token', token);
  setCurrentUser(user);
  return user;
}
