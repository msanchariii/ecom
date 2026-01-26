"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useCartStore } from "@/store/cart";
import { ShoppingCart } from "lucide-react";

const NAV_LINKS = [
  { label: "Men", href: "/products?gender=men" },
  { label: "Women", href: "/products?gender=women" },
  { label: "Kids", href: "/products?gender=unisex" },
  { label: "Collections", href: "/collections" },
  { label: "Contact", href: "/contact" },
] as const;

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { getItemCount } = useCartStore();
  const cartCount = getItemCount();

  return (
    <header className="sticky top-0 z-50 bg-light-100 shadow">
      <nav
        className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
        aria-label="Primary"
      >
        <Link href="/" aria-label="Nike Home" className="flex items-center">
          <Image
            src="/logo.svg"
            alt="Nike"
            width={28}
            height={28}
            priority
            className="invert"
          />
        </Link>

        <ul className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="text-body text-dark-900 transition-colors hover:text-dark-700"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-6 md:flex">
          <Link
            href="/orders"
            className="text-body text-dark-900 transition-colors hover:text-dark-700"
          >
            My Orders
          </Link>
          <Link
            href="/cart"
            className="flex gap-2 items-center text-body text-dark-900 transition-colors hover:text-dark-700"
          >
            <ShoppingCart /> Cart ({cartCount})
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md p-2 md:hidden"
          aria-controls="mobile-menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">Toggle navigation</span>
          <span className="mb-1 block h-0.5 w-6 bg-dark-900"></span>
          <span className="mb-1 block h-0.5 w-6 bg-dark-900"></span>
          <span className="block h-0.5 w-6 bg-dark-900"></span>
        </button>
      </nav>

      <div
        id="mobile-menu"
        className={`border-t border-light-300 md:hidden ${open ? "block" : "hidden"}`}
      >
        <ul className="space-y-2 px-4 py-3">
          {NAV_LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="block py-2 text-body text-dark-900 hover:text-dark-700"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            </li>
          ))}
          <li className="flex flex-col gap-2 pt-2">
            <Link
              href="/orders"
              className="text-body text-dark-900 hover:text-dark-700"
              onClick={() => setOpen(false)}
            >
              My Orders
            </Link>
            <Link
              href="/cart"
              className="text-body"
              onClick={() => setOpen(false)}
            >
              My Cart ({cartCount})
            </Link>
          </li>
        </ul>
      </div>
    </header>
  );
}
