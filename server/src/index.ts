// Load environment variables FIRST before any other imports
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { cwd } from "process";
import os from "os";

// Load .env file - try multiple paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPaths = [
  join(__dirname, "../.env"), // server/.env (relative to this file: server/src -> server/.env)
  join(cwd(), ".env"), // .env in current working directory (server/.env when running from server/)
];

let loaded = false;
for (const envPath of envPaths) {
  const result = dotenv.config({ path: envPath });
  // Check if we got parsed values (not just no error)
  if (!result.error && result.parsed && Object.keys(result.parsed).length > 0) {
    loaded = true;
    console.log(`✅ Loaded .env from: ${envPath}`);
    break;
  }
}

if (!loaded) {
  console.warn("⚠️  Could not load .env file. Attempted paths:", envPaths);
  console.warn("Current working directory:", cwd());
  console.warn("__dirname:", __dirname);
}

// Now import other modules
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import apiRoutes from "./routes/index.js";
import { setupSocketIO } from "./socket/index.js";

// Start server in async function to handle Firebase import
(async () => {
  // Verify environment variables are loaded before Firebase
  console.log("Checking environment variables...");
  console.log("FIREBASE_PROJECT_ID:", process.env.FIREBASE_PROJECT_ID ? "✅ Found" : "❌ Missing");
  console.log("FIREBASE_CLIENT_EMAIL:", process.env.FIREBASE_CLIENT_EMAIL ? "✅ Found" : "❌ Missing");
  console.log("FIREBASE_PRIVATE_KEY:", process.env.FIREBASE_PRIVATE_KEY ? "✅ Found" : "❌ Missing");
  
  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
    console.error("❌ Firebase credentials are missing! Please check your .env file.");
    process.exit(1);
  }
  
  // Dynamically import Firebase AFTER env vars are loaded
  await import("./config/firebase.js");

  const app = express();
  const httpServer = createServer(app);

  const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
  const NODE_ENV = process.env.NODE_ENV || "development";

  // In development, allow all origins for local network access
  // In production, use the specific CLIENT_URL
  const corsOrigin = NODE_ENV === "development" 
    ? true // Allow all origins in development (for local network access)
    : CLIENT_URL;

  const io = new Server(httpServer, {
    cors: {
      origin: corsOrigin,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  app.use(
    cors({
      origin: corsOrigin,
      credentials: true,
    })
  );
  app.use(express.json());

  // Serve static files from uploads directory
  // This makes images accessible from other devices on the local network
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const uploadsPath = join(__dirname, "../uploads");
  
  // Serve uploads directory as static files
  app.use("/uploads", express.static(uploadsPath, {
    // Set proper headers for images
    setHeaders: (res, filePath) => {
      // Allow CORS for images so they can be accessed from other devices
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET");
      
      // Cache images for better performance
      if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg") || 
          filePath.endsWith(".png") || filePath.endsWith(".gif") || 
          filePath.endsWith(".webp")) {
        res.setHeader("Cache-Control", "public, max-age=31536000");
      }
    },
  }));

  const PORT = Number(process.env.PORT) || 3001;
  const HOST = process.env.HOST || "0.0.0.0"; // 0.0.0.0 allows access from all network interfaces

  // REST API routes
  app.use("/api", apiRoutes);

  // Setup Socket.io handlers
  setupSocketIO(io);

  // Helper function to get network IP
  const getNetworkIP = (): string | null => {
    const interfaces = os.networkInterfaces();
    const preferredNames = ["en0", "en1", "eth0", "wlan0", "Wi-Fi", "Ethernet"];
    
    for (const name of preferredNames) {
      const iface = interfaces[name];
      if (iface) {
        for (const addr of iface) {
          if (addr.family === "IPv4" && !addr.internal) {
            return addr.address;
          }
        }
      }
    }
    
    for (const name of Object.keys(interfaces)) {
      const iface = interfaces[name];
      if (iface) {
        for (const addr of iface) {
          if (addr.family === "IPv4" && !addr.internal) {
            return addr.address;
          }
        }
      }
    }
    
    return null;
  };

  httpServer.listen(PORT, HOST, () => {
    const displayHost = HOST === "0.0.0.0" ? "localhost" : HOST;
    const networkIP = HOST === "0.0.0.0" ? getNetworkIP() : null;
    
    console.log(`🚀 Server running on http://${displayHost}:${PORT}`);
    if (networkIP) {
      console.log(`🌐 Network access: http://${networkIP}:${PORT}`);
    }
    console.log(`📁 Serving uploads from: ${uploadsPath}`);
    
    // In development, show helpful network access info
    if (NODE_ENV === "development") {
      if (networkIP) {
        console.log(`\n✅ Network IP detected: ${networkIP}`);
        console.log(`   Images will be accessible from other devices on your network`);
        console.log(`   If images don't load, set PUBLIC_URL=http://${networkIP}:${PORT}\n`);
      } else {
        console.log(`\n💡 To access from other devices on your local network:`);
        console.log(`   1. Find your machine's IP address (e.g., 192.168.1.100)`);
        console.log(`   2. Set PUBLIC_URL environment variable: PUBLIC_URL=http://192.168.1.100:${PORT}`);
        console.log(`   3. This ensures image URLs work correctly on all devices\n`);
      }
    }
  });
})();

