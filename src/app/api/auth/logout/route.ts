import { clearAuthCookie } from "@/features/auth/services/auth-service";
import { successResponse } from "@/lib/api-response";

export async function POST() {
  const response = successResponse(null, "Logout successful");
  clearAuthCookie(response);
  return response;
}
