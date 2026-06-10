const { pool }                   = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');

const getProfile = async (req, res, next) => {
  try {
    const { id } = req.user;

    const [students] = await pool.execute(
      `SELECT s.id, s.name, s.first_name, s.prn, s.email, s.phone, s.cgpa
       FROM students s WHERE s.id = ? LIMIT 1`,
      [id]
    );

    if (!students.length) return sendError(res, 'Student not found.', 404);

    const [prefs] = await pool.execute(
      `SELECT ep.preference_rank, e.name AS elective_name, e.code,
              ep.reason, ep.submitted_at
       FROM elective_preferences ep
       JOIN electives e ON ep.elective_id = e.id
       WHERE ep.student_id = ?
       ORDER BY ep.preference_rank ASC`,
      [id]
    );

    const [allocation] = await pool.execute(
      `SELECT e.name AS elective_name, e.code, ea.allocated_at
       FROM elective_allocations ea
       JOIN electives e ON ea.elective_id = e.id
       WHERE ea.student_id = ? LIMIT 1`,
      [id]
    );

    return sendSuccess(res, {
      student:     students[0],
      preferences: prefs,
      allocation:  allocation[0] || null,
    });

  } catch (err) {
    next(err);
  }
};

const getAllStudents = async (req, res, next) => {
  try {
    const [students] = await pool.execute(
      `SELECT s.id, s.name, s.prn, s.email, s.cgpa,
              e1.name  AS pref1,
              e2.name  AS pref2,
              e3.name  AS pref3,
              alloc.name AS allocated_elective
       FROM students s
       LEFT JOIN elective_preferences ep1 ON ep1.student_id = s.id AND ep1.preference_rank = 1
       LEFT JOIN electives e1 ON e1.id = ep1.elective_id
       LEFT JOIN elective_preferences ep2 ON ep2.student_id = s.id AND ep2.preference_rank = 2
       LEFT JOIN electives e2 ON e2.id = ep2.elective_id
       LEFT JOIN elective_preferences ep3 ON ep3.student_id = s.id AND ep3.preference_rank = 3
       LEFT JOIN electives e3 ON e3.id = ep3.elective_id
       LEFT JOIN elective_allocations ea ON ea.student_id = s.id
       LEFT JOIN electives alloc ON alloc.id = ea.elective_id
       ORDER BY s.name ASC`
    );

    return sendSuccess(res, { students, total: students.length });
  } catch (err) {
    next(err);
  }
};

module.exports = { getProfile, getAllStudents };