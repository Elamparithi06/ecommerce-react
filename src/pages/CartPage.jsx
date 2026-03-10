import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useStore } from "../context/StoreContext";
import { formatPrice } from "../utils/currency";

export default function CartPage() {
  const navigate = useNavigate();
  const {
    cartDetails,
    updateQuantity,
    removeFromCart,
    catalogLoading,
    moveToWishlist,
    applyCoupon,
    clearCoupon,
    appliedCoupon,
  } = useStore();
  const [couponCode, setCouponCode] = useState("");
  const [couponMessage, setCouponMessage] = useState("");
  const { merged, subtotal, shippingFee, discount, tax, total } = cartDetails;

  if (catalogLoading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
        <p className="text-xl font-semibold text-slate-900">Loading cart...</p>
      </section>
    );
  }

  if (!merged.length) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <p className="text-xl font-bold text-slate-900">Your cart is empty.</p>
        <Link
          to="/shop"
          className="mt-3 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
        >
          Start Shopping
        </Link>
      </section>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <section className="space-y-4">
        {merged.map((item) => (
          <article
            key={item.id}
            className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-[100px_1fr_auto]"
          >
            <img src={item.image} alt={item.name} className="h-24 w-24 rounded-xl object-cover" />
            <div>
              <h3 className="font-semibold text-slate-900">{item.name}</h3>
              <p className="text-sm text-slate-600">{formatPrice(item.price)} each</p>
              <div className="mt-3 inline-flex items-center rounded-lg border border-slate-300">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="px-3 py-1 text-slate-700"
                >
                  -
                </button>
                <span className="border-x border-slate-300 px-3 py-1 text-sm font-semibold">
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="px-3 py-1 text-slate-700"
                >
                  +
                </button>
              </div>
            </div>
            <div className="flex flex-col items-end justify-between">
              <p className="text-lg font-bold text-slate-900">{formatPrice(item.lineTotal)}</p>
              <button
                onClick={() => removeFromCart(item.id)}
                className="text-sm font-semibold text-rose-600 hover:text-rose-700"
              >
                Remove
              </button>
              <button
                onClick={() => moveToWishlist(item.id)}
                className="text-sm font-semibold text-slate-700 hover:text-slate-900"
              >
                Save for later
              </button>
            </div>
          </article>
        ))}
      </section>

      <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-black">Order Summary</h2>
        <div className="mt-3 space-y-2 rounded-lg bg-slate-50 p-3">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Coupon
          </label>
          <div className="flex gap-2">
            <input
              value={couponCode}
              onChange={(event) => setCouponCode(event.target.value)}
              placeholder="Enter code"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-teal-500 focus:ring-2"
            />
            <button
              onClick={() => {
                const result = applyCoupon(couponCode);
                setCouponMessage(result.message);
              }}
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
            >
              Apply
            </button>
          </div>
          {appliedCoupon ? (
            <button onClick={clearCoupon} className="text-xs font-semibold text-rose-600">
              Remove {appliedCoupon.code}
            </button>
          ) : null}
          {couponMessage ? <p className="text-xs text-slate-600">{couponMessage}</p> : null}
        </div>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Shipping</span>
            <span>{formatPrice(shippingFee)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Discount</span>
            <span>-{formatPrice(discount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Tax</span>
            <span>{formatPrice(tax)}</span>
          </div>
          <div className="mt-2 border-t border-slate-200 pt-2 text-base font-bold">
            <div className="flex justify-between">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate("/checkout")}
          className="mt-5 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-700"
        >
          Proceed to Checkout
        </button>
      </aside>
    </div>
  );
}
