import { categories as mockCategories, products as mockProducts } from "../../src/data/products.js";
import { getCategories, normalizeProduct } from "../utils/normalizeProduct.js";

const USD_TO_INR_RATE = Number(process.env.USD_TO_INR_RATE || 83);
const OMKAR_CACHE_TTL_MS = Math.max(Number(process.env.OMKAR_CACHE_TTL_MS || 180000), 1000);
const omkarResponseCache = new Map();
const omkarInFlightRequests = new Map();

function isExcludedCategory(category = "") {
  const normalized = String(category || "").trim().toLowerCase();
  return normalized === "groceries" || normalized === "grocery";
}

function decodeHtmlEntities(value = "") {
  if (typeof value !== "string" || !value) return value;
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function parseAmount(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9.-]/g, "");
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function toInrPrice(value, currency = "") {
  const amount = parseAmount(value);
  const normalizedCurrency = String(currency || "").toUpperCase();
  if (!amount) return 0;
  if (normalizedCurrency === "INR") return amount;
  if (normalizedCurrency === "USD" || !normalizedCurrency) {
    return Number((amount * USD_TO_INR_RATE).toFixed(2));
  }
  return amount;
}

function resolveOmkarPrice(item = {}, countryCode = "US") {
  const sourceCurrency = item.currency || (countryCode === "IN" ? "INR" : "USD");
  const candidates = [
    item.price,
    item.current_price,
    item.lowest_offer_price,
    item.original_price,
  ];
  for (const candidate of candidates) {
    const converted = toInrPrice(candidate, sourceCurrency);
    if (converted > 0) return converted;
  }
  return 0;
}

function mapAmazonItem(item, index) {
  return normalizeProduct(
    {
      id: item.asin || item.id || index,
      name: item.title || item.name,
      category: item.category || item.productGroup || "Amazon",
      price: toInrPrice(
        item.price?.amount ||
          item.price?.value ||
          item.offers?.listings?.[0]?.price?.amount ||
          item.amount,
        item.currency || item.price?.currency || "USD"
      ),
      rating: item.rating || item.customerReview?.rating,
      reviews: item.reviews || item.customerReview?.count,
      stock: item.stock || 20,
      badge: item.badge || null,
      description: item.description || item.features?.join(" "),
      image:
        item.image ||
        item.images?.primary?.large?.url ||
        item.images?.[0]?.url ||
        item.imageUrl,
    },
    index
  );
}

export async function getMockCatalog() {
  return {
    products: mockProducts.map((item, index) =>
      normalizeProduct(
        {
          ...item,
          price: toInrPrice(item.price, "USD"),
        },
        index
      )
    ),
    categories: mockCategories,
    provider: "mock",
  };
}

function buildReviewEntry(comment, fallbackRating = 4) {
  const parsedId = Number(comment.id || 1);
  const rating = Math.min(5, Math.max(1, (parsedId % 5) + 1 || fallbackRating));
  return {
    id: `r-${comment.id}`,
    author: comment.name || "Verified Customer",
    email: comment.email || "",
    rating,
    title: "Customer review",
    comment: comment.body || "Great product.",
  };
}

async function loadFreeReviewsMap(products) {
  try {
    const commentsResponse = await fetch("https://jsonplaceholder.typicode.com/comments");
    if (!commentsResponse.ok) return new Map();
    const comments = await commentsResponse.json();
    const byPostId = comments.reduce((acc, comment) => {
      const key = Number(comment.postId || 0);
      if (!acc[key]) acc[key] = [];
      acc[key].push(comment);
      return acc;
    }, {});

    const map = new Map();
    products.forEach((product, index) => {
      const bucket = byPostId[(index % 100) + 1] || [];
      const sampled = bucket.slice(0, 6).map((comment) => buildReviewEntry(comment, product.rating));
      map.set(String(product.id), sampled);
    });
    return map;
  } catch {
    return new Map();
  }
}

export async function getFreeCatalog({ query = "", category = "", page = 1, limit = 24 } = {}) {
  const response = await fetch("https://dummyjson.com/products?limit=194");
  if (!response.ok) {
    throw new Error(`Free product API failed with ${response.status}.`);
  }
  const payload = await response.json();
  const items = payload.products || [];

  const mapped = items
    .map((item, index) =>
      normalizeProduct(
        {
          id: item.id,
          name: item.title,
          category: item.category,
          price: toInrPrice(item.price, "USD"),
          rating: item.rating,
          reviews: item.reviews?.length || item.stock || 0,
          stock: item.stock,
          badge: item.discountPercentage > 15 ? "Deal" : null,
          description: item.description,
          image: item.thumbnail || item.images?.[0],
        },
        index
      )
    )
    .filter((item) => !isExcludedCategory(item.category));

  const reviewsMap = await loadFreeReviewsMap(mapped);
  const enriched = mapped.map((product) => ({
    ...product,
    reviewsData: reviewsMap.get(String(product.id)) || [],
    reviews: Math.max(product.reviews, (reviewsMap.get(String(product.id)) || []).length),
  }));

  let filtered = [...enriched];
  if (query.trim()) {
    const q = query.trim().toLowerCase();
    filtered = filtered.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }
  if (category && category !== "All") {
    filtered = filtered.filter((item) => item.category.toLowerCase() === category.toLowerCase());
  }

  const start = Math.max((page - 1) * limit, 0);
  const paged = filtered.slice(start, start + limit);

  return {
    products: paged,
    total: filtered.length,
    page,
    limit,
    categories: ["All", ...new Set(enriched.map((item) => item.category))],
    provider: "freeapi",
  };
}

