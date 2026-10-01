import express from 'express';
import { getDb } from '../db.js';
import { requireAuth, optionalAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';

const router = express.Router();

function formatOpportunity(row) {
  if (!row) return null;
  const skills = row.skills_needed ? row.skills_needed.split(',').map(s => s.trim()).filter(Boolean) : [];
  const img = row.image || '';
  const isVerified = row.verification_status === 'verified' || row.verification_status === 'govt_registered';

  // Ensure every opportunity in all 10 cities has valid GPS coordinates
  const coords = (row.latitude != null && row.longitude != null)
    ? { lat: Number(row.latitude), lng: Number(row.longitude) }
    : getDefaultCoordsForCity(row.city, row.address);

  return {
    id: row.id,
    org_id: row.org_id,
    title: row.title,
    description: row.description,
    skills_needed: skills,
    skillsNeeded: skills,
    city: row.city,
    address: row.address || '',
    latitude: coords.lat,
    longitude: coords.lng,
    schedule: row.schedule || '',
    date: row.date,
    duration: row.duration || '4 Weeks',
    hours: row.hours || 20,
    capacity: row.capacity,
    applied_count: row.applied_count || 0,
    appliedCount: row.applied_count || 0,
    status: row.status,
    category: row.category || 'Community Action',
    activity_format: row.activity_format || 'weekly',
    activityFormat: row.activity_format || 'weekly',
    timing_details: row.timing_details || row.schedule || '',
    timingDetails: row.timing_details || row.schedule || '',
    image: img,
    imageUrl: img,
    coverImage: img,
    created_at: row.created_at,
    orgName: row.org_display_name || row.org_name || 'Host Organization',
    orgEmail: row.org_email || '',
    // Verification fields
    verification_status: row.verification_status || 'verified',
    verificationStatus: row.verification_status || 'verified',
    isVerified,
    ngo_darpan_id: row.ngo_darpan_id || '',
    ngoDarpanId: row.ngo_darpan_id || '',
    trust_score: row.trust_score != null ? Number(row.trust_score) : 95,
    trustScore: row.trust_score != null ? Number(row.trust_score) : 95,
    registration_type: row.registration_type || 'Trust',
    registration_number: row.registration_number || '',
    tax_exemption_80g: Boolean(row.tax_exemption_80g),
    tax_exemption_12a: Boolean(row.tax_exemption_12a),
    fcra_registered: Boolean(row.fcra_registered),
    trustee_name: row.trustee_name || '',
    verified_at: row.verified_at || '',
    verification_notes: row.verification_notes || '',
    hasSrmSquad: row.city?.toLowerCase() === 'chennai' || row.id?.includes('srm') || row.id === 'opp_digital_literacy',
    organization: {
      id: row.org_id,
      name: row.org_display_name || row.org_name || 'Host Organization',
      email: row.org_email || '',
      city: row.org_city || row.city,
      verification_status: row.verification_status || 'verified',
      verificationStatus: row.verification_status || 'verified',
      isVerified,
      ngo_darpan_id: row.ngo_darpan_id || '',
      trust_score: row.trust_score != null ? Number(row.trust_score) : 95,
      registration_type: row.registration_type || 'Trust',
      registration_number: row.registration_number || '',
      tax_exemption_80g: Boolean(row.tax_exemption_80g),
      tax_exemption_12a: Boolean(row.tax_exemption_12a),
      fcra_registered: Boolean(row.fcra_registered),
      trustee_name: row.trustee_name || '',
      verified_at: row.verified_at || '',
      verification_notes: row.verification_notes || ''
    }
  };
}

export function getDefaultCoordsForCity(city, address = '') {
  const normCity = (city || '').toLowerCase();
  const normAddr = (address || '').toLowerCase();

  // Chennai
  if (normCity.includes('chennai') || normAddr.includes('chennai') || normAddr.includes('srm') || normAddr.includes('kattankulathur') || normAddr.includes('chengalpattu')) {
    if (normAddr.includes('besant') || normAddr.includes('kovalam') || normAddr.includes('beach') || normAddr.includes('marina')) {
      return { lat: 12.9984, lng: 80.2678 };
    }
    if (normAddr.includes('guindy') || normAddr.includes('iit')) {
      return { lat: 13.0067, lng: 80.2025 };
    }
    if (normAddr.includes('tambaram')) {
      return { lat: 12.9249, lng: 80.1000 };
    }
    if (normAddr.includes('kanchipuram')) {
      return { lat: 12.8342, lng: 79.7036 };
    }
    return { lat: 12.8230, lng: 80.0444 }; // SRM KTR Hub
  }

  // Delhi
  if (normCity.includes('delhi')) {
    if (normAddr.includes('yamuna')) return { lat: 28.6650, lng: 77.2500 };
    if (normAddr.includes('ridge')) return { lat: 28.6920, lng: 77.2150 };
    return { lat: 28.6892, lng: 77.2090 };
  }

  // Bengaluru
  if (normCity.includes('bengaluru') || normCity.includes('bangalore')) {
    if (normAddr.includes('bellandur')) return { lat: 12.9260, lng: 77.6762 };
    if (normAddr.includes('koramangala')) return { lat: 12.9352, lng: 77.6245 };
    if (normAddr.includes('whitefield')) return { lat: 12.9698, lng: 77.7500 };
    return { lat: 12.9716, lng: 77.5946 };
  }

  // Mumbai
  if (normCity.includes('mumbai')) {
    if (normAddr.includes('bandra')) return { lat: 19.0596, lng: 72.8295 };
    if (normAddr.includes('thane') || normAddr.includes('mangrove')) return { lat: 19.1800, lng: 72.9800 };
    if (normAddr.includes('dharavi')) return { lat: 19.0400, lng: 72.8550 };
    return { lat: 19.0760, lng: 72.8777 };
  }

  // Hyderabad
  if (normCity.includes('hyderabad')) {
    if (normAddr.includes('old city') || normAddr.includes('charminar')) return { lat: 17.3616, lng: 78.4747 };
    if (normAddr.includes('hitec') || normAddr.includes('gachibowli')) return { lat: 17.4435, lng: 78.3772 };
    return { lat: 17.3850, lng: 78.4867 };
  }

  // Pune
  if (normCity.includes('pune')) {
    if (normAddr.includes('mutha') || normAddr.includes('river')) return { lat: 18.5200, lng: 73.8500 };
    if (normAddr.includes('hinjewadi')) return { lat: 18.5913, lng: 73.7389 };
    return { lat: 18.5204, lng: 73.8567 };
  }

  // Kolkata
  if (normCity.includes('kolkata')) {
    if (normAddr.includes('hooghly') || normAddr.includes('howrah')) return { lat: 22.5850, lng: 88.3450 };
    if (normAddr.includes('jadavpur')) return { lat: 22.4988, lng: 88.3712 };
    return { lat: 22.5726, lng: 88.3639 };
  }

  // Ahmedabad
  if (normCity.includes('ahmedabad')) {
    if (normAddr.includes('sabarmati')) return { lat: 23.0300, lng: 72.5800 };
    if (normAddr.includes('navrangpura')) return { lat: 23.0368, lng: 72.5614 };
    return { lat: 23.0225, lng: 72.5714 };
  }

  // Coimbatore
  if (normCity.includes('coimbatore')) {
    if (normAddr.includes('singanallur') || normAddr.includes('lake')) return { lat: 11.0000, lng: 77.0200 };
    return { lat: 11.0168, lng: 76.9558 };
  }

  // Vellore
  if (normCity.includes('vellore')) {
    if (normAddr.includes('vit')) return { lat: 12.9698, lng: 79.1559 };
    return { lat: 12.9165, lng: 79.1325 };
  }

  return { lat: 13.0827, lng: 80.2707 };
}

/**
 * GET /api/opportunities
 * Server-side parameterized SQL filtering by city, skill, status, search
 */
router.get('/', optionalAuth, async (req, res) => {
  try {
    const db = await getDb();
    const { city, skill, status, search, duration, activity_format, format, verified_only, verifiedOnly } = req.query;

    let query = `
      SELECT 
        o.*,
        u.name as org_name,
        u.email as org_email,
        u.organization_name as org_display_name,
        u.organization_city as org_city,
        u.verification_status,
        u.ngo_darpan_id,
        u.registration_number,
        u.registration_type,
        u.tax_exemption_80g,
        u.tax_exemption_12a,
        u.fcra_registered,
        u.trustee_name,
        u.verified_at,
        u.verification_notes,
        u.trust_score
      FROM opportunities o
      JOIN users u ON o.org_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (city && city.trim() && city.toLowerCase() !== 'all') {
      query += ` AND LOWER(o.city) = LOWER(?)`;
      params.push(city.trim());
    }

    // Activity format filter: 'weekly', 'one_day_drive', 'campaign'
    const formatFilter = activity_format || format;
    if (formatFilter && formatFilter.trim() && formatFilter.toLowerCase() !== 'all') {
      query += ` AND o.activity_format = ?`;
      params.push(formatFilter.trim().toLowerCase());
    }

    // Verified NGOs only filter
    if (verified_only === 'true' || verifiedOnly === 'true') {
      query += ` AND u.verification_status IN ('verified', 'govt_registered')`;
    }

    if (skill && skill.trim() && skill.toLowerCase() !== 'all') {
      query += ` AND LOWER(o.skills_needed) LIKE LOWER(?)`;
      params.push(`%${skill.trim()}%`);
    }

    if (status && status.trim() && status.toLowerCase() !== 'all') {
      query += ` AND o.status = ?`;
      params.push(status.trim());
    }

    if (duration && duration.trim() && duration.toLowerCase() !== 'all') {
      const d = duration.toLowerCase();
      if (d === '1-day' || d === 'day' || d === 'single-day') {
        query += ` AND (LOWER(o.duration) LIKE '%1 day%' OR (LOWER(o.duration) LIKE '%day%' AND LOWER(o.duration) NOT LIKE '%2 day%'))`;
      } else if (d === 'weekend') {
        query += ` AND (LOWER(o.duration) LIKE '%weekend%' OR LOWER(o.duration) LIKE '%2 day%')`;
      } else if (d === 'short' || d === '1-2-weeks') {
        query += ` AND (LOWER(o.duration) LIKE '%1 week%' OR LOWER(o.duration) LIKE '%2 week%')`;
      } else if (d === 'medium' || d === '3-4-weeks') {
        query += ` AND (LOWER(o.duration) LIKE '%3 week%' OR LOWER(o.duration) LIKE '%4 week%')`;
      } else if (d === 'long' || d === '4-plus-weeks') {
        query += ` AND (LOWER(o.duration) LIKE '%4 week%' OR LOWER(o.duration) LIKE '%6 week%' OR LOWER(o.duration) LIKE '%8 week%' OR LOWER(o.duration) LIKE '%month%')`;
      } else {
        query += ` AND LOWER(o.duration) LIKE LOWER(?)`;
        params.push(`%${duration.trim()}%`);
      }
    }

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      query += ` AND (o.title LIKE ? OR o.description LIKE ? OR o.skills_needed LIKE ? OR o.city LIKE ?)`;
      params.push(term, term, term, term);
    }

    query += ` ORDER BY o.created_at DESC`;

    const rows = db.prepare(query).all(...params);
    const opportunities = rows.map(formatOpportunity);

    res.json({
      success: true,
      data: opportunities
    });
  } catch (err) {
    console.error('Error querying opportunities:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve opportunities' }
    });
  }
});

/**
 * GET /api/opportunities/:id
 * Retrieve a single opportunity by ID
 */
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const db = await getDb();
    const row = db.prepare(`
      SELECT 
        o.*,
        u.name as org_name,
        u.email as org_email,
        u.organization_name as org_display_name,
        u.organization_city as org_city,
        u.verification_status,
        u.ngo_darpan_id,
        u.registration_number,
        u.registration_type,
        u.tax_exemption_80g,
        u.tax_exemption_12a,
        u.fcra_registered,
        u.trustee_name,
        u.verified_at,
        u.verification_notes,
        u.trust_score
      FROM opportunities o
      JOIN users u ON o.org_id = u.id
      WHERE o.id = ?
    `).get(req.params.id);

    if (!row) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Opportunity not found' }
      });
    }

    // Include teams summary
    const teams = db.prepare(`
      SELECT 
        t.id,
        t.college,
        t.city,
        t.team_name,
        COUNT(tm.user_id) as member_count
      FROM teams t
      LEFT JOIN team_members tm ON t.id = tm.team_id
      WHERE t.opportunity_id = ?
      GROUP BY t.id
    `).all(row.id);

    const opportunity = formatOpportunity(row);
    opportunity.teams = teams;

    res.json({
      success: true,
      data: opportunity
    });
  } catch (err) {
    console.error('Error fetching opportunity detail:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve opportunity' }
    });
  }
});

/**
 * POST /api/opportunities
 * Authenticated organizations only: creates a new opportunity
 */
router.post('/', requireAuth, requireRole('organization'), async (req, res) => {
  try {
    const db = await getDb();
    const {
      title,
      description,
      skills_needed,
      skillsNeeded,
      city,
      address = '',
      latitude,
      longitude,
      schedule = '',
      date,
      duration = '4 Weeks',
      hours = 20,
      capacity = 25,
      category = 'Community Action',
      activity_format = 'weekly',
      activityFormat,
      timing_details = '',
      timingDetails,
      image = ''
    } = req.body;

    const finalFormat = (activity_format || activityFormat || 'weekly').toLowerCase();
    const finalTiming = timing_details || timingDetails || schedule || '';

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Opportunity title is required' }
      });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Opportunity description is required' }
      });
    }

    if (!city || !city.trim()) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Opportunity location/city is required' }
      });
    }

    if (!date) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Event or start date is required' }
      });
    }

    // Coordinate resolution: use provided or smart lookup based on address & city
    let finalLat = latitude != null && !isNaN(Number(latitude)) ? Number(latitude) : null;
    let finalLng = longitude != null && !isNaN(Number(longitude)) ? Number(longitude) : null;
    if (finalLat === null || finalLng === null) {
      const fallback = getDefaultCoordsForCity(city, address);
      finalLat = fallback.lat;
      finalLng = fallback.lng;
    }

    const skillsRaw = skills_needed || skillsNeeded || '';
    const skillsString = Array.isArray(skillsRaw) ? skillsRaw.join(', ') : skillsRaw;
    const oppId = `opp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const insertStmt = db.prepare(`
      INSERT INTO opportunities (
        id, org_id, title, description, skills_needed, city, address, latitude, longitude, schedule, date, duration, hours, capacity, applied_count, status, category, activity_format, timing_details, image
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'open', ?, ?, ?, ?)
    `);

    insertStmt.run(
      oppId,
      req.user.id,
      title.trim(),
      description.trim(),
      skillsString,
      city.trim(),
      address.trim(),
      finalLat,
      finalLng,
      schedule.trim(),
      date,
      duration,
      Number(hours) || 20,
      Number(capacity) || 25,
      category,
      finalFormat,
      finalTiming,
      image
    );

    const created = db.prepare(`
      SELECT 
        o.*,
        u.name as org_name,
        u.email as org_email,
        u.organization_name as org_display_name,
        u.organization_city as org_city,
        u.verification_status,
        u.ngo_darpan_id,
        u.registration_number,
        u.registration_type,
        u.tax_exemption_80g,
        u.tax_exemption_12a,
        u.fcra_registered,
        u.trustee_name,
        u.verified_at,
        u.verification_notes,
        u.trust_score
      FROM opportunities o
      JOIN users u ON o.org_id = u.id
      WHERE o.id = ?
    `).get(oppId);

    res.status(201).json({
      success: true,
      data: formatOpportunity(created)
    });
  } catch (err) {
    console.error('Error creating opportunity:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to create opportunity' }
    });
  }
});

