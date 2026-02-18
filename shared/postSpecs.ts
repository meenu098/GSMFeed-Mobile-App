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
      record.id,
      record.code,
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

const TRADING_FEED_ARRAY_KEYS = [
  "trading_feeds",
  "trading_feed",
  "feeds",
  "items",
  "data",
  "results",
] as const;

const resolveNumericObjectItem = (value: Record<string, unknown>) => {
  const numericKeys = Object.keys(value)
    .filter((key) => /^\d+$/.test(key))
    .sort((a, b) => Number(a) - Number(b));

  if (!numericKeys.length) return null;
  return value[numericKeys[0]] ?? null;
};

const resolveTradingFeedRecord = (value: unknown): Record<string, any> | null => {
  if (!value) return null;

  if (Array.isArray(value)) {
    for (const entry of value) {
      const resolved = resolveTradingFeedRecord(entry);
      if (resolved) return resolved;
    }
    return null;
  }

  if (typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  const hasDirectTradingFields =
    "qty" in record ||
    "quantity" in record ||
    "type" in record ||
    "price" in record ||
    "product_id" in record ||
    "product" in record ||
    "images" in record ||
    "storage" in record ||
    "grade" in record ||
    "spec" in record ||
    "specs" in record;

  if (hasDirectTradingFields) {
    return record as Record<string, any>;
  }

  const fromNumeric = resolveNumericObjectItem(record);
  if (fromNumeric) {
    const resolved = resolveTradingFeedRecord(fromNumeric);
    if (resolved) return resolved;
  }

  for (const key of TRADING_FEED_ARRAY_KEYS) {
    const nested = resolveTradingFeedRecord(record[key]);
    if (nested) return nested;
  }

  return null;
};

export const resolvePrimaryTradingFeed = (post: any) => {
  return (
    resolveTradingFeedRecord(post?.trading_feeds) ||
    resolveTradingFeedRecord(post?.trading_feed) ||
    resolveTradingFeedRecord(post?.tradingData) ||
    resolveTradingFeedRecord(post?.trading_data) ||
    resolveTradingFeedRecord(post?.feed) ||
    {}
  );
};

export type PostSpecs = {
  qty: NullableText;
  spec: NullableText;
  grade: NullableText;
  storage: NullableText;
};

export const extractPostSpecs = (post: any, tradingData: any): PostSpecs => {
  const resolvedTradingData =
    resolveTradingFeedRecord(tradingData) || resolvePrimaryTradingFeed(post);

  return {
    qty: pickFirst(
      resolvedTradingData?.qty,
      resolvedTradingData?.quantity,
      resolvedTradingData?.stock_qty,
      resolvedTradingData?.stock,
      resolvedTradingData?.available_qty,
      resolvedTradingData?.available_stock,
      post?.trading_feed?.qty,
      post?.trading_feed?.quantity,
      post?.trading_data?.qty,
      post?.trading_data?.quantity,
      post?.tradingData?.qty,
      post?.tradingData?.quantity,
      post?.trading_feeds?.[0]?.qty,
      post?.trading_feeds?.[0]?.quantity,
      post?.trading_feeds?.qty,
      post?.trading_feeds?.quantity,
      post?.trading_feed_data?.qty,
      post?.trading_feed_data?.quantity,
      post?.feed?.qty,
      post?.feed?.quantity,
      post?.details?.qty,
      post?.details?.quantity,
      post?.extra_details?.qty,
      post?.extra_details?.quantity,
      post?.specification?.qty,
      post?.specification?.quantity,
      post?.specs?.qty,
      post?.specs?.quantity,
      post?.product?.qty,
      post?.product?.quantity,
      post?.product_details?.qty,
      post?.product_details?.quantity,
      post?.trading?.qty,
      post?.trading?.quantity,
      post?.trade?.qty,
      post?.trade?.quantity,
      post?.metadata?.qty,
      post?.metadata?.quantity,
      post?.attrs?.qty,
      post?.attrs?.quantity,
      post?.attributes?.qty,
      post?.attributes?.quantity,
      post?.data?.qty,
      post?.data?.quantity,
      post?.payload?.qty,
      post?.payload?.quantity,
      post?.item?.qty,
      post?.item?.quantity,
      post?.main_post?.qty,
      post?.main_post?.quantity,
      post?.post?.qty,
      post?.post?.quantity,
      post?.qty,
      post?.quantity,
      post?.stock_qty,
      post?.stock,
      post?.available_qty,
      post?.available_stock,
    ),
    spec: pickFirst(
      resolvedTradingData?.spec,
      resolvedTradingData?.specs,
      resolvedTradingData?.psec,
      resolvedTradingData?.specification,
      resolvedTradingData?.spec_name,
      resolvedTradingData?.spec_value,
      resolvedTradingData?.spec_label,
      resolvedTradingData?.specification_name,
      resolvedTradingData?.product?.spec,
      resolvedTradingData?.product?.specs,
      resolvedTradingData?.product?.psec,
      resolvedTradingData?.product?.specification,
      resolvedTradingData?.product?.spec_name,
      resolvedTradingData?.product_spec,
      post?.trading_feed?.spec,
      post?.trading_feed?.specs,
      post?.trading_feed?.psec,
      post?.trading_feed?.specification,
      post?.trading_data?.spec,
      post?.trading_data?.specs,
      post?.trading_data?.psec,
      post?.trading_data?.specification,
      post?.tradingData?.spec,
      post?.tradingData?.specs,
      post?.tradingData?.psec,
      post?.tradingData?.specification,
      post?.trading_feeds?.[0]?.spec,
      post?.trading_feeds?.[0]?.specs,
      post?.trading_feeds?.[0]?.psec,
      post?.trading_feeds?.[0]?.specification,
      post?.trading_feeds?.spec,
      post?.trading_feeds?.specs,
      post?.trading_feeds?.psec,
      post?.trading_feeds?.specification,
      post?.trading_feed_data?.spec,
      post?.trading_feed_data?.specs,
      post?.feed?.spec,
      post?.feed?.specs,
      post?.details?.spec,
      post?.details?.specs,
      post?.extra_details?.spec,
      post?.extra_details?.specs,
      post?.specification?.spec,
      post?.specification?.specs,
      post?.specs?.spec,
      post?.specs?.specs,
      post?.product?.spec,
      post?.product?.specs,
      post?.product_details?.spec,
      post?.product_details?.specs,
      post?.trading?.spec,
      post?.trading?.specs,
      post?.trade?.spec,
      post?.trade?.specs,
      post?.metadata?.spec,
      post?.metadata?.specs,
      post?.attrs?.spec,
      post?.attrs?.specs,
      post?.attributes?.spec,
      post?.attributes?.specs,
      post?.data?.spec,
      post?.data?.specs,
      post?.payload?.spec,
      post?.payload?.specs,
      post?.item?.spec,
      post?.item?.specs,
      post?.main_post?.spec,
      post?.main_post?.specs,
      post?.post?.spec,
      post?.post?.specs,
      post?.spec,
      post?.specs,
      post?.psec,
      post?.specification,
      post?.spec_name,
      post?.spec_value,
      post?.spec_label,
      post?.specification_name,
      post?.product?.spec,
      post?.product?.specs,
      post?.product?.psec,
      post?.product?.specification,
      post?.product?.spec_name,
      resolvedTradingData?.spec_id,
      post?.spec_id,
    ),
    grade: pickFirst(
      resolvedTradingData?.grade,
      resolvedTradingData?.grade_name,
      resolvedTradingData?.grade_value,
      resolvedTradingData?.grade_label,
      resolvedTradingData?.product?.grade,
      post?.trading_feed?.grade,
      post?.trading_data?.grade,
      post?.tradingData?.grade,
      post?.trading_feeds?.[0]?.grade,
      post?.trading_feeds?.grade,
      post?.trading_feed_data?.grade,
      post?.feed?.grade,
      post?.details?.grade,
      post?.extra_details?.grade,
      post?.specification?.grade,
      post?.specs?.grade,
      post?.product?.grade,
      post?.product_details?.grade,
      post?.trading?.grade,
      post?.trade?.grade,
      post?.metadata?.grade,
      post?.attrs?.grade,
      post?.attributes?.grade,
      post?.data?.grade,
      post?.payload?.grade,
      post?.item?.grade,
      post?.main_post?.grade,
      post?.post?.grade,
      post?.grade,
      post?.grade_name,
      post?.grade_value,
      post?.grade_label,
      post?.product?.grade,
      resolvedTradingData?.grade_id,
      post?.grade_id,
    ),
    storage: pickFirst(
      resolvedTradingData?.storage,
      resolvedTradingData?.storage_name,
      resolvedTradingData?.storage_value,
      resolvedTradingData?.storage_label,
      resolvedTradingData?.memory,
      resolvedTradingData?.capacity,
      resolvedTradingData?.product?.storage,
      resolvedTradingData?.product?.memory,
      resolvedTradingData?.product?.capacity,
      post?.trading_feed?.storage,
      post?.trading_data?.storage,
      post?.tradingData?.storage,
      post?.trading_feeds?.[0]?.storage,
      post?.trading_feeds?.storage,
      post?.trading_feed_data?.storage,
      post?.feed?.storage,
      post?.details?.storage,
      post?.extra_details?.storage,
      post?.specification?.storage,
      post?.specs?.storage,
      post?.product?.storage,
      post?.product_details?.storage,
      post?.trading?.storage,
      post?.trade?.storage,
      post?.metadata?.storage,
      post?.attrs?.storage,
      post?.attributes?.storage,
      post?.data?.storage,
      post?.payload?.storage,
      post?.item?.storage,
      post?.main_post?.storage,
      post?.post?.storage,
      post?.storage,
      post?.storage_name,
      post?.storage_value,
      post?.storage_label,
      post?.memory,
      post?.capacity,
      post?.product?.storage,
      post?.product?.memory,
      post?.product?.capacity,
      resolvedTradingData?.storage_id,
      post?.storage_id,
    ),
  };
};
