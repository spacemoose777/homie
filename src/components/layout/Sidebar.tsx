"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart, UtensilsCrossed, Calendar, LayoutList, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import HomieLogo from "@/components/HomieLogo";

const NAV_ITEMS = [
  { href: "/shopping", label: "Shopping", Icon: ShoppingCart },
  { href: "/meals", label: "Meals", Icon: UtensilsCrossed },
  { href: "/calendar", label: "Calendar", Icon: Calendar },
  { href: "/lists", label: "Other Lists", Icon: LayoutList },
  { href: "/settings", label: "Settings", Icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, memberProfile, signOut } = useAuth();

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen bg-white border-r border-gray-100 fixed left-0 top-0 z-40">
      {/* Header */}
      <div className="px-5 py-5 border-b border-gray-100">
        <HomieLogo size={36} showWordmark />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const isActive = pathname === href || (href !== "/shopping" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
              style={{
                color: isActive ? "#FF6B6B" : "#6b7280",
                backgroundColor: isActive ? "#FFF0F0" : "transparent",
              }}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.75} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="px-4 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
            style={{ backgroundColor: memberProfile?.colour ?? "#FF6B6B" }}
          >
            {(memberProfile?.name ?? user?.email ?? "?")[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {memberProfile?.name ?? user?.displayName ?? "You"}
            </p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
          <button
            onClick={signOut}
            className="text-gray-400 hover:text-red-400 transition-colors p-1"
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