export async function getAmazonCatalog({ query = "", category = "", page = 1, limit = 24 } = {}) {
  const baseUrl = process.env.AMAZON_API_BASE_URL;
  const token = process.env.AMAZON_ACCESS_TOKEN;
  const apiKey = process.env.AMAZON_API_KEY;
  const path = process.env.AMAZON_PRODUCTS_PATH || "/products";

  if (!baseUrl) {
    throw new Error("Missing AMAZON_API_BASE_URL in server environment.");
  }

  const url = new URL(path, baseUrl);
  url.searchParams.set("q", query);
  if (category) url.searchParams.set("category", category);
  url.searchParams.set("page", String(page));
  url.searchParams.set("limit", String(limit));

  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (apiKey) headers["x-api-key"] = apiKey;

  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`Amazon upstream API failed with ${response.status}.`);
  }

  const payload = await response.json();
  const list = payload.items || payload.products || payload.data || [];
  const mapped = list.map((item, index) => mapAmazonItem(item, index));

  return {
    products: mapped,
    categories: getCategories(mapped),
    provider: "amazon",
  };
}

function mapOmkarSearchItem(item, index = 0, countryCode = "US") {
  return normalizeProduct(
    {
      id: item.asin || item.id || index,
      name: decodeHtmlEntities(item.title || item.name),
      category: item.category || "Amazon",
      price: resolveOmkarPrice(item, countryCode),
      rating: item.rating || 4,
      reviews: item.reviews || 0,
      stock: item.is_prime ? 30 : 15,
      badge: item.is_best_seller ? "Best Seller" : item.is_amazon_choice ? "Amazon Choice" : null,
      description:
        item.sales_volume ||
        item.delivery_info ||
        "Live Amazon data via third-party scraper API.",
      image: item.image_url,
    },
    index
  );
}

function mapOmkarReview(review, index = 0) {
  return {
    id: `omkar-r-${review.review_id || review.id || index}`,
    author: review.reviewer_name || review.author || "Amazon Customer",
    email: "",
    rating: Number(review.rating || 4),
    title: decodeHtmlEntities(review.review_title || review.title || "Top review"),
    comment: decodeHtmlEntities(
      review.review_text || review.text || review.content || "No review text available."
    ),
    date: review.review_date || review.date || "",
    verified: Boolean(review.is_verified_purchase ?? review.verified_purchase),
    helpfulVotes: Number(review.helpful_votes || 0),
  };
}

function getOmkarConfig() {
  const apiKey = process.env.OMKAR_API_KEY;
  const countryCode = (process.env.OMKAR_COUNTRY_CODE || "US").toUpperCase();
  const baseUrl = "https://amazon-scraper-api.omkar.cloud/amazon";
  if (!apiKey) {
    throw new Error("Missing OMKAR_API_KEY in server environment.");
  }
  return { apiKey, countryCode, baseUrl };
}

function buildOmkarCacheKey(path, params = {}, countryCode = "US") {
  const entries = Object.entries({ ...params, country_code: countryCode })
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .sort(([a], [b]) => a.localeCompare(b));
  return `${path}?${entries.map(([k, v]) => `${k}=${String(v)}`).join("&")}`;
}

async function callOmkar(path, params = {}) {
  const { apiKey, countryCode, baseUrl } = getOmkarConfig();
  const cacheKey = buildOmkarCacheKey(path, params, countryCode);
  const now = Date.now();
  const cached = omkarResponseCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return cached.payload;
  }

  const inFlight = omkarInFlightRequests.get(cacheKey);
  if (inFlight) {
    return inFlight;
  }

  const url = new URL(`${baseUrl}${path}`);
  Object.entries({ ...params, country_code: countryCode }).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  const requestPromise = (async () => {
    const response = await fetch(url, {
      headers: { "API-Key": apiKey },
    });

    if (!response.ok) {
      throw new Error(`Omkar API failed with ${response.status}.`);
    }

    const payload = await response.json();
    omkarResponseCache.set(cacheKey, {
      payload,
      expiresAt: Date.now() + OMKAR_CACHE_TTL_MS,
    });
    return payload;
  })();

  omkarInFlightRequests.set(cacheKey, requestPromise);
  try {
    return await requestPromise;
  } finally {
    omkarInFlightRequests.delete(cacheKey);
  }
}

