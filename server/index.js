import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { getCatalog, getProductById, getProductReviews } from "./services/catalogService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });
dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 4000);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "novacart-api",
    now: new Date().toISOString(),
  });
});

app.get("/api/products", async (req, res) => {
  const {
    provider = "mock",
    q = "",
    category = "",
    page = "1",
    limit = "24",
  } = req.query;

  try {
    const catalog = await getCatalog({
      provider: String(provider).toLowerCase(),
      query: String(q),
      category: String(category),
      page: Number(page),
      limit: Number(limit),
    });
    res.json(catalog);
  } catch (error) {
    const providerName = String(provider).toLowerCase();
    const shouldFallback = (process.env.AMAZON_FALLBACK_TO_MOCK || "true") === "true";
    const freeFallback = (process.env.FREEAPI_FALLBACK_TO_MOCK || "true") === "true";
    const omkarFallback = (process.env.OMKAR_FALLBACK_TO_FREEAPI || "true") === "true";
    if (
      (providerName === "amazon" && shouldFallback) ||
      (providerName === "freeapi" && freeFallback)
    ) {
      const fallback = await getCatalog({ provider: "mock" });
      return res.status(200).json({
        ...fallback,
        warning: `${error.message} Returned mock catalog fallback.`,
      });
    }
    if (providerName === "omkar" && omkarFallback) {
      const fallback = await getCatalog({ provider: "freeapi", page: 1, limit: Number(limit) || 24 });
      return res.status(200).json({
        ...fallback,
        warning: `${error.message} Returned freeapi fallback.`,
      });
    }
    return res.status(500).json({
      message: error.message || "Failed to load catalog.",
    });
  }
});

app.get("/api/products/:id", async (req, res) => {
  const { provider = "mock" } = req.query;
  const productId = String(req.params.id);
  try {
    const product = await getProductById({
      provider: String(provider).toLowerCase(),
      productId,
    });
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }
    return res.json(product);
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Failed to load product.",
    });
  }
});

app.get("/api/products/:id/reviews", async (req, res) => {
  const { provider = "mock" } = req.query;
  const productId = String(req.params.id);
  try {
    const reviewPayload = await getProductReviews({
      provider: String(provider).toLowerCase(),
      productId,
    });
    if (!reviewPayload) {
      return res.status(404).json({ message: "Product not found." });
    }
    return res.json(reviewPayload);
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Failed to load reviews.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`NovaCart API running on http://localhost:${PORT}`);
});
