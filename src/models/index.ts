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
import WhatsAppCredential from './whats-app-credential.model';

// ================================
// 🔗 RELATIONSHIPS
// ================================

// 1️⃣ Client → Channels
Client.hasMany(Channel, {
  foreignKey: 'clientId',
  onDelete: 'CASCADE',
  as: 'channels',
});
Channel.belongsTo(Client, {
  foreignKey: 'clientId',
  as: 'client',
});

// 2️⃣ Client → Routes (SMS + WhatsApp)
Client.hasMany(SMSRoute, {
  foreignKey: 'clientId',
  onDelete: 'CASCADE',
  as: 'smsRoutes',
});
SMSRoute.belongsTo(Client, {
  foreignKey: 'clientId',
  as: 'client',
});

Client.hasMany(WhatsAppRoute, {
  foreignKey: 'clientId',
  onDelete: 'CASCADE',
  as: 'whatsappRoutes',
});
WhatsAppRoute.belongsTo(Client, {
  foreignKey: 'clientId',
  as: 'client',
});

// 3️⃣ Channel → Routes (one-to-one per route type)
Channel.belongsTo(SMSRoute, {
  foreignKey: 'smsRouteId',
  as: 'smsRoute',
  onDelete: 'SET NULL',
});
SMSRoute.hasOne(Channel, {
  foreignKey: 'smsRouteId',
  as: 'channelSms',
});

Channel.belongsTo(WhatsAppRoute, {
  foreignKey: 'whatsappRouteId',
  as: 'whatsappRoute',
  onDelete: 'SET NULL',
});
WhatsAppRoute.hasOne(Channel, {
  foreignKey: 'whatsappRouteId',
  as: 'channelWhatsapp',
});

// 4️⃣ Channel → Message
Channel.hasMany(Message, {
  foreignKey: 'channelId',
  as: 'messages',
  onDelete: 'CASCADE',
});
Message.belongsTo(Channel, {
  foreignKey: 'channelId',
  as: 'channel',
});

// 5️⃣ Client → Message (for client-level tracking)
Client.hasMany(Message, {
  foreignKey: 'clientId',
  as: 'messages',
  onDelete: 'CASCADE',
});
Message.belongsTo(Client, {
  foreignKey: 'clientId',
  as: 'client',
});

// 6️⃣ WhatsAppRoute → WhatsAppCredential
WhatsAppRoute.belongsTo(WhatsAppCredential, {
  foreignKey: 'credentialId',
  as: 'credential',
  onDelete: 'CASCADE',
});

WhatsAppCredential.hasMany(WhatsAppRoute, {
  foreignKey: 'credentialId',
  as: 'routes',
});

// 7️⃣ WhatsAppCredential → Client (multi-tenant setup)
Client.hasMany(WhatsAppCredential, {
  foreignKey: 'clientId',
  onDelete: 'CASCADE',
  as: 'whatsappCredentials',
});
WhatsAppCredential.belongsTo(Client, {
  foreignKey: 'clientId',
  as: 'client',
});

// 8️⃣ Subscriber ↔ Channel (Many-to-Many via Subscription)
Subscriber.belongsToMany(Channel, {
  through: Subscription,
  foreignKey: 'subscriberId',
  otherKey: 'channelId',
  as: 'channels',
});
Channel.belongsToMany(Subscriber, {
  through: Subscription,
  foreignKey: 'channelId',
  otherKey: 'subscriberId',
  as: 'subscribers',
});

// 9️⃣ Direct One-to-Many for Subscription
Subscriber.hasMany(Subscription, {
  foreignKey: 'subscriberId',
  as: 'subscriptions',
  onDelete: 'CASCADE',
});
Subscription.belongsTo(Subscriber, {
  foreignKey: 'subscriberId',
  as: 'subscriber',
});

Channel.hasMany(Subscription, {
  foreignKey: 'channelId',
  as: 'subscriptions',
  onDelete: 'CASCADE',
});
Subscription.belongsTo(Channel, {
  foreignKey: 'channelId',
  as: 'channel',
});

// 🔟 Message → Subscriber
// ✅ So you can include the subscriber when fetching queued messages
Subscriber.hasMany(Message, {
  foreignKey: 'subscriberId',
  as: 'messages',
  onDelete: 'SET NULL',
});
Message.belongsTo(Subscriber, {
  foreignKey: 'subscriberId',
  as: 'subscriber',
});

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
  OTP,
  EmailRoute,
  WhatsAppCredential,
};
