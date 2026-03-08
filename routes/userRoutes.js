import { Router } from 'express';
import { getUsers, getUserById, updateAvatar, getAvatar, getOrCreateConversation } from '../controllers/userController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { handleAvatarUpload } from '../middlewares/uploadMiddleware.js';

const router = Router();

router.use(authenticate);

router.get ('/',                            getUsers);
router.get ('/:userId/profile',             getUserById);
router.post('/avatar',   handleAvatarUpload, updateAvatar);
router.get ('/avatar/:userId',              getAvatar);
router.get ('/conversation/:targetUserId',  getOrCreateConversation);

export default router;