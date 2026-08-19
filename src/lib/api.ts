import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";

export const API_BASE_URL: string =
  (Constants.expoConfig?.extra?.apiUrl as string) || "http://localhost:8000/api";

const TOKEN_KEY = "cd_token";

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setToken(token: string | null): Promise<void> {
  if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
  else await SecureStore.deleteItemAsync(TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const text = await res.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!res.ok) {
    const b = (body ?? {}) as { message?: string; errors?: Record<string, string[]> };
    throw new ApiError(b.message || `Terjadi kesalahan (${res.status})`, res.status, b.errors);
  }

  return body as T;
}

export const fetcher = <T,>(path: string) => request<T>(path);

export const api = {
  get: <T,>(path: string) => request<T>(path, { method: "GET" }),
  post: <T,>(path: string, data?: unknown) =>
    request<T>(path, { method: "POST", body: data ? JSON.stringify(data) : undefined }),
  put: <T,>(path: string, data?: unknown) =>
    request<T>(path, { method: "PUT", body: data ? JSON.stringify(data) : undefined }),
  delete: <T,>(path: string) => request<T>(path, { method: "DELETE" }),

  /**
   * Upload file (multipart/form-data) — foto checkin, POD, buyback.
   * uri dari expo-image-picker (file://...), fileName & mimeType opsional.
   */
  postForm: async <T,>(
    path: string,
    fields: Record<string, string>,
    file?: { uri: string; name: string; type: string; fieldName: string }
  ): Promise<T> => {
    const token = await getToken();
    const formData = new FormData();

    Object.entries(fields).forEach(([key, value]) => formData.append(key, value));

    if (file) {
      // React Native FormData menerima object { uri, name, type } sebagai representasi file
      formData.append(file.fieldName, {
        uri: file.uri,
        name: file.name,
        type: file.type,
      } as unknown as Blob);
    }

    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    const text = await res.text();
    let body: unknown = null;
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }
    }

    if (!res.ok) {
      const b = (body ?? {}) as { message?: string; errors?: Record<string, string[]> };
      throw new ApiError(b.message || `Terjadi kesalahan (${res.status})`, res.status, b.errors);
    }

    return body as T;
  },
};

export function formatCurrency(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(
    num || 0
  );
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
