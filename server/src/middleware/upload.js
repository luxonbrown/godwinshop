const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const config = require('../config/env');

const uploadsDir = path.resolve(__dirname, '..', '..', 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    cb(null, name);
  }
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return cb(new Error('Only image files (jpg, jpeg, png, webp, gif) are allowed'));
  }
  if (file.mimetype && !file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image files are allowed'));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: config.uploads.maxSizeMb * 1024 * 1024 }
});

function deleteUploadedFile(filename) {
  if (!filename || typeof filename !== 'string') return;
  const safeName = path.basename(filename);
  const filePath = path.join(uploadsDir, safeName);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}

module.exports = { upload, uploadsDir, deleteUploadedFile };