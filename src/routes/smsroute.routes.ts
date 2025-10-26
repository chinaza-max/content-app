import { Router } from 'express';
import SMSRouteController from '../controllers/smsroute.controller';
import { AuthMiddleware } from '../middleware/auth.middleware';

const router = Router();


router.post('/', AuthMiddleware.verifyClient, SMSRouteController.create);

// Send a test message
router.post('/:routeId/test', AuthMiddleware.verifyClient, SMSRouteController.sendTest);

// Provider inbound webhook
router.post('/webhook/:routeId', SMSRouteController.webhook);

export default router;