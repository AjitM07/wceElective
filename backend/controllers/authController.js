const bcrypt          = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { pool }        = require('../config/database');
const { generateToken } = require('../utils/jwt');
const { sendSuccess, sendError } = require('../utils/response');

const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Enter a valid email address.')
    .normalizeEmail({ gmail_remove_dots: false }),
  body('password')
    .trim()
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 5 }).withMessage('Password must be at least 5 characters.'),
];

const studentLogin = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'Validation failed.', 422, errors.array());
    }

    const { email, password } = req.body;

    const [rows] = await pool.execute(
      `SELECT id, name, first_name, prn, email, cgpa, password_hash, role
       FROM students
       WHERE email = ?
       LIMIT 1`,
      [email.toLowerCase()]
    );

    if (rows.length === 0) {
      return sendError(res, 'Invalid email or password.', 401);
    }

    const student = rows[0];
    const isMatch = await bcrypt.compare(password, student.password_hash);

    if (!isMatch) {
      return sendError(res, 'Invalid email or password.', 401);
    }

    const token = generateToken({
      id:   student.id,
      email: student.email,
      role: 'student',
      prn:  student.prn,
    });

    return sendSuccess(res, {
      token,
      user: {
        id:         student.id,
        name:       student.name,
        first_name: student.first_name,
        prn:        student.prn,
        email:      student.email,
        cgpa:       student.cgpa,
        role:       'student',
      },
    }, 'Login successful.');

  } catch (err) {
    next(err);
  }
};

const coordinatorLogin = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'Validation failed.', 422, errors.array());
    }

    const { email, password } = req.body;

    const [rows] = await pool.execute(
      `SELECT id, name, email, department, password_hash, role, is_active
       FROM coordinators
       WHERE email = ?
       LIMIT 1`,
      [email.toLowerCase()]
    );

    if (rows.length === 0) {
      return sendError(res, 'Invalid email or password.', 401);
    }

    const coordinator = rows[0];

    if (!coordinator.is_active) {
      return sendError(res, 'Account is deactivated. Contact admin.', 403);
    }

    const isMatch = await bcrypt.compare(password, coordinator.password_hash);

    if (!isMatch) {
      return sendError(res, 'Invalid email or password.', 401);
    }

    const token = generateToken({
      id:    coordinator.id,
      email: coordinator.email,
      role:  'coordinator',
    });

    return sendSuccess(res, {
      token,
      user: {
        id:         coordinator.id,
        name:       coordinator.name,
        email:      coordinator.email,
        department: coordinator.department,
        role:       'coordinator',
      },
    }, 'Login successful.');

  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const { id, role } = req.user;

    if (role === 'student') {
      const [rows] = await pool.execute(
        `SELECT id, name, first_name, prn, email, phone, cgpa, role
         FROM students WHERE id = ? LIMIT 1`,
        [id]
      );
      if (!rows.length) return sendError(res, 'User not found.', 404);
      return sendSuccess(res, { user: rows[0] });
    }

    if (role === 'coordinator') {
      const [rows] = await pool.execute(
        `SELECT id, name, email, department, role
         FROM coordinators WHERE id = ? LIMIT 1`,
        [id]
      );
      if (!rows.length) return sendError(res, 'User not found.', 404);
      return sendSuccess(res, { user: rows[0] });
    }

    return sendError(res, 'Unknown role.', 400);

  } catch (err) {
    next(err);
  }
};

module.exports = {
  studentLogin,
  coordinatorLogin,
  getMe,
  loginValidation,
};