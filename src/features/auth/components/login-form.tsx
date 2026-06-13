"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { loginSchema, type LoginInput } from "@/features/auth/schemas/auth-schemas";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoginApiSuccess = {
  status: "success";
  code: number;
  message: string;
  data: {
    user: {
      id: number;
      email: string;
      name: string | null;
      role: "OWNER" | "ADMIN";
      isActive: boolean;
      lastLoginAt: string | null;
      createdAt: string;
      updatedAt: string;
    };
    token: string;
  };
};

type LoginApiError = {
  status: "error";
  code: number;
  message: string;
  data: unknown;
};

export function LoginForm() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(values),
    });

    const payload = (await response.json()) as LoginApiSuccess | LoginApiError;

    if (!response.ok || payload.status !== "success") {
      setSubmitError(payload.message || "Login failed.");
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  });

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          Essentials by Zatab
        </p>
        <CardTitle>Login</CardTitle>
        <CardDescription>
          Sign in to access the internal inventory admin panel.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="owner@example.com"
              {...register("email")}
            />
            {errors.email ? (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              {...register("password")}
            />
            {errors.password ? (
              <p className="text-sm text-red-600">{errors.password.message}</p>
            ) : null}
          </div>

          {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
