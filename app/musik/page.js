import MusicSection from "@/components/MusicSection";
import { SITE_NAME } from "@/lib/site";

export const metadata = {
  title: `Musik — ${SITE_NAME}`,
  description:
    "Cari dan putar lagu dari judul atau nama artis lewat YouTube, Spotify, atau SoundCloud, lalu unduh sebagai MP3 di KOYEN.",
  alternates: { canonical: "/musik" },
};

export default function MusicPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 pb-12 pt-6 sm:pt-10">
      <h1 className="sr-only">Musik: cari, putar, dan unduh lagu dari judulnya</h1>

      <MusicSection />
    </div>
  );
}
