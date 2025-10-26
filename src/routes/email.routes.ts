import { Router } from 'express';
import { EmailController } from '../controllers/email.controller';
import { AuthMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Protect all email routes with admin authentication
router.use(AuthMiddleware.verifyAdmin);

router.get('/stats', EmailController.getStats);
router.get('/failed', EmailController.getFailedEmails);
router.post('/retry', EmailController.retryFailed);
