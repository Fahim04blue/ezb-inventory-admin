export const APP_NAME =
  process.env.NEXT_PUBLIC_APP_NAME ?? "Essentials by Zatab Inventory Admin";

export const AUTH_COOKIE_NAME = "inventory_admin_token";
export const JWT_ALGORITHM = "HS256";
export const JWT_ISSUER = "essentials-by-zatab-inventory-admin";
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "7d";
export const PASSWORD_SALT_ROUNDS = 12;
export const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export const USER_ROLES = ["OWNER", "ADMIN"] as const;
