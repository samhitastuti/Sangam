import express from 'express';
import { getDb } from '../db.js';
import { requireAuth, optionalAuth } from '../middleware/requireAuth.js';

const router = express.Router();

/**
 * GET /api/teams/leaderboard
 * Collegiate squads leaderboard and college competition rankings
 */
router.get('/leaderboard', optionalAuth, async (req, res) => {
  try {
    const db = await getDb();
    const { college, city, category, timeframe } = req.query;

    // Fetch all active teams with opportunity details and member counts
    const teams = db.prepare(`
      SELECT 
        t.id as team_id,
        t.college,
        t.city as team_city,
        t.team_name,
        t.created_at,
        o.id as opportunity_id,
        o.title as opportunity_title,
        o.category as opportunity_category,
        o.city as opportunity_city,
        o.hours as opportunity_hours,
        o.status as opportunity_status,
        COUNT(DISTINCT tm.user_id) as member_count,
        COALESCE(SUM(a.volunteer_hours), 0) as direct_hours,
        COUNT(DISTINCT CASE WHEN a.status = 'completed' THEN a.id END) as completed_count
      FROM teams t
      JOIN opportunities o ON t.opportunity_id = o.id
      LEFT JOIN team_members tm ON t.id = tm.team_id
      LEFT JOIN applications a ON t.id = a.team_id
      GROUP BY t.id
    `).all();

    // Calculate dynamic hours & score
    const processedTeams = teams.map((team) => {
      const memberCount = Number(team.member_count || 0);
      const directHours = Number(team.direct_hours || 0);
      const completedCount = Number(team.completed_count || 0);
      const oppHours = Number(team.opportunity_hours || 16);

      // Estimated total squad hours: direct logged hours + active participation baseline
      const baseHours = directHours > 0 
        ? directHours 
        : Math.max(12, Math.round(memberCount * oppHours * 0.75));

      // Impact score based on hours, members, and completed drives
      const impactScore = (baseHours * 10) + (memberCount * 25) + (completedCount * 50);

      // Fetch squad members
      const members = db.prepare(`
        SELECT u.id, u.name, u.college, u.home_city, tm.joined_via, tm.joined_at
        FROM team_members tm
        JOIN users u ON tm.user_id = u.id
        WHERE tm.team_id = ?
        ORDER BY tm.joined_at ASC
        LIMIT 6
      `).all(team.team_id);

      return {
        id: team.team_id,
        teamName: team.team_name,
        college: team.college,
        city: team.team_city || team.opportunity_city,
        opportunityId: team.opportunity_id,
        opportunityTitle: team.opportunity_title,
        opportunityCategory: team.opportunity_category,
        memberCount,
        totalHours: baseHours,
        impactScore,
        completedCount,
        members: members.map(m => ({
          id: m.id,
          name: m.name,
          college: m.college,
          role: m.joined_via === 'first to join' ? 'Squad Lead' : 'Volunteer',
          initials: m.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        }))
      };
    });

    // College Aggregate Standings (Inter-College Cup)
    const collegeMap = {};
    processedTeams.forEach((t) => {
      const col = t.college || 'Collegiate Squad';
      if (!collegeMap[col]) {
        collegeMap[col] = {
          college: col,
          city: t.city,
          totalSquads: 0,
          totalMembers: 0,
          totalHours: 0,
          impactPoints: 0,
          topSquad: null
        };
      }
      collegeMap[col].totalSquads++;
      collegeMap[col].totalMembers += t.memberCount;
      collegeMap[col].totalHours += t.totalHours;
      collegeMap[col].impactPoints += t.impactScore;
      if (!collegeMap[col].topSquad || t.totalHours > collegeMap[col].topSquad.totalHours) {
        collegeMap[col].topSquad = {
          name: t.teamName,
          hours: t.totalHours,
          opportunity: t.opportunityTitle
        };
      }
    });

    const collegeStandings = Object.values(collegeMap)
      .sort((a, b) => b.totalHours - a.totalHours)
      .map((c, index) => ({
        ...c,
        rank: index + 1,
        badge: index === 0 ? '🏆 1st Champions' : index === 1 ? '🥈 2nd Contenders' : index === 2 ? '🥉 3rd Place' : '⭐ Active Campus'
      }));

    // Filter teams based on query
    let filteredTeams = [...processedTeams];

    if (college && college !== 'All') {
      filteredTeams = filteredTeams.filter(t => 
        t.college.toLowerCase().includes(college.toLowerCase()) || 
        college.toLowerCase().includes(t.college.toLowerCase())
      );
    }

    if (city && city !== 'All') {
      filteredTeams = filteredTeams.filter(t => 
        t.city.toLowerCase() === city.toLowerCase()
      );
    }

    if (category && category !== 'All') {
      filteredTeams = filteredTeams.filter(t => 
        t.opportunityCategory.toLowerCase().includes(category.toLowerCase())
      );
    }

    // Sort teams by total volunteer hours (descending)
    filteredTeams.sort((a, b) => b.totalHours - a.totalHours);

    // Assign rank and badges
    const rankedTeams = filteredTeams.map((team, idx) => ({
      ...team,
      rank: idx + 1,
      badge: idx === 0 ? '🏆 Gold Squad' : idx === 1 ? '🥈 Silver Squad' : idx === 2 ? '🥉 Bronze Squad' : '⚡ Active Squad'
    }));

    // Find requested user's college stats if logged in or specified
    const targetCollege = college || req.user?.college || 'SRM Kattankulathur (KTR)';
    const userCollegeStanding = collegeStandings.find(c => 
      c.college.toLowerCase().includes(targetCollege.toLowerCase()) ||
      targetCollege.toLowerCase().includes(c.college.toLowerCase())
    );

    res.json({
      success: true,
      filter: {
        college: college || 'All',
        city: city || 'All',
        category: category || 'All',
        timeframe: timeframe || 'all'
      },
      data: {
        topTeams: rankedTeams,
        collegeStandings,
        userCollegeStats: userCollegeStanding || collegeStandings[0] || null,
        totalSquads: processedTeams.length,
        totalHoursLogged: processedTeams.reduce((acc, t) => acc + t.totalHours, 0)
      }
    });
  } catch (err) {
    console.error('Error calculating leaderboard:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to generate collegiate leaderboard' }
    });
  }
});

