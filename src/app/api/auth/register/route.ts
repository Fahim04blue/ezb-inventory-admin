import { ZodError } from "zod";

import {
  AuthServiceError,
  createAuthSuccessResponse,
  registerUser,
} from "@/features/auth/services/auth-service";
import { errorResponse } from "@/lib/api-response";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await registerUser(body);

    return createAuthSuccessResponse(result, "Registration successful", 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(
        "Invalid registration payload.",
        400,
        error.flatten(),
      );
    }

    if (error instanceof AuthServiceError) {
      return errorResponse(error.message, error.status);
    }

    return errorResponse("Failed to register user.", 500);
  }
}