/**
 * PATCH /api/opportunities/:id
 * Authenticated organizations only: edit own opportunity
 */
router.patch('/:id', requireAuth, requireRole('organization'), async (req, res) => {
  try {
    const db = await getDb();
    const existing = db.prepare('SELECT * FROM opportunities WHERE id = ?').get(req.params.id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Opportunity not found' }
      });
    }

    if (existing.org_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You are not authorized to modify another organization’s opportunity' }
      });
    }

    const {
      title,
      description,
      skills_needed,
      city,
      address,
      latitude,
      longitude,
      schedule,
      date,
      duration,
      hours,
      capacity,
      status,
      category,
      activity_format,
      activityFormat,
      timing_details,
      timingDetails,
      image
    } = req.body;

    const newTitle = title !== undefined ? title.trim() : existing.title;
    const newDesc = description !== undefined ? description.trim() : existing.description;
    const newCity = city !== undefined ? city.trim() : existing.city;
    const newAddress = address !== undefined ? address.trim() : existing.address;
    const newSchedule = schedule !== undefined ? schedule.trim() : existing.schedule;
    const newLat = latitude !== undefined && !isNaN(Number(latitude)) ? Number(latitude) : existing.latitude;
    const newLng = longitude !== undefined && !isNaN(Number(longitude)) ? Number(longitude) : existing.longitude;
    const newDate = date !== undefined ? date : existing.date;
    const newDuration = duration !== undefined ? duration : existing.duration;
    const newHours = hours !== undefined ? Number(hours) : existing.hours;
    const newCapacity = capacity !== undefined ? Number(capacity) : existing.capacity;
    const newStatus = status !== undefined ? status : existing.status;
    const newCategory = category !== undefined ? category : existing.category;
    const newFormat = (activity_format || activityFormat) !== undefined ? (activity_format || activityFormat) : (existing.activity_format || 'weekly');
    const newTiming = (timing_details || timingDetails) !== undefined ? (timing_details || timingDetails) : (existing.timing_details || existing.schedule || '');
    const newImage = image !== undefined ? image : existing.image;

    let newSkills = existing.skills_needed;
    if (skills_needed !== undefined) {
      newSkills = Array.isArray(skills_needed) ? skills_needed.join(', ') : skills_needed;
    }

    db.prepare(`
      UPDATE opportunities SET
        title = ?,
        description = ?,
        skills_needed = ?,
        city = ?,
        address = ?,
        latitude = ?,
        longitude = ?,
        schedule = ?,
        date = ?,
        duration = ?,
        hours = ?,
        capacity = ?,
        status = ?,
        category = ?,
        activity_format = ?,
        timing_details = ?,
        image = ?
      WHERE id = ?
    `).run(
      newTitle,
      newDesc,
      newSkills,
      newCity,
      newAddress,
      newLat,
      newLng,
      newSchedule,
      newDate,
      newDuration,
      newHours,
      newCapacity,
      newStatus,
      newCategory,
      newFormat,
      newTiming,
      newImage,
      existing.id
    );

    const updated = db.prepare(`
      SELECT 
        o.*,
        u.name as org_name,
        u.email as org_email,
        u.organization_name as org_display_name,
        u.organization_city as org_city,
        u.verification_status,
        u.ngo_darpan_id,
        u.registration_number,
        u.registration_type,
        u.tax_exemption_80g,
        u.tax_exemption_12a,
        u.fcra_registered,
        u.trustee_name,
        u.verified_at,
        u.verification_notes,
        u.trust_score
      FROM opportunities o
      JOIN users u ON o.org_id = u.id
      WHERE o.id = ?
    `).get(existing.id);

    res.json({
      success: true,
      data: formatOpportunity(updated)
    });
  } catch (err) {
    console.error('Error updating opportunity:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to update opportunity' }
    });
  }
});

