import api from "./api";

export function getIncomePlansMonth(year, month) {
  return api.get("/income-plans/month/", {
    params: { year, month },
  });
}

export function createIncomePlan(payload) {
  return api.post("/income-plans/", payload);
}

export function createIncomePlanVersion(payload) {
  return api.post("/income-plan-versions/", payload);
}

export function updateIncomePlan(id, payload) {
  return api.patch(`/income-plans/${id}/`, payload);
}

export function deleteIncomePlan(id) {
  return api.delete(`/income-plans/${id}/`);
}

export function confirmIncomePlan(id, payload = {}) {
  const { year, month, ...data } = payload || {};

  return api.post(`/income-plans/${id}/confirm/`, data, {
    params: {
      year,
      month,
    },
  });
}

export function adjustIncomePlan(id, payload) {
  const { year, month, ...data } = payload || {};

  return api.post(`/income-plans/${id}/adjust/`, data, {
    params: {
      year,
      month,
    },
  });
}
