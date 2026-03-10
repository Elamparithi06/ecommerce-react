import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { useStore } from "../context/StoreContext";

export default function WishlistPage() {
  const { wishlistProducts } = useStore();

  if (!wishlistProducts.length) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <p className="text-xl font-bold text-slate-900">Wishlist is empty.</p>
        <Link to="/shop" className="mt-3 inline-block text-sm font-semibold text-slate-700">
          Browse products
        </Link>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black">Your Wishlist</h1>
      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {wishlistProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </section>
    </div>
  );
}