/**
 * DELETE /api/opportunities/:id
 * Authenticated organizations only: delete own opportunity
 */
router.delete('/:id', requireAuth, requireRole('organization'), async (req, res) => {
  try {
    const db = await getDb();
    const existing = db.prepare('SELECT * FROM opportunities WHERE id = ?').get(req.params.id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Opportunity not found' }
      });
    }

    if (existing.org_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You are not authorized to delete another organization’s opportunity' }
      });
    }

    db.prepare('DELETE FROM opportunities WHERE id = ?').run(existing.id);

    res.json({
      success: true,
      data: { message: 'Opportunity deleted successfully', id: existing.id }
    });
  } catch (err) {
    console.error('Error deleting opportunity:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to delete opportunity' }
    });
  }
});

/**
 * GET /api/opportunities/:id/teams
 * Returns collegiate squads associated with this opportunity
 */
router.get('/:id/teams', async (req, res) => {
  try {
    const db = await getDb();
    const teams = db.prepare(`
      SELECT 
        t.id,
        t.college,
        t.city,
        t.team_name,
        t.created_at,
        COUNT(tm.user_id) as member_count
      FROM teams t
      LEFT JOIN team_members tm ON t.id = tm.team_id
      WHERE t.opportunity_id = ?
      GROUP BY t.id
      ORDER BY member_count DESC, t.college ASC
    `).all(req.params.id);

    res.json({
      success: true,
      data: teams
    });
  } catch (err) {
    console.error('Error fetching teams:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve teams' }
    });
  }
});

