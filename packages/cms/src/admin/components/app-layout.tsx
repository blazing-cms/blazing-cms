import { Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { useToast } from "@/components/toast-provider";
import { useAuth } from "@/lib/auth";

export function AppLayout() {
  const { adminChecked, isAdmin, loading, user } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!loading && user && adminChecked && !isAdmin) {
      addToast({
        description: "Access denied — admin access required",
        title: "Access denied",
        variant: "destructive",
      });
      navigate({ to: "/login" });
    }
  }, [adminChecked, isAdmin, loading, navigate, user, addToast]);

  if (loading || (user && !adminChecked)) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground text-sm">
        Loading...
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
