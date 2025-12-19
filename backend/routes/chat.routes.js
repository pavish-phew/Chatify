import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { createOrGetChat } from '../controllers/chat.controller.js';

const router = express.Router();

router.use(authenticate);

router.post('/', createOrGetChat);

export default router;


