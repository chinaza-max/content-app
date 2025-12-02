import { Request, Response } from 'express';
import { SubscriberService } from '../services/subscriber.service';
import { createSubscriberSchema, updateSubscriberSchema } from '../validators/subscriber.validator';

const subscriberService = new SubscriberService();

export class SubscriberController {
  async create(req: Request, res: Response) {
    const { error, value } = createSubscriberSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    try {
      const subscriber = await subscriberService.create(value);
      res.status(201).json(subscriber);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async findAll(req: Request, res: Response) {
    const data = await subscriberService.findAll();
    res.json(data);
  }

  async findOne(req: Request, res: Response) {
    const { id } = req.params;
    const subscriber = await subscriberService.findById(Number(id));
    if (!subscriber) return res.status(404).json({ error: 'Subscriber not found' });
    res.json(subscriber);
  }

  async update(req: Request, res: Response) {
    const { id } = req.params;
    const { error, value } = updateSubscriberSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    try {
      const updated = await subscriberService.update(Number(id), value);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async delete(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const result = await subscriberService.delete(Number(id));
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
