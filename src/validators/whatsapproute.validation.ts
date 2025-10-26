import Joi from 'joi';

export const whatsappRouteSchema = Joi.object({
  provider: Joi.string().required().example('Twilio'),
  name: Joi.string().max(100).required(),
  credentials: Joi.object({
    accountSid: Joi.string().required(),
    authToken: Joi.string().required(),
    phoneNumber: Joi.string().required(),
  }).optional(), // Optional for central/shared route
  requestUrlTemplate: Joi.string().uri().required(),
  requestMethod: Joi.string().valid('GET', 'POST').default('POST'),
  headersTemplate: Joi.string().optional(),
  bodyTemplate: Joi.string().optional(),
  contentType: Joi.string().valid('application/json', 'application/x-www-form-urlencoded').default('application/json'),
  paramMapping: Joi.object().optional(),
  successMatch: Joi.string().optional(),
  webhookPath: Joi.string().optional(),
  webhookSecretHash: Joi.string().optional(),
  senderName: Joi.string().optional(),
  isDefault: Joi.boolean().default(false),
});
