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

export default function SignupPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async () => {
    // Validation
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords don't match!");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await apiService.signup({
        user: email,
        passwd: password,
        name: `${firstName} ${lastName}`.trim(),
      });

      console.log("Signup successful:", response.message);

      // Redirect to dashboard on successful signup
      router.push("/dashboard");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Signup failed. Please try again.";
      console.error("Signup failed:", errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    window.location.href = apiService.getGoogleAuthUrl();
  };

  return (
    <AuthWrapper requireAuth={false}>
      <AuthCard
        title="Create Account"
        subtitle="Join thousands of users who trust us with their money"
      >
        <div className="space-y-4">
          <GoogleButton onClick={handleGoogleSignup} />

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
                Or create account with email
              </span>
            </div>
          </div>

          <div className="space-y-4 mt-6">
            <div className="grid grid-cols-2 gap-4">
              <InputField
                type="text"
                placeholder="First name"
                value={firstName}
                onChange={setFirstName}
                required
              />
              <InputField
                type="text"
                placeholder="Last name"
                value={lastName}
                onChange={setLastName}
                required
              />
            </div>

            <InputField
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={setEmail}
              required
            />

            <InputField
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={setPassword}
              required
            />

            <InputField
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              required
            />

            <div className="flex items-start mb-6">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 mt-1"
                required
              />
              <span className="ml-2 text-sm" style={{ color: "#B6B09F" }}>
                I agree to the{" "}
                <Link
                  href="#"
                  className="underline"
                  style={{ color: "#000000" }}
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="#"
                  className="underline"
                  style={{ color: "#000000" }}
                >
                  Privacy Policy
                </Link>
              </span>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <SubmitButton
              text={loading ? "Creating Account..." : "Create Account"}
              onClick={handleSignup}
              disabled={loading}
            />
          </div>

          <div className="text-center mt-6">
            <p className="text-sm" style={{ color: "#B6B09F" }}>
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold hover:underline"
                style={{ color: "#000000" }}
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </AuthCard>
    </AuthWrapper>
  );
}
