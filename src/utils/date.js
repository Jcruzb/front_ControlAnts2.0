function pad2(value) {
  return String(value).padStart(2, "0");
}

export function formatLocalDate(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(
    date.getDate()
  )}`;
}

export function getTodayLocalDate() {
  return formatLocalDate(new Date());
}

export function getRelativeLocalDate(daysOffset) {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return formatLocalDate(date);
}
