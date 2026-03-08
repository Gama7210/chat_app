import { Router } from 'express';
import { getMessages, deleteConversation } from '../controllers/messageController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = Router();
router.use(authenticate);

router.get   ('/:conversationId',        getMessages);
router.delete('/:conversationId/clear',  deleteConversation);

export default router;