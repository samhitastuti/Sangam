import express from 'express';
import { getDb } from '../db.js';

const router = express.Router();

/**
 * GET /api/cities
 * Returns list of reference cities from SQLite database
 */
router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const cities = db.prepare('SELECT id, name FROM cities WHERE is_active = 1 ORDER BY id ASC').all();

    res.json({
      success: true,
      data: cities
    });
  } catch (err) {
    console.error('Error fetching cities:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to retrieve cities list'
      }
    });
  }
});

export default router;
