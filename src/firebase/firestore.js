/**
 * Sangam - Data Service Bridge
 * Connects all UI components to the Express SQLite backend API endpoints
 */
import { api } from '../services/api.js';

export function initDB() {
  // Triggers health check to verify backend connectivity
  return api.get('/health').catch(() => null);
}

export async function resetDatabaseToDefaults() {
  return true;
}

export async function getUserById(userId) {
  if (!userId) return null;
  try {
    const user = await api.get(`/users/profile/${userId}`);
    return user;
  } catch {
    const all = await getAllUsers();
    return all.find(u => u.id === userId) || null;
  }
}

export async function getAllUsers() {
  try {
    const users = await api.get('/auth/demo-users');
    return users || [];
  } catch (err) {
    console.error('Failed to get users:', err);
    return [];
  }
}

export async function getUsersByIds(userIds = []) {
  const all = await getAllUsers();
  return all.filter(u => userIds.includes(u.id));
}

export async function updateUserProfile(userId, updates) {
  try {
    const updated = await api.patch('/users/profile', updates);
    return updated;
  } catch (err) {
    console.error('Failed to update profile:', err);
    throw err;
  }
}

export async function getOpportunities(filters = {}) {
  try {
    const params = {};
    if (filters.city && filters.city !== 'All') params.city = filters.city;
    if (filters.status && filters.status !== 'All') params.status = filters.status;
    if (filters.skill && filters.skill !== 'All') params.skill = filters.skill;
    if (filters.selectedSkill && filters.selectedSkill !== 'All') params.skill = filters.selectedSkill;
    if (filters.orgId) params.orgId = filters.orgId;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    if (filters.onlySrm) params.campus = 'SRM';
    if (filters.campus) params.campus = filters.campus;
    if (filters.search) params.search = filters.search;

    const opps = await api.get('/opportunities', params);
    return opps || [];
  } catch (err) {
    console.error('Failed to get opportunities:', err);
    return [];
  }
}

export async function getOpportunityById(oppId) {
  if (!oppId) return null;
  try {
    const opp = await api.get(`/opportunities/${oppId}`);
    return opp;
  } catch (err) {
    console.error('Failed to get opportunity:', err);
    return null;
  }
}

export async function createOpportunity(oppData) {
  try {
    const created = await api.post('/opportunities', oppData);
    return created;
  } catch (err) {
    console.error('Failed to create opportunity:', err);
    throw err;
  }
}

export async function updateOpportunity(oppId, updates) {
  try {
    const updated = await api.patch(`/opportunities/${oppId}`, updates);
    return updated;
  } catch (err) {
    console.error('Failed to update opportunity:', err);
    throw err;
  }
}

export async function closeOpportunity(oppId) {
  return updateOpportunity(oppId, { status: 'closed' });
}

export async function applyToOpportunity(userId, opportunityId) {
  try {
    const res = await api.post('/applications', { opportunityId });
    return res;
  } catch (err) {
    console.error('Failed to apply:', err);
    throw err;
  }
}

export async function withdrawApplication(applicationId, teamId, userId, opportunityId) {
  try {
    const res = await api.post(`/applications/${applicationId}/withdraw`);
    return res;
  } catch (err) {
    console.error('Failed to withdraw application:', err);
    throw err;
  }
}

export async function getApplicationsByUser(userId) {
  if (!userId) return [];
  try {
    const apps = await api.get('/applications', { userId });
    return apps || [];
  } catch (err) {
    console.error('Failed to get applications by user:', err);
    return [];
  }
}

export async function getApplicationByOpportunityAndUser(opportunityId, userId) {
  try {
    const apps = await api.get('/applications', { opportunityId, userId });
    return apps && apps.length > 0 ? apps[0] : null;
  } catch (err) {
    console.error('Failed to get application:', err);
    return null;
  }
}

export async function getApplicationsByOpportunity(opportunityId) {
  if (!opportunityId) return [];
  try {
    const apps = await api.get('/applications', { opportunityId });
    return apps || [];
  } catch (err) {
    console.error('Failed to get applications by opportunity:', err);
    return [];
  }
}

export async function getTeamsByOpportunity(opportunityId) {
  if (!opportunityId) return [];
  try {
    const teams = await api.get(`/teams/opportunity/${opportunityId}`);
    return teams || [];
  } catch (err) {
    console.error('Failed to get teams:', err);
    return [];
  }
}

export async function getTeamById(teamId) {
  if (!teamId) return null;
  try {
    const team = await api.get(`/teams/${teamId}`);
    return team;
  } catch (err) {
    console.error('Failed to get team by id:', err);
    return null;
  }
}

export async function markApplicationComplete(applicationId) {
  try {
    const updated = await api.patch(`/applications/${applicationId}`, { status: 'completed' });
    return updated;
  } catch (err) {
    console.error('Failed to mark complete:', err);
    throw err;
  }
}

export async function getDistinctCities() {
  try {
    const cities = await api.get('/opportunities/distinct-cities');
    return cities || [];
  } catch {
    return ['Chennai', 'Delhi', 'Bengaluru', 'Mumbai'];
  }
}

export async function getDistinctSkills() {
  try {
    const skills = await api.get('/opportunities/distinct-skills');
    return skills || [];
  } catch {
    return ['Digital Literacy', 'Teaching', 'Environmental Action', 'Community Mobilization', 'Event Planning'];
  }
}

export async function getStories() {
  try {
    const stories = await api.get('/stories');
    return stories || [];
  } catch (err) {
    console.error('Failed to get stories:', err);
    return [];
  }
}

export async function getStoryById(idOrSlug) {
  try {
    const story = await api.get(`/stories/${idOrSlug}`);
    return story;
  } catch (err) {
    console.error('Failed to get story:', err);
    return null;
  }
}

export async function createStory(storyData) {
  try {
    const story = await api.post('/stories', storyData);
    return story;
  } catch (err) {
    console.error('Failed to create story:', err);
    throw err;
  }
}

export async function getAllSquadsNetwork() {
  try {
    const network = await api.get('/teams/network');
    return network?.squads || [];
  } catch (err) {
    console.error('Failed to get squads network:', err);
    return [];
  }
}
