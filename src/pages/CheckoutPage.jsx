import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useStore } from "../context/StoreContext";
import { formatPrice } from "../utils/currency";

function isValidAddress(address) {
  return Boolean(
    address?.fullName &&
      address?.email &&
      address?.address &&
      address?.city &&
      address?.state &&
      address?.zip
  );
}

function formatAddressLine(address) {
  return [address.address, address.city, address.state, address.zip, address.country || "India"]
    .filter(Boolean)
    .join(", ");
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const {
    cartDetails,
    shipping,
    setShipping,
    catalogLoading,
    currentUser,
    addresses,
    selectedAddressId,
    setSelectedAddressId,
    addAddress,
    paymentMethod,
    setPaymentMethod,
    paymentMethods,
    placeOrder,
    appliedCoupon,
  } = useStore();

  const [addNewAddress, setAddNewAddress] = useState(false);
  const [error, setError] = useState("");
  const [paymentInfo, setPaymentInfo] = useState({
    cardName: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
    upiId: "",
    bankName: "",
  });

  const { merged, subtotal, shippingFee, discount, tax, total } = cartDetails;
  const canSaveAddress =
    shipping.fullName &&
    shipping.email &&
    shipping.address &&
    shipping.city &&
    shipping.state &&
    shipping.zip;

  const validAddresses = useMemo(
    () => addresses.filter((item) => item?.id && isValidAddress(item)),
    [addresses]
  );

  const hasSelectedSavedAddress = validAddresses.some((item) => item.id === selectedAddressId);

  if (catalogLoading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
        <p className="text-xl font-semibold text-slate-900">Loading checkout...</p>
      </section>
    );
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setShipping((prev) => ({ ...prev, [name]: value }));
  }

  function handlePaymentChange(event) {
    const { name, value } = event.target;
    setPaymentInfo((prev) => ({ ...prev, [name]: value }));
  }

  function getPaymentValidationError() {
    if (paymentMethod === "card") {
      if (!paymentInfo.cardName.trim()) return "Card holder name is required.";
      if (!/^\d{12,19}$/.test(paymentInfo.cardNumber.replace(/\s+/g, ""))) {
        return "Enter a valid card number.";
      }
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(paymentInfo.expiry)) {
        return "Expiry must be in MM/YY format.";
      }
      if (!/^\d{3,4}$/.test(paymentInfo.cvv)) {
        return "Enter a valid CVV.";
      }
    }
    if (paymentMethod === "upi") {
      if (!/^[\w.\-]{2,}@[A-Za-z]{2,}$/.test(paymentInfo.upiId.trim())) {
        return "Enter a valid UPI ID (example: name@okicici).";
      }
    }
    if (paymentMethod === "netbanking" && !paymentInfo.bankName) {
      return "Please select a bank for Net Banking.";
    }
    return "";
  }

  function submitOrder(event) {
    event.preventDefault();
    if (!merged.length) {
      setError("Your cart is empty.");
      return;
    }
    if (!hasSelectedSavedAddress && !canSaveAddress) {
      setError("Please add/select a shipping address.");
      return;
    }

    const paymentError = getPaymentValidationError();
    if (paymentError) {
      setError(paymentError);
      return;
    }

    if (addNewAddress && canSaveAddress) {
      addAddress(shipping);
    }

    setError("");
    const result = placeOrder();
    if (!result.ok) {
      setError(result.message);
      return;
    }
    navigate(`/orders/${result.order.id}`);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <form onSubmit={submitOrder} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5">
        <h1 className="text-2xl font-black">Checkout</h1>
        <p className="mt-1 text-sm text-slate-600">
          {currentUser ? `Signed in as ${currentUser.name}` : "Guest checkout enabled"}
        </p>

        {validAddresses.length ? (
          <section className="mt-5 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm font-semibold text-slate-800">Saved addresses</p>
            <div className="grid gap-2">
              {validAddresses.map((address) => (
                <label
                  key={address.id}
                  className="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-200 bg-white p-3 text-sm"
                >
                  <input
                    type="radio"
                    name="selectedAddress"
                    checked={selectedAddressId === address.id}
                    onChange={() => setSelectedAddressId(address.id)}
                  />
                  <span className="space-y-1">
                    <span className="block font-semibold text-slate-900">{address.fullName}</span>
                    <span className="block text-slate-700">{formatAddressLine(address)}</span>
                    <span className="block text-xs text-slate-500">{address.email}</span>
                  </span>
                </label>
              ))}
            </div>
          </section>
        ) : (
          <section className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-600">
            No saved addresses yet. Add a new address to continue.
          </section>
        )}

        <label className="inline-flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={addNewAddress}
            onChange={(event) => setAddNewAddress(event.target.checked)}
          />
          {validAddresses.length ? "Use a new address" : "Add new address"}
        </label>

        {addNewAddress ? (
          <section className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2">
            <p className="sm:col-span-2 text-sm font-semibold text-slate-800">Shipping details</p>
            <input
              name="fullName"
              placeholder="Full name *"
              value={shipping.fullName}
              onChange={handleChange}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-teal-500 focus:ring-2 sm:col-span-2"
            />
            <input
              name="email"
              type="email"
              placeholder="Email *"
              value={shipping.email}
              onChange={handleChange}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-teal-500 focus:ring-2 sm:col-span-2"
            />
            <input
              name="address"
              placeholder="Address *"
              value={shipping.address}
              onChange={handleChange}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-teal-500 focus:ring-2 sm:col-span-2"
            />
            <input
              name="city"
              placeholder="City *"
              value={shipping.city}
              onChange={handleChange}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-teal-500 focus:ring-2"
            />
            <input
              name="state"
              placeholder="State *"
              value={shipping.state}
              onChange={handleChange}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-teal-500 focus:ring-2"
            />
            <input
              name="zip"
              placeholder="ZIP code *"
              value={shipping.zip}
              onChange={handleChange}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-teal-500 focus:ring-2"
            />
            <input
              name="country"
              placeholder="Country"
              value={shipping.country}
              onChange={handleChange}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-teal-500 focus:ring-2"
            />
          </section>
        ) : null}

        <section className="mt-5 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-sm font-semibold text-slate-800">Payment Method</p>
          <div className="grid gap-2">
            {paymentMethods.map((method) => (
              <label
                key={method.id}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white p-2 text-sm"
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === method.id}
                  onChange={() => setPaymentMethod(method.id)}
                />
                {method.label}
              </label>
            ))}
          </div>

          {paymentMethod === "card" ? (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <input
                name="cardName"
                value={paymentInfo.cardName}
                onChange={handlePaymentChange}
                placeholder="Name on card *"
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-teal-500 focus:ring-2 sm:col-span-2"
              />
              <input
                name="cardNumber"
                value={paymentInfo.cardNumber}
                onChange={handlePaymentChange}
                placeholder="Card number *"
                inputMode="numeric"
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-teal-500 focus:ring-2 sm:col-span-2"
              />
              <input
                name="expiry"
                value={paymentInfo.expiry}
                onChange={handlePaymentChange}
                placeholder="MM/YY *"
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-teal-500 focus:ring-2"
              />
              <input
                name="cvv"
                value={paymentInfo.cvv}
                onChange={handlePaymentChange}
                placeholder="CVV *"
                inputMode="numeric"
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-teal-500 focus:ring-2"
              />
            </div>
          ) : null}

          {paymentMethod === "upi" ? (
            <div className="mt-3">
              <input
                name="upiId"
                value={paymentInfo.upiId}
                onChange={handlePaymentChange}
                placeholder="UPI ID (name@bank) *"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-teal-500 focus:ring-2"
              />
            </div>
          ) : null}

          {paymentMethod === "netbanking" ? (
            <div className="mt-3">
              <select
                name="bankName"
                value={paymentInfo.bankName}
                onChange={handlePaymentChange}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-teal-500 focus:ring-2"
              >
                <option value="">Select your bank *</option>
                <option value="sbi">State Bank of India</option>
                <option value="hdfc">HDFC Bank</option>
                <option value="icici">ICICI Bank</option>
                <option value="axis">Axis Bank</option>
              </select>
            </div>
          ) : null}

          {paymentMethod === "cod" ? (
            <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Cash on Delivery may include verification at delivery time.
            </p>
          ) : null}
        </section>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <input
            type="submit"
            disabled={!merged.length}
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-700"
            value="Place Order"
          />
          <Link
            to="/cart"
            className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700"
          >
            Back to Cart
          </Link>
        </div>

        {error ? <p className="mt-3 text-sm font-semibold text-rose-600">{error}</p> : null}
      </form>

      <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 lg:sticky lg:top-24">
        <h2 className="text-lg font-black">Summary</h2>
        {merged.length ? (
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {merged.map((item) => (
              <li key={item.id} className="flex justify-between gap-2">
                <span className="line-clamp-1">
                  {item.name} x{item.quantity}
                </span>
                <span>{formatPrice(item.lineTotal)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-slate-600">
            No items in cart. <Link to="/shop">Go shopping.</Link>
          </p>
        )}
        <div className="mt-4 space-y-2 border-t border-slate-200 pt-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">Items</span>
            <span>{merged.reduce((sum, item) => sum + item.quantity, 0)}</span>
          </div>
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
          {appliedCoupon ? (
            <div className="flex justify-between">
              <span className="text-slate-600">Coupon</span>
              <span>{appliedCoupon.code}</span>
            </div>
          ) : null}
          <div className="flex justify-between text-base font-bold">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>
      </aside>
    </div>
  );
}
