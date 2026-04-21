const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");
const cookieParser = require("cookie-parser");

// Load environment variables
dotenv.config();
console.log("MONGO_URI:", process.env.MONGO_URI);

const app = express();
app.set("trust proxy", 1);

const isAllowedLocalDevelopmentOrigin = (origin) => {
  if (!origin) {
    return true;
  }

  return (
    /^http:\/\/localhost(?::\d+)?$/i.test(origin) ||
    /^http:\/\/127\.0\.0\.1(?::\d+)?$/i.test(origin) ||
    /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}(?::\d+)?$/i.test(origin) ||
    /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}(?::\d+)?$/i.test(origin) ||
    /^http:\/\/172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}(?::\d+)?$/i.test(
      origin
    )
  );
};

const corsOptions = {
  origin: (origin, callback) => {
    console.log("CORS Origin:", origin);

    // Allow Postman, curl, server-to-server, OAuth redirects
    if (!origin) return callback(null, true);

    // Allow ALL localhost ports
    if (isAllowedLocalDevelopmentOrigin(origin)) {
      return callback(null, true);
    }

    // Allow Netlify (production + previews)
    if (origin.endsWith(".netlify.app")) {
      return callback(null, true);
    }

    // ❗ DO NOT throw error
    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
};



// Middleware
app.use(cors(corsOptions));
app.use(cookieParser());

// Handle preflight requests
app.options("*", cors(corsOptions));

// Add request logging middleware
app.use((req, res, next) => {
  console.log(
    `${new Date().toISOString()} - ${req.method} ${req.url} from ${req.get("Origin") || "unknown"}`
  );
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

// MongoDB Connection with better error handling
mongoose
  .connect(mongoUri)
  .then(() => {
    console.log("MongoDB Connected Successfully");
  })
  .catch((err) => {
    console.error("MongoDB Connection Error:", err);
    process.exit(1); // Exit if database connection fails
  });

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    cors: {
      allowedOrigins: corsOptions.origin,
      credentials: corsOptions.credentials,
    },
  });
});

// Routes
app.use("/", require("./routes/authRoutes"));
app.use("/api/properties", require("./routes/propertyRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api", require("./routes/indexRoutes"));
app.use("/api/messages", require("./routes/messageRoutes"));
app.use("/api/reviews", require("./routes/reviewRoutes"));
app.use("/api/bookings", require("./routes/bookingRoutes"));
app.use("/api/wishlist", require("./routes/wishListRoute"));

// Check if build directory exists (serve from top-level frontend/build)
const buildPath = path.join(__dirname, "../frontend/build");
const indexPath = path.join(buildPath, "index.html");

console.log(" Checking build directory...");
console.log(" Build path:", buildPath);
console.log(" Index path:", indexPath);
console.log(" Directory exists:", fs.existsSync(buildPath));
console.log(" File exists:", fs.existsSync(indexPath));

// List contents of client directory for debugging
const clientPath = path.join(__dirname, "client");
if (fs.existsSync(clientPath)) {
  console.log(" Client directory contents:");
  try {
    const clientContents = fs.readdirSync(clientPath);
    console.log("   -", clientContents.join(", "));

    if (fs.existsSync(buildPath)) {
      console.log(" Build directory contents:");
      const buildContents = fs.readdirSync(buildPath);
      console.log("   -", buildContents.join(", "));
    }
  } catch (err) {
    console.log("   Error reading directory:", err.message);
  }
}

// Serve static files from the React build directory (only if it exists)
if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath));

  // Root route handler for API
  app.get("/api", (req, res) => {
    res.json({
      message: "Smart Rent System API",
      status: "running",
      timestamp: new Date().toISOString(),
      endpoints: {
        health: "/api/health",
        properties: "/api/properties",
        users: "/api/users",
        messages: "/api/messages",
        reviews: "/api/reviews",
        bookings: "/api/bookings",
      },
    });
  });

  // Catch-all handler: send back React's index.html file for any non-API routes
  app.get("*", (req, res) => {
    res.sendFile(indexPath, (err) => {
      if (err) {
        console.error("Error serving React app:", err);
        res.status(500).json({
          message: "Frontend not available",
          error: "React build files not found or corrupted",
        });
      }
    });
  });
} else {
  // If build directory doesn't exist, only serve API
  console.warn("React build directory not found. Only serving API endpoints.");

  // Root route handler for API
  app.get("/api", (req, res) => {
    res.json({
      message: "Smart Rent System API",
      status: "running",
      timestamp: new Date().toISOString(),
      endpoints: {
        health: "/api/health",
        properties: "/api/properties",
        users: "/api/users",
        messages: "/api/messages",
        reviews: "/api/reviews",
        bookings: "/api/bookings",
      },
    });
  });

  // Catch-all handler for non-API routes when build doesn't exist
  app.get("*", (req, res) => {
    res.status(404).json({
      message: "Frontend not available",
      error: "React build files not found. Please run 'npm run build' first.",
      availableEndpoints: {
        api: "/api",
        health: "/api/health",
        properties: "/api/properties",
        users: "/api/users",
      },
    });
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
