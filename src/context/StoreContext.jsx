import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getCatalog } from "../services/productService";

const StoreContext = createContext(null);

const CART_KEY = "novacart_cart_v1";
const SHIPPING_KEY = "novacart_shipping_v1";
const USER_KEY = "novacart_user_v1";
const WISHLIST_KEY = "novacart_wishlist_v1";
const ORDERS_KEY = "novacart_orders_v1";
const ADDRESSES_KEY = "novacart_addresses_v1";
const SELECTED_ADDRESS_KEY = "novacart_selected_address_v1";
const PAYMENT_METHOD_KEY = "novacart_payment_method_v1";
const RECENT_KEY = "novacart_recent_v1";
const COUPON_KEY = "novacart_coupon_v1";

const availableCoupons = [
  { code: "SAVE10", type: "percent", value: 10, minSubtotal: 100 },
  { code: "WELCOME5", type: "flat", value: 5, minSubtotal: 20 },
  { code: "FREESHIP", type: "shipping", value: 100, minSubtotal: 50 },
];

const paymentMethods = [
  { id: "card", label: "Credit/Debit Card" },
  { id: "upi", label: "UPI" },
  { id: "netbanking", label: "Net Banking" },
  { id: "cod", label: "Cash on Delivery" },
];

function readLocalStorage(key, fallbackValue) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallbackValue;
  } catch {
    return fallbackValue;
  }
}