/**
 * GET /api/opportunities/:id/teams/:college
 * Returns specific team for a college
 */
router.get('/:id/teams/:college', async (req, res) => {
  try {
    const db = await getDb();
    const team = db.prepare(`
      SELECT * FROM teams WHERE opportunity_id = ? AND LOWER(college) = LOWER(?)
    `).get(req.params.id, decodeURIComponent(req.params.college));

    if (!team) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'No team yet for this college in this opportunity' }
      });
    }

    const members = db.prepare(`
      SELECT u.id, u.name, u.college, u.home_city, u.skills
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = ?
    `).all(team.id);

    const formattedMembers = members.map(m => ({
      id: m.id,
      name: m.name,
      college: m.college,
      city: m.home_city,
      skills: m.skills ? m.skills.split(',').map(s => s.trim()).filter(Boolean) : []
    }));

    res.json({
      success: true,
      data: {
        ...team,
        members: formattedMembers
      }
    });
  } catch (err) {
    console.error('Error fetching college team:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve college team' }
    });
  }
});

/**
 * GET /api/opportunities/:id/applicants
 * Only owner organization can view applicants.
 * Returns applicants grouped by college dynamically generated from SQL!
 */
router.get('/:id/applicants', requireAuth, requireRole('organization'), async (req, res) => {
  try {
    const db = await getDb();
    const opp = db.prepare('SELECT id, org_id, title FROM opportunities WHERE id = ?').get(req.params.id);

    if (!opp) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Opportunity not found' }
      });
    }

    if (opp.org_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You can only view applicants for opportunities posted by your organization' }
      });
    }

    // Query all applicants for this opportunity
    const rows = db.prepare(`
      SELECT 
        a.id as application_id,
        a.status as application_status,
        a.statement,
        a.volunteer_hours,
        a.completion_date,
        a.certificate_id,
        a.applied_at,
        u.id as user_id,
        u.name as user_name,
        u.email as user_email,
        u.college as user_college,
        u.home_city as user_city,
        u.skills as user_skills,
        t.id as team_id,
        t.team_name,
        t.college as team_college
      FROM applications a
      JOIN users u ON a.user_id = u.id
      LEFT JOIN teams t ON a.team_id = t.id
      WHERE a.opportunity_id = ?
      ORDER BY u.college ASC, a.applied_at DESC
    `).all(opp.id);

    // Dynamic grouping by college generated from SQL
    const byCollege = {};
    const collegeCounts = {};

    rows.forEach(r => {
      const col = r.user_college || 'Independent / Other';
      if (!byCollege[col]) {
        byCollege[col] = [];
        collegeCounts[col] = 0;
      }
      collegeCounts[col]++;

      byCollege[col].push({
        id: r.application_id,
        status: r.application_status,
        statement: r.statement,
        appliedAt: r.applied_at,
        volunteerHours: r.volunteer_hours,
        completionDate: r.completion_date,
        certificateId: r.certificate_id,
        teamId: r.team_id,
        teamName: r.team_name,
        user: {
          id: r.user_id,
          name: r.user_name,
          email: r.user_email,
          college: r.user_college,
          city: r.user_city,
          skills: r.user_skills ? r.user_skills.split(',').map(s => s.trim()).filter(Boolean) : []
        }
      });
    });

    const summary = Object.entries(collegeCounts).map(([college, count]) => ({
      college,
      count
    })).sort((a, b) => b.count - a.count);

    res.json({
      success: true,
      data: {
        opportunityId: opp.id,
        opportunityTitle: opp.title,
        totalApplicants: rows.length,
        summary,
        byCollege
      }
    });
  } catch (err) {
    console.error('Error fetching opportunity applicants:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve applicants' }
    });
  }
});

