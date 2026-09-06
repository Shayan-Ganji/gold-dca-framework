import { createFileRoute, Outlet } from "@tanstack/react-router";
import { getSession } from "@/lib/api";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: () => {
    let token = getSession();
    if (!token && typeof window !== "undefined") {
      localStorage.setItem("access_token", "demo_showcase_guest");
      token = "demo_showcase_guest";
    }
    return { token };
  },
  component: () => <Outlet />,
});
