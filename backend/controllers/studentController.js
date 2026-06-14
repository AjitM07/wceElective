const { pool }                   = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');

const getActiveDeadline = async (req) => {
  const program = req.headers['x-selected-program'] || 'Open Elective I';
  const [rows] = await pool.execute('SELECT deadline FROM portal_settings WHERE name = ? LIMIT 1', [program]);
  if (rows.length && rows[0].deadline) {
    return new Date(rows[0].deadline);
  }
  return new Date("2026-08-30T23:58:00"); // fallback default
};

const getProfile = async (req, res, next) => {
  try {
    const { id } = req.user;

    const [students] = await pool.execute(
      `SELECT s.id, s.name, s.first_name, s.prn, s.division, s.details_verified, s.preferences_submitted, s.preferences_submitted_at, s.email, s.phone, s.cgpa
       FROM students s WHERE s.id = ? LIMIT 1`,
      [id]
    );

    if (!students.length) return sendError(res, 'Student not found.', 404);

    const now = new Date();
    const deadline = await getActiveDeadline(req);
    let isSubmitted = !!students[0].preferences_submitted;

    if (!isSubmitted && now > deadline) {
      // Auto-submit draft preferences!
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        const [drafts] = await conn.execute(
          'SELECT elective_id, preference_rank, reason FROM draft_preferences WHERE student_id = ?',
          [id]
        );
        if (drafts.length > 0) {
          await conn.execute('DELETE FROM submitted_preferences WHERE student_id = ?', [id]);
          for (const draft of drafts) {
            await conn.execute(
              `INSERT INTO submitted_preferences (student_id, elective_id, preference_rank, reason, submitted_at)
               VALUES (?, ?, ?, ?, ?)`,
              [id, draft.elective_id, draft.preference_rank, draft.reason || null, deadline]
            );
          }
        }
        await conn.execute('DELETE FROM draft_preferences WHERE student_id = ?', [id]);
        await conn.execute(
          `UPDATE students 
           SET preferences_submitted = TRUE, preferences_submitted_at = ?
           WHERE id = ?`,
          [deadline, id]
        );
        await conn.commit();
        students[0].preferences_submitted = 1;
        students[0].preferences_submitted_at = deadline;
        isSubmitted = true;
      } catch (err) {
        await conn.rollback();
        console.error("Auto-submit error:", err);
      } finally {
        conn.release();
      }
    }

    const tableToUse = isSubmitted ? 'submitted_preferences' : 'draft_preferences';
    const [prefs] = await pool.execute(
      `SELECT ep.preference_rank, ep.elective_id, e.name AS elective_name, e.code, e.description, e.lecturer,
              ep.reason, ${isSubmitted ? 'ep.submitted_at' : 'NULL AS submitted_at'}
       FROM ${tableToUse} ep
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

    const [allotmentSetting] = await pool.execute(
      `SELECT is_accessible FROM portal_settings WHERE name = 'Allotment Results' LIMIT 1`
    );
    const allotmentPublished = allotmentSetting.length ? !!allotmentSetting[0].is_accessible : false;

    return sendSuccess(res, {
      student:     students[0],
      preferences: prefs,
      allocation:  allocation[0] || null,
      deadline:    deadline.toISOString(),
      allotmentPublished: allotmentPublished,
    });

  } catch (err) {
    next(err);
  }
};

const verifyProfile = async (req, res, next) => {
  try {
    const { id } = req.user;
    const { phone } = req.body;

    if (!phone) {
      return sendError(res, 'Contact number is required.', 400);
    }

    const cleanedPhone = String(phone).trim().replace(/[^0-9]/g, '').slice(-10);
    if (cleanedPhone.length !== 10) {
      return sendError(res, 'Please provide a valid 10-digit contact number.', 400);
    }

    await pool.execute(
      `UPDATE students
       SET phone = ?, details_verified = TRUE
       WHERE id = ?`,
      [cleanedPhone, id]
    );

    return sendSuccess(res, {}, 'Profile verified successfully.');
  } catch (err) {
    next(err);
  }
};

const getAllStudents = async (req, res, next) => {
  try {
    const now = new Date();
    const deadline = await getActiveDeadline(req);
    if (now > deadline) {
      const [pendingStudents] = await pool.execute(
        'SELECT id FROM students WHERE preferences_submitted = FALSE'
      );
      if (pendingStudents.length > 0) {
        const conn = await pool.getConnection();
        try {
          await conn.beginTransaction();
          for (const s of pendingStudents) {
            const [drafts] = await conn.execute(
              'SELECT elective_id, preference_rank, reason FROM draft_preferences WHERE student_id = ?',
              [s.id]
            );
            if (drafts.length > 0) {
              await conn.execute('DELETE FROM submitted_preferences WHERE student_id = ?', [s.id]);
              for (const draft of drafts) {
                await conn.execute(
                  `INSERT INTO submitted_preferences (student_id, elective_id, preference_rank, reason, submitted_at)
                   VALUES (?, ?, ?, ?, ?)`,
                  [s.id, draft.elective_id, draft.preference_rank, draft.reason || null, deadline]
                );
              }
            }
            await conn.execute('DELETE FROM draft_preferences WHERE student_id = ?', [s.id]);
            await conn.execute(
              `UPDATE students 
               SET preferences_submitted = TRUE, preferences_submitted_at = ?
               WHERE id = ?`,
              [deadline, s.id]
            );
          }
          await conn.commit();
        } catch (err) {
          await conn.rollback();
          console.error("Batch auto-submit error in getAllStudents:", err);
        } finally {
          conn.release();
        }
      }
    }

    const [students] = await pool.execute(
      `SELECT s.id, s.name, s.prn, s.division, s.details_verified, s.email, s.cgpa, s.preferences_submitted,
              e1.name  AS pref1,
              e2.name  AS pref2,
              e3.name  AS pref3,
              alloc.name AS allocated_elective,
              ea.elective_id AS allocated_elective_id
       FROM students s
       LEFT JOIN submitted_preferences ep1 ON ep1.student_id = s.id AND ep1.preference_rank = 1
       LEFT JOIN electives e1 ON e1.id = ep1.elective_id
       LEFT JOIN submitted_preferences ep2 ON ep2.student_id = s.id AND ep2.preference_rank = 2
       LEFT JOIN electives e2 ON e2.id = ep2.elective_id
       LEFT JOIN submitted_preferences ep3 ON ep3.student_id = s.id AND ep3.preference_rank = 3
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

const getElectives = async (req, res, next) => {
  try {
    const [electives] = await pool.execute(
      `SELECT id, name, code, description, capacity, lecturer, academic_year, semester
       FROM electives
       WHERE is_active = 1
       ORDER BY name ASC`
    );
    return sendSuccess(res, { electives });
  } catch (err) {
    next(err);
  }
};

const savePreferences = async (req, res, next) => {
  const now = new Date();
  const deadline = await getActiveDeadline(req);
  if (now > deadline) {
    return sendError(res, 'The submission deadline has passed. Preferences are locked.', 400);
  }

  const conn = await pool.getConnection();
  try {
    const { id } = req.user;
    const { preferences, is_submitted } = req.body;

    if (!Array.isArray(preferences)) {
      return sendError(res, 'Preferences list must be an array.', 400);
    }

    await conn.beginTransaction();

    // 1. Check if student has already submitted
    const [students] = await conn.execute(
      'SELECT preferences_submitted FROM students WHERE id = ? LIMIT 1',
      [id]
    );
    if (!students.length) {
      await conn.rollback();
      return sendError(res, 'Student not found.', 404);
    }
    if (students[0].preferences_submitted) {
      await conn.rollback();
      return sendError(res, 'Your preferences have already been submitted and are locked.', 400);
    }

    // 2. Clear existing preferences
    if (is_submitted) {
      await conn.execute('DELETE FROM submitted_preferences WHERE student_id = ?', [id]);
      await conn.execute('DELETE FROM draft_preferences WHERE student_id = ?', [id]);
    } else {
      await conn.execute('DELETE FROM draft_preferences WHERE student_id = ?', [id]);
    }

    // 3. Insert new preferences
    const tableName = is_submitted ? 'submitted_preferences' : 'draft_preferences';
    for (const pref of preferences) {
      const { elective_id, rank, reason } = pref;
      await conn.execute(
        `INSERT INTO ${tableName} (student_id, elective_id, preference_rank, reason)
         VALUES (?, ?, ?, ?)`,
        [id, elective_id, rank, reason || null]
      );
    }

    // 4. If final submit, update student record
    if (is_submitted) {
      await conn.execute(
        `UPDATE students 
         SET preferences_submitted = TRUE, preferences_submitted_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [id]
      );
    }

    await conn.commit();
    return sendSuccess(res, {}, is_submitted ? 'Preferences submitted and locked successfully.' : 'Draft preferences saved successfully.');

  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

module.exports = { getProfile, getAllStudents, verifyProfile, getElectives, savePreferences };