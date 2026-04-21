import axios from "axios";

function normalizeApiBaseUrl(rawValue) {
  const value = String(rawValue || "").trim();

  if (!value) {
    return "/api/";
  }

  const trimmed = value.replace(/\/+$/, "");

  if (trimmed === "/api") {
    return "/api/";
  }

  if (trimmed.endsWith("/api")) {
    return `${trimmed}/`;
  }

  return `${trimmed}/api/`;
}

function buildApiUrl(pathname) {
  const cleanPath = String(pathname || "").replace(/^\/+/, "");
  const baseUrl = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL);

  if (baseUrl.startsWith("http://") || baseUrl.startsWith("https://")) {
    return new URL(cleanPath, baseUrl).toString();
  }

  return `${baseUrl}${cleanPath}`;
}

const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL);
const CSRF_ENDPOINT = buildApiUrl("/csrf/");
const SAFE_METHODS = new Set(["get", "head", "options"]);

let csrfRequest = null;
let csrfTokenFallback = null;

function getCSRFToken() {
  if (csrfTokenFallback) {
    return csrfTokenFallback;
  }

  const name = "csrftoken=";
  const decodedCookie = decodeURIComponent(document.cookie);
  const cookies = decodedCookie.split(";");

  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.startsWith(name)) {
      return cookie.substring(name.length);
    }
  }
  return null;
}

async function ensureCsrfCookie() {
  if (getCSRFToken()) {
    return getCSRFToken();
  }

  if (!csrfRequest) {
    csrfRequest = axios
      .get(CSRF_ENDPOINT, {
        withCredentials: true,
      })
      .then((response) => {
        const responseToken =
          response?.data?.csrfToken ||
          response?.data?.csrf_token ||
          response?.data?.csrftoken ||
          null;

        if (typeof responseToken === "string" && responseToken.trim()) {
          csrfTokenFallback = responseToken.trim();
        }

        return response;
      })
      .finally(() => {
        csrfRequest = null;
      });
  }

  await csrfRequest;
  return getCSRFToken();
}

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  xsrfCookieName: "csrftoken",
  xsrfHeaderName: "X-CSRFToken",
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      console.error("API error:", error.response.status, error.response.data);
    } else {
      console.error("Network error:", error.message);
    }
    return Promise.reject(error);
  }
);

export const initCSRF = async () => {
  await ensureCsrfCookie();
};

export function unwrapCollectionResponse(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
}

export function getApiErrorMessage(error, fallback = "Ha ocurrido un error") {
  if (error?.code === "ERR_NETWORK" || error?.message === "Network Error") {
    return "No se pudo conectar con el backend. Revisa que la API esté levantada, que VITE_API_BASE_URL sea correcta y que CORS/cookies estén bien configurados.";
  }

  const responseData = error?.response?.data;

  if (typeof responseData === "string" && responseData.trim()) {
    return responseData;
  }

  if (typeof responseData?.detail === "string" && responseData.detail.trim()) {
    return responseData.detail;
  }

  if (responseData && typeof responseData === "object") {
    for (const value of Object.values(responseData)) {
      if (Array.isArray(value) && value.length > 0) {
        return String(value[0]);
      }

      if (typeof value === "string" && value.trim()) {
        return value;
      }
    }
  }

  return fallback;
}

api.interceptors.request.use(async (config) => {
  const method = String(config.method || "get").toLowerCase();
  const isUnsafeMethod = !SAFE_METHODS.has(method);
  const isCsrfRequest =
    typeof config.url === "string" &&
    (config.url === "/csrf/" ||
      config.url.endsWith("/csrf/") ||
      config.url === CSRF_ENDPOINT);

  const csrfToken =
    isUnsafeMethod && !isCsrfRequest
      ? await ensureCsrfCookie()
      : getCSRFToken();

  if (csrfToken) {
    config.headers = config.headers || {};
    config.headers["X-CSRFToken"] = csrfToken;
  }
  return config;
});

export default api;
export { API_BASE_URL, CSRF_ENDPOINT };
