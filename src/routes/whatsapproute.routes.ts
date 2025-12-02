import { Router } from 'express';
import WhatsAppRouteController from '../controllers/whatsapproute.controller';
import { AuthMiddleware } from '../middleware/auth.middleware';

const router = Router();


// ✅ Create a WhatsApp credential (only admins)
router.post('/create-credential',AuthMiddleware.verifyAdmin, WhatsAppRouteController.createWhatsAppCredential);

// ✅ Create a WhatsApp route (only authenticated users)
router.post('/create-route',AuthMiddleware.verifyAdmin , WhatsAppRouteController.create);

// ✅ Send a test message using a specific WhatsApp route
router.post('/:routeId/send-test',AuthMiddleware.verifyClient , WhatsAppRouteController.sendTest);

// ✅ Webhook endpoint for incoming WhatsApp messages
router.post('/webhook', WhatsAppRouteController.webhook);
router.get('/webhook/*', WhatsAppRouteController.dynamicWebhook);

router.put(
  '/update-credential/:id',
  AuthMiddleware.verifyAdmin,
  WhatsAppRouteController.updateWhatsAppCredential
);


export default router;
