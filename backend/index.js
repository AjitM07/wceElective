require('dotenv').config();
const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const rateLimit    = require('express-rate-limit');
const { testConnection } = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

const authRoutes        = require('./routes/auth');
const studentRoutes     = require('./routes/students');
const coordinatorRoutes = require('./routes/coordinator');

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || /^http:\/\/localhost:\d+$/.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Blocked by CORS'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many login attempts. Please wait 15 minutes.' },
});

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({ success: true, message: 'WCE Elective API is running', timestamp: new Date() });
});

app.use('/api/auth',        loginLimiter, authRoutes);
app.use('/api/students',    studentRoutes);
app.use('/api/coordinator', coordinatorRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

app.use(errorHandler);

const start = async () => {
  await testConnection();
  app.listen(PORT, () => {
    console.log(`\n Server running on http://localhost:${PORT}`);
    console.log(`   ENV  : ${process.env.NODE_ENV || 'development'}`);
    console.log(`   DB   : ${process.env.DB_NAME}@${process.env.DB_HOST}`);
    console.log(`\n Endpoints:`);
    console.log(`   POST /api/auth/student/login`);
    console.log(`   POST /api/auth/coordinator/login`);
    console.log(`   GET  /api/auth/me`);
    console.log(`   GET  /api/students/profile`);
    console.log(`   GET  /api/students`);
    console.log(`   GET  /api/coordinator/dashboard`);
    console.log(`   POST /api/coordinator/allocate\n`);
  });
};

start();