export function StoreProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(["All"]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");
  const [catalogWarning, setCatalogWarning] = useState("");
  const [catalogProvider, setCatalogProvider] = useState("mock");
  const [cartItems, setCartItems] = useState(() => readLocalStorage(CART_KEY, []));
  const [shipping, setShipping] = useState(() =>
    readLocalStorage(SHIPPING_KEY, {
      fullName: "",
      email: "",
      address: "",
      city: "",
      state: "",
      zip: "",
      country: "United States",
    })
  );
  const [currentUser, setCurrentUser] = useState(() => readLocalStorage(USER_KEY, null));
  const [wishlistItems, setWishlistItems] = useState(() => readLocalStorage(WISHLIST_KEY, []));
  const [orders, setOrders] = useState(() => readLocalStorage(ORDERS_KEY, []));
  const [addresses, setAddresses] = useState(() =>
    readLocalStorage(ADDRESSES_KEY, [
      {
        id: "addr-default",
        fullName: "",
        email: "",
        address: "",
        city: "",
        state: "",
        zip: "",
        country: "United States",
      },
    ])
  );
  const [selectedAddressId, setSelectedAddressId] = useState(() =>
    readLocalStorage(SELECTED_ADDRESS_KEY, "addr-default")
  );
  const [paymentMethod, setPaymentMethod] = useState(() =>
    readLocalStorage(PAYMENT_METHOD_KEY, "card")
  );
  const [recentlyViewedIds, setRecentlyViewedIds] = useState(() => readLocalStorage(RECENT_KEY, []));
  const [appliedCoupon, setAppliedCoupon] = useState(() => readLocalStorage(COUPON_KEY, null));

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    localStorage.setItem(SHIPPING_KEY, JSON.stringify(shipping));
  }, [shipping]);
  useEffect(() => {
    localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
  }, [currentUser]);
  useEffect(() => {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlistItems));
  }, [wishlistItems]);
  useEffect(() => {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  }, [orders]);
  useEffect(() => {
    localStorage.setItem(ADDRESSES_KEY, JSON.stringify(addresses));
  }, [addresses]);
  useEffect(() => {
    localStorage.setItem(SELECTED_ADDRESS_KEY, JSON.stringify(selectedAddressId));
  }, [selectedAddressId]);
  useEffect(() => {
    localStorage.setItem(PAYMENT_METHOD_KEY, JSON.stringify(paymentMethod));
  }, [paymentMethod]);
  useEffect(() => {
    localStorage.setItem(RECENT_KEY, JSON.stringify(recentlyViewedIds));
  }, [recentlyViewedIds]);
  useEffect(() => {
    localStorage.setItem(COUPON_KEY, JSON.stringify(appliedCoupon));
  }, [appliedCoupon]);

  const loadCatalog = useCallback(async (showLoader = true) => {
    if (showLoader) setCatalogLoading(true);
    setCatalogError("");
    setCatalogWarning("");
    try {
      const result = await getCatalog();
      const pricedProducts = (result.products || []).filter((item) => Number(item.price) > 0);
      setProducts(pricedProducts);
      setCategories(result.categories || ["All"]);
      setCatalogProvider(result.provider || "mock");
      if (result.warning) {
        setCatalogWarning(result.warning);
      }
    } catch (error) {
      setCatalogError(error.message || "Unable to load product catalog.");
    } finally {
      if (showLoader) setCatalogLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCatalog(true);
  }, [loadCatalog]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadCatalog(false);
    }, 30000);
    const onFocus = () => loadCatalog(false);
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [loadCatalog]);

  const cartDetails = useMemo(() => {
    const merged = cartItems
      .map((line) => {
        const product = products.find((item) => item.id === line.productId);
        if (!product) return null;
        return {
          ...product,
          quantity: line.quantity,
          lineTotal: product.price * line.quantity,
        };
      })
      .filter(Boolean);

    const subtotal = merged.reduce((sum, item) => sum + item.lineTotal, 0);
    const autoDiscount = subtotal > 400 ? 25 : 0;
    const couponDiscount =
      appliedCoupon?.type === "percent"
        ? Math.min(Math.round((subtotal * appliedCoupon.value) / 100), 80)
        : appliedCoupon?.type === "flat"
          ? appliedCoupon.value
          : 0;
    const shippingFee = subtotal > 0 ? (appliedCoupon?.type === "shipping" ? 0 : 15) : 0;
    const taxableAmount = Math.max(subtotal - autoDiscount - couponDiscount, 0);
    const tax = Math.round(taxableAmount * 0.08);
    const discount = autoDiscount + couponDiscount;
    const total = Math.max(subtotal + shippingFee + tax - discount, 0);

    return {
      merged,
      subtotal,
      autoDiscount,
      couponDiscount,
      shippingFee,
      discount,
      tax,
      total,
    };
  }, [cartItems, products, appliedCoupon]);

  const cartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );
  const selectedAddress = useMemo(
    () => addresses.find((item) => item.id === selectedAddressId) || addresses[0] || null,
    [addresses, selectedAddressId]
  );
  const wishlistProducts = useMemo(
    () => products.filter((item) => wishlistItems.includes(item.id)),
    [products, wishlistItems]
  );
  const recentlyViewedProducts = useMemo(
    () =>
      recentlyViewedIds
        .map((id) => products.find((item) => item.id === id))
        .filter(Boolean)
        .slice(0, 8),
    [products, recentlyViewedIds]
  );

  function addToCart(productId, quantity = 1) {
    const product = products.find((item) => item.id === productId);
    if (!product || Number(product.price) <= 0) {
      return;
    }
    setCartItems((prev) => {
      const existing = prev.find((item) => item.productId === productId);
      if (existing) {
        return prev.map((item) =>
          item.productId === productId
            ? { ...item, quantity: Math.min(item.quantity + quantity, 99) }
            : item
        );
      }
      return [...prev, { productId, quantity }];
    });
  }

  function updateQuantity(productId, quantity) {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, quantity: Math.min(quantity, 99) } : item
      )
    );
  }

  function removeFromCart(productId) {
    setCartItems((prev) => prev.filter((item) => item.productId !== productId));
  }

  function clearCart() {
    setCartItems([]);
  }

  function buyNow(productId) {
    const product = products.find((item) => item.id === productId);
    if (!product || Number(product.price) <= 0) {
      return;
    }
    setCartItems([{ productId, quantity: 1 }]);
  }

  function isWishlisted(productId) {
    return wishlistItems.includes(productId);
  }

  function toggleWishlist(productId) {
    setWishlistItems((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [productId, ...prev]
    );
  }

  function moveToWishlist(productId) {
    setWishlistItems((prev) => (prev.includes(productId) ? prev : [productId, ...prev]));
    removeFromCart(productId);
  }

  function trackRecentlyViewed(productId) {
    setRecentlyViewedIds((prev) => [productId, ...prev.filter((id) => id !== productId)].slice(0, 8));
  }

  function signIn({ name, email }) {
    setCurrentUser({
      id: "user-1",
      name: name || "Guest Shopper",
      email: email || "",
    });
  }

  function signOut() {
    setCurrentUser(null);
  }

  function addAddress(address) {
    const id = `addr-${Date.now()}`;
    const next = { id, ...address };
    setAddresses((prev) => [next, ...prev]);
    setSelectedAddressId(id);
  }

  function updateAddress(addressId, patch) {
    setAddresses((prev) => prev.map((item) => (item.id === addressId ? { ...item, ...patch } : item)));
  }

  function removeAddress(addressId) {
    setAddresses((prev) => {
      const next = prev.filter((item) => item.id !== addressId);
      if (selectedAddressId === addressId) {
        setSelectedAddressId(next[0]?.id || "");
      }
      return next;
    });
  }

  function applyCoupon(code) {
    const coupon = availableCoupons.find((item) => item.code === code.trim().toUpperCase());
    if (!coupon) {
      return { ok: false, message: "Invalid coupon code." };
    }
    if (cartDetails.subtotal < coupon.minSubtotal) {
      return {
        ok: false,
        message: `Minimum subtotal ${coupon.minSubtotal} required for ${coupon.code}.`,
      };
    }
    setAppliedCoupon(coupon);
    return { ok: true, message: `${coupon.code} applied.` };
  }

  function clearCoupon() {
    setAppliedCoupon(null);
  }

  function placeOrder() {
    if (!cartDetails.merged.length) {
      return { ok: false, message: "Cart is empty." };
    }
    const effectiveAddress = selectedAddress || {
      fullName: shipping.fullName,
      email: shipping.email,
      address: shipping.address,
      city: shipping.city,
      state: shipping.state,
      zip: shipping.zip,
      country: shipping.country,
    };
    if (!effectiveAddress?.fullName || !effectiveAddress?.address) {
      return { ok: false, message: "Shipping address is required." };
    }

    const now = new Date();
    const deliveryDate = new Date(now);
    deliveryDate.setDate(deliveryDate.getDate() + 5);

    const order = {
      id: `NC-${now.getTime().toString().slice(-8)}`,
      createdAt: now.toISOString(),
      customer: currentUser || {
        name: effectiveAddress.fullName,
        email: effectiveAddress.email || shipping.email || "",
      },
      address: effectiveAddress,
      paymentMethod,
      coupon: appliedCoupon?.code || null,
      items: cartDetails.merged,
      summary: {
        subtotal: cartDetails.subtotal,
        shippingFee: cartDetails.shippingFee,
        discount: cartDetails.discount,
        tax: cartDetails.tax,
        total: cartDetails.total,
      },
      status: "Order placed",
      tracking: [
        { status: "Order placed", time: now.toISOString() },
        { status: "Packed", time: new Date(now.getTime() + 60 * 60 * 1000).toISOString() },
        { status: "Shipped", time: new Date(now.getTime() + 5 * 60 * 60 * 1000).toISOString() },
      ],
      estimatedDelivery: deliveryDate.toISOString(),
    };

    setOrders((prev) => [order, ...prev]);
    clearCart();
    clearCoupon();
    return { ok: true, order };
  }

  const value = {
    products,
    categories,
    catalogLoading,
    catalogError,
    catalogWarning,
    catalogProvider,
    cartItems,
    cartCount,
    cartDetails,
    currentUser,
    wishlistItems,
    wishlistProducts,
    orders,
    addresses,
    selectedAddressId,
    selectedAddress,
    paymentMethod,
    paymentMethods,
    recentlyViewedProducts,
    appliedCoupon,
    availableCoupons,
    shipping,
    setShipping,
    addToCart,
    buyNow,
    updateQuantity,
    removeFromCart,
    clearCart,
    toggleWishlist,
    isWishlisted,
    moveToWishlist,
    trackRecentlyViewed,
    signIn,
    signOut,
    addAddress,
    updateAddress,
    removeAddress,
    setSelectedAddressId,
    setPaymentMethod,
    applyCoupon,
    clearCoupon,
    placeOrder,
    reloadCatalog: () => loadCatalog(true),
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within StoreProvider");
  }
  return context;
}
