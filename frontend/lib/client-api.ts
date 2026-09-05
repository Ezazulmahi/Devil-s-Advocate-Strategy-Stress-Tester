"use client";

import {
  API_BASE_URL,
  AUTH_COOKIE_MAX_AGE_SECONDS,
  AUTH_COOKIE_NAME,
  parseApiResponse,
} from "@/lib/api-config";

export function getClientToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${AUTH_COOKIE_NAME}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function setClientToken(token: string) {
  document.cookie = `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}; path=/; max-age=${AUTH_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}

export function clearClientToken() {
  document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0`;
}

export async function clientFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getClientToken();

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.body && !(init.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  return parseApiResponse<T>(res);
}

export async function clientFetchBlob(path: string): Promise<Blob> {
  const token = getClientToken();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    throw new Error(`Request failed with status ${res.status}`);
  }
  return res.blob();
}
