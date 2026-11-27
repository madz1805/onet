"use client";

import { useEffect } from "react";

// Mendaftarkan service worker (PWA). Dulu ada di InstallApp (footer); dipisah
// supaya tetap jalan di semua halaman walau footer sudah dihapus.
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}
