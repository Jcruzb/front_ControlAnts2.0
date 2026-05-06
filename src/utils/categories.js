export function buildCategoryMap(categories = []) {
  return categories.reduce((map, category) => {
    if (category?.id !== null && category?.id !== undefined) {
      map.set(String(category.id), category);
    }

    return map;
  }, new Map());
}

export function getCategoryDisplayName(item, categoryMap = new Map()) {
  if (typeof item?.category_detail?.name === "string" && item.category_detail.name.trim()) {
    return item.category_detail.name.trim();
  }

  if (typeof item?.category_name === "string" && item.category_name.trim()) {
    return item.category_name.trim();
  }

  if (typeof item?.category?.name === "string" && item.category.name.trim()) {
    return item.category.name.trim();
  }

  if (
    typeof item?.category === "number" ||
    (typeof item?.category === "string" && item.category.trim())
  ) {
    const category = categoryMap.get(String(item.category));
    if (typeof category?.name === "string" && category.name.trim()) {
      return category.name.trim();
    }
  }

  return "Sin categoría";
}

export function getCategoryDisplayIcon(item, categoryMap = new Map(), fallback = "•") {
  if (typeof item?.category_detail?.icon === "string" && item.category_detail.icon.trim()) {
    return item.category_detail.icon.trim();
  }

  if (typeof item?.category_icon === "string" && item.category_icon.trim()) {
    return item.category_icon.trim();
  }

  if (typeof item?.category?.icon === "string" && item.category.icon.trim()) {
    return item.category.icon.trim();
  }

  if (
    typeof item?.category === "number" ||
    (typeof item?.category === "string" && item.category.trim())
  ) {
    const category = categoryMap.get(String(item.category));
    if (typeof category?.icon === "string" && category.icon.trim()) {
      return category.icon.trim();
    }
  }

  return fallback;
}

export function getCategoryDisplayColor(item, categoryMap = new Map()) {
  if (typeof item?.category_detail?.color === "string" && item.category_detail.color.trim()) {
    return item.category_detail.color.trim();
  }

  if (typeof item?.category?.color === "string" && item.category.color.trim()) {
    return item.category.color.trim();
  }

  if (
    typeof item?.category === "number" ||
    (typeof item?.category === "string" && item.category.trim())
  ) {
    const category = categoryMap.get(String(item.category));
    if (typeof category?.color === "string" && category.color.trim()) {
      return category.color.trim();
    }
  }

  return null;
}
