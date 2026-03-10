import { categories as mockCategories, products as mockProducts } from "../data/products";

const PROVIDER = (import.meta.env.VITE_PRODUCT_PROVIDER || "backend").toLowerCase();
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:4000").replace(
  /\/$/,
  ""
);
const BACKEND_PROVIDER = (import.meta.env.VITE_BACKEND_CATALOG_PROVIDER || "freeapi").toLowerCase();
const BACKEND_CATALOG_LIMIT = Math.max(Number(import.meta.env.VITE_BACKEND_CATALOG_LIMIT || 5000), 24);
const USD_TO_INR_RATE = Number(import.meta.env.VITE_USD_TO_INR_RATE || 83);

function isExcludedCategory(category = "") {
  const normalized = String(category || "").trim().toLowerCase();
  return normalized === "groceries" || normalized === "grocery";
}

function excludeCategories(catalog) {
  const products = Array.isArray(catalog?.products)
    ? catalog.products.filter((item) => !isExcludedCategory(item.category))
    : [];
  const categories = Array.isArray(catalog?.categories)
    ? catalog.categories.filter((item) => !isExcludedCategory(item))
    : ["All"];

  return {
    ...catalog,
    products,
    categories,
  };
}

function toInrPrice(value, currency = "USD") {
  const amount = Number(value || 0);
  const normalizedCurrency = String(currency || "").toUpperCase();
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  if (normalizedCurrency === "INR") return amount;
  if (normalizedCurrency === "USD" || !normalizedCurrency) {
    return Number((amount * USD_TO_INR_RATE).toFixed(2));
  }
  return amount;
}

function normalizeProduct(item, index = 0) {
  return {
    id: String(item.id ?? `item-${index}`),
    name: item.name || item.title || "Untitled Product",
    category: item.category || "General",
    price: Number(item.price || 0),
    rating: Number(item.rating || item.stars || 4),
    reviews: Number(item.reviews || item.reviewCount || 0),
    reviewsData: Array.isArray(item.reviewsData) ? item.reviewsData : [],
    stock: Number(item.stock || 20),
    badge: item.badge || null,
    description: item.description || "No description available.",
    image:
      item.image ||
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80",
  };
}

async function loadFromMock() {
  return excludeCategories({
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
  });
}

async function loadFromFakeStore() {
  const response = await fetch("https://fakestoreapi.com/products");
  if (!response.ok) {
    throw new Error("Fake Store API request failed.");
  }
  const raw = await response.json();
  const mapped = raw.map((item, index) =>
    normalizeProduct(
      {
        id: item.id,
        name: item.title,
        category: item.category,
        price: toInrPrice(item.price, "USD"),
        rating: item.rating?.rate,
        reviews: item.rating?.count,
        description: item.description,
        image: item.image,
        stock: Math.floor(Math.random() * 70) + 10,
      },
      index
    )
  );

  const categories = ["All", ...new Set(mapped.map((item) => item.category))];
  return excludeCategories({ products: mapped, categories, provider: "fakestore" });
}

async function loadFromBackend() {
  const response = await fetch(
    `${API_BASE_URL}/api/products?provider=${encodeURIComponent(BACKEND_PROVIDER)}&page=1&limit=${BACKEND_CATALOG_LIMIT}`
  );
  if (!response.ok) {
    throw new Error("Backend API request failed.");
  }
  const payload = await response.json();
  return excludeCategories(payload);
}

export async function getCatalog() {
  try {
    if (PROVIDER === "backend") {
      return await loadFromBackend();
    }
    if (PROVIDER === "fakestore") {
      return await loadFromFakeStore();
    }
    return await loadFromMock();
  } catch (error) {
    if (PROVIDER !== "mock") {
      const fallback = await loadFromMock();
      return {
        ...fallback,
        warning: `${error.message} Falling back to local catalog.`,
      };
    }
    throw error;
  }
}

export async function getProductReviews(productId) {
  if (!productId || PROVIDER !== "backend") {
    return {
      reviews: [],
      source: "local-catalog",
      provider: PROVIDER,
    };
  }

  const response = await fetch(
    `${API_BASE_URL}/api/products/${encodeURIComponent(productId)}/reviews?provider=${encodeURIComponent(
      BACKEND_PROVIDER
    )}`
  );

  if (response.status === 404) {
    return {
      reviews: [],
      source: "not-found",
      provider: BACKEND_PROVIDER,
    };
  }

  if (!response.ok) {
    throw new Error("Backend reviews API request failed.");
  }

  const payload = await response.json();
  return {
    reviews: Array.isArray(payload.reviews) ? payload.reviews : [],
    source: payload.source || `${BACKEND_PROVIDER}-catalog`,
    provider: payload.provider || BACKEND_PROVIDER,
  };
}
