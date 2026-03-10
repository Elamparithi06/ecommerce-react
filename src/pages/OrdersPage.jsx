import { Link } from "react-router-dom";
import { useStore } from "../context/StoreContext";
import { formatPrice } from "../utils/currency";

export default function OrdersPage() {
  const { orders } = useStore();

  if (!orders.length) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <p className="text-xl font-bold text-slate-900">No orders yet.</p>
        <Link to="/shop" className="mt-3 inline-block text-sm font-semibold text-slate-700">
          Start shopping
        </Link>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black">Your Orders</h1>
      {orders.map((order) => (
        <article key={order.id} className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-bold text-slate-900">{order.id}</p>
            <p className="text-sm text-slate-600">{new Date(order.createdAt).toLocaleString()}</p>
          </div>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-700">
            <span>Status: {order.status}</span>
            <span>Items: {order.items.length}</span>
            <span>Total: {formatPrice(order.summary.total)}</span>
          </div>
          <Link
            to={`/orders/${order.id}`}
            className="mt-3 inline-block rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
          >
            View Details
          </Link>
        </article>
      ))}
    </div>
  );
}
