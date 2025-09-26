/**
 * Main server file for CollabBlog Backend
 * MEAN Stack Collaborative Blogging Platform
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import { connectDB } from './config/database';
import { errorHandler, notFound } from './middleware/errorHandler';
import { setupSocketIO } from './config/socket';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import articleRoutes from './routes/articles';
import commentRoutes from './routes/comments';
import analyticsRoutes from './routes/analytics';
import adminRoutes from './routes/admin.routes';
// import pushRoutes from './routes/push'; // Temporarily disabled

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:4200",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

// Connect to MongoDB
connectDB();

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:4200",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-refresh-token']
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined'));
app.use('/uploads', express.static('uploads'));

// Apply rate limiting to all requests
app.use(limiter);

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CollabBlog API',
      version: '1.0.0',
      description: 'A collaborative blogging platform API built with MEAN stack',
      contact: {
        name: 'API Support',
        email: 'support@collabblog.com'
      }
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./src/routes/*.ts', './src/models/*.ts']
};

const specs = swaggerJsdoc(swaggerOptions);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
// app.use('/api/push', pushRoutes); // Temporarily disabled until VAPID keys are configured

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'CollabBlog API Documentation'
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: '1.0.0'
  });
});

// Socket.IO setup
setupSocketIO(io);

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

server.listen(Number(PORT), () => {
  console.log(`
🚀 CollabBlog Backend Server
┌─────────────────────────────────────┐
│  Server running on port ${PORT}        │
│  Environment: ${process.env.NODE_ENV || 'development'}           │
│  API Documentation: /api-docs       │
│  Health Check: /health              │
└─────────────────────────────────────┘
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

export { io };
export default app;