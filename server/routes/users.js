import express from 'express';
import { getDb } from '../db.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = express.Router();

function sanitizeUser(u) {
  if (!u) return null;
  const { password_hash, ...safe } = u;
  return {
    ...safe,
    skills: safe.skills ? safe.skills.split(',').map(s => s.trim()).filter(Boolean) : []
  };
}

/**
 * GET /api/users/me
 * Returns full profile of logged-in user
 */
router.get('/me', requireAuth, async (req, res) => {
  try {
    const db = await getDb();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' }
      });
    }

    res.json({
      success: true,
      data: sanitizeUser(user)
    });
  } catch (err) {
    console.error('Error fetching user profile:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve profile' }
    });
  }
});

/**
 * PATCH /api/users/me
 * Updates current user profile with role-appropriate validation
 */
router.patch('/me', requireAuth, async (req, res) => {
  try {
    const db = await getDb();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' }
      });
    }

    const {
      name,
      city,
      homeCity,
      home_city,
      college,
      skills,
      bio,
      course,
      organization_name,
      organizationName,
      organization_city,
      organizationCity,
      organization_role,
      organizationRole,
      focus_areas,
      focusAreas
    } = req.body;

    const newName = name !== undefined ? name.trim() : user.name;
    const newCity = (city || homeCity || home_city) !== undefined ? (city || homeCity || home_city).trim() : user.home_city;
    const newBio = bio !== undefined ? bio.trim() : user.bio;
    const newCourse = course !== undefined ? course.trim() : user.course;
    
    let newSkills = user.skills;
    if (skills !== undefined) {
      newSkills = Array.isArray(skills) ? skills.join(', ') : skills;
    }

    let newCollege = user.college;
    if (user.role === 'student' && college !== undefined) {
      newCollege = college.trim();
    }

    let newOrgName = user.organization_name;
    let newOrgCity = user.organization_city;
    let newOrgRole = user.organization_role;
    let newFocusAreas = user.focus_areas;

    if (user.role === 'organization') {
      if (organization_name || organizationName) newOrgName = (organization_name || organizationName).trim();
      if (organization_city || organizationCity) newOrgCity = (organization_city || organizationCity).trim();
      if (organization_role || organizationRole) newOrgRole = (organization_role || organizationRole).trim();
      if (focus_areas || focusAreas) newFocusAreas = (focus_areas || focusAreas).trim();
    }

    const updateStmt = db.prepare(`
      UPDATE users SET
        name = ?,
        home_city = ?,
        college = ?,
        skills = ?,
        bio = ?,
        course = ?,
        organization_name = ?,
        organization_city = ?,
        organization_role = ?,
        focus_areas = ?
      WHERE id = ?
    `);

    updateStmt.run(
      newName,
      newCity,
      newCollege,
      newSkills,
      newBio,
      newCourse,
      newOrgName,
      newOrgCity,
      newOrgRole,
      newFocusAreas,
      user.id
    );

    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);

    res.json({
      success: true,
      data: sanitizeUser(updated)
    });
  } catch (err) {
    console.error('Error updating user profile:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to update profile' }
    });
  }
});

/**
 * GET /api/users/me/applications
 * Returns all opportunities applied to by current user
 */
router.get('/me/applications', requireAuth, async (req, res) => {
  try {
    const db = await getDb();
    const rows = db.prepare(`
      SELECT 
        a.id as application_id,
        a.status as application_status,
        a.applied_at,
        a.completed_at,
        a.volunteer_hours,
        a.hours_logged,
        a.completion_date,
        a.certificate_id,
        a.certificate_hash,
        o.id as opportunity_id,
        o.title,
        o.description,
        o.city,
        o.date,
        o.duration,
        o.hours,
        o.category,
        o.image,
        org.name as org_name,
        t.id as team_id,
        t.team_name,
        t.college as team_college
      FROM applications a
      JOIN opportunities o ON a.opportunity_id = o.id
      JOIN users org ON o.org_id = org.id
      LEFT JOIN teams t ON a.team_id = t.id
      WHERE a.user_id = ?
      ORDER BY a.applied_at DESC
    `).all(req.user.id);

    const applications = rows.map(r => ({
      id: r.application_id,
      status: r.application_status,
      appliedAt: r.applied_at,
      completedAt: r.completed_at || r.completion_date,
      volunteerHours: r.volunteer_hours || r.hours_logged || 0,
      certificateId: r.certificate_id,
      certificateHash: r.certificate_hash,
      opportunity: {
        id: r.opportunity_id,
        title: r.title,
        description: r.description,
        city: r.city,
        date: r.date,
        duration: r.duration,
        hours: r.hours,
        category: r.category,
        image: r.image,
        orgName: r.org_name
      },
      team: r.team_id ? {
        id: r.team_id,
        name: r.team_name,
        college: r.team_college
      } : null
    }));

    res.json({
      success: true,
      data: applications
    });
  } catch (err) {
    console.error('Error fetching my applications:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve applications' }
    });
  }
});

