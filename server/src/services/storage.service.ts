import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get the uploads directory path (server/uploads)
const getUploadsDir = () => {
  return path.join(__dirname, "../../uploads");
};

// Get the base URL for serving images
const getBaseUrl = (): string => {
  // Use PUBLIC_URL if set (allows users to specify their IP for local network access)
  // Format: http://192.168.1.100:3001 or http://localhost:3001
  if (process.env.PUBLIC_URL) {
    return process.env.PUBLIC_URL;
  }
  
  const PORT = process.env.PORT || 3001;
  const hostname = process.env.HOST || "localhost";
  
  // If HOST is 0.0.0.0, use localhost (0.0.0.0 can't be used in URLs)
  const urlHost = hostname === "0.0.0.0" ? "localhost" : hostname;
  
  return `http://${urlHost}:${PORT}`;
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

    console.log(`📁 Upload directory: ${uploadsDir}`);
    console.log(`📁 Full file path: ${filePath}`);

    // Create directories if they don't exist
    await fs.mkdir(contestantDir, { recursive: true });
    console.log(`✅ Created directory: ${contestantDir}`);

    // Write file to disk
    await fs.writeFile(filePath, file.buffer);
    console.log(`✅ File written: ${filePath} (${file.size} bytes)`);

    // Verify file was written
    const stats = await fs.stat(filePath);
    console.log(`✅ File verified: ${stats.size} bytes on disk`);

    // Generate public URL
    const baseUrl = getBaseUrl();
    const publicUrl = `${baseUrl}/uploads/contestants/${gameId}/${contestantId}/${fileName}`;

    console.log(`✅ Photo uploaded successfully`);
    console.log(`   File path: ${filePath}`);
    console.log(`   Public URL: ${publicUrl}`);

    return publicUrl;
  } catch (error) {
    console.error("❌ Error uploading photo to local storage:", error);
    if (error instanceof Error) {
      console.error("   Error message:", error.message);
      console.error("   Error stack:", error.stack);
    }
    throw new Error(`Failed to upload photo: ${error instanceof Error ? error.message : "Unknown error"}`);
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

