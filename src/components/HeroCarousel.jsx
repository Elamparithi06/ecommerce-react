import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const slides = [
  {
    id: "trend-1",
    title: "Mega Deals on Fashion & Electronics",
    subtitle: "Trending picks updated daily. Save big on top categories.",
    cta: "Explore Deals",
    to: "/shop",
    image:
      "https://images.unsplash.com/photo-1607082350899-7e105aa886ae?auto=format&fit=crop&w=1800&q=80",
  },
  {
    id: "trend-2",
    title: "Home Essentials Under Rs 50",
    subtitle: "Kitchen, decor, and utility products with fast delivery.",
    cta: "Shop Home",
    to: "/shop",
    image:
      "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1800&q=80",
  },
  {
    id: "trend-3",
    title: "Beauty & Wellness Best Sellers",
    subtitle: "Top-rated skincare and personal care products this week.",
    cta: "See Best Sellers",
    to: "/shop",
    image:
      "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1800&q=80",
  },
];

export default function HeroCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative w-full overflow-hidden rounded-3xl">
      <div
        className="flex transition-transform duration-500"
        style={{ transform: `translateX(-${activeIndex * 100}%)` }}
      >
        {slides.map((slide) => (
          <article key={slide.id} className="relative min-w-full">
            <img src={slide.image} alt={slide.title} className="h-[220px] w-full object-cover sm:h-[300px] md:h-[420px]" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-900/40 to-transparent" />
            <div className="absolute inset-0 flex items-center px-5 sm:px-8 md:px-12">
              <div className="max-w-xl space-y-3 text-white">
                <p className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold tracking-wide">
                  Trending Now
                </p>
                <h1 className="text-2xl font-black leading-tight sm:text-3xl md:text-5xl">
                  {slide.title}
                </h1>
                <p className="text-sm text-slate-100 sm:text-base">{slide.subtitle}</p>
                <Link
                  to={slide.to}
                  className="inline-block rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-900 transition hover:bg-slate-200 sm:px-5 sm:py-3"
                >
                  {slide.cta}
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            onClick={() => setActiveIndex(index)}
            aria-label={`Go to slide ${index + 1}`}
            className={`h-2.5 w-2.5 rounded-full transition ${
              activeIndex === index ? "bg-white" : "bg-white/50"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
