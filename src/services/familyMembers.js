import api, { getApiErrorMessage, unwrapCollectionResponse } from "./api";

const BASE_URL = "/family/members/";

export async function getFamilyMembers() {
  const response = await api.get(BASE_URL);
  return unwrapCollectionResponse(response);
}

export { getApiErrorMessage };
