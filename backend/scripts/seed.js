require('dotenv').config();
const path   = require('path');
const fs     = require('fs');
const bcrypt = require('bcryptjs');
const XLSX   = require('xlsx');
const { pool, testConnection } = require('../config/database');

const EXCEL_PATH = process.argv[2]
  || path.join(__dirname, '..', 'data', 'responses.xlsx');

const COORDINATOR_DEFAULT_PASSWORD =
  process.env.COORDINATOR_DEFAULT_PASSWORD || 'WCE@Coordinator2025';

const SALT_ROUNDS = 10;

const COORDINATORS = [
  { name: 'Dr. Coordinator Admin',   email: 'coordinator@walchandsangli.ac.in',  department: 'CSE' },
  { name: 'Prof. CSE HOD',           email: 'hod.cse@walchandsangli.ac.in',      department: 'CSE' },
  { name: 'Prof. Elective Incharge', email: 'elective.cse@walchandsangli.ac.in', department: 'CSE' },
];

const ELECTIVES = [
  { name: 'Deep Learning', code: 'CS402', capacity: 60, lecturer: 'Dr. Priya Sharma', description: 'Advanced neural architectures including CNNs, RNNs, Transformers and their applications in computer vision and NLP.' },
  { name: 'Machine Learning', code: 'CS401', capacity: 60, lecturer: 'Dr. Anil Patil', description: 'Covers supervised & unsupervised learning, neural networks, and real-world ML application pipelines.' },
  { name: 'Cyber Security', code: 'CS404', capacity: 60, lecturer: 'Dr. Meera Joshi', description: 'Network security, cryptography fundamentals, ethical hacking, secure coding practices, and risk assessment.' },
  { name: 'Cloud Computing', code: 'CS403', capacity: 60, lecturer: 'Dr. Rajesh Kumar', description: 'Cloud service models (IaaS/PaaS/SaaS), deployment on AWS/Azure/GCP, microservices, containerization with Docker/Kubernetes.' },
  { name: 'Natural Language Processing', code: 'CS406', capacity: 60, lecturer: 'Dr. Kavita Nair', description: 'Text processing, sentiment analysis, language models, chatbot development, and modern NLP algorithms.' },
  { name: 'IoT & Embedded Systems', code: 'CS405', capacity: 60, lecturer: 'Dr. Sanjay Desai', description: 'Embedded programming, sensor integration, MQTT protocol, edge computing, and real-time operating systems.' },
];

function extractFirstName(fullName) {
  return fullName.trim().split(/\s+/)[0].toLowerCase();
}

function cleanPRN(prn) {
  return String(prn).trim();
}

function cleanPhone(phone) {
  if (!phone) return null;
  return String(phone).trim().replace(/[^0-9]/g, '').slice(-10);
}

