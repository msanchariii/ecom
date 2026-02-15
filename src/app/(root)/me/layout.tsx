"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Package, MapPin } from "lucide-react";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/me/orders",
      label: "Orders",
      icon: Package,
    },
    {
      href: "/me/addresses",
      label: "Addresses",
      icon: MapPin,
    },
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center gap-3">
        <User className="h-8 w-8 text-dark-900" />
        <h1 className="text-heading-3 text-dark-900">My Profile</h1>
      </div>

      <div className="mb-6 flex gap-4 border-b border-light-300">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-body font-medium transition-colors ${
                isActive
                  ? "border-dark-900 text-dark-900"
                  : "border-transparent text-dark-600 hover:text-dark-900"
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </div>

      {children}
    </main>
  );
}
