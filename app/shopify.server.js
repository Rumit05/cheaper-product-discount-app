import "@shopify/shopify-app-react-router/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
} from "@shopify/shopify-app-react-router/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server";

// Debugging: Log environment variable presence (do not log values for secrets)
console.log("--- DEBUG ENVIRONMENT VARIABLES ---");
console.log("SHOPIFY_APP_URL:", process.env.SHOPIFY_APP_URL ? "Set" : "Missing");
console.log("SHOPIFY_API_KEY:", process.env.SHOPIFY_API_KEY ? "Set" : "Missing");
console.log("SHOPIFY_API_SECRET:", process.env.SHOPIFY_API_SECRET ? "Set" : "Missing");
console.log("SCOPES:", process.env.SCOPES ? "Set" : "Missing");
console.log("DATABASE_URL:", process.env.DATABASE_URL ? "Set" : "Missing");
console.log("--- END DEBUG ---");

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.October25,
  scopes: process.env.SCOPES?.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  future: {
    expiringOfflineAccessTokens: true,
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

export default shopify;
export const apiVersion = ApiVersion.October25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
