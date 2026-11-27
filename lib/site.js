export const SITE_NAME = "KOYEN";
// Domain utama (dipakai untuk canonical, sitemap, dan Open Graph).
export const SITE_URL = "https://koyen.web.id";
// Site key Cloudflare Turnstile (publik, aman ada di kode). Secret key TIDAK
// boleh ditulis di sini: simpan di environment variable TURNSTILE_SECRET_KEY.
export const TURNSTILE_SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "0x4AAAAAAFL3l4a5g8CC6uhx";
export const SITE_TAGLINE = "Download & Tools Sosial Media";
export const SITE_LOGO = "/assets/logo.jpg";
export const SITE_FAVICON = "/assets/favicon.jpg";
export const KAYNA_AVATAR = "/assets/kayna.png";
// Saluran WhatsApp resmi KOYEN (info update fitur, bug fix, maintenance).
// Dipakai oleh pop up ajakan gabung saluran (components/ChannelPromo.js).
export const WHATSAPP_CHANNEL_URL = "https://whatsapp.com/channel/0029Vb8uu33EawdxN8HJlL1u";

// Info halaman Dev (/dev). Ganti URL Telegram & TikTok dengan akun aslimu.
export const DEV_NAME = "A. Muldi";
export const DEV_INITIALS = "AM";
export const DEV_EMAIL = "koyen@goatmail.uk";
export const DEV_INSTAGRAM_HANDLE = "@madzmuldi_";
export const DEV_INSTAGRAM_URL = "https://www.instagram.com/madzmuldi_";
export const DEV_TELEGRAM_URL = "https://t.me/johanliebert180";
export const DEV_TIKTOK_URL = "https://tiktok.com/@koyenwebid";
// Video banner (putar otomatis, berulang). Boleh diganti file sendiri di public/.
export const DEV_BANNER_VIDEO = "/assets/backgrounds/video-1.mp4";
// Foto profil bulat. Taruh filenya di public/assets/dev/profile.jpg lalu isi
// jalurnya di sini. Kalau dikosongkan, yang tampil inisial "AM".
export const DEV_AVATAR = "";
