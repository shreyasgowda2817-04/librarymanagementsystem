import { ZodError } from "zod";
import AppError from "../utils/AppError.js";

export const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const errorMessages = error.errors.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ');
      return next(new AppError(`Validation failed: ${errorMessages}`, 400));
    }
    next(error);
  }
};
