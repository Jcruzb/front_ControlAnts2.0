import api, { getApiErrorMessage, unwrapCollectionResponse } from "./api";

const BASE_URL = "/categories/";

export async function getCategories() {
  const response = await api.get(BASE_URL);
  return unwrapCollectionResponse(response);
}

export async function createCategory(payload) {
  return api.post(BASE_URL, payload);
}

export async function updateCategory(id, payload) {
  return api.patch(`${BASE_URL}${id}/`, payload);
}

export { getApiErrorMessage };
