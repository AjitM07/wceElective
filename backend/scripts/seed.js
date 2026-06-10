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
  { name: 'IoT',                       code: 'CSE-E1-01', capacity: 60 },
  { name: 'Advanced Machine Learning', code: 'CSE-E1-02', capacity: 40 },
  { name: 'Remote Sensing and GIS',    code: 'CSE-E1-03', capacity: 40 },
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
      `INSERT INTO electives (name, code, capacity, academic_year, semester)
       VALUES (?, ?, ?, '2025-26', 'SEM-VI')
       ON DUPLICATE KEY UPDATE code=VALUES(code), capacity=VALUES(capacity)`,
      [e.name, e.code, e.capacity]
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
    const email     = String(row['Email Address'] || '').trim().toLowerCase();
    const phone     = cleanPhone(row['Contact Number']);
    const cgpa      = parseFloat(row['CGPA']) || null;
    const pref1     = String(row['Elective-I Preference 1'] || '').trim();
    const pref2     = String(row['Elective-I Preference 2'] || '').trim();
    const pref3     = String(row['Elective-I Preference 3'] || '').trim();
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
        `INSERT INTO students (name, first_name, prn, email, phone, cgpa, password_hash)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           name=VALUES(name), first_name=VALUES(first_name),
           phone=VALUES(phone), cgpa=VALUES(cgpa)`,
        [name, firstName, prn, email, phone, cgpa, hash]
      );

      let studentId;
      if (result.insertId) {
        studentId = result.insertId;
      } else {
        const [existing] = await conn.execute(
          'SELECT id FROM students WHERE email = ?', [email]
        );
        studentId = existing[0].id;
      }

      const prefs = [pref1, pref2, pref3];
      for (let rank = 1; rank <= 3; rank++) {
        const prefName   = prefs[rank - 1];
        const electiveId = electiveMap[prefName];
        if (!electiveId) continue;

        await conn.execute(
          `INSERT INTO elective_preferences
             (student_id, elective_id, preference_rank, reason, submitted_at)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             elective_id=VALUES(elective_id),
             reason=VALUES(reason)`,
          [studentId, electiveId, rank, rank === 1 ? reason : null, submittedAt]
        );
      }

      inserted++;
      if (inserted % 20 === 0) console.log(`   …${inserted} students done`);

    } catch (err) {
      console.error(`   ✖ Error for ${email}: ${err.message}`);
      errors++;
    }
  }

  console.log(`   ✅ Inserted/updated: ${inserted} | Skipped: ${skipped} | Errors: ${errors}`);
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