/**
 * GET /api/users/me/teams
 * Returns all collegiate squads the current student is enrolled in
 */
router.get('/me/teams', requireAuth, async (req, res) => {
  try {
    const db = await getDb();
    const teams = db.prepare(`
      SELECT 
        t.id,
        t.team_name,
        t.college,
        t.city,
        t.opportunity_id,
        o.title as opportunity_title,
        o.date as opportunity_date,
        tm.joined_via,
        tm.joined_at,
        (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) as member_count
      FROM team_members tm
      JOIN teams t ON tm.team_id = t.id
      JOIN opportunities o ON t.opportunity_id = o.id
      WHERE tm.user_id = ?
      ORDER BY tm.joined_at DESC
    `).all(req.user.id);

    res.json({
      success: true,
      data: teams
    });
  } catch (err) {
    console.error('Error fetching my teams:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve enrolled teams' }
    });
  }
});

/**
 * GET /api/users/me/certificates
 * Returns completed records with verifiable certificate details
 */
router.get('/me/certificates', requireAuth, async (req, res) => {
  try {
    const db = await getDb();
    const rows = db.prepare(`
      SELECT 
        a.id as application_id,
        a.certificate_id,
        a.certificate_hash,
        a.volunteer_hours,
        a.hours_logged,
        a.completion_date,
        a.completed_at,
        u.name as student_name,
        u.college as student_college,
        o.title as opportunity_title,
        o.category as opportunity_category,
        org.name as organization_name,
        org.organization_name as org_display_name
      FROM applications a
      JOIN users u ON a.user_id = u.id
      JOIN opportunities o ON a.opportunity_id = o.id
      JOIN users org ON o.org_id = org.id
      WHERE a.user_id = ? AND a.status = 'completed' AND (a.certificate_id != '' OR a.completed_at IS NOT NULL)
      ORDER BY a.applied_at DESC
    `).all(req.user.id);

    const certs = rows.map(r => ({
      id: r.certificate_id,
      applicationId: r.application_id,
      studentName: r.student_name,
      college: r.student_college,
      opportunityTitle: r.opportunity_title,
      organizationName: r.org_display_name || r.organization_name,
      completionDate: r.completed_at || r.completion_date,
      volunteerHours: r.volunteer_hours || r.hours_logged || 10,
      certificateHash: r.certificate_hash
    }));

    res.json({
      success: true,
      data: certs
    });
  } catch (err) {
    console.error('Error fetching certificates:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve certificates' }
    });
  }
});

/**
 * GET /api/users/leaderboard
 * Campus leaderboard aggregated across verified volunteer hours
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const db = await getDb();
    const campusStats = db.prepare(`
      SELECT 
        u.college,
        COUNT(DISTINCT u.id) as student_count,
        COUNT(DISTINCT a.id) as applications_count,
        SUM(CASE WHEN a.status = 'completed' THEN COALESCE(a.volunteer_hours, a.hours_logged, 10) ELSE 0 END) as total_hours
      FROM users u
      LEFT JOIN applications a ON u.id = a.user_id
      WHERE u.role = 'student' AND u.college != ''
      GROUP BY u.college
      ORDER BY total_hours DESC, student_count DESC
    `).all();

    res.json({
      success: true,
      data: campusStats
    });
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to load leaderboard' }
    });
  }
});

export default router;
