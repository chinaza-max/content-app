import Joi from 'joi';

export const createSubscriptionSchema = Joi.object({
  subscriberId: Joi.number().integer().required(),
  channelId: Joi.number().integer().required(),
  planType: Joi.string().valid('weekly', 'monthly', 'yearly').required(),
  expiresAt: Joi.date().optional().allow(null),
});

export const updateSubscriptionSchema = Joi.object({
  status: Joi.string().valid('active', 'expired', 'pending').optional(),
  expiresAt: Joi.date().optional().allow(null),
});
