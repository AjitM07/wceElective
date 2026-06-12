const { pool } = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');

const getSettings = async (req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT name, is_accessible FROM portal_settings');
    const settings = rows.map(r => ({
      name: r.name,
      is_accessible: !!r.is_accessible
    }));
    return sendSuccess(res, settings, 'Portal settings retrieved successfully.');
  } catch (err) {
    next(err);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    const { name, is_accessible } = req.body;
    if (!name || is_accessible === undefined) {
      return sendError(res, 'name and is_accessible are required.', 400);
    }
    
    const [result] = await pool.execute(
      'UPDATE portal_settings SET is_accessible = ? WHERE name = ?',
      [is_accessible ? 1 : 0, name]
    );
    
    if (result.affectedRows === 0) {
      return sendError(res, 'Portal setting not found.', 404);
    }
    
    return sendSuccess(res, {}, 'Portal setting updated successfully.');
  } catch (err) {
    next(err);
  }
};

module.exports = { getSettings, updateSettings };
