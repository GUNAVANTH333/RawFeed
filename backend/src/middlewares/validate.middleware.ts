import type { Response, NextFunction } from "express";
import type { ZodType } from "zod";
import { z } from "zod";
import type { AuthenticatedRequest } from "../types/express.js";

export class ValidateMiddleware {
  static body(schema: ZodType) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      const result = schema.safeParse(req.body);

      if (!result.success) {
        const formatted = z.prettifyError(result.error);

        res.status(400).json({ error: "Validation failed", details: formatted });
        return;
      }

      req.body = result.data;
      next();
    };
  }
}
