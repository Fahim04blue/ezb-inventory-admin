import "server-only";

import bcrypt from "bcrypt";

import { PASSWORD_SALT_ROUNDS } from "@/lib/constants";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
}

export async function comparePassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}
