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
      `SELECT e.name, e.capacity,
              COUNT(ep.id) AS preferences_count,
              COUNT(ea.id) AS allocated_count
       FROM electives e
       LEFT JOIN elective_preferences ep ON ep.elective_id = e.id AND ep.preference_rank = 1
       LEFT JOIN elective_allocations ea ON ea.elective_id = e.id
       WHERE e.is_active = 1
       GROUP BY e.id, e.name, e.capacity`
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