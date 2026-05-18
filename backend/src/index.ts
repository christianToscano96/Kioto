import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { connectDatabase } from "./config/database";
import authRoutes from "./routes/auth";
import productRoutes from "./routes/products";
import categoryRoutes from "./routes/categories";
import publicProductRoutes from "./routes/publicProducts";
import cartRoutes from "./routes/cart";
import checkoutRoutes from "./routes/checkout";
import orderRoutes from "./routes/orders";
import apiDocsRoutes from "./routes/api-docs";
import uploadRoutes from "./routes/upload";
import settingsRoutes from "./routes/settings";
import webhookRoutes from "./routes/webhook";
import notificationRoutes from "./routes/notifications";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Security middleware
app.use(helmet());
app.use(mongoSanitize());

// Rate limiting - disabled for development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // increased limit for development
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'development', // Skip in dev
});
app.use(limiter);

// Separate rate limiter for cart operations (stricter)
const cartLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute for cart operations
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'development',
  message: 'Too many cart requests, please slow down.',
  keyGenerator: (req) => {
    // Use session ID or IP for anonymous users
    return req.cookies?.sessionId || req.ip;
  },
});

// CORS configuration - support multiple origins
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "https://kioto-ecomerce.vercel.app",
  // Support all Vercel preview deployments
  /https:\/\/kioto-.*\.vercel\.app$/,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) {
        return callback(null, true);
      }

      // Check if origin matches allowed origins (string or regex)
      const isAllowed = allowedOrigins.some((allowed) => {
        if (typeof allowed === 'string') {
          return allowed === origin;
        }
        if (allowed instanceof RegExp) {
          return allowed.test(origin);
        }
        return false;
      });

      if (isAllowed) {
        callback(null, true);
      } else {
        console.error(`CORS blocked origin: ${origin}`);
        console.error(`Allowed origins:`, allowedOrigins);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

// Body parsing with special handling for Stripe webhooks
// Stripe requires raw body for signature verification
const skipJsonPaths = ["/api/checkout/webhook"];
app.use((req, res, next) => {
  if (skipJsonPaths.some((path) => req.originalUrl.startsWith(path))) {
    express.raw({ type: "application/json" })(req, res, next);
  } else {
    express.json({ limit: "10mb" })(req, res, next);
  }
});
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Cookie parser for HTTP-only cookies
app.use(cookieParser());

// Health check endpoint
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/public", publicProductRoutes);
app.use("/api/cart", cartLimiter, cartRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/docs", apiDocsRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/webhooks", webhookRoutes);

// Error handling middleware
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(err.stack);
    res.status(500).json({ error: "Something went wrong!" });
  },
);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Start server with database connection
const startServer = async () => {
   await connectDatabase();
   
   const server = app.listen(PORT, () => {
     console.log(`Server running on port ${PORT}`);
   });
   
// Initialize Socket.IO
   const io = new (await import('socket.io')).Server(server, {
     cors: {
       origin: (origin, callback) => {
         if (!origin) {
           return callback(null, true);
         }
         const isAllowed = allowedOrigins.some((allowed) => {
           if (typeof allowed === 'string') {
             return allowed === origin;
           }
           if (allowed instanceof RegExp) {
             return allowed.test(origin);
           }
           return false;
         });
         callback(null, isAllowed);
       },
       credentials: true,
     }
   });
   const { initSocket } = await import('./socket');
   initSocket(io);
 };

startServer();
