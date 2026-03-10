import { Link } from "react-router-dom";
import { useStore } from "../context/StoreContext";
import { formatPrice } from "../utils/currency";
import RatingStars from "./RatingStars";

export default function ProductCard({ product }) {
  const { addToCart, toggleWishlist, isWishlisted } = useStore();
  const wished = isWishlisted(product.id);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <Link to={`/product/${product.id}`} className="block overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="h-52 w-full object-cover transition duration-300 group-hover:scale-105"
        />
      </Link>
      <div className="flex flex-1 flex-col space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
            {product.category}
          </span>
          {product.badge ? (
            <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
              {product.badge}
            </span>
          ) : null}
        </div>
        <Link to={`/product/${product.id}`}>
          <h3 className="line-clamp-2 text-lg font-semibold text-slate-900">{product.name}</h3>
        </Link>
        <p className="line-clamp-2 text-sm text-slate-600">{product.description}</p>
        <div className="mt-auto flex items-center justify-between">
          <div>
            <p className="text-xl font-bold text-slate-900">{formatPrice(product.price)}</p>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <RatingStars value={product.rating} />
              <span>({product.reviews})</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleWishlist(product.id)}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                wished
                  ? "bg-rose-100 text-rose-700 hover:bg-rose-200"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {wished ? "Saved" : "Save"}
            </button>
            <button
              onClick={() => addToCart(product.id)}
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
