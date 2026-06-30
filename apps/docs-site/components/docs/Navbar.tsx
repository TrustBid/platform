"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { searchIndex } from "@/lib/navigation";

interface NavbarProps {
  onMenuToggle: () => void;
}

export default function Navbar({ onMenuToggle }: NavbarProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? searchIndex.filter(
        (entry) =>
          entry.title.toLowerCase().includes(query.toLowerCase()) ||
          entry.section?.toLowerCase().includes(query.toLowerCase())
      )
    : searchIndex;

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      setSearchOpen((open) => !open);
    }
    if (e.key === "Escape") {
      setSearchOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between bg-black px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuToggle}
            className="rounded p-2 text-gray-400 hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Open menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Link href="/docs/overview" className="text-base font-bold text-white">
            TrustBid
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="rounded-lg px-3 py-2 text-sm text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            Search <span className="ml-1 text-xs text-gray-500">⌘K</span>
          </button>
          <Link
            href="/docs/how-it-works"
            className="rounded-lg bg-[#2B5BFF] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Get Started
          </Link>
        </div>
      </header>

      {searchOpen && (
        <div className="fixed inset-0 z-[60] bg-black/50">
          <div className="absolute inset-0" onClick={() => setSearchOpen(false)} aria-hidden />
          <div className="relative mx-auto mt-32 w-full max-w-lg px-4">
            <div className="overflow-hidden rounded-2xl bg-white shadow-2xl">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search documentation..."
                className="w-full border-b border-gray-100 px-4 py-3 text-base text-gray-900 outline-none"
                autoFocus
              />
              <ul className="max-h-80 overflow-y-auto py-2">
                {filtered.length === 0 ? (
                  <li className="px-4 py-3 text-sm text-gray-500">No results</li>
                ) : (
                  filtered.slice(0, 12).map((entry) => (
                    <li key={entry.href + entry.title}>
                      <Link
                        href={entry.href}
                        onClick={() => setSearchOpen(false)}
                        className="block px-4 py-2.5 text-sm text-gray-900 hover:bg-gray-50"
                      >
                        {entry.title}
                        {entry.section && (
                          <span className="ml-2 text-xs text-gray-400">{entry.section}</span>
                        )}
                      </Link>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
