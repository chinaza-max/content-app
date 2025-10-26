import Joi from "joi";

export const createChannelSchema = Joi.object({
  name: Joi.string().trim().required().messages({
    "string.empty": "Channel name is required.",
  }),

  description: Joi.string().allow(null, "").optional(),

  routeType: Joi.string()
    .valid("sms", "whatsapp", "email")
    .required()
    .messages({
      "any.only": "Route type must be one of 'sms', 'whatsapp', or 'email'.",
    }),

  monetizationType: Joi.string()
    .valid("free", "paid")
    .default("free")
    .messages({
      "any.only": "Monetization type must be 'free' or 'paid'.",
    }),

  subscriptionFee: Joi.number()
    .min(0)
    .default(0)
    .messages({
      "number.min": "Subscription fee cannot be negative.",
    }),

  status: Joi.string()
    .valid("active", "inactive")
    .default("active"),


  metadata: Joi.object().optional(),

  // ✅ Only require one route ID based on selected routeType
  smsRouteId: Joi.number().when("routeType", {
    is: "sms",
    then: Joi.required().messages({
      "any.required": "smsRouteId is required for SMS channels.",
    }),
    otherwise: Joi.forbidden(),
  }),

  whatsappRouteId: Joi.number().when("routeType", {
    is: "whatsapp",
    then: Joi.required().messages({
      "any.required": "whatsappRouteId is required for WhatsApp channels.",
    }),
    otherwise: Joi.forbidden(),
  }),

  emailRouteId: Joi.number().when("routeType", {
    is: "email",
    then: Joi.required().messages({
      "any.required": "emailRouteId is required for Email channels.",
    }),
    otherwise: Joi.forbidden(),
  }),
});
