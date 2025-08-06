import { MiddlewareConfigFn } from "wasp/server";
import { ipAddressMiddleware } from "./ipAddressMiddleware";

export const middlewareConfig: MiddlewareConfigFn = (middlewareConfig) => {
  middlewareConfig.set("ipAddress", ipAddressMiddleware);
  return middlewareConfig;
};