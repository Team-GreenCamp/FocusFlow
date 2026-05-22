"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MobileNav() {
  const pathname = usePathname();

  const menuItems = [
    { name: "구체화", path: "/breakdown", icon: "account_tree" },
    { name: "타이머", path: "/deep-work", icon: "checklist" },
    { name: "피드백", path: "/insights", icon: "rate_review" },
    { name: "회고", path: "/vault", icon: "inventory_2" },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full bg-surface border-t border-outline-variant flex justify-around items-center h-16 z-50">
      {menuItems.map((item) => {
        const isActive = pathname === item.path;
        return (
          <Link
            key={item.name}
            href={item.path}
            className={`flex flex-col items-center gap-1 transition-colors ${
              isActive ? "text-primary font-bold" : "text-on-surface-variant"
            }`}
          >
            <span
              className="material-symbols-outlined"
              aria-hidden="true"
              style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {item.icon}
            </span>
            <span className="text-[10px] font-bold">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
