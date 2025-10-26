import Joi from 'joi';


export const createSMSRouteSchema = Joi.object({
  name: Joi.string().required(),
  provider: Joi.string().required(),
  requestUrlTemplate: Joi.string().uri().required(),
  requestMethod: Joi.string().valid('GET', 'POST').default('POST'),
  contentType: Joi.string().valid('application/json', 'application/x-www-form-urlencoded').required(),
  headersTemplate: Joi.string().optional().allow(null, ''),
  bodyTemplate: Joi.string().optional().allow(null, ''),
  successMatch: Joi.string().required().description('A JSON path or regex used to evaluate success'),
  senderId: Joi.string().optional(),
  credentials: Joi.object({
    username: Joi.string().optional(),
    apiKey: Joi.string().optional(),
    accountSid: Joi.string().optional(),
    authToken: Joi.string().optional(),
    senderId: Joi.string().optional(),
  }).optional(),
  forType:Joi.string().valid('content', 'bulksms'),
  isDefault: Joi.boolean().default(false),
});

export const sendTestSchema = Joi.object({
  to: Joi.string().required().description('Recipient phone number'),
  text: Joi.string().required().description('Message text to send'),
  from: Joi.string().optional(),
  channelId: Joi.number().optional(),
  type: Joi.string().valid('direct', 'bulk', 'campaign').default('direct'),
});
