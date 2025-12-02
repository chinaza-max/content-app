import { Request, Response } from 'express';
import { SubscriptionService } from '../services/subscription.service';
import { createSubscriptionSchema, updateSubscriptionSchema } from '../validators/subscription.validator';

const subscriptionService = new SubscriptionService();

export class SubscriptionController {
  async create(req: Request, res: Response) {
    const { error, value } = createSubscriptionSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    try {
      const subscription = await subscriptionService.create(value);
      res.status(201).json(subscription);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async findAll(req: Request, res: Response) {
    const data = await subscriptionService.findAll();
    res.json(data);
  }

  async findOne(req: Request, res: Response) {
    const { id } = req.params;
    const sub = await subscriptionService.findById(Number(id));
    if (!sub) return res.status(404).json({ error: 'Subscription not found' });
    res.json(sub);
  }

  async update(req: Request, res: Response) {
    const { id } = req.params;
    const { error, value } = updateSubscriptionSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    try {
      const updated = await subscriptionService.update(Number(id), value);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async delete(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const result = await subscriptionService.delete(Number(id));
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
