import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { useStore } from "../context/StoreContext";

export default function ShopPage() {
  const { products, catalogLoading, catalogError, catalogWarning, catalogProvider } = useStore();
  const [searchParams] = useSearchParams();
  const queryFromUrl = searchParams.get("q") || "";
  const categoryFromUrl = searchParams.get("category") || "";
  const sortFromUrl = searchParams.get("sort") || "featured";
  const PAGE_SIZE = 24;

  const [sortBy, setSortBy] = useState(sortFromUrl);
  const [page, setPage] = useState(1);

  const preparedProducts = useMemo(() => {
    let result = [...products];

    if (queryFromUrl.trim()) {
      const term = queryFromUrl.trim().toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(term) || item.description.toLowerCase().includes(term)
      );
    }

    if (categoryFromUrl && categoryFromUrl !== "All") {
      result = result.filter((item) => item.category === categoryFromUrl);
    }

    switch (sortBy) {
      case "price-low":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        result.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
      default:
        break;
    }

    return result;
  }, [products, queryFromUrl, categoryFromUrl, sortBy]);

  useEffect(() => {
    setSortBy(sortFromUrl || "featured");
    setPage(1);
  }, [sortFromUrl, queryFromUrl, categoryFromUrl]);

  useEffect(() => {
    setPage(1);
  }, [sortBy]);

  const totalPages = Math.max(Math.ceil(preparedProducts.length / PAGE_SIZE), 1);
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const paginatedProducts = preparedProducts.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Shop Products</h1>
          <p className="mt-1 text-sm text-slate-600">
            {preparedProducts.length} results | Page {safePage} of {totalPages} | Provider: {catalogProvider}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-slate-700">Sort by</label>
          <select
            value={sortBy}
            onChange={(event) => {
              setSortBy(event.target.value);
            }}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-amber-400 focus:ring-2"
          >
            <option value="featured">Featured</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>
      </header>

      {catalogWarning ? (
        <section className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {catalogWarning}
        </section>
      ) : null}

      {catalogError ? (
        <section className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {catalogError}
        </section>
      ) : null}

      {catalogLoading ? (
        <section className="rounded-lg border border-slate-200 bg-white p-10 text-center">
          <p className="text-lg font-semibold text-slate-900">Loading products...</p>
        </section>
      ) : preparedProducts.length ? (
        <>
          <section className="grid auto-rows-fr grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {paginatedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </section>

          <section className="flex items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={safePage <= 1}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm font-semibold text-slate-700">
              {safePage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={safePage >= totalPages}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </section>
        </>
      ) : (
        <section className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-lg font-semibold text-slate-900">No products match this view.</p>
        </section>
      )}
    </div>
  );
}
