import express from 'express';
import { SubscriberController } from '../controllers/subscriber.controller';
import { SubscriptionController } from '../controllers/subscription.controller';

const router = express.Router();
const subscriberCtrl = new SubscriberController();
const subscriptionCtrl = new SubscriptionController();

// Subscriber endpoints
router.post('/subscribers', subscriberCtrl.create);
router.get('/subscribers', subscriberCtrl.findAll);
router.get('/subscribers/:id', subscriberCtrl.findOne);
router.put('/subscribers/:id', subscriberCtrl.update);
router.delete('/subscribers/:id', subscriberCtrl.delete);

// Subscription endpoints
router.post('/subscriptions', subscriptionCtrl.create);
router.get('/subscriptions', subscriptionCtrl.findAll);
router.get('/subscriptions/:id', subscriptionCtrl.findOne);
router.put('/subscriptions/:id', subscriptionCtrl.update);
router.delete('/subscriptions/:id', subscriptionCtrl.delete);

export default router;
