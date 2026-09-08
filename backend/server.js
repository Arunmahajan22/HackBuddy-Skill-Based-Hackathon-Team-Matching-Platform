require('dotenv').config();

const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const teamRoutes = require('./routes/teamRoutes');
const requestRoutes = require('./routes/requestRoutes');
const chatRoutes = require('./routes/chatRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const { notFound, errorHandler } = require('./middlewares/errorMiddleware');
const { globalApiLimiter } = require('./middlewares/rateLimitMiddleware');
const initializeSockets = require('./sockets');

const app = express();

// Security Hardening
app.disable('x-powered-by');

// Configure Helmet Security Headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", process.env.CORS_ORIGIN || 'http://localhost:5173', 'ws:', 'wss:'],
      },
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);

// CORS configuration supporting credentials (cookies)
const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  }),
);

// Body and Cookie Parsers
app.use(express.json({ limit: '15kb' }));
app.use(express.urlencoded({ extended: true, limit: '15kb' }));
app.use(cookieParser());

// Global Rate Limiting
app.use('/api', globalApiLimiter);

// Health Check Endpoint
app.get('/api/health', (_req, res) =>
  res.status(200).json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
  }),
);

// API Route Mounts
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);

// Error Handling Middleware Pipeline
app.use(notFound);
app.use(errorHandler);

const startServer = async () => {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 characters.');
  }

  await connectDB();

  const httpServer = http.createServer(app);
  const io = initializeSockets(httpServer);
  app.set('io', io);

  const port = Number(process.env.PORT) || 5000;
  httpServer.listen(port, () => {
    console.log(`HackBuddy API server listening on http://localhost:${port}`);
  });
};

if (require.main === module) {
  startServer().catch((error) => {
    console.error('Unable to start server:', error.message);
    process.exit(1);
  });
}

module.exports = { app, startServer };
