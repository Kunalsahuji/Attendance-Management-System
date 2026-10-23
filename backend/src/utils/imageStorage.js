const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;

const hasCloudinary = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (hasCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

/**
 * Saves a base64 selfie string either to Cloudinary or to local disk storage
 * @param {string} base64Data - Base64 image data (e.g. data:image/jpeg;base64,...)
 * @param {string} prefix - 'punch-in' or 'punch-out'
 * @returns {Promise<string>} Stored image URL or relative path
 */
const saveSelfieImage = async (base64Data, prefix = 'selfie') => {
  if (!base64Data || typeof base64Data !== 'string') {
    throw new Error('Invalid image data provided for selfie capture.');
  }

  // Attempt Cloudinary if configured
  if (hasCloudinary) {
    try {
      const uploadRes = await cloudinary.uploader.upload(base64Data, {
        folder: 'attendance_selfies',
        transformation: [{ width: 640, height: 480, crop: 'limit', quality: 'auto:good' }]
      });
      return uploadRes.secure_url;
    } catch (cloudErr) {
      console.warn(`[Cloudinary] Upload failed (${cloudErr.message}). Falling back to local storage.`);
    }
  }

  // Local disk storage fallback
  const uploadsDir = path.resolve(__dirname, '../../uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Extract base64 payload
  const matches = base64Data.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
  let ext = 'jpg';
  let buffer;

  if (matches && matches.length === 3) {
    ext = matches[1] === 'png' ? 'png' : 'jpg';
    buffer = Buffer.from(matches[2], 'base64');
  } else {
    // Plain base64
    buffer = Buffer.from(base64Data, 'base64');
  }

  const filename = `${prefix}-${Date.now()}-${Math.round(Math.random() * 1e6)}.${ext}`;
  const filePath = path.join(uploadsDir, filename);

  fs.writeFileSync(filePath, buffer);
  return `/uploads/${filename}`;
};

module.exports = {
  saveSelfieImage
};
