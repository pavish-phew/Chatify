import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  sendMessage,
  getMessages,
} from '../controllers/message.controller.js';

const router = express.Router();

router.use(authenticate);

router.post('/', sendMessage);
router.get('/:chatId', getMessages);

export default router;


