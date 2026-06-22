import { toast } from "sonner";
import { ApiErrorResponse, ApiSuccessResponse } from "./api-response";

interface ApiOptions extends RequestInit {
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

export class ApiError extends Error {
  public code: number;
  public data: any;

  constructor(message: string, code: number, data: any = null) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.data = data;
  }
}

let isRedirecting = false;

export async function apiClient<T>(
  url: string,
  options: ApiOptions = {}
): Promise<T> {
  const { showSuccessToast = false, showErrorToast = true, ...fetchOptions } = options;

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        "Content-Type": "application/json",
        ...fetchOptions.headers,
      },
    });

    if (response.status === 401) {
      if (!isRedirecting) {
        isRedirecting = true;
        // Parse message if possible, else default
        let message = "Session expired. Please login again.";
        try {
          const errData = await response.json();
          if (errData?.message) message = errData.message;
        } catch {
          // ignore parsing error for 401
        }
        
        if (showErrorToast) {
          toast.error(message);
        }
        
        // Simple client side redirect
        if (typeof window !== "undefined") {
          fetch("/api/auth/logout", { method: "POST" }).catch(() => {}).finally(() => {
            window.location.href = "/login";
          });
        }
      }
      throw new ApiError("Session expired", 401);
    }

    let result: any;
    try {
      result = await response.json();
    } catch (err) {
      if (!response.ok) {
        throw new ApiError(response.statusText || "Network error", response.status);
      }
      // If it's ok but not JSON, we just return empty or what we can
      result = { status: "success", code: response.status, message: "Success", data: null };
    }

    if (!response.ok || result.status === "error") {
      const apiErrorResult = result as ApiErrorResponse<any>;
      const errorMessage = apiErrorResult.message || "An unexpected error occurred.";
      if (showErrorToast && !isRedirecting) {
        toast.error(errorMessage);
      }
      throw new ApiError(errorMessage, apiErrorResult.code || response.status, apiErrorResult.data);
    }

    const apiSuccessResult = result as ApiSuccessResponse<T>;
    
    if (showSuccessToast && apiSuccessResult.message) {
      toast.success(apiSuccessResult.message);
    }

    return apiSuccessResult.data;

  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    if (showErrorToast && !isRedirecting) {
      toast.error("Network error. Please try again.");
    }
    throw new ApiError("Network error. Please try again.", 500);
  }
}
