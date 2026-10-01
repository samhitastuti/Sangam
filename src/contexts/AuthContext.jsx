/**
 * Sangam - Authentication Context
 * Relies directly on Express REST API & SQL persistence
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, userApi } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allDemoUsers, setAllDemoUsers] = useState([]);

  // Restore authenticated session from backend or guest profile on mount
  const restoreSession = useCallback(async () => {
    const token = localStorage.getItem('sangam_token');
    const storedUserId = localStorage.getItem('sangam_current_user_id');

    // If active guest student session without token, restore from local state
    if (storedUserId === 'user_guest_student' && !token) {
      try {
        const savedGuest = localStorage.getItem('sangam_guest_profile');
        if (savedGuest) {
          const parsed = JSON.parse(savedGuest);
          setCurrentUser(parsed);
          setLoading(false);
          return;
        }
      } catch (e) {}
    }

    if (token || storedUserId) {
      try {
        const response = await authApi.getCurrentUser();
        const user = response?.user || response;
        if (user && user.id) {
          // Normalize skills to array
          if (typeof user.skills === 'string') {
            user.skills = user.skills.split(',').map(s => s.trim()).filter(Boolean);
          } else if (!Array.isArray(user.skills)) {
            user.skills = [];
          }
          // If this was guest student, keep isGuest flag
          if (user.id === 'user_guest_student') {
            user.isGuest = true;
          }
          setCurrentUser(user);
          localStorage.setItem('sangam_current_user_id', user.id);
        } else {
          setCurrentUser(null);
        }
      } catch (err) {
        console.warn('Session restore note:', err.message);
        // If expired, clear
        localStorage.removeItem('sangam_token');
        localStorage.removeItem('sangam_current_user_id');
        setCurrentUser(null);
      }
    } else {
      setCurrentUser(null);
    }

    try {
      const demoUsers = await authApi.getDemoUsers();
      setAllDemoUsers(Array.isArray(demoUsers) ? demoUsers : []);
    } catch {
      // ignore in offline/initial boot
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const register = async (formData) => {
    setLoading(true);
    try {
      const isUpgrading = currentUser?.isGuest || currentUser?.id === 'user_guest_student';
      const payload = {
        ...formData,
        upgradeGuest: isUpgrading,
        guestUserId: isUpgrading ? 'user_guest_student' : undefined
      };
      const result = await authApi.register(payload);
      const user = result.user || result;
      const token = result.token;

      if (token) {
        localStorage.setItem('sangam_token', token);
      }
      if (user?.id) {
        localStorage.setItem('sangam_current_user_id', user.id);
      }
      localStorage.removeItem('sangam_guest_profile');
      setCurrentUser(user);

      // Refresh demo users
      try {
        const updatedList = await authApi.getDemoUsers();
        setAllDemoUsers(Array.isArray(updatedList) ? updatedList : []);
      } catch {
        // ignore
      }

      return user;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const isUpgrading = currentUser?.isGuest || currentUser?.id === 'user_guest_student';
      const result = await authApi.login({
        email,
        password,
        upgradeGuest: isUpgrading,
        guestUserId: isUpgrading ? 'user_guest_student' : undefined
      });
      const user = result.user || result;
      const token = result.token;

      if (token) {
        localStorage.setItem('sangam_token', token);
      }
      if (user?.id) {
        localStorage.setItem('sangam_current_user_id', user.id);
      }
      localStorage.removeItem('sangam_guest_profile');
      setCurrentUser(user);
      return user;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    localStorage.removeItem('sangam_token');
    localStorage.removeItem('sangam_current_user_id');
    localStorage.removeItem('sangam_guest_profile');
    setCurrentUser(null);
  };

  const switchDemo = async (userId) => {
    setLoading(true);
    try {
      const demoUsers = await authApi.getDemoUsers();
      const target = demoUsers.find(u => u.id === userId);
      if (target) {
        if (target.token) {
          localStorage.setItem('sangam_token', target.token);
        }
        localStorage.setItem('sangam_current_user_id', target.id);
        setCurrentUser(target);
        return target;
      }
    } catch (err) {
      console.error('Demo switch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Quick 1-click authentication into the Official Student Guest Profile
  // Includes demo data: name, college, city (from selected city), squad, drives joined, volunteer hours, badges, and sample certificate
  const loginAsGuestStudent = async (cityOverride) => {
    setLoading(true);
    let chosenCity = cityOverride;
    if (!chosenCity) {
      try {
        const savedLoc = localStorage.getItem('sangam_location_choice');
        if (savedLoc) {
          const parsed = JSON.parse(savedLoc);
          if (parsed?.city) chosenCity = parsed.city;
        }
      } catch (e) {}
    }
    if (!chosenCity) chosenCity = 'Chennai';

    try {
      const demoUsers = await authApi.getDemoUsers();
      const target = Array.isArray(demoUsers) ? demoUsers.find(u => u.id === 'user_guest_student') : null;
      const baseUser = target || {
        id: 'user_guest_student',
        name: 'Guest Student',
        email: 'guest.student@srmist.edu.in',
        role: 'student',
        college: 'SRM Kattankulathur (KTR)',
        course: 'B.Tech Computer Science & Engineering'
      };

      const guestProfile = {
        ...baseUser,
        name: 'Guest Student',
        isGuest: true,
        homeCity: chosenCity,
        home_city: chosenCity,
        college: 'SRM Kattankulathur (KTR)',
        squad: `${chosenCity} Community Action Squad`,
        drivesJoined: 4,
        volunteerHours: 38,
        badges: ['🌟 First Responder', '🎓 Collegiate Squad Lead', '🌿 Eco Action Pioneer', '📱 Digital Literacy Mentor'],
        skills: ['Digital Literacy', 'Environmental Action', 'Animal Care', 'First Aid', 'STEM Mentorship'],
        sampleCertificates: [
          {
            id: 'SAN-2026-SRM-GUEST-01',
            title: 'Rural Community Health & Literacy Clinic',
            org: 'SRM Community Action & Outreach Cell',
            hours: 16,
            date: '13 September 2026',
            applicationId: 'app_guest_health_comp',
            category: 'Healthcare & Wellness'
          },
          {
            id: 'SAN-2026-SRM-GUEST-02',
            title: 'Wetland & Lake Restoration Ecological Drive',
            org: 'Environmental Foundation of India (EFI)',
            hours: 12,
            date: '28 August 2026',
            applicationId: 'app_guest_lake_comp',
            category: 'Environment & Ecology'
          },
          {
            id: 'SAN-2026-SRM-GUEST-03',
            title: 'Digital Safety & Smartphone Literacy for Elders',
            org: 'Kattankulathur Civic Volunteers',
            hours: 10,
            date: '05 August 2026',
            applicationId: 'app_guest_digital_comp',
            category: 'Education & Literacy'
          }
        ],
        sampleCertificate: {
          id: 'SAN-2026-SRM-GUEST-01',
          title: 'Rural Community Health & Literacy Clinic',
          org: 'SRM Community Action & Outreach Cell',
          hours: 16,
          date: 'September 2026',
          applicationId: 'app_guest_health_comp'
        },
        bio: 'Official Student Guest profile for exploring collegiate squads, geofenced QR check-ins, and verified impact credentials.'
      };

      if (target?.token) {
        localStorage.setItem('sangam_token', target.token);
      }
      localStorage.setItem('sangam_current_user_id', 'user_guest_student');
      localStorage.setItem('sangam_guest_profile', JSON.stringify(guestProfile));
      setCurrentUser(guestProfile);
      return guestProfile;
    } catch (err) {
      console.warn('Guest login notice:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshUserProfile = async () => {
    try {
      const res = await userApi.getMe();
      const fresh = res?.user || res;
      if (fresh) {
        if (typeof fresh.skills === 'string') {
          fresh.skills = fresh.skills.split(',').map(s => s.trim()).filter(Boolean);
        } else if (!Array.isArray(fresh.skills)) {
          fresh.skills = [];
        }
        setCurrentUser(fresh);
      }
    } catch (e) {
      console.warn('Profile refresh notice:', e);
    }
  };

  const value = {
    currentUser,
    loading,
    signup: register,
    register,
    login,
    logout,
    switchDemo,
    loginAsGuestStudent,
    refreshUserProfile,
    allDemoUsers,
    isStudent: currentUser?.role === 'student',
    isOrg: currentUser?.role === 'organization',
    isGuestStudent: currentUser?.id === 'user_guest_student' || Boolean(currentUser?.isGuest)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
