import express from 'express';
import { randomUUID } from 'crypto';
import { getDb } from '../db.js';
import { requireAuth, optionalAuth } from '../middleware/requireAuth.js';

const router = express.Router();

function formatStory(row) {
  const img = row.image || '';
  const dateStr = row.created_at ? new Date(row.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
  return {
    id: row.id,
    authorId: row.author_id,
    authorName: row.author_name,
    college: row.college,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    category: row.category,
    opportunityId: row.opportunity_id,
    claps: row.claps || 0,
    image: img,
    imageUrl: img,
    coverImage: img,
    date: dateStr,
    createdAt: row.created_at
  };
}

// GET /stories
router.get('/', optionalAuth, async (req, res) => {
  try {
    const db = await getDb();
    const rows = db.prepare('SELECT * FROM stories ORDER BY datetime(created_at) DESC').all();
    res.json(rows.map(formatStory));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /stories/:id
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const db = await getDb();
    const row = db.prepare('SELECT * FROM stories WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Story not found' });
    res.json(formatStory(row));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /stories
router.post('/', requireAuth, async (req, res) => {
  try {
    const { title, excerpt, content, category, opportunityId, image } = req.body;
    if (!title?.trim() || !content?.trim()) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const db = await getDb();
    const user = db.prepare('SELECT name, college FROM users WHERE id = ?').get(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const storyId = 'story_' + randomUUID().slice(0, 8);
    const shortExcerpt = (excerpt || content.slice(0, 160) + '...').trim();

    db.prepare(`
      INSERT INTO stories (id, author_id, author_name, college, title, excerpt, content, category, opportunity_id, claps, image, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, datetime('now'))
    `).run(
      storyId,
      req.user.id,
      user.name,
      user.college || '',
      title.trim(),
      shortExcerpt,
      content.trim(),
      category || 'Field Dispatch',
      opportunityId || null,
      image || ''
    );

    const created = db.prepare('SELECT * FROM stories WHERE id = ?').get(storyId);
    res.status(201).json(formatStory(created));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /stories/:id/clap
router.post('/:id/clap', async (req, res) => {
  try {
    const db = await getDb();
    const story = db.prepare('SELECT * FROM stories WHERE id = ?').get(req.params.id);
    if (!story) return res.status(404).json({ error: 'Story not found' });

    db.prepare('UPDATE stories SET claps = claps + 1 WHERE id = ?').run(req.params.id);
    const updated = db.prepare('SELECT * FROM stories WHERE id = ?').get(req.params.id);
    res.json(formatStory(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
