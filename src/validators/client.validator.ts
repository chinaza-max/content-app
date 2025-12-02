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
  direction: Joi.string()
    .valid("inbound", "outbound")
    .default("outbound"),

  type: Joi.string()
    .valid("content", "broadcast")
    .default("content"),

  content: Joi.string().allow("").optional(),

  contentType: Joi.string()
    .valid(
      "text",
      "image",
      "video",
      "audio",
      "document",
      "location",
      "template",
      "interactive",
      "both"
    )
    .required(),

  channelId: Joi.number().optional(),
  clientId: Joi.number().optional(),
  subscriberId: Joi.number().optional(),
  parentMessageId: Joi.number().allow(null).optional(),

  recipients: Joi.array().items(Joi.string()).optional(),
  metadata: Joi.object().optional(),
  responses: Joi.array().items(Joi.object()).optional(),

  scheduledAt: Joi.date().optional().allow(null),

  // ======================================================
  // TEMPLATE MESSAGE FIELDS
  // ======================================================
  templateName: Joi.string().when("contentType", {
    is: "template",
    then: Joi.string().required(),
    otherwise: Joi.string().optional(),
  }),

  templateLanguage: Joi.string().default("en_US").optional(),

  templateComponents: Joi.array().items(Joi.object()).when("contentType", {
    is: "template",
    then: Joi.array().min(1).required(),
    otherwise: Joi.array().optional(),
  }),

  // ======================================================
  // MEDIA MESSAGE FIELDS
  // ======================================================
  mediaUrl: Joi.string().uri().when("contentType", {
    is: Joi.valid("image", "video", "audio", "document", "both"),
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),

  mediaId: Joi.string().optional(),

  caption: Joi.string().optional(),
  filename: Joi.string().optional(),

  // ======================================================
  // LOCATION MESSAGE FIELDS
  // ======================================================
  latitude: Joi.number().when("contentType", {
    is: "location",
    then: Joi.number().required(),
    otherwise: Joi.number().optional(),
  }),

  longitude: Joi.number().when("contentType", {
    is: "location",
    then: Joi.number().required(),
    otherwise: Joi.number().optional(),
  }),

  locationName: Joi.string().optional(),
  locationAddress: Joi.string().optional(),

})
  // ======================================================
  // CONDITION: content must be present unless template/interactive/location
  // ======================================================
  .custom((value, helpers) => {
    const type = value.contentType;

    if (
      ["text", "image", "video", "audio", "document", "both"].includes(type)
    ) {
      if (!value.content || value.content.trim() === "") {
        return helpers.error("any.invalid", {
          message: "content is required for this contentType",
        });
      }
    }

    if (type === "interactive") {
      try {
        JSON.parse(value.content);
      } catch {
        return helpers.error("any.invalid", {
          message: "Interactive content must be valid JSON string",
        });
      }
    }

    return value;
  });

