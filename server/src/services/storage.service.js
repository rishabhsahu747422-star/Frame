import dotenv from "dotenv";
dotenv.config();
import ImageKit from "imagekit";

const isImageKitConfigured = Boolean(
  process.env.IK_PUB_KEY && process.env.IK_PRI_KEY && process.env.IK_URL
);

let storageInstance = null;

if (isImageKitConfigured) {
  try {
    storageInstance = new ImageKit({
      publicKey: process.env.IK_PUB_KEY,
      privateKey: process.env.IK_PRI_KEY,
      urlEndpoint: process.env.IK_URL,
    });
  } catch (err) {
    console.warn("ImageKit initialization error:", err.message);
  }
}

const ALLOWED_IMAGE_MIMES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_VIDEO_MIMES = ["video/mp4", "video/webm", "video/quicktime"];

/**
 * Validate image file by MIME type and size
 */
export const validateImageFile = (file, maxSizeMB = 10) => {
  if (!file) throw new Error("File is required");
  if (!ALLOWED_IMAGE_MIMES.includes(file.mimetype)) {
    throw new Error(`Invalid image type: ${file.mimetype}. Allowed types: JPEG, PNG, WebP, GIF`);
  }
  const maxBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error(`Image file size exceeds ${maxSizeMB}MB limit`);
  }
};

/**
 * Validate video file by MIME type and size
 */
export const validateVideoFile = (file, maxSizeMB = 100) => {
  if (!file) throw new Error("Video file is required");
  if (!ALLOWED_VIDEO_MIMES.includes(file.mimetype)) {
    throw new Error(`Invalid video type: ${file.mimetype}. Allowed types: MP4, WebM, QuickTime (MOV)`);
  }
  const maxBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error(`Video file size exceeds ${maxSizeMB}MB limit`);
  }
};

/**
 * Upload buffer or file to ImageKit or return deterministic local/mock URL
 */
export const sendFiles = async (fileBuffer, fileName, folder = "kingsta") => {
  if (!fileBuffer) {
    throw new Error("File buffer is required for upload");
  }

  if (storageInstance) {
    try {
      const response = await storageInstance.upload({
        file: fileBuffer,
        fileName: fileName || `file_${Date.now()}`,
        folder,
      });
      return {
        url: response.url,
        fileId: response.fileId,
        name: response.name,
      };
    } catch (error) {
      console.error("ImageKit upload error:", error.message);
      throw new Error(`Media upload failed: ${error.message}`);
    }
  }

  // Fallback for tests or local dev without ImageKit credentials
  const cleanName = (fileName || `media_${Date.now()}`).replace(/\s+/g, "_");
  const fallbackUrl = `https://mock-cdn.frame.local/${folder}/${Date.now()}_${cleanName}`;
  return {
    url: fallbackUrl,
    fileId: `mock_file_${Date.now()}`,
    name: cleanName,
  };
};

/**
 * Delete a file from ImageKit
 */
export const deleteFile = async (fileId) => {
  if (!fileId || !storageInstance) return false;
  try {
    await storageInstance.deleteFile(fileId);
    return true;
  } catch (error) {
    console.error("ImageKit delete error:", error.message);
    return false;
  }
};
