export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
export const AUTH_COOKIE_NAME = "da_token";
export const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24; // 24h, matches backend ACCESS_TOKEN_EXPIRE_MINUTES

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

export async function parseApiResponse<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const detail =
      (body && typeof body === "object" && "detail" in body && typeof body.detail === "string"
        ? body.detail
        : null) ?? `Request failed with status ${res.status}`;
    throw new ApiError(res.status, detail);
  }

  return body as T;
}