function parseExcel(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌  Excel file not found: ${filePath}`);
    process.exit(1);
  }
  const wb  = XLSX.readFile(filePath);
  const ws  = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws);
}

async function seedElectives(conn) {
  console.log('\n📚 Seeding electives…');
  for (const e of ELECTIVES) {
    await conn.execute(
      `INSERT INTO electives (name, code, description, capacity, lecturer, academic_year, semester)
       VALUES (?, ?, ?, ?, ?, '2026-27', 'SEM-VII')
       ON DUPLICATE KEY UPDATE code=VALUES(code), capacity=VALUES(capacity), description=VALUES(description), lecturer=VALUES(lecturer)`,
      [e.name, e.code, e.description, e.capacity, e.lecturer]
    );
    console.log(`   ✔ ${e.name}`);
  }
}

async function seedCoordinators(conn) {
  console.log('\n👤 Seeding coordinators…');
  const hash = await bcrypt.hash(COORDINATOR_DEFAULT_PASSWORD, SALT_ROUNDS);
  for (const c of COORDINATORS) {
    await conn.execute(
      `INSERT INTO coordinators (name, email, department, password_hash)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name=VALUES(name), department=VALUES(department)`,
      [c.name, c.email, c.department, hash]
    );
    console.log(`   ✔ ${c.email}`);
  }
  console.log(`   🔑 Default password: ${COORDINATOR_DEFAULT_PASSWORD}`);
}

async function seedStudents(conn, rows) {
  console.log('\n🎓 Seeding students…');

  const [elRows] = await conn.execute('SELECT id, name FROM electives');
  const electiveMap = {};
  elRows.forEach(r => { electiveMap[r.name] = r.id; });

  let inserted = 0, skipped = 0, errors = 0;

  for (const row of rows) {
    const name      = String(row['Name'] || '').trim();
    const prn       = cleanPRN(row['PRN No']);
    const division  = String(row['Division'] || 'A').trim();
    const email     = String(row['Email Address'] || '').trim().toLowerCase();
    const phone     = cleanPhone(row['Contact Number']);
    const cgpa      = parseFloat(row['CGPA']) || null;
    const mapPrefName = (name) => {
      const n = String(name || '').trim();
      if (n === 'Advanced Machine Learning') return 'Machine Learning';
      if (n === 'IoT') return 'IoT & Embedded Systems';
      if (n === 'Remote Sensing and GIS') return 'Cloud Computing';
      return n;
    };
    const pref1     = mapPrefName(row['Elective-I Preference 1']);
    const pref2     = mapPrefName(row['Elective-I Preference 2']);
    const pref3     = mapPrefName(row['Elective-I Preference 3']);
    const reason    = String(row['Reason for selecting (Elective-I) subject '] || '').trim() || null;
    const submittedAt = row['Timestamp'] ? new Date(row['Timestamp']) : null;

    if (!name || !prn || !email) {
      console.warn(`   ⚠ Skipping incomplete row — Name:${name} PRN:${prn}`);
      skipped++;
      continue;
    }

    const firstName = extractFirstName(name);
    const rawPwd    = firstName + prn;
    const hash      = await bcrypt.hash(rawPwd, SALT_ROUNDS);

    try {
      const [result] = await conn.execute(
        `INSERT INTO students (name, first_name, prn, division, email, phone, cgpa, password_hash, details_verified, preferences_submitted, preferences_submitted_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, FALSE, FALSE, NULL)
         ON DUPLICATE KEY UPDATE
           name=VALUES(name), first_name=VALUES(first_name),
           division=VALUES(division),
           phone=VALUES(phone), cgpa=VALUES(cgpa),
           details_verified=FALSE,
           preferences_submitted=FALSE,
           preferences_submitted_at=NULL`,
        [name, firstName, prn, division, email, phone, cgpa, hash]
      );

      inserted++;
      if (inserted % 20 === 0) console.log(`   …${inserted} students done`);

    } catch (err) {
      console.error(`   ✖ Error for ${email}: ${err.message}`);
      errors++;
    }
  }

  console.log(`   ✅ Inserted/updated: ${inserted} | Skipped: ${skipped} | Errors: ${errors}`);
}

async function seedPortalSettings(conn) {
  console.log('\n⚙ Seeding portal settings…');
  const settings = [
    { name: 'Open Elective I', is_accessible: 1, deadline: new Date("2026-08-30T23:58:00") },
    { name: 'Open Elective II', is_accessible: 0, deadline: new Date("2026-08-30T23:58:00") },
    { name: 'Mini-Project', is_accessible: 0, deadline: new Date("2026-08-30T23:58:00") },
    { name: 'Allotment Results', is_accessible: 0, deadline: null },
  ];
  for (const s of settings) {
    await conn.execute(
      `INSERT INTO portal_settings (name, is_accessible, deadline)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE is_accessible=VALUES(is_accessible), deadline=VALUES(deadline)`,
      [s.name, s.is_accessible, s.deadline]
    );
    console.log(`   ✔ ${s.name} : ${s.is_accessible ? 'Open' : 'Closed'}`);
  }
}

async function main() {
  await testConnection();
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const rows = parseExcel(EXCEL_PATH);
    console.log(`Loaded ${rows.length} rows from Excel`);

    await seedElectives(conn);
    await seedCoordinators(conn);
    await seedStudents(conn, rows);
    await seedPortalSettings(conn);

    await conn.commit();
    console.log('\nSeeding complete!\n');

  } catch (err) {
    await conn.rollback();
    console.error('\nSeeding failed, rolled back:', err.message);
    process.exit(1);
  } finally {
    conn.release();
    pool.end();
  }
}

main();