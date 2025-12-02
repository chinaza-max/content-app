import Joi from 'joi';

export const createSubscriberSchema = Joi.object({
  name: Joi.string().optional().allow(null, ''),
  phone: Joi.string().pattern(/^\+?\d{10,15}$/).required().messages({
    'string.pattern.base': 'Phone number must be in valid international format, e.g. +2348012345678',
  }),
  subscriptionType: Joi.string().valid('sms', 'whatsapp', 'email').required(),
  status: Joi.string().valid('active', 'pending', 'inactive').default('pending'),
  metadata: Joi.object().optional(),
});

export const updateSubscriberSchema = Joi.object({
  name: Joi.string().optional(),
  phone: Joi.string().pattern(/^\+?\d{10,15}$/).optional(),
  subscriptionType: Joi.string().valid('SMS', 'WHATSAPP', 'EMAIL').optional(),
  status: Joi.string().valid('active', 'pending', 'inactive').optional(),
  metadata: Joi.object().optional(),
});
