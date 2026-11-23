"use client";

import { useEffect, useRef, useState } from "react";
import {
  Search,
  Play,
  Loader2,
  Music2,
  Volume2,
  ListPlus,
  ArrowRight,
  X,
} from "lucide-react";
import { makeTrackId } from "@/lib/musicHistory";
import PlaylistTab from "@/components/PlaylistTab";
import AddToPlaylistModal from "@/components/AddToPlaylistModal";
import usePlaylists from "@/lib/usePlaylists";
import { useMusicPlayer } from "@/components/MusicPlayerProvider";

const SOURCES = [
  { id: "spotify", label: "Spotify" },
  { id: "youtube", label: "YouTube" },
  { id: "soundcloud", label: "SoundCloud" },
];

function sourceLabel(id) {
  return SOURCES.find((s) => s.id === id)?.label || "YouTube";
}

function formatTime(sec) {
  if (!sec || Number.isNaN(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

// Satu baris kotak yang bisa digeser ke samping (gaya daftar Spotify).
// `scroll-px-5` = jarak snap sama dengan padding baris, supaya kotak pertama
// tetap sejajar dengan judul di atasnya (tidak menempel ke tepi layar).
function CardRow({ title, count, hint, children }) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 flex items-center gap-2 font-display text-base font-semibold text-white">
        {title}
        {count != null && (
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-medium text-white/60">{count}</span>
        )}
      </h2>
      {hint && <p className="-mt-2 mb-3 text-xs text-white/40">{hint}</p>}
      <div className="-mx-5 flex snap-x scroll-px-5 gap-3 overflow-x-auto overscroll-x-contain px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {children}
      </div>
    </section>
  );
}

// Satu kotak: cover persegi + judul + artis. Ketuk = putar. Tekan-tahan (atau
// klik kanan di desktop) = `onLongPress`, dipakai untuk membuka jendela
// "Tambah ke playlist".
const LONG_PRESS_MS = 450;
const HINT = "";

function Card({ cover, title, subtitle, onPlay, onLongPress, busy, active, disabled }) {
  const timer = useRef(null);
  const fired = useRef(false); // tekan-tahan sudah terpicu: abaikan klik yang menyusul
  const origin = useRef({ x: 0, y: 0 });

  function clearTimer() {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }

  function handlePointerDown(e) {
    fired.current = false;
    clearTimer();
    if (!onLongPress || (e.pointerType === "mouse" && e.button !== 0)) return;
    origin.current = { x: e.clientX, y: e.clientY };
    timer.current = setTimeout(() => {
      timer.current = null;
      fired.current = true;
      try {
        navigator.vibrate?.(15);
      } catch {
        // perangkat tanpa getar: abaikan
      }
      onLongPress();
    }, LONG_PRESS_MS);
  }

  // Jari bergeser (menggeser baris ke samping): bukan tekan-tahan.
  function handlePointerMove(e) {
    if (!timer.current) return;
    if (Math.abs(e.clientX - origin.current.x) > 10 || Math.abs(e.clientY - origin.current.y) > 10) clearTimer();
  }

  function handleClick(e) {
    if (fired.current) {
      fired.current = false;
      e.preventDefault();
      return;
    }
    onPlay();
  }

  function handleContextMenu(e) {
    e.preventDefault(); // tekan-tahan di HP memicu menu browser; pakai jendela playlist saja
    if (onLongPress && !fired.current && !timer.current) onLongPress(); // klik kanan di desktop
  }

  return (
    <div className="w-32 flex-shrink-0 snap-start">
      <button
        type="button"
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={clearTimer}
        onPointerLeave={clearTimer}
        onPointerCancel={clearTimer}
        onContextMenu={handleContextMenu}
        disabled={disabled}
        aria-label={`Putar ${title}`}
        className="relative block w-full select-none text-left [-webkit-touch-callout:none] disabled:cursor-wait"
      >
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt=""
            draggable={false}
            referrerPolicy="no-referrer"
            loading="lazy"
            className={`aspect-square w-full rounded-xl border object-cover ${
              active ? "border-signal-500" : "border-white/10"
            } ${disabled && !busy ? "opacity-50" : ""}`}
          />
        ) : (
          <span
            className={`grid aspect-square w-full place-items-center rounded-xl border bg-ink-800/70 text-white/30 ${
              active ? "border-signal-500" : "border-white/10"
            }`}
          >
            <Music2 size={28} />
          </span>
        )}
        {busy && (
          <span className="absolute inset-0 grid place-items-center rounded-xl bg-black/50 text-white">
            <Loader2 size={22} className="animate-spin" />
          </span>
        )}
        {active && !busy && (
          <span className="absolute bottom-1.5 left-1.5 grid h-7 w-7 place-items-center rounded-full bg-signal-500 text-ink-950">
            <Volume2 size={14} />
          </span>
        )}
      </button>
      <p
        className="mt-2 break-words text-sm font-medium leading-snug text-white"
        style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
      >
        {title}
      </p>
      <p className="truncate text-xs text-white/50">{subtitle}</p>
    </div>
  );
}

