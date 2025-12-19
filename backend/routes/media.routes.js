import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { uploadMedia as uploadMiddleware } from '../middleware/upload.middleware.js';
import { uploadMedia } from '../controllers/media.controller.js';

const router = express.Router();

router.use(authenticate);

router.post('/upload', uploadMiddleware.single('media'), uploadMedia);

export default router;
