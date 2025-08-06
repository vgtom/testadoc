import { Request, Response, NextFunction } from "express";
import { MiddlewareConfig, MiddlewareConfigFn } from "wasp/server/middleware";


declare global {
  namespace Express {
    interface Request {
      clientIP?: string;
    }
  }
}

const getClientIP = (req: Request): string => {
  // Check for IP from reverse proxy headers first
  const forwarded = req.headers["x-forwarded-for"] as string | undefined;
  const realIP = req.headers["x-real-ip"] as string | undefined;
  const cfConnectingIP = req.headers["cf-connecting-ip"] as string | undefined;

  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(",")[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Fallback to connection remote address
  return (
    req.socket?.remoteAddress ||
    req.ip ||
    (req as any).connection?.remoteAddress ||
    "unknown"
  );
};

export const ipAddressMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Add IP address to request object
  req.clientIP = getClientIP(req);

  // Optionally add to response headers for debugging
  res.set("X-Client-IP", req.clientIP);

  console.log(`Request from IP: ${req.clientIP}`);

  next();
};