export default function MusicSection() {
  const [source, setSource] = useState("spotify");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Alur dua langkah: cari -> daftar hasil -> user memilih lagu -> baru ambil link.
  const [results, setResults] = useState([]);
  const [searchedQuery, setSearchedQuery] = useState("");
  const [resolvingUrl, setResolvingUrl] = useState(null);
  const [tab, setTab] = useState("cari"); // cari | playlist
  // Baris-baris kotak album (Lagu trending, Rekomendasi, dst.) dari /api/trending,
  // yang bersumber dari env TRENDING_URL atau data/trending.json.
  const [sections, setSections] = useState([]);
  const [sectionsLoaded, setSectionsLoaded] = useState(false);
  const pl = usePlaylists();
  const searchInputRef = useRef(null);


  useEffect(() => {
    let cancelled = false;
    fetch("/api/trending")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d?.status && Array.isArray(d.sections)) setSections(d.sections);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setSectionsLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // id lagu riwayat yang jendela "Tambah ke playlist"-nya boleh menampilkan tombol Buang.
  const [removeId, setRemoveId] = useState(null);
  const searchSeq = useRef(0); // mencegah hasil lama menimpa pencarian yang lebih baru
  // Semua state pemutaran (audio, lagu aktif, riwayat, mode, progres) ada di
  // MusicPlayerProvider supaya lagu tetap jalan saat pindah halaman.
  const {
    track,
    history,
    isPlaying,
    playbackError,
    refreshing,
    setPlaylistTarget: setAddTarget,
    playlistTarget: addTarget,
    playTrack,
    addAndPlay,
    removeFromHistory,
  } = useMusicPlayer();

  async function runSearch(src = source, text = query) {
    const q = text.trim();
    if (!q) return;
    const seq = ++searchSeq.current;
    setTab("cari");
    setLoading(true);
    setError("");
    setResults([]);
    try {
      const res = await fetch("/api/music", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "search", source: src, query: q }),
      });
      const data = await res.json();
      if (seq !== searchSeq.current) return;
      if (!data.status || !Array.isArray(data.results) || !data.results.length) {
        throw new Error(data.message || "Lagu tidak ditemukan.");
      }
      setResults(data.results);
      setSearchedQuery(q);
    } catch (err) {
      if (seq === searchSeq.current) setError(err.message || "Lagu tidak ditemukan.");
    } finally {
      if (seq === searchSeq.current) setLoading(false);
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    runSearch();
  }

  function changeSource(id) {
    if (id === source) return;
    setSource(id);
    setResults([]);
    setError("");
    if (query.trim()) runSearch(id, query); // hasil milik sumber lama tidak relevan lagi
    else {
      searchSeq.current++;
      setLoading(false);
    }
  }

  // Ambil link stream sebuah hasil pencarian, lalu putar. Melempar error kalau gagal.
  async function playResolved(item, src, q, queueInfo = null) {
    const res = await fetch("/api/music", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "resolve", source: src, url: item.url, query: item.query, artist: item.artist }),
    });
    const data = await res.json();
    if (!data.status || !data.streamUrl) throw new Error(data.message || "Gagal mengambil lagu.");

    const title = item.title || data.title;
    const artist = item.artist || data.artist || "";
    const played = {
      id: makeTrackId({ source: src, title, artist }),
      source: src,
      title,
      artist,
      thumbnail: item.thumbnail || data.thumbnail || null,
      streamUrl: data.streamUrl,
      duration: item.duration || data.duration || null, // dipakai kalau stream tidak melaporkan panjang lagu
      query: q,
      pageUrl: item.url, // dipakai pemutar untuk mengambil ulang link yang kedaluwarsa
      searchQuery: item.query,
      resolvedAt: Date.now(),
    };
    // Dari kotak rekomendasi/trending: antreannya = isi baris itu (lagu yang baru
    // diputar menggantikan entri aslinya), jadi lagu berikutnya ikut baris yang sama.
    const list = queueInfo ? queueInfo.list.map((x, i) => (i === queueInfo.index ? played : x)) : null;
    addAndPlay(played, list);
  }

  // Lagu dipilih dari daftar hasil: ambil link stream-nya, lalu putar.
  async function handlePick(item) {
    if (resolvingUrl) return;
    setResolvingUrl(item.url);
    setError("");
    try {
      await playResolved(item, source, searchedQuery);
    } catch (err) {
      setError(err.message || "Gagal mengambil lagu.");
    } finally {
      setResolvingUrl(null);
    }
  }

  // Kotak dari data/trending.json diketuk: cari "judul artis" di sumber yang
  // sedang dipilih, ambil hasil teratas, lalu putar. Cover & judul tetap
  // memakai yang tertulis di file supaya sama dengan yang terlihat di kotak.
  async function handleCardPick(item, key, sec, index) {
    if (resolvingUrl) return;
    const src = SOURCES.some((s) => s.id === item.source) ? item.source : source;
    const q = (item.query || `${item.title} ${item.artist || ""}`).trim();
    setResolvingUrl(key);
    setError("");
    try {
      const res = await fetch("/api/music", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "search", source: src, query: q }),
      });
      const data = await res.json();
      const first = Array.isArray(data.results) ? data.results[0] : null;
      if (!data.status || !first) throw new Error(data.message || "Lagu tidak ditemukan.");
      await playResolved(
        {
          ...first,
          title: item.title || first.title,
          artist: item.artist || first.artist,
          thumbnail: item.cover || first.thumbnail,
        },
        src,
        q,
        { list: sec.items.map(songFromCard), index }
      );
    } catch (err) {
      setError(err.message || "Gagal mengambil lagu.");
    } finally {
      setResolvingUrl(null);
    }
  }

  // Data lagu dari satu kotak data/trending.json (belum punya link stream; pemutar
  // mengambilnya dari judul + artis saat lagunya diputar dari playlist).
  function songFromCard(it) {
    const src = SOURCES.some((x) => x.id === it.source) ? it.source : source;
    const artist = it.artist || "";
    const q = (it.query || `${it.title} ${artist}`).trim();
    return {
      id: makeTrackId({ source: src, title: it.title, artist }),
      source: src,
      title: it.title,
      artist,
      thumbnail: it.cover || null,
      searchQuery: q,
      query: q,
    };
  }

  // Data lagu dari satu hasil pencarian, untuk disimpan ke playlist.
  function songFromResult(r) {
    const artist = r.artist || "";
    return {
      id: makeTrackId({ source, title: r.title, artist }),
      source,
      title: r.title,
      artist,
      thumbnail: r.thumbnail || null,
      pageUrl: r.url,
      searchQuery: r.query,
      duration: r.duration || null,
      query: searchedQuery,
    };
  }

  return (
    // pb-24: ruang untuk mini player yang menempel di bawah layar selama ada lagu.
    <div className={track ? "pb-24" : ""}>
      <form onSubmit={handleSearch}>
        <div className="relative">
          <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            ref={searchInputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Cari di ${sourceLabel(source)}...`}
            enterKeyHint="search"
            className={`w-full rounded-xl border border-white/10 bg-ink-900/60 py-3 pl-11 text-sm text-white placeholder:text-white/30 focus-ring ${
              query ? "pr-[5.25rem]" : "pr-4"
            }`}
          />
          {query && (
            <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-0.5">
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  searchInputRef.current?.focus();
                }}
                aria-label="Hapus teks pencarian"
                title="Hapus"
                className="grid h-8 w-8 place-items-center rounded-full text-white/50 hover:text-white"
              >
                <X size={16} />
              </button>
              <button
                type="submit"
                disabled={loading}
                aria-label="Cari"
                title="Cari"
                className="grid h-8 w-8 place-items-center rounded-full bg-signal-500 text-ink-950 disabled:opacity-60"
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : <ArrowRight size={16} />}
              </button>
            </div>
          )}
        </div>
      </form>

      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Pilih sumber lagu">
        {SOURCES.map((s) => (
          <button
            type="button"
            key={s.id}
            onClick={() => changeSource(s.id)}
            aria-pressed={source === s.id}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              source === s.id
                ? "border-signal-500 bg-signal-500 text-ink-950"
                : "border-white/10 bg-ink-900/60 text-white/70 hover:text-white"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="mb-2 mt-3 flex rounded-xl border border-white/10 bg-ink-900/60 p-1" role="tablist">
        {[
          { id: "cari", label: "Beranda" },
          { id: "playlist", label: "Playlist" },
        ].map((t) => (
          <button
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.id ? "bg-signal-500 text-ink-950" : "text-white/60 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {refreshing && !error && (
        <p className="mt-4 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
          <Loader2 size={14} className="animate-spin" />
          Link lagu sudah kedaluwarsa, mengambil link baru...
        </p>
      )}

      {((tab === "cari" && error) || playbackError) && (
        <p className="mt-4 rounded-xl border border-flare-500/30 bg-flare-500/10 px-4 py-3 text-sm text-flare-400">
          {(tab === "cari" && error) || playbackError}
        </p>
      )}

      {tab === "cari" && loading && (
        <p className="mt-6 flex items-center gap-2 text-sm text-white/50">
          <Loader2 size={14} className="animate-spin" />
          Mencari di {sourceLabel(source)}...
        </p>
      )}

      {tab === "cari" && results.length > 0 && (
        <div className="mt-6">
          <p className="mb-3 truncate text-sm font-medium text-white/50">
            Hasil untuk &quot;{searchedQuery}&quot; di {sourceLabel(source)}
          </p>
          <div className="space-y-2">
            {results.map((r) => {
              const isCurrent = track?.pageUrl === r.url;
              const busy = resolvingUrl === r.url;
              return (
                <div
                  key={r.url}
                  className={`flex items-center gap-1 rounded-2xl border pr-2 transition-colors ${
                    isCurrent ? "border-signal-500/40 bg-signal-500/5" : "border-white/8 bg-ink-900/60 hover:bg-white/5"
                  } ${resolvingUrl && !busy ? "opacity-50" : ""}`}
                >
                  <button
                    type="button"
                    onClick={() => handlePick(r)}
                    disabled={Boolean(resolvingUrl)}
                    aria-label={`Putar ${r.title}`}
                    className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-left disabled:cursor-wait"
                  >
                    {r.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={r.thumbnail}
                        alt=""
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        className="h-14 w-14 flex-shrink-0 rounded-xl object-cover"
                      />
                    ) : (
                      <span className="grid h-14 w-14 flex-shrink-0 place-items-center rounded-xl bg-white/5 text-white/30">
                        <Music2 size={20} />
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-white">{r.title}</span>
                      <span className="block truncate text-xs text-white/50">
                        {[r.artist, r.duration ? formatTime(r.duration) : null].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                    <span
                      className={`grid h-10 w-10 flex-shrink-0 place-items-center rounded-full ${
                        isCurrent ? "bg-signal-500 text-ink-950" : "bg-white/10 text-white"
                      }`}
                    >
                      {busy ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : isCurrent && isPlaying ? (
                        <Volume2 size={16} />
                      ) : (
                        <Play size={16} className="ml-0.5" />
                      )}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddTarget(songFromResult(r))}
                    aria-label={`Tambah ${r.title} ke playlist`}
                    title="Tambah ke playlist"
                    className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full text-white/50 hover:bg-white/10 hover:text-white"
                  >
                    <ListPlus size={18} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === "cari" && !track && !error && !playbackError && history.length === 0 && results.length === 0 && !loading && sectionsLoaded && sections.length === 0 && (
        <div className="mt-14 flex flex-col items-center gap-3 text-center text-white/40">
          <Music2 size={32} />
          <p className="max-w-sm text-sm">
            Ketik judul lagu, pilih sumbernya, lalu tekan cari. Pilih lagu yang kamu mau dari daftar hasil,
            lalu lagunya langsung diputar dan bisa diunduh. Lagu yang dipilih tersimpan di riwayat.
          </p>
        </div>
      )}

      {tab === "playlist" && (
        <div className="mt-2">
          <PlaylistTab pl={pl} />
        </div>
      )}

      {tab === "cari" && results.length === 0 && !loading &&
        sections.map((sec, si) => (
          <CardRow key={`${si}-${sec.title}`} title={sec.title} hint={si === 0 ? HINT : undefined}>
            {sec.items.map((it, i) => {
              const key = `sec-${si}-${i}`;
              return (
                <Card
                  key={key}
                  cover={it.cover}
                  title={it.title}
                  subtitle={it.artist || ""}
                  onPlay={() => handleCardPick(it, key, sec, i)}
                  onLongPress={() => {
                    setRemoveId(null);
                    setAddTarget(songFromCard(it));
                  }}
                  busy={resolvingUrl === key}
                  disabled={Boolean(resolvingUrl)}
                  active={
                    isPlaying &&
                    track?.title?.toLowerCase() === it.title.toLowerCase() &&
                    (track?.artist || "").toLowerCase() === (it.artist || "").toLowerCase()
                  }
                />
              );
            })}
          </CardRow>
        ))}

      {tab === "cari" && history.length > 0 && (
        <CardRow
          title="Riwayat"
          count={history.length}
          hint={sections.length === 0 ? HINT : undefined}
        >
          {history.map((t) => (
            <Card
              key={t.id}
              cover={t.thumbnail}
              title={t.title}
              subtitle={`${sourceLabel(t.source)} · ${t.artist}`}
              onPlay={() => playTrack(t)}
              onLongPress={() => {
                setRemoveId(t.id);
                setAddTarget(t);
              }}
              active={track?.id === t.id && isPlaying}
            />
          ))}
        </CardRow>
      )}

      {addTarget && (
        <AddToPlaylistModal
          song={addTarget}
          pl={pl}
          onClose={() => {
            setAddTarget(null);
            setRemoveId(null);
          }}
          onRemove={removeId && removeId === addTarget.id ? () => removeFromHistory(addTarget.id) : undefined}
        />
      )}
    </div>
  );
}
