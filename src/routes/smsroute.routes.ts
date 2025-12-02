import { Router , Request, Response} from 'express';
import SMSRouteController from '../controllers/smsroute.controller';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { TwoWaySMSHandler } from '../services/two-way-sms-handler.service';

const router = Router();


router.post('/', AuthMiddleware.verifyClient, SMSRouteController.create);

// Send a test message
router.post('/:routeId/test', AuthMiddleware.verifyClient, SMSRouteController.sendTest);

router.get(
  '/:id/webhook-info',
  AuthMiddleware.verifyClient,
  SMSRouteController.getWebhookInfo
);

// Provider inbound webhook
router.post('/webhook/:routeId', SMSRouteController.webhook);

 router.post('/webhooks/*', async (req: Request, res: Response) => {
    await TwoWaySMSHandler.handleWebhook(req, res);
  });

  // ✅ Also support GET (some providers use GET)
  router.get('/webhooks/*', async (req: Request, res: Response) => {
    await TwoWaySMSHandler.handleWebhook(req, res);
  });

  

export default router;