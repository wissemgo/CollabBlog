"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const database_1 = require("./config/database");
const errorHandler_1 = require("./middleware/errorHandler");
const socket_1 = require("./config/socket");
const auth_1 = __importDefault(require("./routes/auth"));
const users_1 = __importDefault(require("./routes/users"));
const articles_1 = __importDefault(require("./routes/articles"));
const comments_1 = __importDefault(require("./routes/comments"));
const analytics_1 = __importDefault(require("./routes/analytics"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.CORS_ORIGIN || "http://localhost:4200",
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true
    }
});
exports.io = io;
(0, database_1.connectDB)();
const limiter = (0, express_rate_limit_1.default)({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    message: {
        error: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || "http://localhost:4200",
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-refresh-token']
}));
app.use((0, compression_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use((0, morgan_1.default)('combined'));
app.use('/uploads', express_1.default.static('uploads'));
app.use(limiter);
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
const specs = (0, swagger_jsdoc_1.default)(swaggerOptions);
app.use('/api/auth', auth_1.default);
app.use('/api/users', users_1.default);
app.use('/api/articles', articles_1.default);
app.use('/api/comments', comments_1.default);
app.use('/api/analytics', analytics_1.default);
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(specs, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'CollabBlog API Documentation'
}));
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        version: '1.0.0'
    });
});
(0, socket_1.setupSocketIO)(io);
app.use(errorHandler_1.notFound);
app.use(errorHandler_1.errorHandler);
const PORT = process.env.PORT || 9999;
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
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
    });
});
exports.default = app;
//# sourceMappingURL=server.js.map