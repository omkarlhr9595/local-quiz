import { storage } from "../config/firebase.js";
import path from "path";

interface UploadPhotoParams {
  file: Express.Multer.File;
  gameId: string;
  contestantId: string;
}

/**
 * Upload contestant photo to Firebase Storage
 * @param params - Upload parameters
 * @returns Public URL of uploaded photo
 */
export const uploadContestantPhoto = async ({
  file,
  gameId,
  contestantId,
}: UploadPhotoParams): Promise<string> => {
  try {
    const bucket = storage.bucket();
    const fileExtension = path.extname(file.originalname);
    const fileName = `contestants/${gameId}/${contestantId}/photo${fileExtension}`;

    const fileRef = bucket.file(fileName);

    // Upload file
    await fileRef.save(file.buffer, {
      metadata: {
        contentType: file.mimetype,
        metadata: {
          gameId,
          contestantId,
          uploadedAt: new Date().toISOString(),
        },
      },
    });

    // Make file publicly accessible
    await fileRef.makePublic();

    // Get public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    return publicUrl;
  } catch (error) {
    console.error("Error uploading photo to Firebase Storage:", error);
    throw new Error("Failed to upload photo");
  }
};

/**
 * Delete contestant photo from Firebase Storage
 */
export const deleteContestantPhoto = async (
  gameId: string,
  contestantId: string
): Promise<void> => {
  try {
    const bucket = storage.bucket();

    // Note: Firebase Storage doesn't support wildcards directly
    // List files and delete them
    const [files] = await bucket.getFiles({
      prefix: `contestants/${gameId}/${contestantId}/`,
    });

    await Promise.all(files.map((file) => file.delete()));
  } catch (error) {
    console.error("Error deleting photo from Firebase Storage:", error);
    throw new Error("Failed to delete photo");
  }
};

