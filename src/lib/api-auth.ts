import type { NextRequest } from "next/server";

import { getCurrentUserFromRequest } from "@/lib/auth/current-user";

export async function requireApiUser(request: NextRequest) {
  return getCurrentUserFromRequest(request);
}