/**
 * In-memory active check-in sessions for geofenced check-in
 * Stores { [oppId]: { sessionCode, openedAt, venueLat, venueLng, radiusMeters, hostId } }
 */
const activeCheckinSessions = {};

/**
 * GET /api/opportunities/:id/checkin-session
 * Retrieves current active check-in session and venue geofence parameters
 */
router.get('/:id/checkin-session', optionalAuth, async (req, res) => {
  try {
    const db = await getDb();
    const opp = db.prepare('SELECT * FROM opportunities WHERE id = ?').get(req.params.id);
    if (!opp) {
      return res.status(404).json({ success: false, error: { message: 'Opportunity not found' } });
    }

    const defaultCoords = getDefaultCoordsForCity(opp.city, opp.address);
    const venueLat = opp.latitude != null ? Number(opp.latitude) : defaultCoords.lat;
    const venueLng = opp.longitude != null ? Number(opp.longitude) : defaultCoords.lng;

    let session = activeCheckinSessions[opp.id];
    if (!session) {
      // Auto-initialize standard session for demo
      session = {
        sessionCode: `SG-${opp.id.slice(-4).toUpperCase()}`,
        venueLat,
        venueLng,
        radiusMeters: 800, // 800m geofence radius around venue
        venueName: opp.address || `${opp.title} Venue`,
        city: opp.city,
        openedAt: new Date().toISOString(),
        hoursToCredit: Number(opp.hours) || 20
      };
      activeCheckinSessions[opp.id] = session;
    }

    res.json({
      success: true,
      data: session
    });
  } catch (err) {
    console.error('Error getting check-in session:', err);
    res.status(500).json({ success: false, error: { message: 'Failed to get check-in session' } });
  }
});

