import { Router } from 'express';
import { uploadFile, downloadFile } from '../controllers/fileController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { handleUpload } from '../middlewares/uploadMiddleware.js';

const router = Router();

router.use(authenticate);

router.post('/upload',      handleUpload, uploadFile);
router.get ('/:messageId',               downloadFile);

export default router;
