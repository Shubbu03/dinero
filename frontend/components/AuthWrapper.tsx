"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import apiService from "../lib/apiService";
import Loading from "./Loading";

interface AuthWrapperProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

export default function AuthWrapper({
  children,
  requireAuth = true,
  redirectTo = "/login",
}: AuthWrapperProps) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const hasToken = apiService.isAuthenticated();

        if (hasToken) {
          await apiService.getCurrentUser();
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.log("Error occured:", error);
        setIsAuthenticated(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    if (!isChecking) {
      if (requireAuth && !isAuthenticated) {
        router.push(redirectTo);
      } else if (!requireAuth && isAuthenticated) {
        router.push("/dashboard");
      }
    }
  }, [isChecking, isAuthenticated, requireAuth, redirectTo, router]);

  if (isChecking) {
    return <Loading />;
  }

  if (requireAuth && !isAuthenticated) {
    return null;
  }

  if (!requireAuth && isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
