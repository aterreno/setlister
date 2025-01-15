import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { config } from "../config";

const app = express();

// Set trust proxy before any middleware that depends on it
if (config.isProd) {
  app.set('trust proxy', 1);
  app.enable('trust proxy'); // Enable proxy support
}

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add security headers and CORS configuration
app.use((req, res, next) => {
  // Security headers
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
  });

  // CORS headers
  const origin = req.headers.origin;
  if (origin === 'https://setlister.replit.app') {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  }

  // Debug headers
  console.log('=== Request Debug ===');
  console.log('Origin:', req.headers.origin);
  console.log('Cookies:', req.headers.cookie);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('==================');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Request logging middleware with enhanced debug info
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (config.isDev || path.includes('auth')) {
        logLine += `\nHeaders: ${JSON.stringify(req.headers)}`;
        logLine += `\nCookies: ${JSON.stringify(req.cookies)}`;
      }
      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    log("Starting server...");
    log(`Environment: ${config.isDev ? 'development' : 'production'}`);
    log(`Using server origin: ${config.baseUrl}`);
    log(`Cookie domain: ${config.auth.cookieDomain}`);

    const server = registerRoutes(app);

    // Global error handler with detailed logging
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error("Server Error:", err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
    });

    if (config.isDev) {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    server.listen(config.port, "0.0.0.0", () => {
      log(`Server environment: ${config.isDev ? 'development' : 'production'}`);
      log(`Server listening on port ${config.port}`);
    });

    server.on('error', (error: NodeJS.ErrnoException) => {
      console.error('Server error:', error);
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${config.port} is already in use`);
      }
      process.exit(1);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();