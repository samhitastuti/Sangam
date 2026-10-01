import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../db.js';
import { requireAuth, JWT_SECRET } from '../middleware/requireAuth.js';

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
 * POST /api/auth/register
 * Registers a student or organization account with strict field validation
 */
router.post('/register', async (req, res) => {
  try {
    const db = await getDb();
    const {
      name,
      email,
      password,
      role = 'student',
      college,
      homeCity,
      city,
      skills,
      organization_name,
      organizationName,
      organization_city,
      organizationCity,
      organization_role,
      organizationRole,
      focus_areas,
      focusAreas,
      bio,
      course
    } = req.body;

    // Common validations
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Full name is required.' }
      });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Email address is required.' }
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Please provide a valid email address.' }
      });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Password must be at least 6 characters long.' }
      });
    }

    if (!['student', 'organization'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Role must be student or organization.' }
      });
    }

    const effectiveCity = homeCity || city || organization_city || organizationCity || '';

    // Role-specific validation
    if (role === 'student') {
      if (!college || !college.trim()) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'College / University name is required to activate automatic team grouping.' }
        });
      }
      if (!effectiveCity.trim()) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'City is required for student registration.' }
        });
      }
    }

    const effectiveOrgName = organization_name || organizationName || (role === 'organization' ? college : '');
    if (role === 'organization') {
      if (!effectiveOrgName || !effectiveOrgName.trim()) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Organization name is required.' }
        });
      }
    }

    // Check if email already registered
    const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').get(email.trim());
    if (existing) {
      return res.status(409).json({
        success: false,
        error: { code: 'EMAIL_ALREADY_EXISTS', message: 'An account with this email address already exists.' }
      });
    }

    const id = `user_${role === 'organization' ? 'org_' : ''}${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const password_hash = bcrypt.hashSync(password, 10);
    const skillsString = Array.isArray(skills) ? skills.join(', ') : (skills || '');

    const insertUser = db.prepare(`
      INSERT INTO users (
        id, name, email, password_hash, role, college, home_city,
        skills, bio, organization_name, organization_city, organization_role, focus_areas, course
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertUser.run(
      id,
      name.trim(),
      email.trim().toLowerCase(),
      password_hash,
      role,
      role === 'student' ? college.trim() : '',
      effectiveCity.trim(),
      skillsString,
      bio || '',
      role === 'organization' ? effectiveOrgName.trim() : '',
      role === 'organization' ? effectiveCity.trim() : '',
      role === 'organization' ? (organization_role || organizationRole || 'Organizer').trim() : '',
      role === 'organization' ? (focus_areas || focusAreas || skillsString).trim() : '',
      role === 'student' ? (course || '').trim() : ''
    );

    const newUser = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    const safeUser = sanitizeUser(newUser);

    // Upgrade guest student data if registering from an active guest session
    if (req.body.upgradeGuest || req.body.guestUserId === 'user_guest_student' || req.body.isGuestUpgrade) {
      try {
        const guestId = req.body.guestUserId || 'user_guest_student';
        db.prepare('UPDATE applications SET user_id = ? WHERE user_id = ?').run(id, guestId);
        db.prepare('UPDATE team_members SET user_id = ? WHERE user_id = ?').run(id, guestId);
      } catch (upErr) {
        console.warn('Guest upgrade record migration notice:', upErr.message);
      }
    }

    const token = jwt.sign(
      { userId: safeUser.id, id: safeUser.id, role: safeUser.role, email: safeUser.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      data: {
        user: safeUser,
        token
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'An internal error occurred during registration.' }
    });
  }
});

/**
 * POST /api/auth/login
 * Verifies credentials and returns JWT session
 */
router.post('/login', async (req, res) => {
  try {
    const db = await getDb();
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Email and password are required.' }
      });
    }

    const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email.trim());
    if (!user) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' }
      });
    }

    const matches = bcrypt.compareSync(password, user.password_hash);
    if (!matches) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' }
      });
    }

    const safeUser = sanitizeUser(user);

    // Upgrade guest student data if logging in from a guest session
    if (req.body.upgradeGuest || req.body.guestUserId === 'user_guest_student') {
      try {
        const guestId = req.body.guestUserId || 'user_guest_student';
        db.prepare('UPDATE applications SET user_id = ? WHERE user_id = ?').run(safeUser.id, guestId);
        db.prepare('UPDATE team_members SET user_id = ? WHERE user_id = ?').run(safeUser.id, guestId);
      } catch (upErr) {
        console.warn('Guest upgrade record migration notice on login:', upErr.message);
      }
    }

    const token = jwt.sign(
      { userId: safeUser.id, id: safeUser.id, role: safeUser.role, email: safeUser.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      data: {
        user: safeUser,
        token
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'An internal error occurred during login.' }
    });
  }
});

/**
 * GET /api/auth/me
 * Returns current authenticated user state
 */
router.get('/me', requireAuth, async (req, res) => {
  try {
    const db = await getDb();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User record not found.' }
      });
    }

    return res.json({
      success: true,
      data: {
        user: sanitizeUser(user)
      }
    });
  } catch (err) {
    console.error('Auth check error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to verify session' }
    });
  }
});

/**
 * GET /api/auth/demo-users
 * Returns list of seeded demo users with pre-signed tokens for easy hackathon walkthrough
 */
router.get('/demo-users', async (req, res) => {
  try {
    const db = await getDb();
    const users = db.prepare(`
      SELECT id, name, email, role, college, home_city, organization_name, organization_city, skills, bio
      FROM users
      ORDER BY role DESC, name ASC
    `).all();

    const formatted = users.map(u => ({
      ...u,
      skills: u.skills ? u.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
      token: jwt.sign({ userId: u.id, id: u.id, role: u.role, email: u.email }, JWT_SECRET, { expiresIn: '7d' })
    }));

    res.json({
      success: true,
      data: formatted
    });
  } catch (err) {
    console.error('Demo users error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to load demo accounts' }
    });
  }
});

export default router;
