import { Link, useParams } from "react-router-dom";
import { useStore } from "../context/StoreContext";
import { formatPrice } from "../utils/currency";

export default function OrderDetailPage() {
  const { orderId } = useParams();
  const { orders } = useStore();
  const order = orders.find((item) => item.id === orderId);

  if (!order) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <p className="text-xl font-bold text-slate-900">Order not found.</p>
        <Link to="/orders" className="mt-3 inline-block text-sm font-semibold text-slate-700">
          Back to orders
        </Link>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h1 className="text-2xl font-black">Order {order.id}</h1>
        <p className="mt-1 text-sm text-slate-600">Placed on {new Date(order.createdAt).toLocaleString()}</p>
        <p className="mt-2 text-sm font-semibold text-slate-800">Status: {order.status}</p>
        <p className="text-sm text-slate-600">
          Estimated delivery: {new Date(order.estimatedDelivery).toLocaleDateString()}
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-black">Tracking Timeline</h2>
        <ul className="mt-3 space-y-2">
          {order.tracking.map((track) => (
            <li key={track.time} className="rounded-lg border border-slate-200 p-3 text-sm">
              <p className="font-semibold text-slate-900">{track.status}</p>
              <p className="text-slate-600">{new Date(track.time).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-black">Items</h2>
        <ul className="mt-3 space-y-2">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-3 text-sm">
              <span>
                {item.name} x{item.quantity}
              </span>
              <span>{formatPrice(item.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 border-t border-slate-200 pt-3 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatPrice(order.summary.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping</span>
            <span>{formatPrice(order.summary.shippingFee)}</span>
          </div>
          <div className="flex justify-between">
            <span>Discount</span>
            <span>-{formatPrice(order.summary.discount)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax</span>
            <span>{formatPrice(order.summary.tax)}</span>
          </div>
          <div className="mt-2 flex justify-between text-base font-bold">
            <span>Total</span>
            <span>{formatPrice(order.summary.total)}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
