import { SignJWT, jwtVerify } from "jose";
import { z } from "zod";

import {
  JWT_ALGORITHM,
  JWT_EXPIRES_IN,
  JWT_ISSUER,
  USER_ROLES,
} from "@/lib/constants";

const authTokenPayloadSchema = z.object({
  sub: z.string().min(1),
  email: z.email(),
  role: z.enum(USER_ROLES),
});

export type AuthTokenPayload = z.infer<typeof authTokenPayloadSchema>;

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be set and at least 32 characters long.");
  }

  return new TextEncoder().encode(secret);
}

export async function signAuthToken(payload: AuthTokenPayload) {
  return new SignJWT({
    email: payload.email,
    role: payload.role,
  })
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(getJwtSecret());
}

export async function verifyAuthToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret(), {
      issuer: JWT_ISSUER,
    });

    return authTokenPayloadSchema.parse({
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
    });
  } catch {
    return null;
  }
}

export function extractBearerToken(authorizationHeader: string | null) {
  if (!authorizationHeader?.startsWith("Bearer ")) {
    return null;
  }

  return authorizationHeader.slice("Bearer ".length).trim() || null;
}
