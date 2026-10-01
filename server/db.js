import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { seedExtendedData } from './seedExtended.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.resolve(__dirname, '../sangam.sqlite');
const SCHEMA_FILE = path.resolve(__dirname, 'schema.sql');

let rawDb = null;
let inTransaction = false;

function saveDb() {
  if (rawDb && !inTransaction) {
    const data = rawDb.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE, buffer);
  }
}

class PreparedStatement {
  constructor(db, sql) {
    this.db = db;
    this.sql = sql;
  }

  run(...params) {
    const stmt = this.db.prepare(this.sql);
    try {
      stmt.run(params);
      saveDb();
      return {
        changes: this.db.getRowsModified()
      };
    } finally {
      stmt.free();
    }
  }

  get(...params) {
    const stmt = this.db.prepare(this.sql);
    try {
      stmt.bind(params);
      if (stmt.step()) {
        return stmt.getAsObject();
      }
      return undefined;
    } finally {
      stmt.free();
    }
  }

  all(...params) {
    const stmt = this.db.prepare(this.sql);
    const results = [];
    try {
      stmt.bind(params);
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      return results;
    } finally {
      stmt.free();
    }
  }
}

class DbWrapper {
  constructor(db) {
    this.db = db;
  }

  prepare(sql) {
    return new PreparedStatement(this.db, sql);
  }

  exec(sql) {
    this.db.exec(sql);
    saveDb();
  }

  transaction(fn) {
    return (...args) => {
      inTransaction = true;
      this.db.exec('BEGIN TRANSACTION;');
      try {
        const result = fn(...args);
        this.db.exec('COMMIT;');
        inTransaction = false;
        saveDb();
        return result;
      } catch (err) {
        try {
          this.db.exec('ROLLBACK;');
        } catch {
          // ignore rollback errors
        }
        inTransaction = false;
        throw err;
      }
    };
  }
}

export async function getDb() {
  if (rawDb) {
    return new DbWrapper(rawDb);
  }

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_FILE)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE);
      rawDb = new SQL.Database(fileBuffer);
    } catch (e) {
      console.warn('Failed reading sqlite file, recreating:', e);
      rawDb = new SQL.Database();
    }
  } else {
    rawDb = new SQL.Database();
  }

  const wrapped = new DbWrapper(rawDb);

  // Initialize schema
  const schemaSql = fs.readFileSync(SCHEMA_FILE, 'utf-8');
  wrapped.exec(schemaSql);

  // Run schema additions & data enrichment
  try {
    ensureSchemaAndEnrichData(wrapped);
  } catch (err) {
    console.warn('Notice during schema enrichment:', err);
  }

  // Seed reference data and demo records if users or colleges empty
  try {
    const collegeCount = wrapped.prepare('SELECT COUNT(*) as count FROM colleges').get()?.count || 0;
    const userCount = wrapped.prepare('SELECT COUNT(*) as count FROM users').get()?.count || 0;

    if (collegeCount === 0 || userCount === 0) {
      await seedInitialData(wrapped);
    }
  } catch (err) {
    console.error('Error during database verification or seed:', err);
    await seedInitialData(wrapped);
  }

  return wrapped;
}

