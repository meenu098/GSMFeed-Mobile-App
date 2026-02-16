type NullableText = string | null;

const normalizeText = (value: unknown): NullableText => {
  if (value === null || value === undefined) return null;

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }

  if (typeof value === "number" || typeof value === "bigint") {
    return String(value);
  }

  if (Array.isArray(value)) {
    const parts = value
      .map((entry) => normalizeText(entry))
      .filter((entry): entry is string => Boolean(entry));
    return parts.length ? parts.join(", ") : null;
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const candidates = [
      record.name,
      record.label,
      record.value,
      record.title,
      record.text,
      record.spec,
      record.specs,
      record.psec,
      record.specification,
    ];

    for (const candidate of candidates) {
      const normalized = normalizeText(candidate);
      if (normalized) return normalized;
    }
  }

  return null;
};

const pickFirst = (...values: unknown[]): NullableText => {
  for (const value of values) {
    const normalized = normalizeText(value);
    if (normalized) return normalized;
  }
  return null;
};

export type PostSpecs = {
  qty: NullableText;
  spec: NullableText;
  grade: NullableText;
  storage: NullableText;
};

export const extractPostSpecs = (post: any, tradingData: any): PostSpecs => ({
  qty: pickFirst(
    tradingData?.qty,
    tradingData?.quantity,
    tradingData?.stock_qty,
    post?.qty,
    post?.quantity,
  ),
  spec: pickFirst(
    tradingData?.spec,
    tradingData?.specs,
    tradingData?.psec,
    tradingData?.specification,
    tradingData?.spec_name,
    post?.spec,
    post?.specs,
    post?.psec,
    post?.specification,
  ),
  grade: pickFirst(
    tradingData?.grade,
    tradingData?.grade_name,
    post?.grade,
    post?.grade_name,
  ),
  storage: pickFirst(
    tradingData?.storage,
    tradingData?.storage_name,
    post?.storage,
    post?.storage_name,
  ),
});
