"use client";

import { useState, ReactNode } from "react";
import Sidebar from "@/components/docs/Sidebar";
import Navbar from "@/components/docs/Navbar";

export default function DocsLayoutClient({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:ml-[260px]">
        <Navbar onMenuToggle={() => setSidebarOpen((open) => !open)} />
        <main className="mx-auto max-w-3xl px-6 py-10 lg:px-12">{children}</main>
      </div>
    </div>
  );
}
