import Joi from 'joi';


export const createWhatsAppCredentialSchema = Joi.object({
  provider: Joi.string().required().label('Provider'),
  credentials: Joi.object().optional().label('Credentials'),
  encryptedConfig: Joi.string().optional().allow(null, ''),
  requestUrlTemplate: Joi.string().optional().allow(null, ''),
  headersTemplate: Joi.string().optional().allow(null, ''),
  bodyTemplate: Joi.string().optional().allow(null, ''),
  contentType: Joi.string()
    .valid('application/json', 'application/x-www-form-urlencoded')
    .default('application/json'),
  successMatch: Joi.string().optional().allow(null, ''),
  webhookSecretHash: Joi.string().optional().allow(null, ''),
  businessId: Joi.string().required().label('WhatsApp Business ID'),
});

export const createWhatsAppRouteSchema = Joi.object({
  name: Joi.string().required(),
  metaPhoneId: Joi.string().allow(null, ''),
  phoneNumber: Joi.string().pattern(/^\+?\d{10,15}$/).allow(null, ''),
  senderName: Joi.string().allow(null, ''),
  status: Joi.string().valid('active', 'inactive').default('active'),
  isDefault: Joi.boolean().default(false),
  forType: Joi.string().valid('content', 'bulkmessage').optional(),
  rateLimitPerSec: Joi.number().integer().min(1).default(1).optional(),
  dailyQuota: Joi.number().integer().min(0).allow(null).optional(),
  webhookPath: Joi.string().allow(null, ''),
  credentialId: Joi.number().integer().required(),
  clientId: Joi.number().integer().required()
});

export const updateRouteSchema = Joi.object({
  name: Joi.string().max(100).optional(),
  provider: Joi.string().valid('meta', 'twilio', '360dialog').optional(),
  encryptedConfig: Joi.string().optional(),
  requestUrlTemplate: Joi.string().uri().optional(),
  requestMethod: Joi.string().valid('GET', 'POST').optional(),
  headersTemplate: Joi.string().optional(),
  bodyTemplate: Joi.string().optional(),
  contentType: Joi.string().valid('application/json', 'application/x-www-form-urlencoded').optional(),
  status: Joi.string().valid('active', 'inactive', 'error').optional(),
  isDefault: Joi.boolean().optional(),
  rateLimitPerSec: Joi.number().integer().optional(),
  dailyQuota: Joi.number().integer().optional(),
});



export const updateWhatsAppCredentialSchema = Joi.object({
  provider: Joi.string().optional(),

  businessId: Joi.string().optional(),

  credentials: Joi.object({
    appId: Joi.string().optional(),
    appSecret: Joi.string().optional(),      
    accessToken: Joi.string().optional()
  }).optional(),

  encryptedConfig: Joi.any().optional(),

  requestUrlTemplate: Joi.string().optional(),
  headersTemplate: Joi.string().optional(),
  bodyTemplate: Joi.string().optional(),

  contentType: Joi.string().optional(),
  successMatch: Joi.string().optional(),
  webhookSecretHash: Joi.string().optional(),
});

