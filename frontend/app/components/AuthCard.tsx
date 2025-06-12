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
