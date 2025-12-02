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



export const createInteractiveSchema = Joi.object({
  channelId: Joi.number().required(),
  interactiveType: Joi.string().valid('button', 'list', 'cta_url').required(),
  
  // Common fields
  header: Joi.object({
    type: Joi.string().valid('text', 'image', 'video', 'document').optional(),
    text: Joi.string().optional(),
    image: Joi.object({ link: Joi.string().uri() }).optional(),
    video: Joi.object({ link: Joi.string().uri() }).optional(),
    document: Joi.object({ link: Joi.string().uri() }).optional(),
  }).optional(),
  
  body: Joi.object({
    text: Joi.string().max(1024).required()
  }).required(),
  
  footer: Joi.object({
    text: Joi.string().max(60)
  }).optional(),
  
  // For button type
  buttons: Joi.when('interactiveType', {
    is: 'button',
    then: Joi.array().items(
      Joi.object({
        id: Joi.string().max(256).required(),
        title: Joi.string().max(20).required()
      })
    ).min(1).max(3).required(),
    otherwise: Joi.forbidden()
  }),
  
  // For list type
  buttonText: Joi.when('interactiveType', {
    is: 'list',
    then: Joi.string().max(20).required(),
    otherwise: Joi.forbidden()
  }),
  
  sections: Joi.when('interactiveType', {
    is: 'list',
    then: Joi.array().items(
      Joi.object({
        title: Joi.string().max(24).optional(),
        rows: Joi.array().items(
          Joi.object({
            id: Joi.string().max(200).required(),
            title: Joi.string().max(24).required(),
            description: Joi.string().max(72).optional()
          })
        ).min(1).max(10).required()
      })
    ).min(1).max(10).required(),
    otherwise: Joi.forbidden()
  }),
  
  // For CTA type
  ctaUrl: Joi.when('interactiveType', {
    is: 'cta_url',
    then: Joi.string().uri().required(),
    otherwise: Joi.forbidden()
  }),
  
  ctaDisplayText: Joi.when('interactiveType', {
    is: 'cta_url',
    then: Joi.string().max(20).required(),
    otherwise: Joi.forbidden()
  }),
});