/**
 * POST /api/opportunities/:id/checkin-session
 * Host generates / refreshes check-in session with geofence parameters
 */
router.post('/:id/checkin-session', requireAuth, async (req, res) => {
  try {
    const db = await getDb();
    const opp = db.prepare('SELECT * FROM opportunities WHERE id = ?').get(req.params.id);
    if (!opp) {
      return res.status(404).json({ success: false, error: { message: 'Opportunity not found' } });
    }

    const { radiusMeters = 800, sessionCode } = req.body;
    const defaultCoords = getDefaultCoordsForCity(opp.city, opp.address);
    const venueLat = opp.latitude != null ? Number(opp.latitude) : defaultCoords.lat;
    const venueLng = opp.longitude != null ? Number(opp.longitude) : defaultCoords.lng;

    const code = sessionCode || `SG-${Math.floor(1000 + Math.random() * 9000)}`;

    const session = {
      sessionCode: code,
      venueLat,
      venueLng,
      radiusMeters: Math.max(200, Number(radiusMeters) || 800),
      venueName: opp.address || `${opp.title} Venue`,
      city: opp.city,
      openedAt: new Date().toISOString(),
      hoursToCredit: Number(opp.hours) || 20
    };

    activeCheckinSessions[opp.id] = session;

    res.json({
      success: true,
      data: session
    });
  } catch (err) {
    console.error('Error starting check-in session:', err);
    res.status(500).json({ success: false, error: { message: 'Failed to create check-in session' } });
  }
});

