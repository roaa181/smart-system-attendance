import Joi from "joi";

export let userValidation ={
   signUp: Joi.object({
    name: Joi.string().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid("employee", "security").optional()
   }),
};

// export let loginValidation = Joi.object({
//     email: Joi.string().email().required(),
//     password: Joi.string().min(6).required()
// });