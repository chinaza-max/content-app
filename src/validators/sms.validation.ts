import Joi from 'joi';

/*
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
*/


const signatureValidationSchema = Joi.object({
  enabled: Joi.boolean().required(),
  headerName: Joi.string().when('enabled', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional().allow(''),
  }),
  algorithm: Joi.string()
    .valid('sha256', 'sha1', 'md5', 'bearer', 'basic', 'none')
    .required(),
  prefix: Joi.string().optional().allow(''),
  secretKey: Joi.string().when('algorithm', {
    is: Joi.valid('sha256', 'sha1', 'md5', 'bearer'),
    then: Joi.required(),
    otherwise: Joi.optional().allow(''),
  }),
  username: Joi.string().when('algorithm', {
    is: 'basic',
    then: Joi.required(),
    otherwise: Joi.optional().allow(''),
  }),
  password: Joi.string().when('algorithm', {
    is: 'basic',
    then: Joi.required(),
    otherwise: Joi.optional().allow(''),
  }),
});

// Incoming message parsing schema
const incomingMessageSchema = Joi.object({
  enabled: Joi.boolean().required(),
  fromPath: Joi.string().when('enabled', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional().allow(''),
  }),
  messagePath: Joi.string().when('enabled', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional().allow(''),
  }),
  timestampPath: Joi.string().optional().allow(''),
  messageIdPath: Joi.string().optional().allow(''),
});

// Delivery report parsing schema
const deliveryReportSchema = Joi.object({
  enabled: Joi.boolean().required(),
  messageIdPath: Joi.string().when('enabled', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional().allow(''),
  }),
  statusPath: Joi.string().when('enabled', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional().allow(''),
  }),
  statusMapping: Joi.object()
    .pattern(
      Joi.string(),
      Joi.string().valid('delivered', 'failed', 'pending')
    )
    .when('enabled', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
  errorPath: Joi.string().optional().allow(''),
  externalIdPath: Joi.string().optional().allow(''),
  timestampPath: Joi.string().optional().allow(''),
});


const webhookSchema = Joi.object({
  enabled: Joi.boolean().required(),
  customPath: Joi.string()
    .pattern(/^\/webhooks\/[a-zA-Z0-9\-_]+$/)
    .optional()
    .allow('')
    .description('Custom webhook path'),
  signatureValidation: signatureValidationSchema.optional(),
  incomingMessage: incomingMessageSchema.optional(),
  deliveryReport: deliveryReportSchema.optional(),
  responseTemplate: Joi.string().optional().allow(''),
  responseStatus: Joi.number().integer().min(200).max(599).default(200),
});

const credentialsSchema = Joi.object({
  username: Joi.string().optional(),
  apiKey: Joi.string().optional(),
  accountSid: Joi.string().optional(),
  authToken: Joi.string().optional(),
  accessToken: Joi.string().optional(),
  clientId: Joi.string().optional(),
  clientSecret: Joi.string().optional(),
  password: Joi.string().optional(),
}).unknown(true); // Allow any additional provider-specific fields



export const createSMSRouteSchema = Joi.object({
  // Basic info
  provider: Joi.string()
    .required()
    .min(2)
    .max(50)
    .description('Provider name'),
  
  name: Joi.string()
    .required()
    .min(3)
    .max(100)
    .description('Route name'),
  
  senderId: Joi.string()
    .optional()
    .allow('', null)
    .max(50)
    .description('Sender ID'),
  
  forType: Joi.string()
    .valid('content', 'bulksms')
    .default('content')
    .description('Route type'),
  
  isDefault: Joi.boolean()
    .default(false)
    .description('Set as default route'),
  
  // Sending configuration
  credentials: credentialsSchema.required(),
  
  requestUrlTemplate: Joi.string()
    .required()
    .description('API endpoint template'),
  
  requestMethod: Joi.string()
    .valid('GET', 'POST', 'PUT', 'DELETE')
    .default('POST')
    .description('HTTP method'),
  
  headersTemplate: Joi.string()
    .optional()
    .allow('', null)
    .description('Headers JSON template'),
  
  bodyTemplate: Joi.string()
    .optional()
    .allow('', null)
    .description('Body template'),
  
  contentType: Joi.string()
    .valid(
      'application/json',
      'application/x-www-form-urlencoded',
      'text/xml',
      'text/plain'
    )
    .optional()
    .allow('', null)
    .description('Content-Type'),
  
  successMatch: Joi.string()
    .optional()
    .allow('', null)
    .description('Success indicator string'),
  
  // Webhook configuration
  webhook: webhookSchema.optional(),
});







export const sendTestSchema = Joi.object({
  to: Joi.string().required().description('Recipient phone number'),
  text: Joi.string().required().description('Message text to send'),
  from: Joi.string().optional(),
  channelId: Joi.number().optional(),
  type: Joi.string().valid('direct', 'bulk', 'campaign').default('direct'),
});

export const getWebhookInfoSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    'any.required': 'Route ID is required',
    'number.base': 'Route ID must be a number',
    'number.positive': 'Route ID must be a positive number',
  }),
  includeCredentials: Joi.boolean().default(true),
});

export const getRouteSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    'any.required': 'Route ID is required',
    'number.base': 'Route ID must be a number',
    'number.positive': 'Route ID must be a positive number',
  }),

  includeCredentials: Joi.boolean().default(false).messages({
    'boolean.base': 'includeCredentials must be true or false',
  }),
});