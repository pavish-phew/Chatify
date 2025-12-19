import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
    sendRequest,
    getRequests,
    respondToRequest,
    getPendingCount,
} from '../controllers/friendRequest.controller.js';

const router = express.Router();

router.use(authenticate);

router.post('/send', sendRequest);
router.get('/pending', getRequests);
router.get('/count', getPendingCount);
router.post('/respond', respondToRequest);

export default router;
