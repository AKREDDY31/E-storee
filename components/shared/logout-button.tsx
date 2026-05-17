"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";

export function LogoutButton({
  label = "Logout",
  redirectTo = "/"
}: {
  label?: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const { setSession } = useAuth();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } finally {
      setSession(null);
      setLoading(false);
      router.push(redirectTo);
      router.refresh();
    }
  }

  return (
    <button
      className="button secondary"
      type="button"
      onClick={handleLogout}
      disabled={loading}
      suppressHydrationWarning
    >
      {loading ? "Logging out..." : label}
    </button>
  );
}
