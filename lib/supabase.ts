import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabaseConfigured = url.startsWith("https://") && anon.length > 20;

const REMEMBER = "prism-remember";

function memory(): Storage {
  if (localStorage.getItem(REMEMBER) === "0") return sessionStorage;
  return localStorage;
}

export function setRemember(remember: boolean) {
  localStorage.setItem(REMEMBER, remember ? "1" : "0");
  if (remember) sessionStorage.clear();
}

export const supabase = createClient(
  supabaseConfigured ? url : "https://placeholder.supabase.co",
  supabaseConfigured ? anon : "public-anon-key-placeholder",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: {
        getItem: (key) => (typeof window === "undefined" ? null : memory().getItem(key)),
        setItem: (key, value) => {
          if (typeof window !== "undefined") memory().setItem(key, value);
        },
        removeItem: (key) => {
          if (typeof window === "undefined") return;
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
        },
      },
    },
  },
);
