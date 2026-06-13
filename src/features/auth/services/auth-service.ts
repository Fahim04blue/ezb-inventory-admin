import "server-only";

import { Prisma, UserRole } from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";

import { comparePassword, hashPassword } from "@/lib/auth/password";
import { signAuthToken } from "@/lib/auth/jwt";
import { getCurrentUserFromRequest } from "@/lib/auth/current-user";
import {
  AUTH_COOKIE_MAX_AGE_SECONDS,
  AUTH_COOKIE_NAME,
} from "@/lib/constants";
import { successResponse } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import {
  loginSchema,
  registerSchema,
  type LoginInput,
  type RegisterInput,
} from "@/features/auth/schemas/auth-schemas";
import type { AuthResponse, AuthUser } from "@/features/auth/types/auth";

const authUserSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

export class AuthServiceError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

function canRegister() {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.ALLOW_REGISTRATION === "true"
  );
}

function setAuthCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
  });
}

export function clearAuthCookie(response: NextResponse) {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

async function buildAuthResponse(user: AuthUser): Promise<AuthResponse> {
  const token = await signAuthToken({
    sub: String(user.id),
    email: user.email,
    role: user.role,
  });

  return {
    user,
    token,
  };
}

export async function registerUser(input: RegisterInput): Promise<AuthResponse> {
  if (!canRegister()) {
    throw new AuthServiceError("Registration is disabled.", 403);
  }

  const data = registerSchema.parse(input);
  const passwordHash = await hashPassword(data.password);

  try {
    const existingUserCount = await prisma.user.count();
    const role = existingUserCount === 0 ? UserRole.OWNER : UserRole.ADMIN;

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role,
      },
      select: authUserSelect,
    });

    return buildAuthResponse(user);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new AuthServiceError("A user with this email already exists.", 409);
    }

    throw error;
  }
}

export async function loginUser(input: LoginInput): Promise<AuthResponse> {
  const data = loginSchema.parse(input);

  const user = await prisma.user.findUnique({
    where: { email: data.email },
    select: {
      ...authUserSelect,
      passwordHash: true,
    },
  });

  if (!user) {
    throw new AuthServiceError("Invalid email or password.", 401);
  }

  const isPasswordValid = await comparePassword(data.password, user.passwordHash);

  if (!isPasswordValid) {
    throw new AuthServiceError("Invalid email or password.", 401);
  }

  if (!user.isActive) {
    throw new AuthServiceError("This user account is inactive.", 403);
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      lastLoginAt: new Date(),
    },
    select: authUserSelect,
  });

  return buildAuthResponse(updatedUser);
}

export async function getAuthenticatedUser(request: NextRequest) {
  return getCurrentUserFromRequest(request);
}

export function createAuthSuccessResponse(
  payload: AuthResponse,
  message: string,
  status = 200,
) {
  const response = successResponse(payload, message, status);
  setAuthCookie(response, payload.token);
  return response;
}
