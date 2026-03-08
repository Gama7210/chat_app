import { Router } from 'express';
import {
  register,
  login,
  logout,
  me,
  forgotPassword,
  changePassword,
  updateStatus,
} from '../controllers/authController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/register',        register);
router.post('/login',           login);
router.post('/logout',          logout);
router.get ('/me',              authenticate, me);
router.post('/forgot-password', forgotPassword);
router.post('/change-password', authenticate, changePassword);
router.post('/update-status',   authenticate, updateStatus);

export default router;