"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart, UtensilsCrossed, Calendar, Settings } from "lucide-react";

const NAV_ITEMS = [
  { href: "/shopping", label: "Shopping", Icon: ShoppingCart },
  { href: "/meals", label: "Meals", Icon: UtensilsCrossed },
  { href: "/calendar", label: "Calendar", Icon: Calendar },
  { href: "/settings", label: "Settings", Icon: Settings },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-white border-t border-gray-100 z-40 safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const isActive = pathname === href || (href !== "/shopping" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-1 flex-col items-center gap-1 py-2 rounded-xl transition-colors"
              style={{ color: isActive ? "#FF6B6B" : "#9ca3af" }}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.75} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
