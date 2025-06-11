"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AuthCard,
  GoogleButton,
  InputField,
  SubmitButton,
} from "../../components/AuthCard";
import apiService from "../../../lib/apiService";
import AuthWrapper from "../../../components/AuthWrapper";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await apiService.login({
        user: email,
        passwd: password,
      });

      console.log("Login successful:", response.message);

      // Redirect to dashboard on successful login
      router.push("/dashboard");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Login failed. Please try again.";
      console.error("Login failed:", errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = apiService.getGoogleAuthUrl();
  };

  return (
    <AuthWrapper requireAuth={false}>
      <AuthCard
        title="Welcome Back"
        subtitle="Sign in to your account to continue"
      >
        <div className="space-y-4">
          <GoogleButton onClick={handleGoogleLogin} />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div
                className="w-full border-t"
                style={{ borderColor: "#EAE4D5" }}
              ></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span
                className="px-2 bg-white"
                style={{ color: "#B6B09F", backgroundColor: "#FFFFFF" }}
              >
                Or continue with email
              </span>
            </div>
          </div>

          <div className="space-y-4 mt-6">
            <InputField
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={setEmail}
              required
            />

            <InputField
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={setPassword}
              required
            />

            <div className="flex items-center justify-between mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm" style={{ color: "#B6B09F" }}>
                  Remember me
                </span>
              </label>
              <Link
                href="#"
                className="text-sm hover:underline"
                style={{ color: "#B6B09F" }}
              >
                Forgot password?
              </Link>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <SubmitButton
              text={loading ? "Signing In..." : "Sign In"}
              onClick={handleLogin}
              disabled={loading}
            />
          </div>

          <div className="text-center mt-6">
            <p className="text-sm" style={{ color: "#B6B09F" }}>
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="font-semibold hover:underline"
                style={{ color: "#000000" }}
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </AuthCard>
    </AuthWrapper>
  );
}
