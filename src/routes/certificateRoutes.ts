import express from 'express';
import { getMyCertificates, downloadCertificate } from '../controllers/certificateController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);

router.get('/my-certificates', getMyCertificates);
router.get('/download/:id', downloadCertificate);

export default router;
