import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { useStore } from "../context/StoreContext";
import { getProductReviews } from "../services/productService";
import { formatPrice } from "../utils/currency";
import RatingStars from "../components/RatingStars";

function clampRating(value) {
  return Math.max(1, Math.min(5, Math.round(Number(value) || 0)));
}

export default function ProductPage() {
  const navigate = useNavigate();
  const { productId } = useParams();
  const {
    products,
    addToCart,
    buyNow,
    catalogLoading,
    toggleWishlist,
    isWishlisted,
    trackRecentlyViewed,
  } = useStore();

  const product = products.find((item) => item.id === productId);
  const wished = product ? isWishlisted(product.id) : false;
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsSource, setReviewsSource] = useState("catalog-fallback");
  const [selectedImage, setSelectedImage] = useState("");

  const galleryImages = useMemo(() => {
    if (!product) return [];
    const candidates = [
      product.image,
      ...(Array.isArray(product.images) ? product.images : []),
      ...(Array.isArray(product.additionalImages) ? product.additionalImages : []),
    ].filter(Boolean);
    return [...new Set(candidates)];
  }, [product]);

  const similarProducts = useMemo(() => {
    if (!product) return [];
    const byCategory = products.filter(
      (item) => item.id !== product.id && item.category === product.category
    );
    const fallback = products.filter((item) => item.id !== product.id);
    const list = byCategory.length ? byCategory : fallback;
    return list.slice(0, 6);
  }, [product, products]);

  const aboutItems = useMemo(() => {
    if (!product?.description) return [];
    const parts = product.description
      .split(/[.!?]\s+/)
      .map((part) => part.trim())
      .filter(Boolean);
    return (parts.length ? parts : [product.description]).slice(0, 6);
  }, [product]);

  const ratingBreakdown = useMemo(() => {
    const base = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((review) => {
      const bucket = clampRating(review.rating);
      base[bucket] += 1;
    });
    const total = reviews.length;
    const avgFromReviews =
      total > 0
        ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / total
        : Number(product?.rating || 0);
    return {
      total,
      average: avgFromReviews || Number(product?.rating || 0),
      counts: base,
    };
  }, [reviews, product]);

  function formatReviewsSourceLabel(source) {
    if (source === "omkar-api") return "Omkar API";
    if (source === "freeapi-catalog") return "Free API catalog";
    if (source === "mock-catalog" || source === "local-catalog") return "Local catalog";
    if (source === "not-found") return "No source (not found)";
    return "Catalog fallback";
  }

  useEffect(() => {
    if (productId) {
      trackRecentlyViewed(productId);
    }
  }, [productId]);

  useEffect(() => {
    if (galleryImages.length) {
      setSelectedImage(galleryImages[0]);
    } else {
      setSelectedImage("");
    }
  }, [galleryImages]);

  useEffect(() => {
    let active = true;
    const fallbackReviews = Array.isArray(product?.reviewsData) ? product.reviewsData : [];
    setReviews(fallbackReviews);
    setReviewsSource("catalog-fallback");

    if (!product?.id) {
      return () => {
        active = false;
      };
    }

    const loadReviews = async () => {
      setReviewsLoading(true);
      try {
        const reviewPayload = await getProductReviews(product.id);
        if (!active) return;
        setReviewsSource(reviewPayload.source || "catalog-fallback");
        setReviews(reviewPayload.reviews || fallbackReviews);
      } catch {
        if (!active) return;
        setReviews(fallbackReviews);
        setReviewsSource("catalog-fallback");
      } finally {
        if (active) setReviewsLoading(false);
      }
    };

    loadReviews();
    return () => {
      active = false;
    };
  }, [product?.id, product?.reviewsData]);

  if (catalogLoading) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-10 text-center">
        <p className="text-xl font-semibold text-slate-900">Loading product...</p>
      </section>
    );
  }

  if (!product) {
    return (
      <section className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
        <p className="text-xl font-bold text-slate-900">Product not found.</p>
        <Link to="/shop" className="mt-3 inline-block text-sm font-semibold text-slate-700">
          Back to shop
        </Link>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <nav className="sticky top-[112px] z-20 hidden items-center gap-4 border border-slate-200 bg-white px-4 py-2 text-sm md:flex">
        <a href="#top" className="font-semibold text-slate-700 hover:text-slate-900">
          Top
        </a>
        <a href="#about" className="font-semibold text-slate-700 hover:text-slate-900">
          About this item
        </a>
        <a href="#similar" className="font-semibold text-slate-700 hover:text-slate-900">
          Similar
        </a>
        <a href="#info" className="font-semibold text-slate-700 hover:text-slate-900">
          Product information
        </a>
        <a href="#reviews" className="font-semibold text-slate-700 hover:text-slate-900">
          Reviews
        </a>
      </nav>

      <section id="top" className="rounded-lg border border-slate-200 bg-white p-4 md:p-6">
        <div className="grid items-start gap-6 xl:grid-cols-[84px_minmax(0,520px)_minmax(0,1fr)_300px]">
          <div className="order-2 flex max-h-[520px] gap-2 overflow-auto xl:order-1 xl:flex-col">
            {galleryImages.map((image, index) => (
              <button
                key={`${product.id}-img-${index}`}
                onClick={() => setSelectedImage(image)}
                className={`h-16 w-16 shrink-0 overflow-hidden rounded border ${
                  selectedImage === image ? "border-amber-500" : "border-slate-200"
                }`}
              >
                <img src={image} alt={`${product.name} ${index + 1}`} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>

          <div className="order-1 flex h-[520px] items-center justify-center rounded border border-slate-200 bg-slate-50 p-4 xl:order-2">
            <img
              src={selectedImage || product.image}
              alt={product.name}
              className="h-full w-full object-contain"
            />
          </div>

          <div className="order-3 space-y-3">
            <p className="text-xs text-slate-500">Brand: {product.category}</p>
            <h1 className="text-3xl leading-tight text-slate-900">{product.name}</h1>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span>{Number(product.rating).toFixed(1)}</span>
              <RatingStars value={product.rating} />
              <span>({product.reviews} ratings)</span>
            </div>
            {product.badge ? (
              <span className="inline-block rounded bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800">
                {product.badge}
              </span>
            ) : null}
            <p className="text-4xl font-black text-slate-900">{formatPrice(product.price)}</p>
            <p className="text-sm text-slate-600">Inclusive of all taxes</p>
            <div className="border-t border-slate-200 pt-3">
              <p className="text-sm text-slate-600">See full details in the “About this item” section below.</p>
            </div>
          </div>

          <aside className="order-4 h-fit space-y-3 rounded border border-slate-300 p-4 xl:sticky xl:top-[150px]">
            <p className="text-3xl font-black text-slate-900">{formatPrice(product.price)}</p>
            <p className="text-sm text-emerald-700">In stock</p>
            <p className="text-sm text-slate-600">Delivery in 2-3 days to your location.</p>
            <button
              onClick={() => addToCart(product.id)}
              className="w-full rounded-full bg-amber-400 px-5 py-2 text-sm font-bold text-slate-900 transition hover:bg-amber-300"
            >
              Add to Cart
            </button>
            <button
              onClick={() => {
                buyNow(product.id);
                navigate("/checkout");
              }}
              className="w-full rounded-full bg-orange-400 px-5 py-2 text-sm font-bold text-slate-900 transition hover:bg-orange-300"
            >
              Buy Now
            </button>
            <button
              onClick={() => toggleWishlist(product.id)}
              className={`w-full rounded-full px-5 py-2 text-sm font-bold transition ${
                wished
                  ? "bg-rose-100 text-rose-700 hover:bg-rose-200"
                  : "border border-slate-300 text-slate-700 hover:bg-slate-100"
              }`}
            >
              {wished ? "Wishlisted" : "Add to Wishlist"}
            </button>
          </aside>
        </div>
      </section>

      <section id="about" className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-3xl font-black text-slate-900">About this item</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-base text-slate-700">
          {aboutItems.map((line, index) => (
            <li key={`${product.id}-about-long-${index}`}>{line}</li>
          ))}
        </ul>
      </section>

      <section id="info" className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-3xl font-black text-slate-900">Product information</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <table className="w-full border-collapse text-sm">
            <tbody>
              <tr className="border-b border-slate-200">
                <th className="w-1/2 bg-slate-50 px-3 py-2 text-left font-semibold text-slate-700">Brand</th>
                <td className="px-3 py-2 text-slate-800">{product.category}</td>
              </tr>
              <tr className="border-b border-slate-200">
                <th className="bg-slate-50 px-3 py-2 text-left font-semibold text-slate-700">Item ID</th>
                <td className="px-3 py-2 text-slate-800">{product.id}</td>
              </tr>
              <tr className="border-b border-slate-200">
                <th className="bg-slate-50 px-3 py-2 text-left font-semibold text-slate-700">Rating</th>
                <td className="px-3 py-2 text-slate-800">{Number(product.rating).toFixed(1)} / 5</td>
              </tr>
              <tr>
                <th className="bg-slate-50 px-3 py-2 text-left font-semibold text-slate-700">Reviews</th>
                <td className="px-3 py-2 text-slate-800">{product.reviews}</td>
              </tr>
            </tbody>
          </table>

          <table className="w-full border-collapse text-sm">
            <tbody>
              <tr className="border-b border-slate-200">
                <th className="w-1/2 bg-slate-50 px-3 py-2 text-left font-semibold text-slate-700">Stock</th>
                <td className="px-3 py-2 text-slate-800">{product.stock}</td>
              </tr>
              <tr className="border-b border-slate-200">
                <th className="bg-slate-50 px-3 py-2 text-left font-semibold text-slate-700">Badge</th>
                <td className="px-3 py-2 text-slate-800">{product.badge || "None"}</td>
              </tr>
              <tr className="border-b border-slate-200">
                <th className="bg-slate-50 px-3 py-2 text-left font-semibold text-slate-700">Price</th>
                <td className="px-3 py-2 text-slate-800">{formatPrice(product.price)}</td>
              </tr>
              <tr>
                <th className="bg-slate-50 px-3 py-2 text-left font-semibold text-slate-700">Data source</th>
                <td className="px-3 py-2 text-slate-800">{formatReviewsSourceLabel(reviewsSource)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="similar" className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-3xl font-black text-slate-900">Similar products</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {similarProducts.map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>
      </section>

      <section id="reviews" className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-3xl font-black text-slate-900">Customer reviews</h2>
          <p className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            Source: {formatReviewsSourceLabel(reviewsSource)}
          </p>
        </div>

        <div className="mt-5 grid gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="space-y-3">
            <div className="flex items-center gap-2">
              <RatingStars value={ratingBreakdown.average} />
              <p className="text-xl font-bold text-slate-900">{ratingBreakdown.average.toFixed(1)} out of 5</p>
            </div>
            <p className="text-sm text-slate-600">
              {ratingBreakdown.total || product.reviews} global ratings
            </p>
            {[5, 4, 3, 2, 1].map((star) => {
              const count = ratingBreakdown.counts[star];
              const percent = ratingBreakdown.total ? Math.round((count / ratingBreakdown.total) * 100) : 0;
              return (
                <div key={`star-${star}`} className="flex items-center gap-2 text-sm">
                  <span className="w-10 text-slate-700">{star} star</span>
                  <div className="h-4 flex-1 overflow-hidden rounded border border-slate-200 bg-white">
                    <div className="h-full bg-amber-400" style={{ width: `${percent}%` }} />
                  </div>
                  <span className="w-10 text-right text-slate-600">{percent}%</span>
                </div>
              );
            })}
          </aside>

          <div>
            {reviewsLoading && !reviews.length ? (
              <p className="text-sm text-slate-600">Loading reviews...</p>
            ) : reviews.length ? (
              <ul className="space-y-4">
                {reviews.map((review) => (
                  <li key={review.id} className="border-b border-slate-200 pb-4">
                    <p className="text-sm font-semibold text-slate-900">{review.author}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <p className="text-amber-500">
                        {Array.from({ length: clampRating(review.rating) }).map((_, idx) => (
                          <span key={`${review.id}-${idx}`}>★</span>
                        ))}
                      </p>
                      <p className="text-sm font-semibold text-slate-900">{review.title || "Review"}</p>
                    </div>
                    <p className="text-xs text-slate-500">{review.date || "Verified review"}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{review.comment}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-600">No detailed reviews available for this product.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
