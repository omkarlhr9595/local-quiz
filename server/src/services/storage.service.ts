import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import os from "os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get the uploads directory path (server/uploads)
const getUploadsDir = () => {
  return path.join(__dirname, "../../uploads");
};

// Get the first non-internal IPv4 address from network interfaces
const getNetworkIP = (): string | null => {
  const interfaces = os.networkInterfaces();
  
  // Look for the first non-internal IPv4 address
  // Prefer en0, en1, eth0, etc. (common network interface names)
  const preferredNames = ["en0", "en1", "eth0", "wlan0", "Wi-Fi", "Ethernet"];
  
  // First, try preferred interface names
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
  
  // If no preferred interface found, search all interfaces
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

// Cache the network IP to avoid repeated lookups
let cachedNetworkIP: string | null = null;

// Get the base URL for serving images
const getBaseUrl = (): string => {
  // Use PUBLIC_URL if set (allows users to specify their IP for local network access)
  // Format: http://192.168.1.100:3001 or http://localhost:3001
  if (process.env.PUBLIC_URL) {
    return process.env.PUBLIC_URL;
  }
  
  const PORT = process.env.PORT || 3001;
  const hostname = process.env.HOST || "localhost";
  
  // If HOST is 0.0.0.0, try to detect the network IP for local network access
  if (hostname === "0.0.0.0") {
    // Cache the network IP to avoid repeated lookups
    if (!cachedNetworkIP) {
      cachedNetworkIP = getNetworkIP();
    }
    
    // Use detected network IP if available, otherwise fall back to localhost
    const urlHost = cachedNetworkIP || "localhost";
    
    if (cachedNetworkIP) {
      console.log(`🌐 Using network IP for image URLs: ${cachedNetworkIP}`);
    } else {
      console.warn(`⚠️  Could not detect network IP. Using localhost. Set PUBLIC_URL env var for network access.`);
    }
    
    return `http://${urlHost}:${PORT}`;
  }
  
  return `http://${hostname}:${PORT}`;
};

interface UploadPhotoParams {
  file: Express.Multer.File;
  gameId: string;
  contestantId: string;
}

/**
 * Upload contestant photo to local storage
 * @param params - Upload parameters
 * @returns Public URL of uploaded photo
 */
export const uploadContestantPhoto = async ({
  file,
  gameId,
  contestantId,
}: UploadPhotoParams): Promise<string> => {
  try {
    const fileExtension = path.extname(file.originalname);
    const uploadsDir = getUploadsDir();
    const gameDir = path.join(uploadsDir, "contestants", gameId);
    const contestantDir = path.join(gameDir, contestantId);
    const fileName = `photo${fileExtension}`;
    const filePath = path.join(contestantDir, fileName);

    // Create directories if they don't exist
    await fs.mkdir(contestantDir, { recursive: true });

    // Write file to disk
    await fs.writeFile(filePath, file.buffer);

    // Generate public URL
    const baseUrl = getBaseUrl();
    const publicUrl = `${baseUrl}/uploads/contestants/${gameId}/${contestantId}/${fileName}`;

    console.log(`✅ Photo uploaded: ${filePath}`);
    console.log(`   Public URL: ${publicUrl}`);

    return publicUrl;
  } catch (error) {
    console.error("Error uploading photo to local storage:", error);
    throw new Error("Failed to upload photo");
  }
};

/**
 * Delete contestant photo from local storage
 */
export const deleteContestantPhoto = async (
  gameId: string,
  contestantId: string
): Promise<void> => {
  try {
    const uploadsDir = getUploadsDir();
    const contestantDir = path.join(uploadsDir, "contestants", gameId, contestantId);

    // Check if directory exists
    try {
      await fs.access(contestantDir);
    } catch {
      // Directory doesn't exist, nothing to delete
      return;
    }

    // Read all files in the directory
    const files = await fs.readdir(contestantDir);
    
    // Delete all files in the contestant directory
    await Promise.all(
      files.map((file) => fs.unlink(path.join(contestantDir, file)))
    );

    // Try to remove the directory (will fail if not empty, which is fine)
    try {
      await fs.rmdir(contestantDir);
    } catch {
      // Directory not empty or other error, ignore
    }

    console.log(`✅ Deleted photos for contestant: ${contestantId}`);
  } catch (error) {
    console.error("Error deleting photo from local storage:", error);
    throw new Error("Failed to delete photo");
  }
};

