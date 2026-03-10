import { useRef } from "react";
import ProductCard from "./ProductCard";

export default function ProductRowCarousel({ title, products = [], subtitle = "" }) {
  const scrollerRef = useRef(null);

  function scrollRow(direction) {
    if (!scrollerRef.current) return;
    const width = scrollerRef.current.clientWidth;
    scrollerRef.current.scrollBy({
      left: direction === "left" ? -width * 0.9 : width * 0.9,
      behavior: "smooth",
    });
  }

  if (!products.length) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black">{title}</h2>
          {subtitle ? <p className="text-sm text-slate-600">{subtitle}</p> : null}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => scrollRow("left")}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            ←
          </button>
          <button
            onClick={() => scrollRow("right")}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            →
          </button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:thin]"
      >
        {products.map((product) => (
          <div
            key={product.id}
            className="min-w-[78%] snap-start sm:min-w-[46%] lg:min-w-[31%] xl:min-w-[24%]"
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
