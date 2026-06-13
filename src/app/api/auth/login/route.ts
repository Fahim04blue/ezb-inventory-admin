import { ZodError } from "zod";

import {
  AuthServiceError,
  createAuthSuccessResponse,
  loginUser,
} from "@/features/auth/services/auth-service";
import { errorResponse } from "@/lib/api-response";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await loginUser(body);

    return createAuthSuccessResponse(result, "Login successful");
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse("Invalid login payload.", 400, error.flatten());
    }

    if (error instanceof AuthServiceError) {
      return errorResponse(error.message, error.status);
    }

    return errorResponse("Failed to log in.", 500);
  }
}
