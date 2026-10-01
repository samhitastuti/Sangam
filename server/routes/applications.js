import express from 'express';
import crypto from 'crypto';
import { getDb } from '../db.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';

const router = express.Router();

/**
 * POST /api/applications
 * The core Sangam Collegiate Squad Auto-Matching Engine
 * Atomic execution: validates limits -> creates/finds collegiate squad -> binds member & application
 */
router.post('/', requireAuth, requireRole('student'), async (req, res) => {
  try {
    const db = await getDb();
    const userId = req.user.id;
    const { opportunityId, opportunity_id, statement = '' } = req.body;
    const targetOppId = opportunityId || opportunity_id;

    if (!targetOppId) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'opportunityId is required' }
      });
    }

    // 1. Fetch student profile
    const student = db.prepare('SELECT id, name, email, college, home_city, skills FROM users WHERE id = ?').get(userId);
    if (!student) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'Student profile not found' }
      });
    }

    if (!student.college || !student.college.trim()) {
      return res.status(400).json({
        success: false,
        error: { code: 'COLLEGE_REQUIRED', message: 'Please update your profile with your college before applying.' }
      });
    }

    // 2. Fetch opportunity
    const opp = db.prepare('SELECT * FROM opportunities WHERE id = ?').get(targetOppId);
    if (!opp) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Opportunity not found' }
      });
    }

    if (opp.status !== 'open') {
      return res.status(400).json({
        success: false,
        error: { code: 'OPPORTUNITY_CLOSED', message: 'This opportunity is no longer open for new applications.' }
      });
    }

    if (opp.applied_count >= opp.capacity) {
      return res.status(400).json({
        success: false,
        error: { code: 'CAPACITY_REACHED', message: 'This opportunity has reached maximum capacity.' }
      });
    }

    // 3. Check for existing active application
    const existingApp = db.prepare('SELECT * FROM applications WHERE user_id = ? AND opportunity_id = ?').get(userId, opp.id);
    if (existingApp) {
      if (existingApp.status === 'withdrawn') {
        // Re-activating withdrawn application will proceed below
      } else {
        return res.status(409).json({
          success: false,
          error: { code: 'DUPLICATE_APPLICATION', message: 'You have already applied for this programme.' }
        });
      }
    }

    // 4. Atomic Auto-Grouping Transaction
    const executeApplication = db.transaction(() => {
      // Find or create collegiate squad
      let team = db.prepare('SELECT * FROM teams WHERE opportunity_id = ? AND LOWER(college) = LOWER(?)').get(opp.id, student.college);
      let isFirstInTeam = false;

      if (!team) {
        isFirstInTeam = true;
        const newTeamId = `team_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const squadName = `${student.college} Squad`;
        
        db.prepare(`
          INSERT INTO teams (id, opportunity_id, college, city, team_name, created_at)
          VALUES (?, ?, ?, ?, ?, datetime('now'))
        `).run(newTeamId, opp.id, student.college, student.home_city || opp.city, squadName);

        team = db.prepare('SELECT * FROM teams WHERE id = ?').get(newTeamId);
      }

      // Add to team_members
      const existingMember = db.prepare('SELECT * FROM team_members WHERE team_id = ? AND user_id = ?').get(team.id, student.id);
      if (!existingMember) {
        const memberId = `tm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        db.prepare(`
          INSERT OR IGNORE INTO team_members (id, team_id, user_id, joined_via, joined_at)
          VALUES (?, ?, ?, ?, datetime('now'))
        `).run(memberId, team.id, student.id, isFirstInTeam ? 'first to join' : 'auto-match');
      }

      // Create or update application record
      let appId;
      if (existingApp && existingApp.status === 'withdrawn') {
        appId = existingApp.id;
        db.prepare(`
          UPDATE applications SET
            status = 'applied',
            team_id = ?,
            statement = ?,
            applied_at = datetime('now')
          WHERE id = ?
        `).run(team.id, statement, appId);
      } else {
        appId = `app_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        db.prepare(`
          INSERT INTO applications (id, user_id, opportunity_id, team_id, status, statement, applied_at)
          VALUES (?, ?, ?, ?, 'applied', ?, datetime('now'))
        `).run(appId, student.id, opp.id, team.id, statement);
      }

      // Increment applied count
      db.prepare(`
        UPDATE opportunities SET applied_count = applied_count + 1 WHERE id = ?
      `).run(opp.id);

      // Fetch squad roster
      const members = db.prepare(`
        SELECT u.id, u.name, u.college, u.home_city, u.skills, tm.joined_via, tm.joined_at
        FROM team_members tm
        JOIN users u ON tm.user_id = u.id
        WHERE tm.team_id = ?
        ORDER BY tm.joined_at ASC
      `).all(team.id);

      const application = db.prepare('SELECT * FROM applications WHERE id = ?').get(appId);

      return {
        application,
        team: {
          ...team,
          members: members.map(m => ({
            id: m.id,
            name: m.name,
            college: m.college,
            city: m.home_city,
            joinedVia: m.joined_via,
            skills: m.skills ? m.skills.split(',').map(s => s.trim()).filter(Boolean) : []
          }))
        },
        message: `You're part of the ${student.college} team.`
      };
    });

    const result = executeApplication();

    return res.status(201).json({
      success: true,
      data: result
    });
  } catch (err) {
    console.error('Application error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to process application' }
    });
  }
});

