import api from "./api";

export function getIncomePlansMonth(year, month) {
  return api.get("/income-plans/month/", {
    params: { year, month },
  });
}

export function confirmIncomePlan(id) {
  return api.post(`/income-plans/${id}/confirm/`, {});
}

export function adjustIncomePlan(id, payload) {
  return api.post(`/income-plans/${id}/adjust/`, payload);
}
