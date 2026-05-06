import api, { getApiErrorMessage } from "./api";

export async function getCsrf() {
  return api.get("/csrf/");
}

export async function register(payload) {
  await getCsrf();
  return api.post("/auth/register/", payload);
}

export async function login(payload) {
  await getCsrf();
  return api.post("/auth/login/", payload);
}

export async function logout() {
  await getCsrf();
  return api.post("/auth/logout/");
}

export async function me() {
  return api.get("/auth/me/");
}

export async function updateMe(payload) {
  return api.patch("/auth/me/", payload);
}

export async function changePassword(payload) {
  return api.post("/auth/change-password/", payload);
}

export function getAuthErrorMessage(error, fallback = "No se pudo completar la operación") {
  return getApiErrorMessage(error, fallback);
}
