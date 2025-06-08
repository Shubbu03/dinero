"use client";

import { ArrowRight, Wallet, Shield, Zap } from "lucide-react";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { useRouter } from "next/navigation";

export function Landing() {
  const router = useRouter();
  return (
    <div
      className="flex flex-col min-h-screen"
      style={{ backgroundColor: "#F2F2F2" }}
    >
      <Header />

      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-12">
            <h2
              className="text-5xl md:text-6xl font-bold mb-6 leading-tight"
              style={{ color: "#000000" }}
            >
              Send Money
              <br />
              <span className="cursor-pointer" style={{ color: "#B6B09F" }}>
                seamlessly.
              </span>
            </h2>

            <p
              className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto leading-relaxed"
              style={{ color: "#000000", opacity: 0.7 }}
            >
              Experience the future of digital payments. Fast, secure, and
              effortless money transfers at your fingertips.
            </p>

            <button
              className="inline-flex items-center gap-3 px-8 py-4 rounded-full text-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer"
              style={{
                backgroundColor: "#000000",
                color: "#F2F2F2",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#B6B09F";
                e.currentTarget.style.color = "#000000";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#000000";
                e.currentTarget.style.color = "#F2F2F2";
              }}
              onClick={() => router.push("/login")}
            >
              Get Started Today
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="flex flex-col items-center p-6">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: "#EAE4D5" }}
              >
                <Wallet className="w-8 h-8" style={{ color: "#000000" }} />
              </div>
              <h3
                className="text-lg font-semibold mb-2"
                style={{ color: "#000000" }}
              >
                Easy Transfers
              </h3>
              <p className="text-sm" style={{ color: "#B6B09F" }}>
                Send money with just a few taps
              </p>
            </div>

            <div className="flex flex-col items-center p-6">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: "#EAE4D5" }}
              >
                <Shield className="w-8 h-8" style={{ color: "#000000" }} />
              </div>
              <h3
                className="text-lg font-semibold mb-2"
                style={{ color: "#000000" }}
              >
                Bank-Level Security
              </h3>
              <p className="text-sm" style={{ color: "#B6B09F" }}>
                Your money is protected by advanced encryption
              </p>
            </div>

            <div className="flex flex-col items-center p-6">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: "#EAE4D5" }}
              >
                <Zap className="w-8 h-8" style={{ color: "#000000" }} />
              </div>
              <h3
                className="text-lg font-semibold mb-2"
                style={{ color: "#000000" }}
              >
                Instant Processing
              </h3>
              <p className="text-sm" style={{ color: "#B6B09F" }}>
                Lightning-fast transaction processing
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
