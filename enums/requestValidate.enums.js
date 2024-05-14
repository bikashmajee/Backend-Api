const Joi = require("joi");

const requestSchema = Joi.object({
  name: Joi.string(),
  email: Joi.string().email(),
  password: Joi.string().min(6),
  phone: Joi.number().min(10),
  bio: Joi.string()
});

module.exports = { requestSchema };