export async function getOmkarCatalog({ query = "", page = 1, limit = 24 } = {}) {
  const q = query?.trim() || process.env.OMKAR_DEFAULT_QUERY || "best sellers";
  const { countryCode } = getOmkarConfig();
  const requestedPage = Math.max(Number(page) || 1, 1);
  const requestedLimit = Math.max(Number(limit) || 24, 1);
  const maxPagesToFetch = Math.max(Number(process.env.OMKAR_MAX_PAGES || 50), 1);

  const collected = [];
  let currentPage = requestedPage;
  for (let i = 0; i < maxPagesToFetch && collected.length < requestedLimit; i += 1) {
    const payload = await callOmkar("/search", { query: q, page: currentPage });
    const list = payload.results || payload.data || [];
    if (!list.length) {
      break;
    }

    const offset = (currentPage - requestedPage) * list.length;
    const mapped = list.map((item, index) => mapOmkarSearchItem(item, offset + index, countryCode));
    collected.push(...mapped);
    currentPage += 1;
  }

  const sliced = collected.slice(0, requestedLimit);

  return {
    products: sliced,
    total: collected.length,
    page: requestedPage,
    limit: requestedLimit,
    categories: getCategories(collected),
    provider: "omkar",
  };
}

export async function getOmkarProductById(asin) {
  const { countryCode } = getOmkarConfig();
  const payload = await callOmkar("/product-details", { asin });
  const details = payload.product || payload.data || payload;
  const resolvedPrice = resolveOmkarPrice(details, countryCode);
  return normalizeProduct({
    id: details.asin || asin,
    name: decodeHtmlEntities(
      details.title || details.product_name || details.product_title || details.name
    ),
    category: details.main_category?.name || details.category || details.product_group || "Amazon",
    price: resolvedPrice,
    rating: details.rating || details.average_rating || 4,
    reviews: details.reviews || details.reviews_count || details.review_count || 0,
    stock:
      typeof details.availability === "string" && /out of stock/i.test(details.availability)
        ? 0
        : details.in_stock === false
          ? 0
          : 20,
    badge: details.is_bestseller
      ? "Best Seller"
      : details.is_amazon_choice
        ? "Amazon Choice"
        : null,
    description:
      decodeHtmlEntities(
        details.description ||
          details.full_description ||
          details.sales_volume ||
          (Array.isArray(details.key_features)
            ? details.key_features.join(" ")
            : Array.isArray(details.features)
              ? details.features.join(" ")
              : "")
      ),
    image:
      details.main_image_url ||
      details.main_image ||
      details.image ||
      details.additional_image_urls?.[0] ||
      details.images?.[0] ||
      details.image_url,
  });
}

export async function getOmkarTopReviews(asin) {
  const payload = await callOmkar("/product-reviews/top", { asin });
  const reviews = payload.results || payload.reviews || payload.data || [];
  return reviews.map((review, index) => mapOmkarReview(review, index));
}

export async function getProductById({ provider = "mock", productId = "" }) {
  if (provider === "omkar") {
    try {
      return await getOmkarProductById(productId);
    } catch {
      const fallbackCatalog = await getOmkarCatalog({ query: productId, page: 1, limit: 24 });
      return (
        fallbackCatalog.products.find((item) => item.id === String(productId)) ||
        fallbackCatalog.products[0] ||
        null
      );
    }
  }
  const catalog = await getCatalog({ provider, page: 1, limit: 500 });
  return catalog.products.find((item) => item.id === String(productId)) || null;
}

export async function getProductReviews({ provider = "mock", productId = "" }) {
  if (provider === "omkar") {
    const [product, reviews] = await Promise.all([
      getProductById({ provider, productId }),
      getOmkarTopReviews(productId).catch(() => []),
    ]);
    if (!product) return null;
    return {
      productId,
      provider: "omkar",
      source: "omkar-api",
      rating: product.rating,
      reviewsCount: product.reviews,
      reviews,
    };
  }

  const product = await getProductById({ provider, productId });
  if (!product) return null;
  return {
    productId,
    provider,
    source: `${provider}-catalog`,
    rating: product.rating,
    reviewsCount: product.reviews,
    reviews: product.reviewsData || [],
  };
}

export async function getCatalog({
  provider = "mock",
  query = "",
  category = "",
  page = 1,
  limit = 24,
}) {
  if (provider === "omkar") {
    return getOmkarCatalog({ query, category, page, limit });
  }
  if (provider === "freeapi") {
    return getFreeCatalog({ query, category, page, limit });
  }
  if (provider === "amazon") {
    return getAmazonCatalog({ query, category, page, limit });
  }
  return getMockCatalog();
}
