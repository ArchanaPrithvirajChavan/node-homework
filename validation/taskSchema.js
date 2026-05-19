const Joi = require("joi");

// ----------- CREATE SCHEMA ----------------
const taskSchema = Joi.object({
  title: Joi.string().trim().min(3).max(30).required(),

  isCompleted: Joi.boolean().default(false),

  priority: Joi.string()
    .valid("low", "medium", "high")
    .default("medium"),
});

// --------- PATCH SCHEMA ----------------
const patchTaskSchema = Joi.object({
  title: Joi.string().trim().min(3).max(30),

  isCompleted: Joi.boolean(),

  priority: Joi.string().valid('low','medium','high') 
})
module.exports = { taskSchema, patchTaskSchema };