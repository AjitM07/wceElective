const { pool }                   = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');

const getDashboard = async (req, res, next) => {
  try {
    const [[{ totalStudents }]] = await pool.execute(
      'SELECT COUNT(*) AS totalStudents FROM students'
    );
    const [[{ totalAllocated }]] = await pool.execute(
      'SELECT COUNT(*) AS totalAllocated FROM elective_allocations'
    );
    const [electiveCounts] = await pool.execute(
      `SELECT e.id, e.name, e.capacity,
              (SELECT COUNT(*) FROM submitted_preferences ep 
               WHERE ep.elective_id = e.id AND ep.preference_rank = 1) AS preferences_count,
              (SELECT COUNT(*) FROM elective_allocations ea WHERE ea.elective_id = e.id) AS allocated_count
       FROM electives e
       WHERE e.is_active = 1
       ORDER BY e.name ASC`
    );

    return sendSuccess(res, {
      totalStudents,
      totalAllocated,
      pendingAllocation: totalStudents - totalAllocated,
      electives: electiveCounts,
    });
  } catch (err) {
    next(err);
  }
};

const allocateElective = async (req, res, next) => {
  try {
    const { student_id, elective_id } = req.body;
    const coordinatorId = req.user.id;

    if (!student_id || !elective_id) {
      return sendError(res, 'student_id and elective_id are required.', 400);
    }

    await pool.execute(
      `INSERT INTO elective_allocations (student_id, elective_id, allocated_by)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE
         elective_id  = VALUES(elective_id),
         allocated_by = VALUES(allocated_by),
         allocated_at = CURRENT_TIMESTAMP`,
      [student_id, elective_id, coordinatorId]
    );

    return sendSuccess(res, {}, 'Elective allocated successfully.');
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboard, allocateElective };