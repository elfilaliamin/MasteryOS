// backend/src/routes/upload.routes.js
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { verifyJWT } from '../middleware/auth.middleware.js';
import { uploadLimiter } from '../middleware/rateLimiter.middleware.js';
import { detectAllowedMimeType } from '../utils/fileSignature.js';

const router = Router();

// Storage volume directory isolated outside web execution roots
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// 5MB hard limit in memory storage for inspection prior to disk persistence
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Multipart upload endpoint
router.post(
  '/',
  verifyJWT,
  uploadLimiter,
  (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File exceeds maximum allowed size of 5MB.' });
        }
        return res.status(400).json({ error: `Upload error: ${err.message}` });
      } else if (err) {
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      if (!req.file || !req.file.buffer) {
        return res.status(400).json({ error: 'No file uploaded.' });
      }

      // Inspect binary magic bytes
      const detected = detectAllowedMimeType(req.file.buffer);
      if (!detected) {
        return res.status(400).json({
          error: 'Invalid file signature. Only authentic PNG, JPEG, WEBP, and PDF files are permitted.'
        });
      }

      // Cryptographically randomized filename (UUID + authentic extension)
      const randomName = `${crypto.randomUUID()}${detected.extension}`;
      const filePath = path.join(UPLOAD_DIR, randomName);

      // Write to isolated disk volume
      await fs.promises.writeFile(filePath, req.file.buffer);

      res.status(201).json({
        message: 'File uploaded successfully',
        url: `/api/upload/file/${randomName}`,
        filename: randomName,
        originalName: req.file.originalname,
        mimeType: detected.mimeType,
        size: req.file.size
      });
    } catch (err) {
      console.error('File upload error:', err);
      res.status(500).json({ error: 'Internal server error during file upload.' });
    }
  }
);

// Secure static delivery endpoint with nosniff and forced PDF attachment
router.get('/file/:filename', async (req, res) => {
  try {
    const { filename } = req.params;

    // Strict regex check prevents path traversal (e.g. ../ or absolute paths)
    if (!/^[a-f0-9-]+\.(png|jpg|webp|pdf)$/i.test(filename)) {
      return res.status(400).json({ error: 'Invalid file identifier.' });
    }

    const filePath = path.join(UPLOAD_DIR, filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found.' });
    }

    const ext = path.extname(filename).toLowerCase();
    const mimeMap = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf'
    };

    const mimeType = mimeMap[ext] || 'application/octet-stream';

    // Set security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Type', mimeType);

    if (ext === '.pdf') {
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    } else {
      res.setHeader('Content-Disposition', 'inline');
    }

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  } catch (err) {
    console.error('File retrieval error:', err);
    res.status(500).json({ error: 'Error retrieving file.' });
  }
});

export default router;
