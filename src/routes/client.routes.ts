import { Router } from 'express';
import { ClientController } from '../controllers/client.controller';
import { AuthMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/signup', ClientController.renderSignup);
router.post('/signup', ClientController.signup);
router.get('/login', ClientController.renderLogin);
router.post('/login', ClientController.login);
router.post('/verify-otp', ClientController.verifyOTP);
router.post('/resend-otp', ClientController.resendOTP);
router.post('/logout', AuthMiddleware.verifyClient, ClientController.logout);

export default router;