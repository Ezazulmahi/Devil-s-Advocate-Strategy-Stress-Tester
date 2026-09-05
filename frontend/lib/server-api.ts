import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { API_BASE_URL, AUTH_COOKIE_NAME, parseApiResponse } from "@/lib/api-config";

async function rawServerFetch(path: string, init?: RequestInit): Promise<Response> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  // The cookie can outlive the token it holds (backend restart with a new
  // JWT_SECRET, a token issued before a manual revoke, clock skew, etc).
  // Middleware only checks that a cookie is present, not that it still
  // validates — so a stale one reaches here and, uncaught, would crash the
  // whole server component render instead of sending the user back to sign in.
  if (res.status === 401) {
    redirect("/");
  }

  return res;
}

export async function serverFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await rawServerFetch(path, init);
  return parseApiResponse<T>(res);
}

export async function serverFetchPage<T>(
  path: string,
  init?: RequestInit
): Promise<{ items: T[]; total: number }> {
  const res = await rawServerFetch(path, init);
  const items = await parseApiResponse<T[]>(res);
  const total = Number(res.headers.get("X-Total-Count") ?? items.length);
  return { items, total };
}

export async function getServerToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE_NAME)?.value;
}
