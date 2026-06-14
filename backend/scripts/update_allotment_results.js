require('dotenv').config();
const { pool } = require('../config/database');

async function main() {
  try {
    const [result] = await pool.execute(
      "UPDATE portal_settings SET is_accessible = 1 WHERE name = 'Allotment Results'"
    );
    console.log("Updated Allotment Results setting to 1:", result);
    
    // Let's allocate an elective to Niraj (student_id = 3, elective_id = 1 is Deep Learning)
    const [students] = await pool.execute(
      "SELECT id FROM students WHERE prn = '23510112' LIMIT 1"
    );
    if (students.length > 0) {
      const studentId = students[0].id;
      await pool.execute(
        "INSERT INTO elective_allocations (student_id, elective_id, allocated_by) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE elective_id = ?",
        [studentId, 1, 1, 1]
      );
      console.log("Allocated Deep Learning (id=1) to student id:", studentId);
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
