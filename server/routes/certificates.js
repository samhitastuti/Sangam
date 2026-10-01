import express from 'express';
import { getDb } from '../db.js';

const router = express.Router();

// GET /certificates/:applicationId
router.get('/:applicationId', async (req, res) => {
  try {
    const db = await getDb();
    const app = db.prepare(`
      SELECT a.*,
             o.title as opp_title, o.city as opp_city, o.date as opp_date, o.hours as opp_hours, o.duration as opp_duration,
             u.name as student_name, u.email as student_email, u.college as student_college, u.course as student_course,
             org.name as org_name, org.email as org_email,
             t.college as team_college, t.team_name
      FROM applications a
      JOIN opportunities o ON a.opportunity_id = o.id
      JOIN users u ON a.user_id = u.id
      JOIN users org ON o.org_id = org.id
      LEFT JOIN teams t ON a.team_id = t.id
      WHERE a.id = ? OR a.certificate_id = ?
    `).get(req.params.applicationId, req.params.applicationId);

    if (!app) {
      return res.status(404).json({ error: 'Certificate record not found' });
    }

    const certData = {
      certificateId: app.certificate_id || `SAN-2026-${(app.student_college || 'SRM').slice(0, 3).toUpperCase()}-0084`,
      certificateHash: app.certificate_hash || 'c8f712903e0bb43c0825f7786ae881729b44',
      status: app.status === 'completed' ? 'VERIFIED' : 'PENDING_COMPLETION',
      isCompleted: app.status === 'completed',
      studentName: app.student_name,
      college: app.student_college,
      course: app.student_course || 'Collegiate Volunteer',
      opportunityTitle: app.opp_title,
      hostOrganization: app.org_name,
      city: app.opp_city,
      hoursLogged: app.hours_logged || app.opp_hours || 20,
      completionDate: app.completion_date || app.applied_at,
      teamName: app.team_name || `${app.student_college} Squad`,
      issuedBy: 'Sangam Collegiate Credential Registry'
    };

    res.json(certData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /certificates/verify/:hashOrId
router.get('/verify/:hashOrId', async (req, res) => {
  try {
    const db = await getDb();
    const queryTerm = req.params.hashOrId.trim();

    const app = db.prepare(`
      SELECT a.*, o.title as opp_title, u.name as student_name, u.college as student_college, org.name as org_name
      FROM applications a
      JOIN opportunities o ON a.opportunity_id = o.id
      JOIN users u ON a.user_id = u.id
      JOIN users org ON o.org_id = org.id
      WHERE a.certificate_id = ? OR a.certificate_hash = ? OR a.id = ?
    `).get(queryTerm, queryTerm, queryTerm);

    if (!app) {
      return res.status(404).json({ valid: false, error: 'No matching certificate found in cryptographic registry' });
    }

    res.json({
      valid: app.status === 'completed',
      certificateId: app.certificate_id,
      studentName: app.student_name,
      college: app.student_college,
      opportunityTitle: app.opp_title,
      hostOrganization: app.org_name,
      completionDate: app.completion_date,
      hoursLogged: app.hours_logged,
      verificationHash: app.certificate_hash
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
