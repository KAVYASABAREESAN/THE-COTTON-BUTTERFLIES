const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const helmet = require('helmet');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const User = require('./models/User');
const productRoutes = require('./routes/productRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const supportRoutes = require('./routes/supportRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const addressRoutes = require('./routes/addressRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const profileRoutes = require('./routes/profileRoutes');
const userRoutes = require('./routes/userRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const ensureAdminUser = require('./utils/ensureAdminUser');

const app = express();

// ============================================
// MIDDLEWARE
// ============================================

// Allow cross-origin image loading (fixes ERR_BLOCKED_BY_RESPONSE.NotSameOrigin)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

const normalizeOrigin = (value) => {
  if (!value || typeof value !== 'string') {
    return '';
  }

  return value.trim().replace(/\/+$/, '');
};

const allowedOrigins = [
  ...(process.env.FRONTEND_URL || '')
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean),
  normalizeOrigin(process.env.NETLIFY_URL),
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'https://thecottonbutterfliespvt.netlify.app'
]
  .map(normalizeOrigin)
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    const normalizedOrigin = normalizeOrigin(origin);

    if (!origin || allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    console.error('CORS blocked for origin:', origin, 'Allowed origins:', allowedOrigins);
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Fix: use path.resolve to get absolute path to uploads folder
// server.js is in backend/src/ so uploads is backend/src/uploads/
const uploadsPath = path.resolve(__dirname, 'uploads');

// Create uploads folder if it doesn't exist
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

console.log('📁 Serving uploads from:', uploadsPath);
app.use('/uploads', express.static(uploadsPath));

// ============================================
// HEALTH CHECK ROUTES
// ============================================
app.get('/', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  res.json({
    message: '🦋 The Cotton Butterflies API',
    status: 'running',
    database: {
      connected: dbStatus === 1,
      status: ['disconnected', 'connected', 'connecting', 'disconnecting'][dbStatus] || 'unknown'
    }
  });
});

app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  res.json({
    status: 'success',
    message: 'API is healthy',
    database: dbStatus === 1 ? 'connected' : 'disconnected'
  });
});

// ============================================
// AUTH ROUTES
// ============================================
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide name, email, and password'
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'User already exists with this email'
      });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone,
      role: 'customer'
    });

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || 'your_jwt_secret_key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone
        },
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Registration failed',
      error: error.message
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide email and password'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || 'your_jwt_secret_key',
      { expiresIn: '7d' }
    );

    res.json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Login failed',
      error: error.message
    });
  }
});

app.get('/api/auth/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'Not authorized'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.json({
      status: 'success',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone
        }
      }
    });
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid token'
    });
  }
});

// ============================================
// API ROUTES
// ============================================
app.use('/api/products', productRoutes);
app.use('/api', reviewRoutes);
app.use('/api', supportRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/settings', settingsRoutes);

// ============================================
// 404 HANDLER
// ============================================
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`
  });
});

// ============================================
// DATABASE CONNECTION & SERVER START
// ============================================
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    await ensureAdminUser();
    console.log('✅ MongoDB Connected Successfully!');

    app.listen(PORT, () => {
      console.log(`
      ╔════════════════════════════════════════════╗
      ║    🦋 The Cotton Butterflies API 🦋        ║
      ╚════════════════════════════════════════════╝
      
      🚀 Server: http://localhost:${PORT}
      📊 Database: ✅ Connected
      🔐 Auth: /api/auth/*
      
      Press Ctrl+C to stop
      `);
    });
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

startServer();


