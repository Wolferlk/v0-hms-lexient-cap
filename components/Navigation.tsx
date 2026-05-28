'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold text-primary">
              Hotel Management
            </div>
          </div>

          {/* Desktop Menu */}
          <div className="hidden gap-8 md:flex">
            <Link
              href="/"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Home
            </Link>
            <Link
              href="/booking"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Book Now
            </Link>
            <Link
              href="/admin"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Admin
            </Link>
            <Link
              href="/rooms"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Rooms
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="border-t border-border py-4 md:hidden">
            <div className="space-y-4">
              <Link
                href="/"
                className="block text-sm font-medium transition-colors hover:text-primary"
              >
                Home
              </Link>
              <Link
                href="/booking"
                className="block text-sm font-medium transition-colors hover:text-primary"
              >
                Book Now
              </Link>
              <Link
                href="/admin"
                className="block text-sm font-medium transition-colors hover:text-primary"
              >
                Admin
              </Link>
              <Link
                href="/rooms"
                className="block text-sm font-medium transition-colors hover:text-primary"
              >
                Rooms
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
