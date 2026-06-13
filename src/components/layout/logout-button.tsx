"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";

type LogoutButtonProps = {
  className?: string;
  variant?: "default" | "outline";
};

export function LogoutButton({
  className,
  variant = "outline",
}: LogoutButtonProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleLogout() {
    setIsPending(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      router.replace("/login");
      router.refresh();
      setIsPending(false);
    }
  }

  return (
    <Button
      className={className}
      disabled={isPending}
      onClick={handleLogout}
      type="button"
      variant={variant}
    >
      <LogOut className="mr-2 h-4 w-4" />
      {isPending ? "Logging out..." : "Logout"}
    </Button>
  );
}