function ensureSchemaAndEnrichData(wrapped) {
  // 1. Add verification columns to users if missing
  const userCols = [
    "ALTER TABLE users ADD COLUMN verification_status TEXT NOT NULL DEFAULT 'unverified'",
    "ALTER TABLE users ADD COLUMN ngo_darpan_id TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE users ADD COLUMN registration_number TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE users ADD COLUMN registration_type TEXT NOT NULL DEFAULT 'Trust'",
    "ALTER TABLE users ADD COLUMN tax_exemption_80g INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE users ADD COLUMN tax_exemption_12a INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE users ADD COLUMN fcra_registered INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE users ADD COLUMN trustee_name TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE users ADD COLUMN verified_at TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE users ADD COLUMN verification_notes TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE users ADD COLUMN trust_score INTEGER NOT NULL DEFAULT 75"
  ];
  userCols.forEach(sql => {
    try { wrapped.exec(sql); } catch (e) { /* column exists */ }
  });

  // 2. Add missing columns to opportunities if missing
  const oppCols = [
    "ALTER TABLE opportunities ADD COLUMN address TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE opportunities ADD COLUMN latitude REAL",
    "ALTER TABLE opportunities ADD COLUMN longitude REAL",
    "ALTER TABLE opportunities ADD COLUMN schedule TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE opportunities ADD COLUMN image TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE opportunities ADD COLUMN activity_format TEXT NOT NULL DEFAULT 'weekly'",
    "ALTER TABLE opportunities ADD COLUMN timing_details TEXT NOT NULL DEFAULT ''"
  ];
  oppCols.forEach(sql => {
    try { wrapped.exec(sql); } catch (e) { /* column exists */ }
  });

  // 3. Update existing orgs with verified credentials
  const orgUpdates = [
    {
      id: 'org_srm_outreach',
      status: 'govt_registered',
      darpan: 'TN/2018/0201948',
      regNum: 'SRM-UGC-ACT-2002',
      regType: 'University Statutory Outreach Cell',
      has80g: 1, has12a: 1, fcra: 0,
      trustee: 'Dr. C. Muthamizhchelvan',
      score: 98,
      notes: 'Statutory Outreach Wing of SRMIST recognized by UGC and Ministry of Education.'
    },
    {
      id: 'org_greenearth',
      status: 'verified',
      darpan: 'DL/2016/0114829',
      regNum: 'DEL-TR-2016-8819',
      regType: 'Registered Public Environmental Trust',
      has80g: 1, has12a: 1, fcra: 1,
      trustee: 'Dr. Sunita Narain / Aniket Mathur',
      score: 96,
      notes: 'NITI Aayog Darpan registered with 80G tax exemption and clean FCRA audit.'
    },
    {
      id: 'org_teachall',
      status: 'verified',
      darpan: 'KA/2019/0082716',
      regNum: 'U85300KA2019NPL128490',
      regType: 'Section 8 Non-Profit Company (MCA)',
      has80g: 1, has12a: 1, fcra: 0,
      trustee: 'Radhika Ramaswamy',
      score: 94,
      notes: 'MCA Section 8 Non-Profit registered with audited financial transparency.'
    },
    {
      id: 'org_cleancity',
      status: 'govt_registered',
      darpan: 'MH/2017/0158291',
      regNum: 'MUM-SOC-2017-0492',
      regType: 'Registered Charitable Trust',
      has80g: 1, has12a: 1, fcra: 0,
      trustee: 'Kavita Merchant',
      score: 92,
      notes: 'Registered with Maharashtra Charity Commissioner and BMC Marine Conservation Cell.'
    },
    {
      id: 'org_youthforseva',
      status: 'verified',
      darpan: 'TS/2018/0173820',
      regNum: 'TS-SOC-2018-9921',
      regType: 'Registered Society',
      has80g: 1, has12a: 1, fcra: 1,
      trustee: 'Venkatesh Murthy',
      score: 96,
      notes: 'Empanelled with Telangana State Youth Development & Volunteer Services.'
    }
  ];

  orgUpdates.forEach(o => {
    try {
      wrapped.prepare(`
        UPDATE users SET
          verification_status = ?,
          ngo_darpan_id = ?,
          registration_number = ?,
          registration_type = ?,
          tax_exemption_80g = ?,
          tax_exemption_12a = ?,
          fcra_registered = ?,
          trustee_name = ?,
          trust_score = ?,
          verified_at = '2026-06-01T10:00:00.000Z',
          verification_notes = ?
        WHERE id = ?
      `).run(o.status, o.darpan, o.regNum, o.regType, o.has80g, o.has12a, o.fcra, o.trustee, o.score, o.notes, o.id);
    } catch (e) {
      // ignore
    }
  });

  // 4. Ensure special NGOs exist: Blue Cross & Paws Shelter, and Youth Democracy & Civic Action
  const hash = bcrypt.hashSync('password123', 10);
  try {
    wrapped.prepare(`
      INSERT OR REPLACE INTO users (
        id, name, email, password_hash, role, organization_name, organization_city, organization_role, focus_areas, home_city, bio,
        verification_status, ngo_darpan_id, registration_number, registration_type, tax_exemption_80g, tax_exemption_12a, fcra_registered, trustee_name, verified_at, verification_notes, trust_score, created_at
      ) VALUES (?, ?, ?, ?, 'organization', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'org_paws_animal',
      'Blue Cross & Paws Shelter Foundation',
      'shelter@bluecrosspaws.org',
      hash,
      'Blue Cross & Paws Animal Care Trust',
      'Chennai',
      'Shelter Coordinator & Vet Care Head',
      'Animal Welfare, Rescue & Rehabilitation, Puppy Socialization, Anti-Rabies Vaccination',
      'Chennai',
      'AWBI-recognized sanctuary and rehabilitation center providing emergency animal care, adoption drives, and humane education.',
      'verified',
      'TN/2015/0074219',
      'TN-AWBI-2015-3810',
      'Animal Welfare Charitable Trust (AWBI Recognized)',
      1, 1, 1,
      'Dr. S. Chinny Krishna',
      '2026-04-10T09:00:00.000Z',
      'Recognized by Animal Welfare Board of India (AWBI) and NITI Aayog NGO-Darpan. Regular audit passed.',
      97,
      '2026-07-06T08:00:00.000Z'
    );

    wrapped.prepare(`
      INSERT OR REPLACE INTO users (
        id, name, email, password_hash, role, organization_name, organization_city, organization_role, focus_areas, home_city, bio,
        verification_status, ngo_darpan_id, registration_number, registration_type, tax_exemption_80g, tax_exemption_12a, fcra_registered, trustee_name, verified_at, verification_notes, trust_score, created_at
      ) VALUES (?, ?, ?, ?, 'organization', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'org_civic_democracy',
      'Civic Voice & Democracy Youth Mission',
      'vote@civicvoice.org',
      hash,
      'Civic Voice & Youth Democracy Initiative',
      'Delhi',
      'National Campaign Lead',
      'Civic Literacy, First-Time Voter Registration, Election Awareness, Democratic Participation',
      'Delhi',
      'Dedicated non-partisan civil society foundation mobilizing student communities for 100% democratic voter turnout and electoral literacy.',
      'govt_registered',
      'DL/2014/0059124',
      'DEL-SOC-2014-4412',
      'Registered Electoral Literacy Trust',
      1, 1, 0,
      'Prof. Jagdeep Chhokar / Meenakshi Sen',
      '2026-03-25T11:00:00.000Z',
      'Empanelled with National Election Literacy Club (ELC) guidelines. 12A/80G certified.',
      99,
      '2026-07-07T08:00:00.000Z'
    );
  } catch (e) {
    // ignore
  }

  // 5. Ensure Animal Shelter Volunteering (Weekly with Timings) and Election Awareness (Campaign) are in opportunities!
  try {
    wrapped.prepare(`
      INSERT OR REPLACE INTO opportunities (
        id, org_id, title, description, skills_needed, city, address, latitude, longitude, schedule, date, duration, hours, capacity, applied_count, status, category, activity_format, timing_details, image, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'opp_animal_shelter',
      'org_paws_animal',
      'Blue Cross & Paws Shelter: Weekend Animal Care, Rescue & Rehabilitation',
      'Provide hands-on care for rescued dogs, cats, and injured native animals at the shelter. Student volunteers work in structured weekly morning cohorts assisting staff with puppy feeding, kennel socialization, basic grooming, and weekend public adoption drives. Perfect for compassionate students who want regular weekly impact.',
      'Animal Care, Volunteer Management, Public Outreach, Empathy & Care',
      'Chennai',
      'Blue Cross Animal Sanctuary & Hospital, Velachery Main Road, Guindy, Chennai 600032',
      12.9980,
      80.2150,
      'Every Saturday & Sunday, 8:00 AM – 11:30 AM',
      '2026-10-17T08:00:00.000Z',
      '6 Weeks',
      24,
      25,
      6,
      'open',
      'Animal Welfare',
      'weekly',
      'Every Saturday & Sunday, 08:00 AM – 11:30 AM IST (Weekly Cohort)',
      '/src/assets/images/opp_animal_shelter_1790696976814.jpg',
      '2026-08-10T08:00:00.000Z'
    );

    wrapped.prepare(`
      INSERT OR REPLACE INTO opportunities (
        id, org_id, title, description, skills_needed, city, address, latitude, longitude, schedule, date, duration, hours, capacity, applied_count, status, category, activity_format, timing_details, image, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'opp_election_awareness',
      'org_civic_democracy',
      'Youth Vote & Democracy: Collegiate Voter Awareness & Electoral Enrolment Campaign',
      'Lead a campus-wide and public democracy campaign! Student squads organize voter enrollment helpdesks (Form 6 assistance), host interactive myth-busting sessions on electoral participation, stage street plays on ethical voting, and conduct weekend citizen rallies across university clusters before upcoming elections.',
      'Public Speaking, Event Planning, Social Media, Community Mobilization, Civic Literacy',
      'Delhi',
      'Central Civic Amphitheater & University Enclave, Chhatra Marg, North Campus, Delhi 110007',
      28.6892,
      77.2090,
      '3-Week Campaign Sprint: Tue/Thu campus booths + Sat rallies',
      '2026-10-20T10:00:00.000Z',
      '3 Weeks',
      18,
      40,
      12,
      'open',
      'Civic & Democracy',
      'campaign',
      '3-Week Campaign Sprint: Tue/Thu campus booths (4-6 PM) + Sat public rallies (9 AM-1 PM)',
      '/src/assets/images/opp_traffic_civic_1790697071726.jpg',
      '2026-08-11T09:00:00.000Z'
    );

    wrapped.prepare(`
      INSERT OR REPLACE INTO opportunities (
        id, org_id, title, description, skills_needed, city, address, latitude, longitude, schedule, date, duration, hours, capacity, applied_count, status, category, activity_format, timing_details, image, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'opp_srm_marina_cleanup',
      'org_cleancity',
      'Marina Beach Mega Coastal Clean-up & Microplastic Drive',
      'A high-intensity, one-day environmental blitz! Mobilizing 500+ university students along Marina Beach promenade to collect, weigh, and segregate marine debris. Microplastic samples are logged for scientific research with the National Institute of Ocean Technology.',
      'Environmental Action, Logistics, Surveying, Data Collection',
      'Chennai',
      'Marina Beach Lighthouse Promenade, Kamarajar Salai, Mylapore, Chennai 600004',
      13.0382,
      80.2785,
      'Single Day Drive: Saturday, 6:00 AM – 11:30 AM',
      '2026-10-24T06:00:00.000Z',
      '1 Day',
      6,
      60,
      18,
      'open',
      'Environment',
      'one_day_drive',
      'Single Day Drive: Saturday, Oct 24, 06:00 AM – 11:30 AM IST (5.5 hrs)',
      '/src/assets/images/srm_coastal_cleanup_1790532259292.jpg',
      '2026-08-12T07:00:00.000Z'
    );

    // Update existing opportunities formats
    wrapped.prepare(`UPDATE opportunities SET activity_format = 'weekly', timing_details = 'Every Saturday & Sunday, 09:30 AM – 01:30 PM IST' WHERE id = 'opp_digital_literacy'`).run();
    wrapped.prepare(`UPDATE opportunities SET activity_format = 'one_day_drive', timing_details = 'Single Day Drive: Sunday, Oct 25, 07:00 AM – 12:00 PM IST (5 hrs)' WHERE id = 'opp_yamuna_afforestation'`).run();
    wrapped.prepare(`UPDATE opportunities SET activity_format = 'one_day_drive', timing_details = 'Single Day Blitz: Saturday, Nov 02, 06:00 AM – 11:30 AM IST (5.5 hrs)' WHERE id = 'opp_coastal_waste_audit'`).run();
    wrapped.prepare(`UPDATE opportunities SET activity_format = 'weekly', timing_details = 'Every Saturday, 10:00 AM – 02:00 PM IST' WHERE id = 'opp_stem_mentorship'`).run();
    wrapped.prepare(`UPDATE opportunities SET activity_format = 'one_day_drive', timing_details = 'Single Day Medical Camp: Saturday, 08:00 AM – 04:00 PM IST (8 hrs)' WHERE id = 'opp_community_health_camp'`).run();
    wrapped.prepare(`UPDATE opportunities SET activity_format = 'weekly', timing_details = 'Every Friday & Saturday, 10:00 AM – 02:00 PM IST' WHERE id = 'opp_slum_library_setup'`).run();
    wrapped.prepare(`UPDATE opportunities SET activity_format = 'one_day_drive', timing_details = 'Single Day Wetland Audit: Saturday, 07:00 AM – 01:00 PM IST (6 hrs)' WHERE id = 'opp_mumbai_mangrove_restoration'`).run();
    wrapped.prepare(`UPDATE opportunities SET activity_format = 'weekly', timing_details = 'Every Sunday, 10:00 AM – 01:00 PM IST' WHERE id = 'opp_elderly_tech_support'`).run();
    wrapped.prepare(`UPDATE opportunities SET activity_format = 'campaign', timing_details = 'Multi-Week Conservation Sprint: Bi-weekly water testing + community awareness' WHERE id = 'opp_bengaluru_lake_revival'`).run();
    wrapped.prepare(`UPDATE opportunities SET activity_format = 'campaign', timing_details = '3-Week Energy Survey Sprint: Weekday artisan cluster audits' WHERE id = 'opp_rural_solar_survey'`).run();
    wrapped.prepare(`UPDATE opportunities SET activity_format = 'weekly', timing_details = 'Every Saturday & Sunday, 08:30 AM – 01:00 PM IST' WHERE id = 'opp_community_nutrition'`).run();
  } catch (e) {
    console.warn('Error configuring opportunity formats:', e);
  }

  // Ensure user_guest_student and 3 verified certificates exist in the database
  try {
    const hash = bcrypt.hashSync('password123', 10);
    wrapped.prepare(`
      INSERT OR REPLACE INTO users (
        id, name, email, password_hash, role, college, home_city, course, skills, bio, verification_status
      ) VALUES (?, ?, ?, ?, 'student', ?, ?, ?, ?, ?, 'verified')
    `).run(
      'user_guest_student',
      'Aarav Sharma (Guest Student)',
      'guest.student@srmist.edu.in',
      hash,
      'SRM Kattankulathur (KTR)',
      'Chennai',
      'B.Tech Computer Science & Engineering',
      'Digital Literacy, Environmental Action, Animal Care, First Aid, STEM Mentorship',
      'Official Student Guest profile exploring collegiate squads, geofenced QR check-ins, and verified impact credentials.'
    );

    const certIdGuest1 = 'SAN-2026-SRM-GUEST-01';
    const certHashGuest1 = crypto.createHash('sha256').update(certIdGuest1).digest('hex');
    wrapped.prepare(`
      INSERT OR REPLACE INTO applications (
        id, user_id, opportunity_id, team_id, status, statement, volunteer_hours, hours_logged, completion_date, completed_at, certificate_id, certificate_hash, applied_at
      ) VALUES (?, ?, ?, ?, 'completed', ?, 16, 16, '2026-09-13T16:00:00.000Z', '2026-09-13T16:00:00.000Z', ?, ?, '2026-07-22T08:00:00.000Z')
    `).run('app_guest_health_comp', 'user_guest_student', 'opp_community_health_camp', 'team_srm_health', 'Supervised community registration and digital vitals log at SRM Rural Outreach Clinic.', certIdGuest1, certHashGuest1);

    const certIdGuest2 = 'SAN-2026-SRM-GUEST-02';
    const certHashGuest2 = crypto.createHash('sha256').update(certIdGuest2).digest('hex');
    wrapped.prepare(`
      INSERT OR REPLACE INTO applications (
        id, user_id, opportunity_id, team_id, status, statement, volunteer_hours, hours_logged, completion_date, completed_at, certificate_id, certificate_hash, applied_at
      ) VALUES (?, ?, ?, ?, 'completed', ?, 12, 12, '2026-08-28T14:30:00.000Z', '2026-08-28T14:30:00.000Z', ?, ?, '2026-08-10T09:00:00.000Z')
    `).run('app_guest_lake_comp', 'user_guest_student', 'opp_lake_cleanup', 'team_srm_lake', 'Led littoral zone plastic recovery and water quality sampling at Singaperumal Koil wetland.', certIdGuest2, certHashGuest2);

    const certIdGuest3 = 'SAN-2026-SRM-GUEST-03';
    const certHashGuest3 = crypto.createHash('sha256').update(certIdGuest3).digest('hex');
    wrapped.prepare(`
      INSERT OR REPLACE INTO applications (
        id, user_id, opportunity_id, team_id, status, statement, volunteer_hours, hours_logged, completion_date, completed_at, certificate_id, certificate_hash, applied_at
      ) VALUES (?, ?, ?, ?, 'completed', ?, 10, 10, '2026-08-05T12:00:00.000Z', '2026-08-05T12:00:00.000Z', ?, ?, '2026-07-28T10:00:00.000Z')
    `).run('app_guest_digital_comp', 'user_guest_student', 'opp_digital_literacy', 'team_srm_digital', 'Trained senior citizens on cyber scam protection and DigiLocker access.', certIdGuest3, certHashGuest3);

    wrapped.prepare(`
      INSERT OR REPLACE INTO applications (
        id, user_id, opportunity_id, team_id, status, statement, volunteer_hours, hours_logged, completion_date, completed_at, certificate_id, certificate_hash, applied_at
      ) VALUES (?, ?, ?, ?, 'applied', ?, 12, 0, '', null, '', '', '2026-08-15T09:00:00.000Z')
    `).run('app_guest_nutrition_active', 'user_guest_student', 'opp_community_nutrition', 'team_srm_nutrition', 'Ready to volunteer with the SRM KTR community relief squad for meal preparation and delivery.');
  } catch (err) {
    console.warn('Error ensuring guest student applications:', err);
  }

  try {
    seedExtendedData(wrapped);
    saveDb();
  } catch (err) {
    console.warn('Error during extended dataset enrichment:', err);
  }

  try {
    saveDb();
  } catch (e) {
    // ignore
  }
}

export async function seedInitialData(db) {
  const hash = bcrypt.hashSync('password123', 10);

  // 1. Reference Data: Colleges
  const collegesList = [
    // IITs (23)
    { name: 'IIT Bombay', category: 'IIT', city: 'Mumbai' },
    { name: 'IIT Delhi', category: 'IIT', city: 'Delhi' },
    { name: 'IIT Madras', category: 'IIT', city: 'Chennai' },
    { name: 'IIT Kanpur', category: 'IIT', city: 'Kanpur' },
    { name: 'IIT Kharagpur', category: 'IIT', city: 'Kharagpur' },
    { name: 'IIT Roorkee', category: 'IIT', city: 'Roorkee' },
    { name: 'IIT Guwahati', category: 'IIT', city: 'Guwahati' },
    { name: 'IIT Hyderabad', category: 'IIT', city: 'Hyderabad' },
    { name: 'IIT Indore', category: 'IIT', city: 'Indore' },
    { name: 'IIT Mandi', category: 'IIT', city: 'Mandi' },
    { name: 'IIT Ropar', category: 'IIT', city: 'Rupnagar' },
    { name: 'IIT Bhubaneswar', category: 'IIT', city: 'Bhubaneswar' },
    { name: 'IIT Gandhinagar', category: 'IIT', city: 'Gandhinagar' },
    { name: 'IIT Patna', category: 'IIT', city: 'Patna' },
    { name: 'IIT Jodhpur', category: 'IIT', city: 'Jodhpur' },
    { name: 'IIT (BHU) Varanasi', category: 'IIT', city: 'Varanasi' },
    { name: 'IIT Palakkad', category: 'IIT', city: 'Palakkad' },
    { name: 'IIT Tirupati', category: 'IIT', city: 'Tirupati' },
    { name: 'IIT (ISM) Dhanbad', category: 'IIT', city: 'Dhanbad' },
    { name: 'IIT Bhilai', category: 'IIT', city: 'Bhilai' },
    { name: 'IIT Goa', category: 'IIT', city: 'Goa' },
    { name: 'IIT Jammu', category: 'IIT', city: 'Jammu' },
    { name: 'IIT Dharwad', category: 'IIT', city: 'Dharwad' },

    // NITs (31)
    { name: 'NIT Tiruchirappalli', category: 'NIT', city: 'Tiruchirappalli' },
    { name: 'NIT Warangal', category: 'NIT', city: 'Warangal' },
    { name: 'NIT Karnataka, Surathkal', category: 'NIT', city: 'Mangalore' },
    { name: 'NIT Rourkela', category: 'NIT', city: 'Rourkela' },
    { name: 'NIT Calicut', category: 'NIT', city: 'Calicut' },
    { name: 'NIT Durgapur', category: 'NIT', city: 'Durgapur' },
    { name: 'NIT Kurukshetra', category: 'NIT', city: 'Kurukshetra' },
    { name: 'MNIT Jaipur', category: 'NIT', city: 'Jaipur' },
    { name: 'MANIT Bhopal', category: 'NIT', city: 'Bhopal' },
    { name: 'VNIT Nagpur', category: 'NIT', city: 'Nagpur' },
    { name: 'MNNIT Allahabad', category: 'NIT', city: 'Prayagraj' },
    { name: 'NIT Jamshedpur', category: 'NIT', city: 'Jamshedpur' },
    { name: 'NIT Patna', category: 'NIT', city: 'Patna' },
    { name: 'NIT Raipur', category: 'NIT', city: 'Raipur' },
    { name: 'NIT Silchar', category: 'NIT', city: 'Silchar' },
    { name: 'NIT Hamirpur', category: 'NIT', city: 'Hamirpur' },
    { name: 'NIT Jalandhar', category: 'NIT', city: 'Jalandhar' },
    { name: 'NIT Agartala', category: 'NIT', city: 'Agartala' },
    { name: 'NIT Meghalaya', category: 'NIT', city: 'Shillong' },
    { name: 'NIT Manipur', category: 'NIT', city: 'Imphal' },
    { name: 'NIT Mizoram', category: 'NIT', city: 'Aizawl' },
    { name: 'NIT Nagaland', category: 'NIT', city: 'Dimapur' },
    { name: 'NIT Sikkim', category: 'NIT', city: 'Ravangla' },
    { name: 'NIT Arunachal Pradesh', category: 'NIT', city: 'Yupia' },
    { name: 'NIT Delhi', category: 'NIT', city: 'Delhi' },
    { name: 'NIT Goa', category: 'NIT', city: 'Ponda' },
    { name: 'NIT Puducherry', category: 'NIT', city: 'Karaikal' },
    { name: 'NIT Uttarakhand', category: 'NIT', city: 'Srinagar' },
    { name: 'NIT Andhra Pradesh', category: 'NIT', city: 'Tadepalligudem' },
    { name: 'NIT Srinagar', category: 'NIT', city: 'Srinagar' },
    { name: 'SVNIT Surat', category: 'NIT', city: 'Surat' },

    // VIT (4)
    { name: 'VIT Vellore', category: 'VIT', city: 'Vellore' },
    { name: 'VIT Chennai', category: 'VIT', city: 'Chennai' },
    { name: 'VIT-AP Amaravati', category: 'VIT', city: 'Amaravati' },
    { name: 'VIT Bhopal', category: 'VIT', city: 'Bhopal' },

    // SRM (7)
    { name: 'SRM Kattankulathur (KTR)', category: 'SRM', city: 'Chennai' },
    { name: 'SRM Ramapuram', category: 'SRM', city: 'Chennai' },
    { name: 'SRM Vadapalani', category: 'SRM', city: 'Chennai' },
    { name: 'SRM Trichy', category: 'SRM', city: 'Trichy' },
    { name: 'SRM Amaravati', category: 'SRM', city: 'Amaravati' },
    { name: 'SRM Sonepat', category: 'SRM', city: 'Sonepat' },
    { name: 'SRM Sikkim', category: 'SRM', city: 'Gangtok' },

    // Universities (8)
    { name: 'University of Delhi', category: 'UNIVERSITY', city: 'Delhi' },
    { name: 'Jawaharlal Nehru University', category: 'UNIVERSITY', city: 'Delhi' },
    { name: 'Jamia Millia Islamia', category: 'UNIVERSITY', city: 'Delhi' },
    { name: 'Anna University', category: 'UNIVERSITY', city: 'Chennai' },
    { name: 'Jadavpur University', category: 'UNIVERSITY', city: 'Kolkata' },
    { name: 'Banaras Hindu University', category: 'UNIVERSITY', city: 'Varanasi' },
    { name: 'Osmania University', category: 'UNIVERSITY', city: 'Hyderabad' },
    { name: 'BITS Pilani', category: 'UNIVERSITY', city: 'Pilani' },

    // Other
    { name: 'Other / Not Listed', category: 'OTHER', city: '' }
  ];

  const insertCollege = db.prepare(`
    INSERT OR REPLACE INTO colleges (id, name, category, city, is_active)
    VALUES (?, ?, ?, ?, 1)
  `);

  collegesList.forEach((col, idx) => {
    insertCollege.run(`col_${idx + 1}`, col.name, col.category, col.city);
  });

  // 2. Reference Data: Cities
  const citiesList = [
    'Chennai',
    'Bengaluru',
    'Hyderabad',
    'Mumbai',
    'Delhi',
    'Pune',
    'Kolkata',
    'Ahmedabad',
    'Coimbatore',
    'Vellore',
    'Other'
  ];

  const insertCity = db.prepare(`
    INSERT OR REPLACE INTO cities (id, name, is_active)
    VALUES (?, ?, 1)
  `);

  citiesList.forEach((cityName, idx) => {
    insertCity.run(`city_${idx + 1}`, cityName);
  });

  // 3. Organizations (5 NGOs / Community Foundations)
  const insertOrg = db.prepare(`
    INSERT OR REPLACE INTO users (
      id, name, email, password_hash, role, organization_name, organization_city, organization_role, focus_areas, home_city, bio, created_at
    ) VALUES (?, ?, ?, ?, 'organization', ?, ?, ?, ?, ?, ?, ?)
  `);

  insertOrg.run(
    'org_srm_outreach',
    'SRM Community Action & Outreach Cell',
    'outreach@srmist.edu.in',
    hash,
    'SRM Community Action & Outreach Cell',
    'Chennai',
    'Outreach Director',
    'Rural Development, Digital Literacy, Health Camps, Youth Volunteering',
    'Chennai',
    'Central community engagement wing of SRMIST Kattankulathur connecting student cohorts with suburban public services.',
    '2026-07-01T08:00:00.000Z'
  );

  insertOrg.run(
    'org_greenearth',
    'GreenEarth India Foundation',
    'contact@greenearth.org',
    hash,
    'GreenEarth India Foundation',
    'Delhi',
    'Programs Lead',
    'Afforestation, River Rejuvenation, Urban Biodiversity, Climate Resilience',
    'Delhi',
    'National non-profit coordinating civic tree planting, Yamuna bank cleanup, and urban biodiversity surveys.',
    '2026-07-02T08:00:00.000Z'
  );

  insertOrg.run(
    'org_teachall',
    'TeachAll Youth Initiative',
    'coordinator@teachall.org',
    hash,
    'TeachAll Youth Initiative',
    'Bengaluru',
    'Education Director',
    'STEM Education, Weekend Mentorship, Digital Literacy, Child Welfare',
    'Bengaluru',
    'Enabling collegiate volunteers to run interactive coding and STEM experiments for underserved suburban schools.',
    '2026-07-03T08:00:00.000Z'
  );

  insertOrg.run(
    'org_cleancity',
    'CleanCity Urban Trust',
    'info@cleancity.org',
    hash,
    'CleanCity Urban Trust',
    'Mumbai',
    'Trustee & Head of Operations',
    'Coastal Conservation, Waste Audit, Microplastic Segregation, Marine Safety',
    'Mumbai',
    'Mobilizing citizens and university students along the Arabian coastline for coastal audits and waste diversion.',
    '2026-07-04T08:00:00.000Z'
  );

  insertOrg.run(
    'org_youthforseva',
    'Youth For Seva Fellowship',
    'contact@youthforseva.org',
    hash,
    'Youth For Seva Fellowship',
    'Hyderabad',
    'State Coordinator',
    'Community Health, Library Drives, Civic Awareness, Elderly Care',
    'Hyderabad',
    'National collegiate volunteering movement bridging campus youth with social organizations across Telangana.',
    '2026-07-05T08:00:00.000Z'
  );

  // 4. Student Volunteers (18 students across VIT, SRM, IIT Madras, DU, IIT Delhi + Official Guest Student)
  const insertStudent = db.prepare(`
    INSERT OR REPLACE INTO users (
      id, name, email, password_hash, role, college, home_city, course, skills, bio, created_at
    ) VALUES (?, ?, ?, ?, 'student', ?, ?, ?, ?, ?, ?)
  `);

  // Dedicated Official Student Guest Profile
  insertStudent.run(
    'user_guest_student',
    'Aarav Sharma (Guest Student)',
    'guest.student@srmist.edu.in',
    hash,
    'SRM Kattankulathur (KTR)',
    'Chennai',
    'B.Tech Computer Science & Engineering',
    'Environmental Action, STEM Mentorship, Animal Care, Digital Literacy, First Aid',
    'Official Student Guest profile for exploring collegiate squads, geofenced QR check-ins, and verified impact credentials.',
    '2026-08-01T08:00:00.000Z'
  );

  // VIT Vellore students (4)
  insertStudent.run('user_aarav_vit', 'Aarav Nair', 'aarav.nair@vit.ac.in', hash, 'VIT Vellore', 'Vellore', 'B.Tech Computer Science', 'Teaching, Technology, Python, Digital Literacy', 'Third year CS at VIT Vellore passionate about practical education tech.', '2026-08-01T10:00:00.000Z');
  insertStudent.run('user_meera_vit', 'Meera Raman', 'meera.r@vit.ac.in', hash, 'VIT Vellore', 'Vellore', 'B.Tech Electronics & Comm', 'Graphic Design, Digital Literacy, Content Writing', 'ECE student volunteering for community literacy initiatives.', '2026-08-01T10:30:00.000Z');
  insertStudent.run('user_rohan_vit', 'Rohan Gupta', 'rohan.g@vit.ac.in', hash, 'VIT Vellore', 'Chennai', 'B.Tech Information Technology', 'Web Development, Public Speaking, Teaching', 'Enthusiastic about teaching rural youth to code.', '2026-08-02T11:00:00.000Z');
  insertStudent.run('user_ananya_vit', 'Ananya Deshmukh', 'ananya.d@vit.ac.in', hash, 'VIT Vellore', 'Vellore', 'B.Tech Biotechnology', 'Public Health, First Aid, Documentation', 'Passionate about health awareness camps and school outreach.', '2026-08-02T11:30:00.000Z');

  // SRM Kattankulathur (KTR) students (4)
  insertStudent.run('user_karthik_srm', 'Karthik Subramanian', 'karthik.s@srmist.edu.in', hash, 'SRM Kattankulathur (KTR)', 'Chennai', 'B.Tech Computer Science & Engineering', 'Digital Literacy, Teaching, Web Development, Community Mobilization', 'Final year CS student at SRM KTR passionate about tech literacy.', '2026-08-03T09:00:00.000Z');
  insertStudent.run('user_divya_srm', 'Divya Sundaram', 'divya.s@srmist.edu.in', hash, 'SRM Kattankulathur (KTR)', 'Chennai', 'B.Tech Biotechnology', 'First Aid, Lab Research, Public Health, Volunteer Management', 'Biotech pre-med student at SRM coordinating community screening clinics.', '2026-08-03T09:30:00.000Z');
  insertStudent.run('user_sneha_srm', 'Sneha Krishnan', 'sneha.k@srmist.edu.in', hash, 'SRM Kattankulathur (KTR)', 'Chennai', 'B.Tech Computer Science', 'Graphic Design, Public Speaking, Digital Literacy, Robotics', 'SRM tech enthusiast committed to coding camps for high schoolers.', '2026-08-04T10:00:00.000Z');
  insertStudent.run('user_arjun_srm', 'Arjun Varma', 'arjun.v@srmist.edu.in', hash, 'SRM Kattankulathur (KTR)', 'Chennai', 'B.Tech Civil Engineering', 'Surveying, Social Outreach, Logistics, Environmental Action', 'Civil engineering student active in coastal reclamation.', '2026-08-04T10:30:00.000Z');

  // IIT Madras students (3)
  insertStudent.run('user_vikram_iitm', 'Vikram Raghavan', 'vikram.r@iitm.ac.in', hash, 'IIT Madras', 'Chennai', 'B.Tech Mechanical Engineering', 'Data Analysis, Logistics, Robotics, Teaching', 'IIT Madras student active in sustainable village technology.', '2026-08-05T08:00:00.000Z');
  insertStudent.run('user_kavya_iitm', 'Kavya Balaji', 'kavya.b@iitm.ac.in', hash, 'IIT Madras', 'Chennai', 'B.Tech Electrical Engineering', 'Solar Energy, Teaching, Python, Public Speaking', 'Renewable energy researcher volunteering for rural STEM outreach.', '2026-08-05T08:30:00.000Z');
  insertStudent.run('user_siddharth_iitm', 'Siddharth Menon', 'siddharth.m@iitm.ac.in', hash, 'IIT Madras', 'Chennai', 'Dual Degree Engineering Design', 'Product Design, Surveying, Environmental Action', 'Focusing on community recycling systems.', '2026-08-06T09:00:00.000Z');

  // University of Delhi students (4)
  insertStudent.run('user_aarav_du', 'Aarav Sharma', 'aarav.sharma@du.ac.in', hash, 'University of Delhi', 'Delhi', 'B.A. Political Science & Public Policy', 'Content Writing, Teaching, Social Media, Community Mobilization', 'Passionate about grassroots civic participation.', '2026-08-06T10:00:00.000Z');
  insertStudent.run('user_priya_du', 'Priya Verma', 'priya.v@du.ac.in', hash, 'University of Delhi', 'Delhi', 'B.Sc. Environmental Sciences', 'Event Planning, Photography, Volunteer Management, Afforestation', 'Dedicated to river ecosystem rejuvenation.', '2026-08-07T11:00:00.000Z');
  insertStudent.run('user_tanya_du', 'Tanya Kapoor', 'tanya.k@du.ac.in', hash, 'University of Delhi', 'Delhi', 'B.Com Honours', 'Finance, Logistics, Community Mobilization', 'Helping non-profits with budget accountability and drives.', '2026-08-07T11:30:00.000Z');
  insertStudent.run('user_rahul_du', 'Rahul Malhotra', 'rahul.m@du.ac.in', hash, 'University of Delhi', 'Delhi', 'B.A. Economics', 'Data Collection, Teaching, Public Policy', 'Focused on skill enhancement in urban slums.', '2026-08-08T12:00:00.000Z');

  // IIT Delhi students (3)
  insertStudent.run('user_sneha_iitd', 'Sneha Patel', 'sneha.p@iitd.ac.in', hash, 'IIT Delhi', 'Delhi', 'B.Tech Electrical Engineering', 'Data Analysis, Python, Environmental Research, Solar Tech', 'Focusing on clean energy and environmental modeling.', '2026-08-08T13:00:00.000Z');
  insertStudent.run('user_harsh_iitd', 'Harsh Singhal', 'harsh.s@iitd.ac.in', hash, 'IIT Delhi', 'Delhi', 'B.Tech Computer Science', 'Python, Machine Learning, STEM Mentorship', 'Mentoring high school teams in coding basics.', '2026-08-09T14:00:00.000Z');
  insertStudent.run('user_pooja_iitd', 'Pooja Agarwal', 'pooja.a@iitd.ac.in', hash, 'IIT Delhi', 'Delhi', 'B.Tech Chemical Engineering', 'Water Quality Testing, Chemistry, First Aid', 'Specializing in clean drinking water verification.', '2026-08-09T14:30:00.000Z');

  // 5. Opportunities (10+ realistic opportunities across cities & skills)
  // 5. Opportunities (15 realistic initiatives with addresses, coordinates & schedules)
  const insertOpp = db.prepare(`
    INSERT OR REPLACE INTO opportunities (
      id, org_id, title, description, skills_needed, city, address, latitude, longitude, schedule, date, duration, hours, capacity, applied_count, status, category, image, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertOpp.run(
    'opp_digital_literacy',
    'org_srm_outreach',
    'Rural Digital Literacy & Smartphone Safety Camp',
    'Empower rural village residents and women’s self-help groups near Chengalpattu with practical digital literacy: UPI payments, cyber safety, government service navigation, and student scholarship discovery. Student volunteers collaborate in collegiate squads.',
    'Digital Literacy, Teaching, Web Development, Community Mobilization',
    'Chennai',
    'Panchayat Community Hall, GST Road, Maraimalai Nagar, Chengalpattu 603209',
    12.7983,
    80.0245,
    'Saturdays & Sundays, 9:30 AM – 1:30 PM',
    '2026-10-18T09:00:00.000Z',
    '2 Weeks',
    20,
    30,
    9, // 4 VIT + 3 SRM + 2 IIT Madras = 9 applicants
    'open',
    'Education',
    '/src/assets/images/featured_digital_literacy_1790530845015.jpg',
    '2026-08-01T08:00:00.000Z'
  );

  insertOpp.run(
    'opp_yamuna_afforestation',
    'org_greenearth',
    'Yamuna Riverbank Urban Afforestation Drive',
    'Join GreenEarth Foundation to plant 1,500 indigenous native trees along the Yamuna biodiversity corridor. Student volunteers operate in college squads to manage sapling zones, soil prep, and citizen sensitization.',
    'Volunteer Management, Social Media, Event Planning, Environmental Action',
    'Delhi',
    'Yamuna Biodiversity Park Corridor, Wazirabad, Delhi 110054',
    28.7180,
    77.2340,
    'Weekend mornings, 7:00 AM – 11:00 AM',
    '2026-10-25T07:30:00.000Z',
    '1 Weekend',
    12,
    25,
    5, // 3 DU + 2 IIT Delhi = 5
    'open',
    'Environment',
    '/src/assets/images/srm_tree_planting_1790532298221.jpg',
    '2026-08-02T08:00:00.000Z'
  );

  insertOpp.run(
    'opp_coastal_waste_audit',
    'org_cleancity',
    'Kovalam & Besant Nagar Coastal Marine Waste Audit',
    'Partner with marine biologists and civic bodies to conduct systematic plastic waste segregation, microplastic data logging, and community beach reclamation along Chennai’s coastal strip.',
    'Surveying, Social Outreach, Logistics, Environmental Action, Data Analysis',
    'Chennai',
    'Besant Nagar Beach & Kovalam Coastal Marine Center, ECR Road, Chennai 600090',
    12.9984,
    80.2678,
    'Saturday dawn audit, 6:00 AM – 11:00 AM',
    '2026-11-02T06:30:00.000Z',
    '1 Weekend',
    10,
    35,
    3,
    'open',
    'Environment',
    '/src/assets/images/srm_coastal_cleanup_1790532259292.jpg',
    '2026-08-03T09:00:00.000Z'
  );

  insertOpp.run(
    'opp_stem_mentorship',
    'org_teachall',
    'Weekend STEM Mentors for Rural High Schools',
    'TeachAll is seeking passionate collegiate volunteers to run interactive, hands-on physics, coding, and science lab workshops for underprivileged 8th–10th grade students across suburban learning centers.',
    'Teaching, Python, Public Speaking, STEM Mentorship',
    'Bengaluru',
    'Government Model High School, Outer Ring Road, Bellandur, Bengaluru 560103',
    12.9320,
    77.6840,
    'Every Saturday, 10:00 AM – 2:00 PM',
    '2026-11-08T09:30:00.000Z',
    '4 Weeks',
    25,
    20,
    2,
    'open',
    'Education',
    '/src/assets/images/srm_stem_robotics_1790532269549.jpg',
    '2026-08-04T10:00:00.000Z'
  );

  insertOpp.run(
    'opp_community_health_camp',
    'org_srm_outreach',
    'Community Health & Preventive Wellness Camp',
    'Organize free health screening clinics, vitals monitoring, diabetes awareness, and nutritional counsel for over 800 peri-urban residents in Kanchipuram district alongside SRM Medical College doctors.',
    'First Aid, Lab Research, Public Health, Volunteer Management',
    'Chennai',
    'SRM Rural Health Outreach Clinic, Kanchipuram High Road, Chengalpattu 603001',
    12.8342,
    79.7036,
    'Full Day Medical Camp, 8:00 AM – 4:00 PM',
    '2026-09-12T08:00:00.000Z',
    'Completed',
    16,
    15,
    2,
    'completed',
    'Healthcare',
    '/src/assets/images/srm_health_camp_1790532283536.jpg',
    '2026-07-20T10:00:00.000Z'
  );

  insertOpp.run(
    'opp_slum_library_setup',
    'org_youthforseva',
    'Children Community Library & Book Bank Drive',
    'Establish vibrant, open-access reading corners and mini-libraries across three municipal schools in Old City Hyderabad. Volunteers curate books, organize storytelling sessions, and build reading habits.',
    'Teaching, Content Writing, Event Planning, Community Mobilization',
    'Hyderabad',
    'Municipal Urdu School, Charminar West, Old City, Hyderabad 500002',
    17.3616,
    78.4747,
    'Fridays & Saturdays, 10:00 AM – 2:00 PM',
    '2026-11-15T10:00:00.000Z',
    '3 Weeks',
    18,
    30,
    0,
    'open',
    'Education',
    '/src/assets/images/srm_library_story_1790570169598.jpg',
    '2026-08-05T11:00:00.000Z'
  );

  insertOpp.run(
    'opp_mumbai_mangrove_restoration',
    'org_cleancity',
    'Thane Creek Mangrove Biodiversity Documentation',
    'Field documentation and cleanup in the delicate Thane Creek mangrove wetland. Volunteers work alongside forest conservationists to record avian species and remove trapped debris.',
    'Surveying, Photography, Environmental Action, Data Analysis',
    'Mumbai',
    'Thane Creek Flamingo Sanctuary Gate, Airoli, Mumbai 400708',
    19.1620,
    72.9940,
    'Low tide slots, 7:00 AM – 1:00 PM',
    '2026-11-22T07:00:00.000Z',
    '2 Days',
    12,
    20,
    0,
    'open',
    'Environment',
    '/src/assets/images/story_meera_chennai_1790530867787.jpg',
    '2026-08-06T12:00:00.000Z'
  );

  insertOpp.run(
    'opp_elderly_tech_support',
    'org_srm_outreach',
    'Senior Citizens Smartphone & Digital Banking Clinic',
    'One-on-one technology coaching for senior citizens in suburban Chennai. Volunteers patiently guide elders on online pensions, railway bookings, medicine orders, and scam recognition.',
    'Teaching, Digital Literacy, Public Speaking',
    'Chennai',
    'Senior Citizen Recreation Guild, Potheri Railway Station Road, Kattankulathur 603203',
    12.8260,
    80.0410,
    'Every Sunday, 10:00 AM – 1:00 PM',
    '2026-11-29T10:00:00.000Z',
    '1 Day',
    8,
    15,
    0,
    'open',
    'Community Action',
    '/src/assets/images/campus_team_impact_1790530881758.jpg',
    '2026-08-07T13:00:00.000Z'
  );

  insertOpp.run(
    'opp_bengaluru_lake_revival',
    'org_teachall',
    'Bellandur Catchment Micro-Wetland Rejuvenation',
    'Citizen science and water testing initiative around secondary feeder canals. Student teams test water samples with field kits and record flora species.',
    'Data Analysis, Lab Research, Environmental Action, Logistics',
    'Bengaluru',
    'Bellandur Wetland Inflow Canal, Sarjapur Main Road, Bengaluru 560102',
    12.9260,
    77.6762,
    'Alternate weekends, 8:00 AM – 12:00 PM',
    '2026-12-05T08:00:00.000Z',
    '2 Weekends',
    15,
    25,
    0,
    'open',
    'Environment',
    '/src/assets/images/opp_lake_restoration_1790570182484.jpg',
    '2026-08-08T14:00:00.000Z'
  );

  insertOpp.run(
    'opp_rural_solar_survey',
    'org_greenearth',
    'Rooftop Solar & Energy Access Baseline Survey',
    'Conduct household energy assessments and solar rooftop feasibility evaluations for 200 off-grid artisan clusters in suburban Delhi NCR.',
    'Surveying, Python, Solar Energy, Data Collection',
    'Delhi',
    'Rural Artisan Cooperative Center, Najafgarh Cluster, South West Delhi 110043',
    28.6090,
    76.9850,
    'Weekday field batches, 10:00 AM – 3:00 PM',
    '2026-12-12T09:00:00.000Z',
    '3 Weeks',
    20,
    18,
    0,
    'open',
    'Technology',
    '/src/assets/images/story_solar_village_1790570221710.jpg',
    '2026-08-09T15:00:00.000Z'
  );

  insertOpp.run(
    'opp_community_nutrition',
    'org_srm_outreach',
    'Suburban Chennai Food Security & Community Kitchen Relief',
    'Join student squads from SRM Kattankulathur to prepare, package, and distribute 2,000 balanced warm meals and dry nutrient rations for low-income families and urban shelter communities in Chengalpattu district.',
    'Logistics, Public Health, Volunteer Management, Community Mobilization',
    'Chennai',
    'Annadanam Community Welfare Kitchen, Potheri Village, Kattankulathur 603203',
    12.8310,
    80.0380,
    'Saturday & Sunday, 6:00 AM – 12:00 PM',
    '2026-11-20T08:30:00.000Z',
    '1 Weekend',
    12,
    25,
    4,
    'open',
    'Healthcare',
    '/src/assets/images/opp_nutrition_kitchen_1790570196162.jpg',
    '2026-08-10T11:00:00.000Z'
  );

  insertOpp.run(
    'opp_school_vision_clinic',
    'org_srm_outreach',
    'Pediatric Vision Screening & Eye Care Camp',
    'Collaborate with SRM Medical College optometrists to conduct non-invasive visual acuity chart screenings, refractive error checks, and distribute corrective eyeglasses for 400 government school children in Chengalpattu.',
    'First Aid, Lab Research, Public Health, Teaching',
    'Chennai',
    'Government Higher Secondary School, Singaperumal Koil, Chengalpattu 603204',
    12.7650,
    80.0030,
    'Thursday & Friday, 9:00 AM – 2:30 PM',
    '2026-11-28T09:00:00.000Z',
    '2 Days',
    14,
    20,
    3,
    'open',
    'Healthcare',
    '/src/assets/images/opp_vision_clinic_1790570208128.jpg',
    '2026-08-11T12:00:00.000Z'
  );

  insertOpp.run(
    'opp_srm_marina_cleanup',
    'org_cleancity',
    'SRM Green Warriors Marina Debris & Coastal Sand Stabilization',
    'A massive dawn clean-up and dune vegetation stabilization drive along Marina Beach and Foreshore Estate. Student cohorts record waste weight by polymer type and plant shoreline sand-binding creepers.',
    'Environmental Action, Surveying, Logistics, Volunteer Management',
    'Chennai',
    'Marina Beach Promenade & Foreshore Estate Shoreline, Triplicane, Chennai 600005',
    13.0500,
    80.2824,
    'Sunday sunrise cleanup, 6:00 AM – 10:00 AM',
    '2026-12-06T06:00:00.000Z',
    '1 Weekend',
    10,
    40,
    6,
    'open',
    'Environment',
    '/src/assets/images/srm_coastal_cleanup_1790532259292.jpg',
    '2026-08-12T07:00:00.000Z'
  );

  insertOpp.run(
    'opp_rural_crafts_digital',
    'org_srm_outreach',
    'Artisan Women Digital Storefront & Cataloging Clinic',
    'Help Kanchipuram and Chengalpattu traditional weavers and handloom self-help groups digitize their merchandise catalog, photograph craft products with smartphones, and set up verified Open Network for Digital Commerce (ONDC) seller profiles.',
    'Digital Literacy, Graphic Design, Web Development, Teaching',
    'Chennai',
    'Handloom Weavers Federation Center, Collectorate Road, Kanchipuram 631501',
    12.8387,
    79.7011,
    'Saturdays, 10:00 AM – 4:00 PM',
    '2026-12-19T09:30:00.000Z',
    '3 Weeks',
    18,
    22,
    0,
    'open',
    'Technology',
    '/src/assets/images/hero_student_outreach_1790530832259.jpg',
    '2026-08-13T14:00:00.000Z'
  );

  insertOpp.run(
    'opp_urban_biodiversity_delhi',
    'org_greenearth',
    'Delhi Ridge Urban Forest Bird & Pollinator Census',
    'Join ecologists to map urban biodiversity corridors, conduct butterfly and pollinator counts, and eradicate invasive Vilayati Kikar shrubs across Northern Ridge conservation areas.',
    'Environmental Action, Surveying, Photography, Data Analysis',
    'Delhi',
    'Northern Ridge Forest Ecological Trail, Chauburja Marg, Delhi 110007',
    28.6750,
    77.2180,
    'Saturday & Sunday mornings, 7:00 AM – 11:30 AM',
    '2026-12-20T07:00:00.000Z',
    '2 Days',
    12,
    30,
    2,
    'open',
    'Environment',
    '/src/assets/images/srm_tree_planting_1790532298221.jpg',
    '2026-08-14T09:00:00.000Z'
  );

  // 6. Collegiate Squads (Teams auto-created for opportunities)
  const insertTeam = db.prepare(`
    INSERT OR REPLACE INTO teams (id, opportunity_id, college, city, team_name, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  // Digital Literacy Outreach Squads (Section 27 example: VIT Vellore 4 members, SRM KTR 3 members, IIT Madras 2 members)
  insertTeam.run('team_vit_digital', 'opp_digital_literacy', 'VIT Vellore', 'Vellore', 'VIT Vellore Squad', '2026-08-10T09:00:00.000Z');
  insertTeam.run('team_srm_digital', 'opp_digital_literacy', 'SRM Kattankulathur (KTR)', 'Chennai', 'SRM Kattankulathur Squad', '2026-08-10T09:15:00.000Z');
  insertTeam.run('team_iitm_digital', 'opp_digital_literacy', 'IIT Madras', 'Chennai', 'IIT Madras Squad', '2026-08-10T09:30:00.000Z');

  // Yamuna Afforestation Squads (Delhi University + IIT Delhi)
  insertTeam.run('team_du_yamuna', 'opp_yamuna_afforestation', 'University of Delhi', 'Delhi', 'Delhi University Squad', '2026-08-11T10:00:00.000Z');
  insertTeam.run('team_iitd_yamuna', 'opp_yamuna_afforestation', 'IIT Delhi', 'Delhi', 'IIT Delhi Squad', '2026-08-11T10:30:00.000Z');

  // Coastal Waste Audit Squad
  insertTeam.run('team_srm_coastal', 'opp_coastal_waste_audit', 'SRM Kattankulathur (KTR)', 'Chennai', 'SRM Kattankulathur Squad', '2026-08-12T11:00:00.000Z');

  // Community Health Camp Squad
  insertTeam.run('team_srm_health', 'opp_community_health_camp', 'SRM Kattankulathur (KTR)', 'Chennai', 'SRM Kattankulathur Squad', '2026-07-22T08:00:00.000Z');

  // 7. Team Members
  const insertMember = db.prepare(`
    INSERT OR REPLACE INTO team_members (id, team_id, user_id, joined_via, joined_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  // VIT Vellore team (4 members)
  insertMember.run('tm_vit_1', 'team_vit_digital', 'user_aarav_vit', 'first to join', '2026-08-10T09:00:00.000Z');
  insertMember.run('tm_vit_2', 'team_vit_digital', 'user_meera_vit', 'auto-match', '2026-08-10T09:05:00.000Z');
  insertMember.run('tm_vit_3', 'team_vit_digital', 'user_rohan_vit', 'auto-match', '2026-08-10T09:10:00.000Z');
  insertMember.run('tm_vit_4', 'team_vit_digital', 'user_ananya_vit', 'auto-match', '2026-08-10T09:12:00.000Z');

  // SRM KTR team (3 members)
  insertMember.run('tm_srm_1', 'team_srm_digital', 'user_karthik_srm', 'first to join', '2026-08-10T09:15:00.000Z');
  insertMember.run('tm_srm_2', 'team_srm_digital', 'user_divya_srm', 'auto-match', '2026-08-10T09:20:00.000Z');
  insertMember.run('tm_srm_3', 'team_srm_digital', 'user_sneha_srm', 'auto-match', '2026-08-10T09:25:00.000Z');

  // IIT Madras team (2 members)
  insertMember.run('tm_iitm_1', 'team_iitm_digital', 'user_vikram_iitm', 'first to join', '2026-08-10T09:30:00.000Z');
  insertMember.run('tm_iitm_2', 'team_iitm_digital', 'user_kavya_iitm', 'auto-match', '2026-08-10T09:35:00.000Z');

  // DU team (3 members)
  insertMember.run('tm_du_1', 'team_du_yamuna', 'user_aarav_du', 'first to join', '2026-08-11T10:00:00.000Z');
  insertMember.run('tm_du_2', 'team_du_yamuna', 'user_priya_du', 'auto-match', '2026-08-11T10:05:00.000Z');
  insertMember.run('tm_du_3', 'team_du_yamuna', 'user_tanya_du', 'auto-match', '2026-08-11T10:10:00.000Z');

  // IIT Delhi team (2 members)
  insertMember.run('tm_iitd_1', 'team_iitd_yamuna', 'user_sneha_iitd', 'first to join', '2026-08-11T10:30:00.000Z');
  insertMember.run('tm_iitd_2', 'team_iitd_yamuna', 'user_harsh_iitd', 'auto-match', '2026-08-11T10:35:00.000Z');

  // SRM Coastal team (3 members)
  insertMember.run('tm_c_1', 'team_srm_coastal', 'user_karthik_srm', 'first to join', '2026-08-12T11:00:00.000Z');
  insertMember.run('tm_c_2', 'team_srm_coastal', 'user_arjun_srm', 'auto-match', '2026-08-12T11:05:00.000Z');
  insertMember.run('tm_c_3', 'team_srm_coastal', 'user_sneha_srm', 'auto-match', '2026-08-12T11:10:00.000Z');

  // SRM Health Camp team (2 completed members + Guest Student)
  insertMember.run('tm_h_1', 'team_srm_health', 'user_divya_srm', 'first to join', '2026-07-22T08:00:00.000Z');
  insertMember.run('tm_h_2', 'team_srm_health', 'user_arjun_srm', 'auto-match', '2026-07-22T08:30:00.000Z');
  insertMember.run('tm_h_guest', 'team_srm_health', 'user_guest_student', 'auto-match', '2026-07-22T08:45:00.000Z');

  // 8. Applications
  const insertApp = db.prepare(`
    INSERT OR REPLACE INTO applications (
      id, user_id, opportunity_id, team_id, status, statement, volunteer_hours, hours_logged, completion_date, completed_at, certificate_id, certificate_hash, applied_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Official Guest Student Applications (3 Completed Certificates + 1 Active Check-in Ready)
  const certIdGuest = 'SAN-2026-SRM-GUEST-01';
  const certHashGuest = crypto.createHash('sha256').update(certIdGuest).digest('hex');
  insertApp.run(
    'app_guest_health_comp',
    'user_guest_student',
    'opp_community_health_camp',
    'team_srm_health',
    'completed',
    'Supervised community registration and digital vitals log at SRM Rural Outreach Clinic.',
    16,
    16,
    '2026-09-13T16:00:00.000Z',
    '2026-09-13T16:00:00.000Z',
    certIdGuest,
    certHashGuest,
    '2026-07-22T08:00:00.000Z'
  );

  const certIdGuest2 = 'SAN-2026-SRM-GUEST-02';
  const certHashGuest2 = crypto.createHash('sha256').update(certIdGuest2).digest('hex');
  insertApp.run(
    'app_guest_lake_comp',
    'user_guest_student',
    'opp_lake_cleanup',
    'team_srm_lake',
    'completed',
    'Led littoral zone plastic recovery and water quality sampling at Singaperumal Koil wetland.',
    12,
    12,
    '2026-08-28T14:30:00.000Z',
    '2026-08-28T14:30:00.000Z',
    certIdGuest2,
    certHashGuest2,
    '2026-08-10T09:00:00.000Z'
  );

  const certIdGuest3 = 'SAN-2026-SRM-GUEST-03';
  const certHashGuest3 = crypto.createHash('sha256').update(certIdGuest3).digest('hex');
  insertApp.run(
    'app_guest_digital_comp',
    'user_guest_student',
    'opp_digital_literacy',
    'team_srm_digital',
    'completed',
    'Trained senior citizens on cyber scam protection and DigiLocker access.',
    10,
    10,
    '2026-08-05T12:00:00.000Z',
    '2026-08-05T12:00:00.000Z',
    certIdGuest3,
    certHashGuest3,
    '2026-07-28T10:00:00.000Z'
  );

  insertApp.run(
    'app_guest_nutrition_active',
    'user_guest_student',
    'opp_community_nutrition',
    'team_srm_nutrition',
    'applied',
    'Ready to volunteer with the SRM KTR community relief squad for meal preparation and delivery.',
    12,
    0,
    '',
    null,
    '',
    '',
    '2026-08-15T09:00:00.000Z'
  );

  // Digital Literacy Applications
  insertApp.run('app_aarav_vit_dl', 'user_aarav_vit', 'opp_digital_literacy', 'team_vit_digital', 'applied', 'Eager to train women entrepreneurs on UPI fraud prevention.', 0, 0, '', null, '', '', '2026-08-10T09:00:00.000Z');
  insertApp.run('app_meera_vit_dl', 'user_meera_vit', 'opp_digital_literacy', 'team_vit_digital', 'applied', 'Creating bilingual infographics and illustrated cheat sheets.', 0, 0, '', null, '', '', '2026-08-10T09:05:00.000Z');
  insertApp.run('app_rohan_vit_dl', 'user_rohan_vit', 'opp_digital_literacy', 'team_vit_digital', 'applied', 'Assisting with hands-on smartphone navigation.', 0, 0, '', null, '', '', '2026-08-10T09:10:00.000Z');
  insertApp.run('app_ananya_vit_dl', 'user_ananya_vit', 'opp_digital_literacy', 'team_vit_digital', 'applied', 'Coordinating village hall attendance & feedback surveys.', 0, 0, '', null, '', '', '2026-08-10T09:12:00.000Z');

  insertApp.run('app_karthik_srm_dl', 'user_karthik_srm', 'opp_digital_literacy', 'team_srm_digital', 'applied', 'Leading our SRM squad in Maraimalai Nagar demonstration tables.', 0, 0, '', null, '', '', '2026-08-10T09:15:00.000Z');
  insertApp.run('app_divya_srm_dl', 'user_divya_srm', 'opp_digital_literacy', 'team_srm_digital', 'applied', 'Managing booth registration and triage.', 0, 0, '', null, '', '', '2026-08-10T09:20:00.000Z');
  insertApp.run('app_sneha_srm_dl', 'user_sneha_srm', 'opp_digital_literacy', 'team_srm_digital', 'applied', 'Running the offline simulator demos.', 0, 0, '', null, '', '', '2026-08-10T09:25:00.000Z');

  insertApp.run('app_vikram_iitm_dl', 'user_vikram_iitm', 'opp_digital_literacy', 'team_iitm_digital', 'applied', 'Supporting technical connectivity and network setup.', 0, 0, '', null, '', '', '2026-08-10T09:30:00.000Z');
  insertApp.run('app_kavya_iitm_dl', 'user_kavya_iitm', 'opp_digital_literacy', 'team_iitm_digital', 'applied', 'Explaining digital scholarship portals for high schoolers.', 0, 0, '', null, '', '', '2026-08-10T09:35:00.000Z');

  // Yamuna Afforestation Applications
  insertApp.run('app_aarav_du_ya', 'user_aarav_du', 'opp_yamuna_afforestation', 'team_du_yamuna', 'applied', 'Representing DU North Campus youth club.', 0, 0, '', null, '', '', '2026-08-11T10:00:00.000Z');
  insertApp.run('app_priya_du_ya', 'user_priya_du', 'opp_yamuna_afforestation', 'team_du_yamuna', 'applied', 'Coordinating sapling nursery distribution.', 0, 0, '', null, '', '', '2026-08-11T10:05:00.000Z');
  insertApp.run('app_tanya_du_ya', 'user_tanya_du', 'opp_yamuna_afforestation', 'team_du_yamuna', 'applied', 'Managing on-ground volunteer registration.', 0, 0, '', null, '', '', '2026-08-11T10:10:00.000Z');

  insertApp.run('app_sneha_iitd_ya', 'user_sneha_iitd', 'opp_yamuna_afforestation', 'team_iitd_yamuna', 'applied', 'Logging GPS coordinates of planted saplings.', 0, 0, '', null, '', '', '2026-08-11T10:30:00.000Z');
  insertApp.run('app_harsh_iitd_ya', 'user_harsh_iitd', 'opp_yamuna_afforestation', 'team_iitd_yamuna', 'applied', 'Assisting with soil aeration and watering channels.', 0, 0, '', null, '', '', '2026-08-11T10:35:00.000Z');

  // Completed Health Camp Applications with Verified Certificate
  const certId1 = 'SAN-2026-SRM-4821';
  const certHash1 = crypto.createHash('sha256').update(certId1).digest('hex');
  insertApp.run(
    'app_divya_health_comp',
    'user_divya_srm',
    'opp_community_health_camp',
    'team_srm_health',
    'completed',
    'Supervised vitals station and patient records for 800+ rural visitors.',
    16,
    16,
    '2026-09-13T16:00:00.000Z',
    '2026-09-13T16:00:00.000Z',
    certId1,
    certHash1,
    '2026-07-22T08:00:00.000Z'
  );

  const certId2 = 'SAN-2026-SRM-4822';
  const certHash2 = crypto.createHash('sha256').update(certId2).digest('hex');
  insertApp.run(
    'app_arjun_health_comp',
    'user_arjun_srm',
    'opp_community_health_camp',
    'team_srm_health',
    'completed',
    'Managed clinic patient queue and logistics with village panchayat.',
    16,
    16,
    '2026-09-13T16:00:00.000Z',
    '2026-09-13T16:00:00.000Z',
    certId2,
    certHash2,
    '2026-07-22T08:30:00.000Z'
  );

  // Additional Collegiate Squads for New Opportunities
  insertTeam.run('team_srm_nutrition', 'opp_community_nutrition', 'SRM Kattankulathur (KTR)', 'Chennai', 'SRM Kattankulathur Squad', '2026-08-13T10:00:00.000Z');
  insertTeam.run('team_srm_vision', 'opp_school_vision_clinic', 'SRM Kattankulathur (KTR)', 'Chennai', 'SRM Kattankulathur Squad', '2026-08-14T11:00:00.000Z');
  insertTeam.run('team_srm_marina', 'opp_srm_marina_cleanup', 'SRM Kattankulathur (KTR)', 'Chennai', 'SRM Green Warriors Squad', '2026-08-14T12:00:00.000Z');

  insertMember.run('tm_nut_1', 'team_srm_nutrition', 'user_arjun_srm', 'first to join', '2026-08-13T10:00:00.000Z');
  insertMember.run('tm_nut_2', 'team_srm_nutrition', 'user_karthik_srm', 'auto-match', '2026-08-13T10:15:00.000Z');
  insertMember.run('tm_vis_1', 'team_srm_vision', 'user_divya_srm', 'first to join', '2026-08-14T11:00:00.000Z');
  insertMember.run('tm_vis_2', 'team_srm_vision', 'user_sneha_srm', 'auto-match', '2026-08-14T11:20:00.000Z');
  insertMember.run('tm_mar_1', 'team_srm_marina', 'user_karthik_srm', 'first to join', '2026-08-14T12:00:00.000Z');
  insertMember.run('tm_mar_2', 'team_srm_marina', 'user_arjun_srm', 'auto-match', '2026-08-14T12:15:00.000Z');

  // 9. Stories / Dispatches (9 distinct field narratives with unique photography)
  const insertStory = db.prepare(`
    INSERT OR REPLACE INTO stories (
      id, author_id, author_name, college, title, excerpt, content, category, opportunity_id, claps, image, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertStory.run(
    'story_srm_dispatch',
    'user_karthik_srm',
    'Karthik Subramanian',
    'SRM Kattankulathur (KTR)',
    'Bridging Chengalpattu: 18 SRM Volunteers Power Tech Literacy in Maraimalai Nagar',
    'When our college squad first set up camp in Maraimalai Nagar, we realized tech barriers are rarely about capability—they are about confidence and trust.',
    'Over two weekends, our collegiate squad from SRM Kattankulathur worked in paired teams with local panchayat coordinators. We set up bilingual demonstration booths showing women how to check direct benefit transfers, scan government QR IDs, and avoid phishing calls.\n\nHaving our campus peers beside us made coordinating shifts effortless. We carpooled from the SRM KTR Campus Arch each morning and held reflection circles on the bus ride back. Tech volunteering works best when students show up together.',
    'Field Dispatch',
    'opp_digital_literacy',
    196,
    '/src/assets/images/srm_student_lead_1790532310998.jpg',
    '2026-08-16T14:00:00.000Z'
  );

  insertStory.run(
    'story_coastal_cleanup',
    'user_sneha_srm',
    'Sneha Krishnan',
    'SRM Kattankulathur (KTR)',
    'Tidal Traces: 45 SRM Students Collect 850kg Plastic at Kovalam',
    'Starting at 6 AM along Kovalam shoreline, our student cohort turned an ordinary weekend into a major marine conservation audit.',
    'Marine microplastics pose an invisible crisis. Working alongside oceanographers from CleanCity Trust, SRM volunteers divided into specialized squads: debris sweepers, baggers, and catalogers.\n\nBy midday we had collected, sorted, and recorded over 850kg of discarded polypropylene nets, plastic bottles, and synthetic wrappers. The field data was directly fed into Chennai Climate Action’s coastal policy review.',
    'Ecology & Environment',
    'opp_coastal_waste_audit',
    168,
    '/src/assets/images/srm_coastal_cleanup_1790532259292.jpg',
    '2026-08-18T09:00:00.000Z'
  );

  insertStory.run(
    'story_vision_camp',
    'user_divya_srm',
    'Divya Sundaram',
    'SRM Kattankulathur (KTR)',
    'Clearer Horizons: Screening 420 Village Schoolchildren in Chengalpattu',
    'When poor eyesight goes undetected, a student falls behind through no fault of their own. Our medical volunteer drive tackled that head-on.',
    'Biotechnology and pre-med students from SRM teamed up with clinical optometrists to conduct comprehensive visual acuity examinations across two rural government schools.\n\nWe identified 86 children requiring prescription corrective lenses, which our partner foundation sponsored on the spot. Seeing a 4th grader read the bottom line of the chart with new glasses was unforgettable.',
    'Healthcare',
    'opp_school_vision_clinic',
    184,
    '/src/assets/images/opp_vision_clinic_1790570208128.jpg',
    '2026-08-19T11:00:00.000Z'
  );

  insertStory.run(
    'story_hyderabad_library',
    'user_meera_vit',
    'Meera Raman',
    'VIT Vellore',
    'Pages of Possibility: Setting Up 3 Open-Air Reading Corners in Old City Hyderabad',
    'Books should not be locked behind glass cabinets. Our collegiate cohort helped build colorful, accessible mini-libraries for 300+ children.',
    'Volunteering alongside students from VIT and local colleges, we catalogued 1,500 donated storybooks, illustrated bilingual vocabulary murals, and hosted lively afternoon storytelling circles.\n\nThe energy was infectious. Children who previously had access to only one textbook were eagerly trading illustrated science tales and fairy tales by the end of our drive.',
    'Education & Tech',
    'opp_slum_library_setup',
    155,
    '/src/assets/images/srm_library_story_1790570169598.jpg',
    '2026-08-20T10:30:00.000Z'
  );

  insertStory.run(
    'story_lake_restoration',
    'user_priya_du',
    'Priya Verma',
    'University of Delhi',
    'Reviving Feeder Canals: What 30 Collegiate Water Audits Revealed in Bengaluru',
    'Equipped with testing tubes, digital turbidity sensors, and field note pads, our environmental squad tracked urban waterway revival in real time.',
    'During our two-week field residency around Bellandur catchment, we logged daily dissolved oxygen, pH, and nitrate levels. We discovered that micro-wetlands established by citizen volunteers were filtering runoff 35% more effectively than concrete channels.\n\nPublishing our findings with local water trusts gave us our first real taste of scientific public advocacy.',
    'Urban Ecology',
    'opp_bengaluru_lake_revival',
    128,
    '/src/assets/images/opp_lake_restoration_1790570182484.jpg',
    '2026-08-21T08:00:00.000Z'
  );

  insertStory.run(
    'story_solar_microgrid',
    'user_vikram_iitm',
    'Vikram Raghavan',
    'IIT Madras',
    'Powering Rural Looms: The Solar Energy Baseline Expedition',
    'Engineering theory meets rural reality: our IIT Madras cohort surveyed 200 off-grid artisan clusters to design micro-solar rooftop systems.',
    'Traditional handloom weavers often lose 4–6 hours of production every evening due to erratic suburban power cuts. Our squad conducted detailed rooftop shadow analysis and load profiling using portable voltmeters and Python simulation notebooks.\n\nThe resulting blueprint showed how a shared 5kW rooftop microgrid could boost household weaver earnings by nearly 40%.',
    'Education & Tech',
    'opp_rural_solar_survey',
    172,
    '/src/assets/images/story_solar_village_1790570221710.jpg',
    '2026-08-22T13:00:00.000Z'
  );

  insertStory.run(
    'story_nutrition_kitchen',
    'user_arjun_srm',
    'Arjun Varma',
    'SRM Kattankulathur (KTR)',
    'Warm Meals, Shared Dignity: Serving 2,000 Families in Suburban Chennai',
    'Stepping into the community relief kitchen at 5 AM taught our engineering squad more about logistics and empathy than any textbook ever could.',
    'Working with local community elders, our SRM squad organized ingredient supply lines, managed hot food packaging lines, and coordinated clean, dignified distribution to over 2,000 residents across suburban Chengalpattu settlements.\n\nEvery volunteer had a role, from quality testing to direct doorstep deliveries for elderly residents.',
    'Healthcare',
    'opp_community_nutrition',
    163,
    '/src/assets/images/opp_nutrition_kitchen_1790570196162.jpg',
    '2026-08-23T15:00:00.000Z'
  );

  insertStory.run(
    'story_vit_dispatch',
    'user_aarav_vit',
    'Aarav Nair',
    'VIT Vellore',
    'From Vellore to Rural Chengalpattu: Our 4-Student Squad at Work',
    'When four of us from VIT showed up for the drive, we didn’t waste minutes breaking the ice—we were already a cohesive team with shared purpose.',
    'Over two weekends, our collegiate squad from VIT Vellore collaborated with SRM and IIT Madras squads. Having familiar peers alongside allowed us to focus immediately on delivering impact: helping 140 self-help group members securely activate digital banking on their phones.',
    'Field Dispatch',
    'opp_digital_literacy',
    142,
    '/src/assets/images/story_aarav_vit_1790530857035.jpg',
    '2026-08-15T12:00:00.000Z'
  );

  insertStory.run(
    'story_du_reflection',
    'user_aarav_du',
    'Aarav Sharma',
    'University of Delhi',
    'Roots of Hope: DU Squad Seeds 500 Saplings Along Yamuna Flats',
    'A collective weekend where Delhi University students turned out at sunrise to restore native wetland vegetation.',
    'Waking up before dawn alongside classmates from across North Campus was electrifying. Planting native peepal, neem, and jamun saplings gave us a visceral connection to the climate crisis and the power of localized student action.',
    'Ecology & Environment',
    'opp_yamuna_afforestation',
    115,
    '/src/assets/images/srm_tree_planting_1790532298221.jpg',
    '2026-08-17T10:00:00.000Z'
  );

  // 10. Squad Chatter Messages
  const insertMessage = db.prepare(`
    INSERT OR REPLACE INTO team_messages (id, team_id, user_id, user_name, college, message, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertMessage.run('msg_vit_1', 'team_vit_digital', 'user_aarav_vit', 'Aarav Nair', 'VIT Vellore', 'Hey VIT squad! I have printed the laminated Tamil & English UPI safety charts for our morning shift.', '2026-08-10T10:00:00.000Z');
  insertMessage.run('msg_vit_2', 'team_vit_digital', 'user_meera_vit', 'Meera Raman', 'VIT Vellore', 'Awesome! I will handle the phone simulator booth on tablet 2.', '2026-08-10T10:15:00.000Z');
  insertMessage.run('msg_srm_1', 'team_srm_digital', 'user_karthik_srm', 'Karthik Subramanian', 'SRM Kattankulathur (KTR)', 'SRM squad assemble! Bus leaves Campus Arch gate at 7:30 AM sharp.', '2026-08-10T10:30:00.000Z');
  insertMessage.run('msg_srm_2', 'team_srm_digital', 'user_divya_srm', 'Divya Sundaram', 'SRM Kattankulathur (KTR)', 'First aid kits and water bottles checked. Ready for action!', '2026-08-10T10:45:00.000Z');

  console.log('Sangam SQLite database successfully seeded with colleges, cities, users, opportunities, and collegiate squads.');
}
