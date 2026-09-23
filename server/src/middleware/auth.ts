import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    loginId: string;
  };
}

export function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Authentication required.",
    });
  }

  const token = authHeader.substring(7);

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    console.error("JWT_SECRET is not configured.");

    return res.status(500).json({
      message: "Server authentication configuration error.",
    });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);

    if (
      typeof decoded !== "object" ||
      decoded === null ||
      typeof decoded.userId !== "string" ||
      typeof decoded.loginId !== "string"
    ) {
      return res.status(401).json({
        message: "Invalid authentication token.",
      });
    }

    req.user = {
      userId: decoded.userId,
      loginId: decoded.loginId,
    };

    next();
  } catch {
    return res.status(401).json({
      message: "Invalid or expired authentication token.",
    });
  }
}