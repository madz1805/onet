"use client";

// Tab bar bawah yang mengambang (hanya di layar HP; di desktop navigasinya
// tetap di navbar atas). Halaman yang sedang dibuka ditandai dengan latar
// berwarna DI DALAM tab bar (tidak menonjol keluar). Warna/permukaan memakai
// token tema (ink/signal/glass), jadi otomatis mengikuti tema yang dipilih.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Download, Wand2, Music2, Mail, Bot } from "lucide-react";

const TABS = [
  { href: "/", label: "Downloader", icon: Download },
  { href: "/tools", label: "Tools", icon: Wand2 },
  { href: "/musik", label: "Musik", icon: Music2 },
  { href: "/tempmail", label: "Temp Mail", icon: Mail },
  { href: "/chat", label: "Chat AI", icon: Bot },
];

export default function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigasi utama"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] md:hidden"
    >
      <ul className="glass-surface-solid pointer-events-auto mx-auto flex max-w-md items-stretch gap-1 rounded-2xl border border-white/10 bg-ink-900/95 p-1.5 shadow-glow backdrop-blur">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <li key={href} className="min-w-0 flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex h-14 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-medium leading-3 transition-colors focus-ring ${
                  active ? "bg-signal-500 text-ink-950" : "text-white/60 hover:text-white"
                }`}
              >
                <Icon size={20} strokeWidth={active ? 2.4 : 2} />
                <span className="max-w-full truncate px-0.5">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
