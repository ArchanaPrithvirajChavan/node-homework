const Joi = require("joi");

const taskSchema = Joi.object({
  title: Joi.string().min(3).max(30).required(),

  isCompleted: Joi.boolean().default(false),

  priority: Joi.string()
    .valid("low", "medium", "high")
    .default("medium"),
});

const patchTaskSchema = Joi.object({
  title: Joi.string().required(),
  isCompleted: Joi.boolean().not(null),


  priority: Joi.string().valid("low", "medium", "high"),
});

module.exports = { taskSchema, patchTaskSchema };