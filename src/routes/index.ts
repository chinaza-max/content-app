import { Router } from 'express';
import adminRoutes from './admin.routes';
import clientRoutes from './client.routes';
import smsRoutes from './smsroute.routes';

const router = Router();

router.use('/admin', adminRoutes);
router.use('/client', clientRoutes);
router.use('/sms', smsRoutes);


router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    endpoints: {
      admin: {
        login: 'GET/POST /admin/login',
        logout: 'POST /admin/logout',
      },
      client: {
        signup: 'GET/POST /client/signup',
        login: 'GET/POST /client/login',
        verifyOtp: 'POST /client/verify-otp',
        resendOtp: 'POST /client/resend-otp',
        logout: 'POST /client/logout',
      },
    },
  });
});

export default router;

//https://claude.ai/chat/7fd2837e-9c5f-4f67-864f-f23d4747f1a8