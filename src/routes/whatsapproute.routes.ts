import { Router } from 'express';
import WhatsAppRouteController from '../controllers/whatsapproute.controller';
import { AuthMiddleware } from '../middleware/auth.middleware';

const router = Router();

// ✅ Create a WhatsApp route (only authenticated users)
router.post('/',AuthMiddleware.verifyClient , WhatsAppRouteController.create);

// ✅ Send a test message using a specific WhatsApp route
router.post('/:routeId/send-test',AuthMiddleware.verifyClient , WhatsAppRouteController.sendTest);

// ✅ Webhook endpoint for incoming WhatsApp messages
router.post('/:routeId/webhook', WhatsAppRouteController.webhook);

export default router;
