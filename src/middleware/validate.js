import { Schema } from "mongoose";
export const validate = (schema) => {
  return (req, res, next) => {
  
    const input = { ...req.body, ...req.params, ...req.query };
    const { error } = schema.validate(input, { abortEarly: false });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return res.status(400).json({ message: "Validation error", errors });
    };
    
    next();
}
};