/**
 * POST /api/opportunities/:id/verify-checkin
 * Volunteer validates attendance with device GPS coordinates against venue geofence
 */
router.post('/:id/verify-checkin', requireAuth, async (req, res) => {
  try {
    const { deviceLat, deviceLng, sessionCode, mockBypassGeofence } = req.body;
    const userId = req.user.id;

    if (deviceLat == null || deviceLng == null) {
      return res.status(400).json({
        success: false,
        error: { message: 'Device GPS coordinates are required for geofenced check-in.' }
      });
    }

    const db = await getDb();
    const opp = db.prepare('SELECT * FROM opportunities WHERE id = ?').get(req.params.id);
    if (!opp) {
      return res.status(404).json({ success: false, error: { message: 'Opportunity not found' } });
    }

    // Retrieve or create session
    let session = activeCheckinSessions[opp.id];
    const defaultCoords = getDefaultCoordsForCity(opp.city, opp.address);
    const venueLat = session?.venueLat || (opp.latitude != null ? Number(opp.latitude) : defaultCoords.lat);
    const venueLng = session?.venueLng || (opp.longitude != null ? Number(opp.longitude) : defaultCoords.lng);
    const radiusMeters = session?.radiusMeters || 800;

    // Calculate Haversine distance in meters
    const R = 6371000; // meters
    const dLat = ((Number(venueLat) - Number(deviceLat)) * Math.PI) / 180;
    const dLng = ((Number(venueLng) - Number(deviceLng)) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((Number(deviceLat) * Math.PI) / 180) *
        Math.cos((Number(venueLat) * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceMeters = Math.round(R * c);

    // Verify distance is within geofence radius (or demo bypass)
    const isWithinGeofence = distanceMeters <= radiusMeters || mockBypassGeofence === true;

    if (!isWithinGeofence) {
      return res.status(403).json({
        success: false,
        verified: false,
        error: {
          code: 'OUTSIDE_GEOFENCE',
          message: `Attendance rejected: You are ${distanceMeters > 1000 ? (distanceMeters / 1000).toFixed(1) + ' km' : distanceMeters + ' m'} away from the venue. Check-in must be completed on-site within ${radiusMeters}m of ${opp.address || opp.city}.`,
          distanceMeters,
          radiusMeters,
          venueCoords: { lat: venueLat, lng: venueLng },
          deviceCoords: { lat: deviceLat, lng: deviceLng }
        }
      });
    }

    // Geofence check passed! Find or update user's application
    let app = db.prepare('SELECT * FROM applications WHERE user_id = ? AND opportunity_id = ?').get(userId, opp.id);
    const hoursToCredit = Number(opp.hours) || 20;
    const certId = `CERT-${opp.id}-${userId.slice(0, 6)}-${Date.now().toString(36).toUpperCase()}`;

    if (app) {
      db.prepare(`
        UPDATE applications 
        SET status = 'completed',
            volunteer_hours = ?,
            completion_date = date('now'),
            certificate_id = ?
        WHERE id = ?
      `).run(hoursToCredit, certId, app.id);
    } else {
      const appId = `app_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      db.prepare(`
        INSERT INTO applications (id, user_id, opportunity_id, status, applied_at, volunteer_hours, completion_date, certificate_id, statement)
        VALUES (?, ?, ?, 'completed', datetime('now'), ?, date('now'), ?, 'Direct On-Site Attendance Geofence Check-in')
      `).run(appId, userId, opp.id, hoursToCredit, certId);
    }

    // Generate Certificate record if not exists
    const existingCert = db.prepare('SELECT id FROM certificates WHERE id = ?').get(certId);
    if (!existingCert) {
      const certHash = `0x${Buffer.from(`${userId}:${opp.id}:${Date.now()}`).toString('hex').slice(0, 32)}`;
      db.prepare(`
        INSERT INTO certificates (id, application_id, user_id, opportunity_id, hours, verification_hash, issue_date, status)
        VALUES (?, ?, ?, ?, ?, ?, date('now'), 'issued')
      `).run(certId, app?.id || certId, userId, opp.id, hoursToCredit, certHash);
    }

    res.json({
      success: true,
      verified: true,
      data: {
        opportunityId: opp.id,
        opportunityTitle: opp.title,
        verifiedHours: hoursToCredit,
        distanceMeters,
        radiusMeters,
        certificateId: certId,
        completionDate: new Date().toLocaleDateString('en-IN'),
        message: `Success! Attendance verified at ${opp.address || opp.city}. ${hoursToCredit} verified hours awarded.`
      }
    });
  } catch (err) {
    console.error('Error verifying checkin:', err);
    res.status(500).json({ success: false, error: { message: 'Failed to verify check-in.' } });
  }
});

export default router;
