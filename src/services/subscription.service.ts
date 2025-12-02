import Subscription from '../models/subscription.model';
import Subscriber from '../models/subscriber.model';
import Channel from '../models/channel.model';

export class SubscriptionService {
  async create(data: any) {
    // Verify foreign keys exist
    const subscriber = await Subscriber.findByPk(data.subscriberId);
    const channel = await Channel.findByPk(data.channelId);

    if (!subscriber) throw new Error('Subscriber not found');
    if (!channel) throw new Error('Channel not found');

    // One subscriber–channel unique pair rule
    const existing = await Subscription.findOne({
      where: { subscriberId: data.subscriberId, channelId: data.channelId },
    });
    if (existing) throw new Error('Subscriber already subscribed to this channel');

    return await Subscription.create(data);
  }

  async findAll() {
    return await Subscription.findAll({
      include: ['subscriber', 'channel'],
    });
  }

  async findById(id: number) {
    return await Subscription.findByPk(id, {
      include: ['subscriber', 'channel'],
    });
  }

  async update(id: number, data: any) {
    const subscription = await Subscription.findByPk(id);
    if (!subscription) throw new Error('Subscription not found');
    return await subscription.update(data);
  }

  async delete(id: number) {
    const subscription = await Subscription.findByPk(id);
    if (!subscription) throw new Error('Subscription not found');
    await subscription.destroy();
    return { message: 'Subscription deleted successfully' };
  }
}
