// Load environment variables FIRST before any other imports
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { cwd } from "process";

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

  const PORT = process.env.PORT || 3001;

  // REST API routes
  app.use("/api", apiRoutes);

  // Setup Socket.io handlers
  setupSocketIO(io);

  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
})();

