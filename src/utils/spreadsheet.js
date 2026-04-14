function pad2(value) {
  return String(value).padStart(2, "0");
}

let xlsxModulePromise = null;

async function loadXlsx() {
  if (!xlsxModulePromise) {
    xlsxModulePromise = import("xlsx");
  }

  return xlsxModulePromise;
}

export function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function isSpreadsheetRowEmpty(row) {
  return Object.values(row).every((value) => String(value ?? "").trim() === "");
}

export async function readSpreadsheetRows(file) {
  const XLSX = await loadXlsx();
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, {
    type: "array",
    cellDates: true,
  });
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];

  if (!sheet) {
    return [];
  }

  return XLSX.utils.sheet_to_json(sheet, {
    defval: "",
    raw: true,
  });
}

export async function parseSpreadsheetDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getFullYear()}-${pad2(value.getMonth() + 1)}-${pad2(
      value.getDate()
    )}`;
  }

  if (typeof value === "number") {
    const XLSX = await loadXlsx();
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) {
      return `${parsed.y}-${pad2(parsed.m)}-${pad2(parsed.d)}`;
    }
  }

  const normalized = String(value ?? "").trim();
  if (!normalized) {
    return "";
  }

  const isoMatch = normalized.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${year}-${pad2(month)}-${pad2(day)}`;
  }

  const dayFirstMatch = normalized.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dayFirstMatch) {
    const [, day, month, year] = dayFirstMatch;
    return `${year}-${pad2(month)}-${pad2(day)}`;
  }

  const timestamp = Date.parse(normalized);
  if (!Number.isNaN(timestamp)) {
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(
      date.getDate()
    )}`;
  }

  return "";
}

export function parsePositiveAmount(value) {
  const rawValue = String(value ?? "").trim();
  let normalized = rawValue;

  if (rawValue.includes(",") && rawValue.includes(".")) {
    const lastComma = rawValue.lastIndexOf(",");
    const lastDot = rawValue.lastIndexOf(".");

    normalized =
      lastComma > lastDot
        ? rawValue.replace(/\./g, "").replace(",", ".")
        : rawValue.replace(/,/g, "");
  } else if (rawValue.includes(",")) {
    normalized = rawValue.replace(",", ".");
  }

  if (!normalized) {
    return Number.NaN;
  }

  return Number(normalized);
}

export function buildCategoryLookup(categories) {
  return categories.reduce((lookup, category) => {
    const key = normalizeText(category.name);
    if (key && !lookup.has(key)) {
      lookup.set(key, category);
    }
    return lookup;
  }, new Map());
}

export async function downloadWorkbook(filename, sheets) {
  const XLSX = await loadXlsx();
  const workbook = XLSX.utils.book_new();

  sheets.forEach((sheetConfig) => {
    const sheet =
      sheetConfig.type === "aoa"
        ? XLSX.utils.aoa_to_sheet(sheetConfig.data)
        : XLSX.utils.json_to_sheet(sheetConfig.data);

    if (sheetConfig.columns) {
      sheet["!cols"] = sheetConfig.columns.map((width) => ({ wch: width }));
    }

    XLSX.utils.book_append_sheet(workbook, sheet, sheetConfig.name);
  });

  XLSX.writeFile(workbook, filename);
}
