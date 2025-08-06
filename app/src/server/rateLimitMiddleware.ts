// src/server/serverSetup.ts



// interface RateLimitEntry {
//   count: number
//   timestamp: number
// }

// type RateLimitStore = Map<string, RateLimitEntry>;

// declare global {
//   var rateLimitStore: RateLimitStore | undefined;
// }

// const rateLimitMiddleware = (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): void => {
//   const ip = req.clientIP || req.ip || "unknown";

//   // Simple in-memory rate limiting (use Redis in production)
//   if (!global.rateLimitStore) {
//     global.rateLimitStore = new Map<string, RateLimitEntry>();
//   }

//   const store = global.rateLimitStore;
//   const now = Date.now();
//   const windowMs = 15 * 60 * 1000; // 15 minutes
//   const maxRequests = 100;

//   const key = `${ip}:${Math.floor(now / windowMs)}`;
//   const entry = store.get(key);

//   if (entry && entry.count >= maxRequests) {
//     res.status(429).json({
//       error: "Too many requests from this IP",
//       retryAfter: Math.ceil(windowMs / 1000),
//       ip: ip,
//     });
//     return;
//   }

//   // Update or create entry
//   if (entry) {
//     entry.count += 1;
//   } else {
//     store.set(key, { count: 1, timestamp: now });
//   }

//   // Clean up old entries periodically (1% chance)
//   if (Math.random() < 0.01) {
//     for (const [k, v] of store) {
//       const keyTime = parseInt(k.split(":")[1]) * windowMs;
//       if (now - keyTime > windowMs * 2) {
//         store.delete(k);
//       }
//     }
//   }

//   next();
// };


