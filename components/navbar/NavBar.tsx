"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import ProfileOrLoginButton from '@/components/ProfileOrLoginButton';

export function NavBar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="flex items-center justify-between w-full">
      <div className="flex items-center space-x-2">
        <Link href="/" className="text-2xl font-semibold p-2">
          🎮 Game Matcher
        </Link>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center space-x-4 flex-1">
        <Link 
          href="/games" 
          className={`px-3 py-2 rounded-md ${pathname === "/games" ? "bg-zinc-800" : "hover:bg-zinc-800"}`}
        >
          Игры
        </Link>
        <div className="ml-auto">
          <ProfileOrLoginButton />
        </div>
      </div>
      
      
      {/* Mobile menu button */}
      <button 
        className="md:hidden p-2 rounded-md hover:bg-zinc-800" 
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-16 right-4 bg-zinc-900 rounded-md shadow-lg p-2 z-10 min-w-[160px]">
          <div className="flex flex-col space-y-2">
            <Link 
              href="/games" 
              className={`px-3 py-2 rounded-md ${pathname === "/games" ? "bg-zinc-800" : "hover:bg-zinc-800"}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Игры
            </Link>
            <div className="pt-2 border-t border-zinc-800 mt-2">
              <ProfileOrLoginButton />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
} 