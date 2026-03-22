import express from 'express';
import { getMessages, sendMessage } from '../controllers/messageController';

const router = express.Router();

// Get messages for a specific room (e.g., /api/messages/global OR /api/messages/12345boardId)
router.get('/:boardId', getMessages);

// Send a new message
router.post('/', sendMessage);

export default router;