import { Router } from 'express';
import { ClientController } from '../controllers/client.controller';
import { AuthMiddleware } from '../middleware/auth.middleware';



const router = Router();

//AUTH
router.get('/signup', ClientController.renderSignup);
router.post('/signup', ClientController.signup);
router.get('/login', ClientController.renderLogin);
router.post('/login', ClientController.login);
router.post('/verify-otp', ClientController.verifyOTP);
router.post('/resend-otp', ClientController.resendOTP);
router.post('/logout',AuthMiddleware.verifyClient, ClientController.logout);


//DASHBOARD
router.get('/overview',AuthMiddleware.verifyClient , ClientController.getDashboardOverview);
router.get('/metrics', AuthMiddleware.verifyClient , ClientController.getDashboardMetrics);
router.get('/recent-activity', AuthMiddleware.verifyClient , ClientController.getRecentActivity) ;
router.get('/quick-actions', AuthMiddleware.verifyClient, ClientController.getQuickActions);

//CHANNEL
router.post("/channel", AuthMiddleware.verifyClient, ClientController.create);
router.get("/channel", AuthMiddleware.verifyClient, ClientController.list);
router.get("/channel/:id", AuthMiddleware.verifyClient, ClientController.get);
router.put("/channel/:id", AuthMiddleware.verifyClient, ClientController.update);
router.delete("/channel/:id", AuthMiddleware.verifyClient, ClientController.delete);


//CONTENT
router.post("/create",AuthMiddleware.verifyClient, ClientController.createMessage);








export default router;