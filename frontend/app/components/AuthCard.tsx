"use client";

import { ReactNode, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface AuthCardProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <div
      className="flex flex-col min-h-screen"
      style={{ backgroundColor: "#F2F2F2" }}
    >
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div
            className="bg-white rounded-2xl shadow-xl p-8"
            style={{ backgroundColor: "#FFFFFF" }}
          >
            <div className="text-center mb-8">
              <h1
                className="text-3xl font-bold mb-2"
                style={{ color: "#000000" }}
              >
                {title}
              </h1>
              <p
                className="text-base"
                style={{ color: "#000000", opacity: 0.7 }}
              >
                {subtitle}
              </p>
            </div>
            {children}
          </div>

          <p className="text-center text-sm mt-6" style={{ color: "#B6B09F" }}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}

export function GoogleButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-center gap-3 px-6 py-3 rounded-xl border-2 font-medium transition-all duration-300 hover:scale-[1.02] hover:shadow-md mb-6 cursor-pointer"
      style={{
        backgroundColor: "#FFFFFF",
        borderColor: "#EAE4D5",
        color: "#000000",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "#F8F8F8";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "#FFFFFF";
      }}
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
      Continue with Google
    </button>
  );
}

interface InputFieldProps {
  type: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

export function InputField({
  type,
  placeholder,
  value,
  onChange,
  required = false,
}: InputFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordField = type === "password";
  const inputType = isPasswordField && showPassword ? "text" : type;

  return (
    <div className="relative">
      <input
        type={inputType}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full px-4 py-3 rounded-xl border-2 font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-opacity-50 mb-4"
        style={{
          backgroundColor: "#F8F8F8",
          borderColor: "#EAE4D5",
          color: "#000000",
          paddingRight: isPasswordField ? "3rem" : "1rem",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "#B6B09F";
          e.currentTarget.style.backgroundColor = "#FFFFFF";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "#EAE4D5";
          e.currentTarget.style.backgroundColor = "#F8F8F8";
        }}
      />
      {isPasswordField && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-3 p-1 hover:bg-gray-100 rounded-full transition-colors duration-200"
          style={{ color: "#B6B09F" }}
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      )}
    </div>
  );
}

interface SubmitButtonProps {
  text: string;
  onClick: () => void;
  disabled?: boolean;
}

export function SubmitButton({
  text,
  onClick,
  disabled = false,
}: SubmitButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 ${
        disabled
          ? "opacity-50 cursor-not-allowed"
          : "hover:scale-[1.02] hover:shadow-lg cursor-pointer"
      }`}
      style={{
        backgroundColor: disabled ? "#B6B09F" : "#000000",
        color: "#F2F2F2",
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = "#B6B09F";
          e.currentTarget.style.color = "#000000";
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = "#000000";
          e.currentTarget.style.color = "#F2F2F2";
        }
      }}
    >
      {text}
    </button>
  );
}
