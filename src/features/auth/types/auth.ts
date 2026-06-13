import type { UserRole } from "@prisma/client";

export type AuthUser = {
  id: number;
  email: string;
  name: string | null;
  role: UserRole;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type AuthResponse = {
  user: AuthUser;
  token: string;
};
