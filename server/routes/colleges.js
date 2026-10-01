import express from 'express';
import { getDb } from '../db.js';

const router = express.Router();

/**
 * GET /api/colleges
 * Returns list of reference colleges from database with category metadata
 */
router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const { category, search } = req.query;

    let sql = 'SELECT id, name, category, city FROM colleges WHERE is_active = 1';
    const params = [];

    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }

    if (search) {
      sql += ' AND (name LIKE ? OR city LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY category ASC, name ASC';

    const colleges = db.prepare(sql).all(...params);

    // Grouping helper for frontend optgroup convenience if requested
    const grouped = {};
    colleges.forEach(col => {
      const cat = col.category;
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(col);
    });

    res.json({
      success: true,
      data: colleges,
      grouped
    });
  } catch (err) {
    console.error('Error fetching colleges:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to retrieve colleges directory'
      }
    });
  }
});

export default router;