/**
 * GET /api/teams/network
 * Campus squads network overview grouped by college and city
 */
router.get('/network', async (req, res) => {
  try {
    const db = await getDb();
    const rows = db.prepare(`
      SELECT 
        t.id as team_id,
        t.college,
        t.city as team_city,
        t.team_name,
        o.id as opportunity_id,
        o.title as opportunity_title,
        o.category as opportunity_category,
        o.city as opportunity_city,
        COUNT(tm.user_id) as member_count
      FROM teams t
      JOIN opportunities o ON t.opportunity_id = o.id
      LEFT JOIN team_members tm ON t.id = tm.team_id
      GROUP BY t.id
      ORDER BY member_count DESC, t.college ASC
    `).all();

    // Group squads by college
    const collegeNetwork = {};
    rows.forEach(r => {
      const col = r.college;
      if (!collegeNetwork[col]) {
        collegeNetwork[col] = {
          college: col,
          totalSquads: 0,
          totalMembers: 0,
          squads: []
        };
      }
      collegeNetwork[col].totalSquads++;
      collegeNetwork[col].totalMembers += Number(r.member_count || 0);
      collegeNetwork[col].squads.push({
        id: r.team_id,
        name: r.team_name,
        opportunityId: r.opportunity_id,
        opportunityTitle: r.opportunity_title,
        opportunityCategory: r.opportunity_category,
        city: r.team_city || r.opportunity_city,
        memberCount: Number(r.member_count || 0)
      });
    });

    res.json({
      success: true,
      data: {
        raw: rows,
        network: Object.values(collegeNetwork)
      }
    });
  } catch (err) {
    console.error('Error fetching network:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve squad network' }
    });
  }
});

/**
 * GET /api/teams/me
 * Returns all collegiate squads the logged-in user belongs to
 */
router.get('/me', requireAuth, async (req, res) => {
  try {
    const db = await getDb();
    const teams = db.prepare(`
      SELECT 
        t.id,
        t.opportunity_id,
        t.college,
        t.city,
        t.team_name,
        t.created_at,
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
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve your teams' }
    });
  }
});

/**
 * GET /api/teams/:id
 * Retrieve team details with safely sanitized member roster
 */
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const db = await getDb();
    const team = db.prepare(`
      SELECT 
        t.id,
        t.opportunity_id,
        t.college,
        t.city,
        t.team_name,
        t.created_at,
        o.title as opportunity_title,
        o.city as opportunity_city,
        o.status as opportunity_status
      FROM teams t
      JOIN opportunities o ON t.opportunity_id = o.id
      WHERE t.id = ?
    `).get(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Collegiate squad not found' }
      });
    }

    const members = db.prepare(`
      SELECT 
        u.id,
        u.name,
        u.college,
        u.home_city,
        u.skills,
        tm.joined_via,
        tm.joined_at
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = ?
      ORDER BY tm.joined_at ASC
    `).all(team.id);

    const safeMembers = members.map(m => ({
      id: m.id,
      name: m.name,
      college: m.college,
      city: m.home_city,
      joinedVia: m.joined_via,
      skills: m.skills ? m.skills.split(',').map(s => s.trim()).filter(Boolean) : []
    }));

    res.json({
      success: true,
      data: {
        id: team.id,
        opportunityId: team.opportunity_id,
        opportunityTitle: team.opportunity_title,
        opportunityCity: team.opportunity_city,
        college: team.college,
        city: team.city,
        teamName: team.team_name,
        createdAt: team.created_at,
        members: safeMembers
      }
    });
  } catch (err) {
    console.error('Error fetching team:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve team details' }
    });
  }
});

/**
 * GET /api/teams/:id/messages
 * Retrieves team chatter messages for a squad
 */
router.get('/:id/messages', optionalAuth, async (req, res) => {
  try {
    const db = await getDb();
    const messages = db.prepare(`
      SELECT id, team_id, user_id, user_name, college, message, created_at
      FROM team_messages
      WHERE team_id = ?
      ORDER BY created_at ASC
    `).all(req.params.id);

    res.json({
      success: true,
      data: messages
    });
  } catch (err) {
    console.error('Error fetching team messages:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to load team messages' }
    });
  }
});

/**
 * POST /api/teams/:id/messages
 * Adds a message to the collegiate squad chatter wall
 */
router.post('/:id/messages', requireAuth, async (req, res) => {
  try {
    const db = await getDb();
    const teamId = req.params.id;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Message cannot be empty' }
      });
    }

    const user = db.prepare('SELECT id, name, college FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' }
      });
    }

    const msgId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    db.prepare(`
      INSERT INTO team_messages (id, team_id, user_id, user_name, college, message, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(msgId, teamId, user.id, user.name, user.college || '', message.trim());

    const created = db.prepare('SELECT * FROM team_messages WHERE id = ?').get(msgId);

    res.status(201).json({
      success: true,
      data: created
    });
  } catch (err) {
    console.error('Error sending team message:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to post message' }
    });
  }
});

export default router;
