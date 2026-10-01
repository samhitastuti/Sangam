import jwt from 'jsonwebtoken';
import { getDb } from '../db.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'sangam-dev-super-secret-key-2026';

export async function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const devUserId = req.headers['x-user-id'];

  if (authHeader) {
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      req.user = {
        id: payload.userId || payload.id,
        role: payload.role
      };
      return next();
    } catch {
      // If token expired but devUserId provided in dev mode, fallback below
      if (!devUserId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHENTICATED',
            message: 'Invalid or expired session token. Please sign in again.'
          }
        });
      }
    }
  }

  if (devUserId) {
    try {
      const db = await getDb();
      const user = db.prepare('SELECT id, role, email, name FROM users WHERE id = ?').get(devUserId);
      if (user) {
        req.user = { id: user.id, role: user.role };
        return next();
      }
    } catch (e) {
      console.warn('Dev user lookup error in requireAuth:', e);
    }
  }

  return res.status(401).json({
    success: false,
    error: {
      code: 'UNAUTHENTICATED',
      message: 'Authentication required. Please sign in.'
    }
  });
}

export async function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const devUserId = req.headers['x-user-id'];

  if (authHeader) {
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      req.user = {
        id: payload.userId || payload.id,
        role: payload.role
      };
      return next();
    } catch {
      // Continue without user
    }
  }

  if (devUserId) {
    try {
      const db = await getDb();
      const user = db.prepare('SELECT id, role FROM users WHERE id = ?').get(devUserId);
      if (user) {
        req.user = { id: user.id, role: user.role };
      }
    } catch {
      // Continue without user
    }
  }

  next();
}

export default requireAuth;
