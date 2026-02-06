import CONFIG from "../config";
import { getUser } from "../storage";

export type ApiError = {
  status: number;
  message: string;
  url: string;
  data?: unknown;
};

type RequestOptions = {
  auth?: boolean;
  headers?: HeadersInit;
  body?: unknown;
  signal?: AbortSignal;
};

const baseUrl = CONFIG.API_ENDPOINT.replace(/\/+$/, "");

const buildUrl = (path: string) => {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${normalized}`;
};

const parseBody = async (response: Response) => {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const isFormData = (body: unknown): body is FormData => {
  return typeof FormData !== "undefined" && body instanceof FormData;
};

const request = async <T>(
  method: string,
  path: string,
  options: RequestOptions = {},
): Promise<T> => {
  const url = buildUrl(path);
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  const authEnabled = options.auth !== false;
  if (authEnabled) {
    const user = await getUser();
    if (user?.token) {
      headers.set("Authorization", `Bearer ${user.token}`);
    }
  }

  let body: BodyInit | undefined;
  if (options.body !== undefined) {
    if (isFormData(options.body)) {
      body = options.body;
    } else if (typeof options.body === "string") {
      body = options.body;
      if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "text/plain");
      }
    } else {
      body = JSON.stringify(options.body);
      if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body,
      signal: options.signal,
    });
  } catch (error: any) {
    const message = error?.message || "Network request failed";
    throw { status: 0, message, url } satisfies ApiError;
  }

  const data = await parseBody(response);
  if (!response.ok) {
    const message =
      (data as any)?.message || response.statusText || "Request failed";
    throw { status: response.status, message, url, data } satisfies ApiError;
  }

  return data as T;
};

export const api = {
  get: <T>(path: string, options?: Omit<RequestOptions, "body">) =>
    request<T>("GET", path, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("POST", path, { ...options, body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PUT", path, { ...options, body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PATCH", path, { ...options, body }),
  del: <T>(path: string, options?: RequestOptions) =>
    request<T>("DELETE", path, options),
};
