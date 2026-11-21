import { NextResponse } from "next/server";
import { reportError } from "@/lib/reportError";
import { CHAT_SYSTEM_PROMPT, CHAT_BOT_NAME } from "@/lib/chatPersona";
import { SITE_NAME } from "@/lib/site";

export const runtime = "nodejs";

// Cadangan: endpoint DeepSeek milik sendiri (koyen-api.vercel.app).
// Sama seperti Logic Bell, API ini menyimpan memori percakapan per `session`
// (dikirim dari client sebagai sessionId), jadi obrolan tetap nyambung.
async function callDeepSeek(message, sessionId) {
  const params = new URLSearchParams({
    query: message,
    prompt: CHAT_SYSTEM_PROMPT,
    session: sessionId || `web-${Date.now()}`,
  });
  const res = await fetch(`https://koyen-api.vercel.app/download/deepseek?${params.toString()}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(25000),
  });

  const data = await res.json().catch(() => null);
  const reply = typeof data?.data?.answer === "string" ? data.data.answer.trim() : "";
  if (!res.ok || !data?.status || !reply) {
    throw new Error(data?.message || data?.msg || `DeepSeek tidak mengembalikan jawaban (status ${res.status}).`);
  }
  return reply;
}

// Sumber utama: Logic Bell (api.termai.cc), host yang sama juga dipakai
// downloader Instagram & maker iqc di project ini jadi kemungkinan besar
// tidak diblokir firewall macam api-faa.my.id.
// Bawaannya API ini punya memori percakapan per `id` sesi (dikirim dari
// client sebagai sessionId), tapi tetap jalan tanpa itu kalau tidak dikirim.
async function callLogicBell(message, sessionId) {
  const res = await fetch("https://api.termai.cc/api/chat/logic-bell?key=Bell409", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: message,
      id: sessionId || `web-${Date.now()}`,
      fullainame: `${CHAT_BOT_NAME} - Asisten ${SITE_NAME}`,
      nickainame: CHAT_BOT_NAME,
      senderName: "Pengunjung",
      ownerName: SITE_NAME,
      date: new Date().toISOString(),
      role: "Asisten Website",
      custom_profile: CHAT_SYSTEM_PROMPT,
      msgtype: "text",
    }),
    signal: AbortSignal.timeout(20000),
  });

  const data = await res.json().catch(() => null);
  const reply = data?.data?.msg;
  if (!data?.status || !reply) {
    throw new Error(data?.msg || "Logic Bell tidak mengembalikan jawaban.");
  }
  return reply;
}

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ status: false, message: "Body tidak valid." }, { status: 400 });
  }

  const message = (body?.message || "").trim();
  const sessionId = typeof body?.sessionId === "string" ? body.sessionId.slice(0, 100) : null;
  if (!message) {
    return NextResponse.json({ status: false, message: "Pesan tidak boleh kosong." }, { status: 400 });
  }
  if (message.length > 1000) {
    return NextResponse.json({ status: false, message: "Pesan terlalu panjang." }, { status: 400 });
  }

  try {
    const reply = await callLogicBell(message, sessionId).catch((err) => {
      console.error("[chat] Logic Bell gagal, coba DeepSeek:", err.message);
      return callDeepSeek(message, sessionId);
    });
    return NextResponse.json({ status: true, reply });
  } catch (err) {
    console.error("[chat] semua sumber gagal:", err.message);
    await reportError("chat AI", err);
    return NextResponse.json(
      { status: false, message: "Bot lagi tidak bisa menjawab, coba lagi sebentar lagi ya." },
      { status: 502 }
    );
  }
}
