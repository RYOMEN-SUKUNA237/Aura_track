const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const courierRoutes = require('./routes/couriers');
const customerRoutes = require('./routes/customers');
const shipmentRoutes = require('./routes/shipments');
const dashboardRoutes = require('./routes/dashboard');
const messageRoutes = require('./routes/messages');
const quoteRoutes = require('./routes/quotes');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── MIDDLEWARE ───────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// ─── ROUTES ──────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/couriers', courierRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/quotes', quoteRoutes);

// Root route — friendly message
app.get('/', (req, res) => {
  res.json({
    name: 'Aura Track API',
    version: '1.0.0',
    status: 'running',
    message: 'This is the backend API server. The frontend is at http://localhost:3000',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth/login',
      couriers: '/api/couriers',
      customers: '/api/customers',
      shipments: '/api/shipments',
      dashboard: '/api/dashboard/stats',
      publicTracking: '/api/shipments/:trackingId/track',
    },
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found.` });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

// ─── START SERVER ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Aura Track API Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`\nAPI Endpoints:`);
  console.log(`  POST   /api/auth/register`);
  console.log(`  POST   /api/auth/login`);
  console.log(`  GET    /api/auth/me`);
  console.log(`  GET    /api/couriers`);
  console.log(`  POST   /api/couriers`);
  console.log(`  GET    /api/customers`);
  console.log(`  POST   /api/customers`);
  console.log(`  GET    /api/shipments`);
  console.log(`  POST   /api/shipments`);
  console.log(`  GET    /api/shipments/:id/track  (public)`);
  console.log(`  GET    /api/dashboard/stats`);
  console.log(`  GET    /api/dashboard/active-map`);
  console.log(`  POST   /api/messages/conversations  (public)`);
  console.log(`  POST   /api/messages/send            (public)`);
  console.log(`  GET    /api/messages/admin/conversations`);
  console.log(`  POST   /api/quotes                (public)`);
  console.log(`  GET    /api/quotes/admin           (admin)`);
  console.log(`  PATCH  /api/quotes/admin/:id/status (admin)`);
  console.log(`\n`);
});
