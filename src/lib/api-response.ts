import { NextResponse } from "next/server";

export type ApiSuccessResponse<T> = {
  status: "success";
  code: number;
  message: string;
  data: T;
};

export type ApiErrorResponse<T = null> = {
  status: "error";
  code: number;
  message: string;
  data: T | null;
};

export function successResponse<T>(
  data: T,
  message: string,
  code = 200,
) {
  return NextResponse.json<ApiSuccessResponse<T>>(
    {
      status: "success",
      code,
      message,
      data,
    },
    { status: code },
  );
}

export function errorResponse<T = null>(
  message: string,
  code = 400,
  data: T | null = null,
) {
  return NextResponse.json<ApiErrorResponse<T>>(
    {
      status: "error",
      code,
      message,
      data,
    },
    { status: code },
  );
}
