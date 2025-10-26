import Joi from 'joi';

export const clientSignupSchema = Joi.object({
  purpose: Joi.string().valid('Content Creation', 'Bulk SMS Delivery', 'Both').required(),
  accountType: Joi.string().valid('Individual', 'Organization').required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required(),
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
});


export const clientLoginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const verifyOtpSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).required().messages({
    'string.length': 'OTP must be 6 digits',
    'any.required': 'OTP is required',
  }),
});




export const createMessageSchema = Joi.object({
  channelId: Joi.number().required(),
  direction: Joi.string().valid("inbound", "outbound").default("outbound"),
  type: Joi.string().valid("content", "broadcast", "direct").default("content"),
  content: Joi.string().min(1).required(),
  contentType: Joi.string()
    .valid("text", "image", "video", "audio", "document", "location", "both")
    .required(),
  deliveryMethod: Joi.string().valid("sms", "whatsapp", "both").required(),
  recipients: Joi.array().items(Joi.string()).min(1).optional(),
  metadata: Joi.object().optional(),
});
