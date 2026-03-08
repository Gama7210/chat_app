import { Router } from 'express';
import { chatWithAI, getAIHistory, clearAIHistory } from '../controllers/aiController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = Router();
router.use(authenticate);

router.post('/chat',          chatWithAI);
router.get ('/history',       getAIHistory);
router.delete('/history',     clearAIHistory);

export default router;