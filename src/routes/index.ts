import { Router } from 'express';
import adminRoutes from './admin.routes';
import clientRoutes from './client.routes';

const router = Router();

router.use('/admin', adminRoutes);
router.use('/client', clientRoutes);

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