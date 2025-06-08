"use client";

import { useRouter } from "next/navigation";

export function Header() {
  const router = useRouter();

  return (
    <header className="absolute top-0 left-0 p-6 z-10">
      <h1
        className="relative inline-block font-bold text-2xl group cursor-pointer"
        style={{ color: "#000000" }}
        onClick={() => router.push("/")}
      >
        paytm
        <span
          className="absolute bottom-0 left-0 w-0 h-0.5 group-hover:w-full transition-all duration-300"
          style={{ backgroundColor: "#B6B09F" }}
        ></span>
      </h1>
    </header>
  );
}