/**
 * GET /api/applications/me
 * Returns current authenticated student's applications
 */
router.get('/me', requireAuth, async (req, res) => {
  try {
    const db = await getDb();
    const rows = db.prepare(`
      SELECT 
        a.id as application_id,
        a.status as application_status,
        a.statement,
        a.applied_at,
        a.completed_at,
        a.completion_date,
        a.volunteer_hours,
        a.hours_logged,
        a.certificate_id,
        a.certificate_hash,
        o.id as opportunity_id,
        o.title as opportunity_title,
        o.city as opportunity_city,
        o.date as opportunity_date,
        o.duration as opportunity_duration,
        o.hours as opportunity_hours,
        o.status as opportunity_status,
        org.name as org_name,
        org.organization_name as org_display_name,
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
      statement: r.statement,
      appliedAt: r.applied_at,
      completedAt: r.completed_at || r.completion_date,
      volunteerHours: r.volunteer_hours || r.hours_logged || 0,
      certificateId: r.certificate_id,
      certificateHash: r.certificate_hash,
      opportunity: {
        id: r.opportunity_id,
        title: r.opportunity_title,
        city: r.opportunity_city,
        date: r.opportunity_date,
        duration: r.opportunity_duration,
        hours: r.opportunity_hours,
        status: r.opportunity_status,
        organizationName: r.org_display_name || r.org_name
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
    console.error('Error fetching applications:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve applications' }
    });
  }
});

/**
 * GET /api/applications
 * Query applications by userId or opportunityId
 */
router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const { userId, opportunityId, status } = req.query;

    let query = `
      SELECT 
        a.id as application_id,
        a.status as application_status,
        a.statement,
        a.applied_at,
        a.completed_at,
        a.completion_date,
        a.volunteer_hours,
        a.hours_logged,
        a.certificate_id,
        a.certificate_hash,
        o.id as opportunity_id,
        o.title as opportunity_title,
        o.city as opportunity_city,
        o.date as opportunity_date,
        o.duration as opportunity_duration,
        o.hours as opportunity_hours,
        o.status as opportunity_status,
        org.name as org_name,
        org.organization_name as org_display_name,
        t.id as team_id,
        t.team_name,
        t.college as team_college
      FROM applications a
      JOIN opportunities o ON a.opportunity_id = o.id
      JOIN users org ON o.org_id = org.id
      LEFT JOIN teams t ON a.team_id = t.id
      WHERE 1=1
    `;
    const params = [];

    if (userId) {
      query += ` AND a.user_id = ?`;
      params.push(userId);
    }
    if (opportunityId) {
      query += ` AND a.opportunity_id = ?`;
      params.push(opportunityId);
    }
    if (status) {
      query += ` AND a.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY a.applied_at DESC`;

    const rows = db.prepare(query).all(...params);

    const applications = rows.map(r => ({
      id: r.application_id,
      status: r.application_status,
      statement: r.statement,
      appliedAt: r.applied_at,
      completedAt: r.completed_at || r.completion_date,
      volunteerHours: r.volunteer_hours || r.hours_logged || 0,
      certificateId: r.certificate_id,
      certificateHash: r.certificate_hash,
      opportunity: {
        id: r.opportunity_id,
        title: r.opportunity_title,
        city: r.opportunity_city,
        date: r.opportunity_date,
        duration: r.opportunity_duration,
        hours: r.opportunity_hours,
        status: r.opportunity_status,
        organizationName: r.org_display_name || r.org_name
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
    console.error('Error fetching applications list:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve applications' }
    });
  }
});

/**
 * GET /api/applications/:id
 * Retrieve a specific application by ID
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const db = await getDb();
    const app = db.prepare(`
      SELECT 
        a.*,
        u.name as student_name,
        u.email as student_email,
        u.college as student_college,
        o.title as opportunity_title,
        o.org_id,
        o.city as opportunity_city,
        o.date as opportunity_date,
        org.name as organization_name,
        org.organization_name as org_display_name
      FROM applications a
      JOIN users u ON a.user_id = u.id
      JOIN opportunities o ON a.opportunity_id = o.id
      JOIN users org ON o.org_id = org.id
      WHERE a.id = ?
    `).get(req.params.id);

    if (!app) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Application not found' }
      });
    }

    // Authorization: student who applied OR owner organization can view
    const isStudentOwner = app.user_id === req.user.id;
    const isOrgOwner = app.org_id === req.user.id;

    if (!isStudentOwner && !isOrgOwner) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You do not have access to view this application' }
      });
    }

    res.json({
      success: true,
      data: app
    });
  } catch (err) {
    console.error('Error fetching application:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve application' }
    });
  }
});

/**
 * PATCH /api/applications/:id/withdraw
 * Student withdraws their active application
 */
router.patch('/:id/withdraw', requireAuth, requireRole('student'), async (req, res) => {
  try {
    const db = await getDb();
    const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);

    if (!app) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Application not found' }
      });
    }

    if (app.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You can only withdraw your own applications' }
      });
    }

    if (app.status === 'withdrawn') {
      return res.json({
        success: true,
        data: { message: 'Application already withdrawn', application: app }
      });
    }

    // Atomic withdrawal transaction
    const executeWithdrawal = db.transaction(() => {
      db.prepare(`UPDATE applications SET status = 'withdrawn' WHERE id = ?`).run(app.id);

      if (app.team_id) {
        db.prepare(`DELETE FROM team_members WHERE team_id = ? AND user_id = ?`).run(app.team_id, app.user_id);
      }

      db.prepare(`
        UPDATE opportunities 
        SET applied_count = CASE WHEN applied_count > 0 THEN applied_count - 1 ELSE 0 END 
        WHERE id = ?
      `).run(app.opportunity_id);

      return db.prepare('SELECT * FROM applications WHERE id = ?').get(app.id);
    });

    const updated = executeWithdrawal();

    res.json({
      success: true,
      data: {
        message: 'Application successfully withdrawn',
        application: updated
      }
    });
  } catch (err) {
    console.error('Withdrawal error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to withdraw application' }
    });
  }
});

/**
 * PATCH /api/applications/:id/complete
 * Host organization marks application as completed and issues certificate
 */
router.patch('/:id/complete', requireAuth, requireRole('organization'), async (req, res) => {
  try {
    const db = await getDb();
    const app = db.prepare(`
      SELECT a.*, o.org_id, o.title as opp_title, o.hours as default_hours, u.college as student_college, u.name as student_name
      FROM applications a
      JOIN opportunities o ON a.opportunity_id = o.id
      JOIN users u ON a.user_id = u.id
      WHERE a.id = ?
    `).get(req.params.id);

    if (!app) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Application not found' }
      });
    }

    if (app.org_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Only the host organization can mark completion' }
      });
    }

    const { volunteer_hours, volunteerHours, hours } = req.body;
    const finalHours = Number(volunteer_hours || volunteerHours || hours || app.default_hours || 15);

    // Generate unique verifiable certificate ID & SHA-256 hash
    const cleanCollege = (app.student_college || 'SANGAM').replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase();
    const certNum = Math.floor(1000 + Math.random() * 9000);
    const certId = app.certificate_id || `SAN-2026-${cleanCollege}-${certNum}`;
    const certHash = crypto.createHash('sha256').update(certId).digest('hex');
    const nowIso = new Date().toISOString();

    db.prepare(`
      UPDATE applications SET
        status = 'completed',
        completed_at = ?,
        completion_date = ?,
        volunteer_hours = ?,
        hours_logged = ?,
        certificate_id = ?,
        certificate_hash = ?
      WHERE id = ?
    `).run(nowIso, nowIso, finalHours, finalHours, certId, certHash, app.id);

    const updated = db.prepare('SELECT * FROM applications WHERE id = ?').get(app.id);

    res.json({
      success: true,
      data: {
        message: 'Application marked completed and certificate generated',
        certificateId: certId,
        certificateHash: certHash,
        application: updated
      }
    });
  } catch (err) {
    console.error('Completion error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to complete application' }
    });
  }
});

/**
 * GET /api/applications/:id/certificate
 * Returns formatted certificate metadata for print or display
 */
router.get('/:id/certificate', async (req, res) => {
  try {
    const db = await getDb();
    const app = db.prepare(`
      SELECT 
        a.id as application_id,
        a.status,
        a.certificate_id,
        a.certificate_hash,
        COALESCE(a.volunteer_hours, a.hours_logged, 10) as volunteer_hours,
        COALESCE(a.completed_at, a.completion_date, a.applied_at) as completion_date,
        u.name as student_name,
        u.college as student_college,
        o.title as programme_name,
        o.category as programme_category,
        o.city as programme_city,
        org.name as org_name,
        org.organization_name as org_display_name
      FROM applications a
      JOIN users u ON a.user_id = u.id
      JOIN opportunities o ON a.opportunity_id = o.id
      JOIN users org ON o.org_id = org.id
      WHERE a.id = ? OR a.certificate_id = ?
    `).get(req.params.id, req.params.id);

    if (!app) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Certificate or application record not found' }
      });
    }

    if (app.status !== 'completed' && !app.certificate_id) {
      return res.status(400).json({
        success: false,
        error: { code: 'NOT_COMPLETED', message: 'This participation has not been completed yet.' }
      });
    }

    const certData = {
      certificateId: app.certificate_id,
      certificateHash: app.certificate_hash,
      studentName: app.student_name,
      college: app.student_college,
      programmeName: app.programme_name,
      organisationName: app.org_display_name || app.org_name,
      completionDate: app.completion_date,
      volunteerHours: app.volunteer_hours,
      programmeCity: app.programme_city,
      programmeCategory: app.programme_category
    };

    res.json({
      success: true,
      data: certData
    });
  } catch (err) {
    console.error('Certificate retrieval error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve certificate details' }
    });
  }
});

export default router;
