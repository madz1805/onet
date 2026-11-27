import Image from "next/image";
import { Mail, Instagram, Send, ChevronRight } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import {
  SITE_NAME,
  SITE_LOGO,
  WHATSAPP_CHANNEL_URL,
  DEV_NAME,
  DEV_INITIALS,
  DEV_EMAIL,
  DEV_INSTAGRAM_HANDLE,
  DEV_INSTAGRAM_URL,
  DEV_TELEGRAM_URL,
  DEV_TIKTOK_URL,
  DEV_BANNER_VIDEO,
  DEV_AVATAR,
} from "@/lib/site";

function TikTokIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  );
}

// Ambil username dari URL profil (t.me/xxx, tiktok.com/@xxx) supaya teks kecil di
// tombol otomatis ikut URL yang kamu isi di lib/site.js.
function handleFromUrl(url) {
  try {
    const last = new URL(url).pathname.split("/").filter(Boolean).pop() || "";
    return last ? (last.startsWith("@") ? last : `@${last}`) : undefined;
  } catch {
    return undefined;
  }
}

// Warna ikon tiap tombol (dipakai di semua tema; tetap terbaca karena latar pastel).
const LINKS = [
  { label: "Email", sub: DEV_EMAIL, href: `mailto:${DEV_EMAIL}`, icon: Mail, color: "#FFD60A", external: false },
  { label: "Instagram", sub: DEV_INSTAGRAM_HANDLE, href: DEV_INSTAGRAM_URL, icon: Instagram, color: "#F5B8D0", external: true },
  { label: "Saluran", sub: `${SITE_NAME} WEB`, href: WHATSAPP_CHANNEL_URL, icon: WhatsAppIcon, color: "#9FE3C8", external: true },
  { label: "Telegram", sub: handleFromUrl(DEV_TELEGRAM_URL), href: DEV_TELEGRAM_URL, icon: Send, color: "#AFCBF5", external: true },
  { label: "TikTok", sub: handleFromUrl(DEV_TIKTOK_URL), href: DEV_TIKTOK_URL, icon: TikTokIcon, color: "#C9B6FF", external: true },
];

export default function DevProfile() {
  return (
    <div className="space-y-4">
      {/* Banner video + foto profil + nama */}
      <section
        aria-label={`Profil ${DEV_NAME}`}
        className="relative aspect-square overflow-hidden rounded-3xl border border-white/10 bg-ink-900 shadow-glow"
      >
        <video
          src={DEV_BANNER_VIDEO}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Gradasi gelap di bagian bawah supaya nama & foto profil selalu jelas,
            apa pun isi videonya. Video 16:9 otomatis terpotong rapi di tengah (object-cover). */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5"
          style={{
            background:
              "linear-gradient(to top, rgba(8,14,11,0.96) 0%, rgba(8,14,11,0.85) 30%, rgba(8,14,11,0.5) 60%, rgba(8,14,11,0) 100%)",
          }}
        />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5">
          <h1 className="font-display text-3xl font-semibold leading-tight text-white" style={{ color: "#fff" }}>
            {DEV_NAME}
          </h1>
          <div
            className="relative grid h-28 w-28 flex-shrink-0 place-items-center overflow-hidden rounded-full border-4 border-white font-display text-4xl font-semibold"
            style={{ backgroundColor: "#FFD60A", color: "#0a0a0a", borderColor: "#fff" }}
          >
            {DEV_AVATAR ? (
              <Image src={DEV_AVATAR} alt={DEV_NAME} fill sizes="112px" className="object-cover" />
            ) : (
              DEV_INITIALS
            )}
          </div>
        </div>
      </section>

      {/* Tombol ala Linktree */}
      <ul className="space-y-3">
        {LINKS.map(({ label, sub, href, icon: Icon, color, external }) => (
          <li key={label}>
            <a
              href={href}
              {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-ink-900 px-3 py-3 shadow-glow transition-transform active:scale-[0.99] focus-ring"
            >
              <span
                className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-xl border-2"
                style={{ backgroundColor: color, color: "#0a0a0a", borderColor: "#0a0a0a" }}
              >
                <Icon size={22} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-semibold text-white">{label}</span>
                {sub && <span className="block truncate text-sm text-white/50">{sub}</span>}
              </span>
              <ChevronRight size={20} className="flex-shrink-0 text-white/60" />
            </a>
          </li>
        ))}
      </ul>

      {/* Kotak KOYEN (pengganti footer) */}
      <section className="rounded-2xl border border-white/10 bg-ink-900 p-5 shadow-glow">
        <p className="flex items-center gap-3 font-display text-xl font-semibold text-white">
          <Image src={SITE_LOGO} alt={SITE_NAME} width={40} height={40} className="h-10 w-10 rounded-xl object-cover" />
          {SITE_NAME}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-white/70">
          Download video &amp; foto dari berbagai sosial media, tools edit cepat, dan pemutar musik semua dalam satu
          tempat.
        </p>
      </section>
    </div>
  );
}
