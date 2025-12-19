import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import upload from '../middleware/upload.middleware.js';
import {
  searchUsers,
  getUserById,
  getUserChats,
  completeProfile,
  updateProfile,
} from '../controllers/user.controller.js';

const router = express.Router();

router.use(authenticate);

router.get('/search', searchUsers);
router.get('/chats', getUserChats);
router.post('/complete-profile', upload.single('profilePicture'), completeProfile);
router.put('/update-profile', upload.single('profilePicture'), updateProfile);
router.get('/:userId', getUserById);

export default router;


