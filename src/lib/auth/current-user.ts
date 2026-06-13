import "server-only";

import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

import { AUTH_COOKIE_NAME } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { extractBearerToken, verifyAuthToken } from "@/lib/auth/jwt";

const currentUserSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return getCurrentUserFromToken(token);
}

export async function getCurrentUserFromRequest(request: NextRequest) {
  const cookieToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (cookieToken) {
    return getCurrentUserFromToken(cookieToken);
  }

  const bearerToken = extractBearerToken(request.headers.get("authorization"));

  if (!bearerToken) {
    return null;
  }

  return getCurrentUserFromToken(bearerToken);
}

export async function getCurrentUserFromToken(token: string) {
  const payload = await verifyAuthToken(token);

  if (!payload) {
    return null;
  }

  const userId = Number(payload.sub);

  if (!Number.isInteger(userId)) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: currentUserSelect,
  });

  if (!user?.isActive) {
    return null;
  }

  return user;
}
