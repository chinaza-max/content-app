import Subscriber from '../models/subscriber.model';

export class SubscriberService {
  async create(data: any) {
    return await Subscriber.create(data);
  }

  async findAll() {
    return await Subscriber.findAll();
  }

  async findById(id: number) {
    return await Subscriber.findByPk(id);
  }

  async update(id: number, data: any) {
    const subscriber = await Subscriber.findByPk(id);
    if (!subscriber) throw new Error('Subscriber not found');
    return await subscriber.update(data);
  }

  async delete(id: number) {
    const subscriber = await Subscriber.findByPk(id);
    if (!subscriber) throw new Error('Subscriber not found');
    await subscriber.destroy();
    return { message: 'Subscriber deleted successfully' };
  }
}
