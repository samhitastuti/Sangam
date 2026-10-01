/**
 * Sangam - Firebase / Storage Configuration
 * Provides client-side state persistence matching Firestore schema and Auth interfaces.
 */

export const firebaseConfig = {
  apiKey: "mock-sangam-api-key",
  authDomain: "sangam-app.firebaseapp.com",
  projectId: "sangam-app",
  storageBucket: "sangam-app.appspot.com",
  messagingSenderId: "989cc0f0",
  appId: "sangam-web-client"
};

// In-memory / LocalStorage database keys
export const STORAGE_KEYS = {
  USERS: 'sangam_users',
  OPPORTUNITIES: 'sangam_opportunities',
  APPLICATIONS: 'sangam_applications',
  TEAMS: 'sangam_teams',
  CURRENT_USER_ID: 'sangam_current_user_id'
};
