import Admin from './admin.model';
import Client from './client.model';
import Channel from './channel.model';
import Subscriber from './subscriber.model';
import Subscription from './subscription.model';
import Message from './message.model';
import SMSRoute from './smsroute.model';
import WhatsAppRoute from './whatsapproute.model';
import OTP from './otp.model';
import EmailRoute from './EmailRoute.model';

// ================================
// 🔗 RELATIONSHIPS
// ================================

// 1️⃣ Client → Channels
Client.hasMany(Channel, { foreignKey: 'clientId', onDelete: 'CASCADE' });
Channel.belongsTo(Client, { foreignKey: 'clientId' });

// 2️⃣ Client → Routes (SMS + WhatsApp)
Client.hasMany(SMSRoute, { foreignKey: 'clientId', onDelete: 'CASCADE' });
SMSRoute.belongsTo(Client, { foreignKey: 'clientId' });

Client.hasMany(WhatsAppRoute, { foreignKey: 'clientId', onDelete: 'CASCADE' });
WhatsAppRoute.belongsTo(Client, { foreignKey: 'clientId' });

// 3️⃣ Channel → Routes (one-to-one per route type)
// A channel can be tied to a specific route for that delivery method.
Channel.belongsTo(SMSRoute, { foreignKey: 'smsRouteId', as: 'smsRoute', onDelete: 'SET NULL' });
SMSRoute.hasOne(Channel, { foreignKey: 'smsRouteId', as: 'channelSms' });

Channel.belongsTo(WhatsAppRoute, { foreignKey: 'whatsappRouteId', as: 'whatsappRoute', onDelete: 'SET NULL' });
WhatsAppRoute.hasOne(Channel, { foreignKey: 'whatsappRouteId', as: 'channelWhatsapp' });

// 4️⃣ Channel ↔ Subscriber (Many-to-Many through Subscription)
Channel.belongsToMany(Subscriber, { through: Subscription, foreignKey: 'channelId' });
Subscriber.belongsToMany(Channel, { through: Subscription, foreignKey: 'subscriberId' });

// 5️⃣ Channel → Message
Channel.hasMany(Message, { foreignKey: 'channelId', onDelete: 'CASCADE' });
Message.belongsTo(Channel, { foreignKey: 'channelId' });

// 6️⃣ Client → Message (for global client-level filtering)
Client.hasMany(Message, { foreignKey: 'clientId', onDelete: 'CASCADE' });
Message.belongsTo(Client, { foreignKey: 'clientId' });

// 7️⃣ Subscriber → Subscription
Subscriber.hasMany(Subscription, { foreignKey: 'subscriberId', onDelete: 'CASCADE' });
Subscription.belongsTo(Subscriber, { foreignKey: 'subscriberId' });

// 8️⃣ Channel → Subscription
Channel.hasMany(Subscription, { foreignKey: 'channelId', onDelete: 'CASCADE' });
Subscription.belongsTo(Channel, { foreignKey: 'channelId' });

// ================================
// ✅ EXPORT MODELS
// ================================
export {
  Admin,
  Client,
  Channel,
  Subscriber,
  Subscription,
  Message,
  SMSRoute,
  WhatsAppRoute,
  OTP,EmailRoute
};
