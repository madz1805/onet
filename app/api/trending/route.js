import { NextResponse } from "next/server";
import localData from "@/data/trending.json";

// Daftar lagu untuk baris-baris kotak album di halaman Musik, tab Cari
// (components/MusicSection.js): "Lagu trending", "Rekomendasi", dst.
//
// Sumber data (sama seperti sistem notifikasi):
//  - Kalau env TRENDING_URL diisi (mis. link RAW file trending.json di GitHub /
//    Gist), isinya dibaca dari sana. Edit file itu di GitHub => daftar lagu
//    berubah tanpa deploy ulang (hasilnya di-cache singkat).
//  - Kalau kosong, atau sumbernya gagal dibaca, memakai data/trending.json yang
//    ikut terbawa di project (halaman musik tidak pernah rusak karena ini).
// Repo privat: isi juga TRENDING_TOKEN (GitHub token yang boleh membaca repo).
//
// Format file: { "sections": [ { "title": "Lagu trending", "items": [ ... ] } ] }
// Tiap item: title (wajib), artist, cover (link gambar https), source (opsional:
// "spotify" | "youtube" | "soundcloud"), query (opsional, kata kunci pencarian khusus).

export const runtime = "nodejs";

const SOURCES = ["spotify", "youtube", "soundcloud"];
const MAX_SECTIONS = 10;
const MAX_ITEMS = 50;

const clip = (v, n) => (typeof v === "string" || typeof v === "number" ? String(v).trim().slice(0, n) : "");

function httpsOrNull(v) {
  try {
    const u = new URL(String(v || "").trim());
    return u.protocol === "https:" ? u.href : null;
  } catch {
    return null;
  }
}

// Hanya teks polos yang dikirim ke tampilan (tidak ada HTML), semua field dibatasi.
function normalize(raw) {
  const list = Array.isArray(raw?.sections) ? raw.sections : [];
  const out = [];
  for (const sec of list) {
    if (!sec || typeof sec !== "object" || sec.active === false) continue;
    const title = clip(sec.title, 60);
    if (!title) continue;
    const items = [];
    for (const it of Array.isArray(sec.items) ? sec.items : []) {
      if (!it || typeof it !== "object" || it.active === false) continue;
      const name = clip(it.title, 120);
      if (!name) continue;
      items.push({
        title: name,
        artist: clip(it.artist, 120),
        cover: httpsOrNull(it.cover),
        source: SOURCES.includes(it.source) ? it.source : null,
        query: clip(it.query, 160),
      });
      if (items.length >= MAX_ITEMS) break;
    }
    if (items.length) out.push({ title, items });
    if (out.length >= MAX_SECTIONS) break;
  }
  return out;
}

const reply = (sections) =>
  NextResponse.json(
    { status: true, sections },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
  );

export async function GET() {
  const src = httpsOrNull(process.env.TRENDING_URL);
  if (!src) return reply(normalize(localData));

  try {
    const headers = { Accept: "application/json", "User-Agent": "KOYEN-Web/1.0" };
    if (process.env.TRENDING_TOKEN) headers.Authorization = `Bearer ${process.env.TRENDING_TOKEN}`;
    const res = await fetch(src, { headers, cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    return reply(normalize(JSON.parse(text.slice(0, 300000))));
  } catch (err) {
    console.error("[trending] gagal membaca sumber, pakai data lokal:", err.message);
    return reply(normalize(localData));
  }
}
