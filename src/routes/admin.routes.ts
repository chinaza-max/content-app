import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { AuthMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/login', AdminController.renderLogin);
router.post('/login', AdminController.login);
router.post('/logout', AuthMiddleware.verifyAdmin, AdminController.logout);

export default router;