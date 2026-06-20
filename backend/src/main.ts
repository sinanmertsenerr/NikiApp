import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { AppModule } from './app.module';
import { SanitizePipe } from './common/pipes/sanitize.pipe';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const isProduction = process.env.NODE_ENV === 'production';

  // Initialize Sentry FIRST (before app creation)
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      integrations: [nodeProfilingIntegration()],
      tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
      profilesSampleRate: 1.0,
      beforeSend(event) {
        if (event.request?.headers) {
          delete event.request.headers['authorization'];
          delete event.request.headers['cookie'];
        }
        return event;
      },
      ignoreErrors: ['UnauthorizedException', 'NotFoundException', 'BadRequestException'],
    });
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Behind nginx + Cloudflare: trust the proxy chain so req.ip is the REAL client
  // (nginx restores it from CF-Connecting-IP). Without this the rate limiter keys
  // on the proxy IP (127.0.0.1) and throttles ALL users together. Safe here
  // because the origin firewall only accepts traffic from Cloudflare IPs.
  app.set('trust proxy', true);

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // HTTPS Enforcement - Force HTTPS in production
  app.use((req, res, next) => {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;

    if (isProduction && protocol !== 'https') {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }

    next();
  });

  // Security Headers (Helmet) with HSTS
  app.use((req, res, next) => {
    // Skip helmet for Swagger in development only
    if (!isProduction && req.path.startsWith('/api/docs')) {
      return next();
    }

    helmet({
      // HSTS - Force HTTPS for 1 year, include subdomains
      strictTransportSecurity: {
        maxAge: 31536000, // 1 year in seconds
        includeSubDomains: true,
        preload: true,
      },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
      crossOriginEmbedderPolicy: false,
      // Additional security headers
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      noSniff: true, // X-Content-Type-Options: nosniff
      xssFilter: true, // X-XSS-Protection
      hidePoweredBy: true, // Remove X-Powered-By header
    })(req, res, next);
  });

  // CORS - Whitelisted origins
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:19006';
  const productionUrl = process.env.PRODUCTION_APP_URL;
  const dashboardUrl = process.env.DASHBOARD_URL || 'http://localhost:5173';
  // Mobile web build (react-native-web). WEB_APP_URL = deployed web origin;
  // http://localhost:8081 is the Expo web dev server (Metro bundler).
  const webAppUrl = process.env.WEB_APP_URL;
  const allowedOrigins = [
    frontendUrl,
    dashboardUrl,
    'http://localhost:8081',
    'http://localhost:19006',
  ];
  if (productionUrl) {
    allowedOrigins.push(productionUrl);
  }
  if (webAppUrl) {
    allowedOrigins.push(webAppUrl);
  }

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Validation & Sanitization
  app.useGlobalPipes(
    new SanitizePipe(), // XSS Protection - strip HTML from all inputs
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger Documentation - DISABLED in production for security
  if (!isProduction) {
    const config = new DocumentBuilder()
      .setTitle('Niki Coffee API')
      .setDescription('Niki Coffee & Sandwich Loyalty App API Documentation')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .addTag('Auth', 'Authentication endpoints')
      .addTag('Users', 'User management')
      .addTag('Wallet', 'Niki Credits & QR')
      .addTag('Menu', 'Products & Categories')
      .addTag('Orders', 'Order/Receipt management')
      .addTag('Campaigns', 'Loyalty campaigns')
      .addTag('Wheel', 'Spin the wheel')
      .addTag('Admin', 'Admin operations')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
    logger.log('Swagger documentation enabled at /api/docs');
  } else {
    logger.log('Swagger documentation DISABLED in production');
  }

  const port = process.env.APP_PORT || 3000;
  // Bind to 0.0.0.0 to make it accessible from other devices on the network
  await app.listen(port, '0.0.0.0');

  // Get local network IP for mobile testing
  const os = require('os');
  const interfaces = os.networkInterfaces();
  let localIp = 'localhost';
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        localIp = iface.address;
        break;
      }
    }
  }

  logger.log(`
  🚀 Niki Coffee API is running!

  📍 Environment: ${isProduction ? 'PRODUCTION' : 'development'}
  📍 Local:    http://localhost:${port}/api/v1
  📍 Network:  http://${localIp}:${port}/api/v1
  ${!isProduction ? `📚 Swagger:  http://localhost:${port}/api/docs` : '🔒 Swagger:  DISABLED in production'}
  `);
}
bootstrap();
