import { useMemo } from "react";
import { Link } from "react-router-dom";
import HeroCarousel from "../components/HeroCarousel";
import ProductCard from "../components/ProductCard";
import ProductRowCarousel from "../components/ProductRowCarousel";
import { useStore } from "../context/StoreContext";

export default function HomePage() {
  const { products, catalogLoading, recentlyViewedProducts } = useStore();
  const featured = products.slice(0, 4);
  const topDeals = useMemo(() => [...products].sort((a, b) => a.price - b.price).slice(0, 10), [products]);
  const topRated = useMemo(
    () => [...products].sort((a, b) => b.rating - a.rating).slice(0, 10),
    [products]
  );
  const electronics = useMemo(
    () =>
      products
        .filter((item) => {
          const cat = item.category?.toLowerCase() || "";
          return cat.includes("elect");
        })
        .slice(0, 10),
    [products]
  );
  const fashion = useMemo(
    () =>
      products
        .filter((item) => {
          const cat = item.category?.toLowerCase() || "";
          return cat.includes("fashion") || cat.includes("cloth") || cat.includes("jewel");
        })
        .slice(0, 10),
    [products]
  );
  const home = useMemo(
    () =>
      products
        .filter((item) => {
          const cat = item.category?.toLowerCase() || "";
          return cat.includes("home") || cat.includes("furniture") || cat.includes("kitchen");
        })
        .slice(0, 10),
    [products]
  );

  return (
    <div className="space-y-12">
      <HeroCarousel />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-2xl font-black text-slate-900">2-day shipping</p>
          <p className="mt-1 text-slate-600">Fast delivery on all domestic orders.</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-2xl font-black text-slate-900">30-day returns</p>
          <p className="mt-1 text-slate-600">Not right for you? Easy refund process.</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-2xl font-black text-slate-900">Secure checkout</p>
          <p className="mt-1 text-slate-600">Protected payment and encrypted data flow.</p>
        </article>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black">Featured Products</h2>
          <Link to="/shop" className="text-sm font-semibold text-slate-700 hover:text-slate-900">
            Browse all
          </Link>
        </div>
        {catalogLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-700">
            Loading featured products...
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {!catalogLoading ? (
        <ProductRowCarousel
          title="Top Deals"
          subtitle="Lowest prices across popular categories"
          products={topDeals}
        />
      ) : null}

      {!catalogLoading ? (
        <ProductRowCarousel
          title="Top Rated Picks"
          subtitle="Most loved by customers"
          products={topRated}
        />
      ) : null}

      {!catalogLoading ? (
        <ProductRowCarousel
          title="Trending Electronics"
          subtitle="Smart picks for gadgets and devices"
          products={electronics}
        />
      ) : null}

      {!catalogLoading ? (
        <ProductRowCarousel
          title="Trending Fashion"
          subtitle="Popular style picks this week"
          products={fashion}
        />
      ) : null}

      {!catalogLoading ? (
        <ProductRowCarousel
          title="Home Essentials"
          subtitle="Popular products for your home"
          products={home}
        />
      ) : null}

      {!catalogLoading && recentlyViewedProducts.length ? (
        <ProductRowCarousel
          title="Recently Viewed"
          subtitle="Continue where you left off"
          products={recentlyViewedProducts}
        />
      ) : null}
    </div>
  );
}
