import { Router } from 'express';
import { autocorrect } from '../controllers/autocorrectController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = Router();
router.post('/', authenticate, autocorrect);
export default router;