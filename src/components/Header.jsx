import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useStore } from "../context/StoreContext";

function navStyle({ isActive }) {
  return `rounded-md px-3 py-2 text-sm font-medium transition ${
    isActive ? "bg-amber-400 text-slate-900" : "text-white hover:bg-slate-700"
  }`;
}

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartCount, wishlistItems, currentUser } = useStore();
  const [headerQuery, setHeaderQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  function onHeaderSearchSubmit(event) {
    event.preventDefault();
    const q = headerQuery.trim();
    navigate(q ? `/shop?q=${encodeURIComponent(q)}` : "/shop");
  }

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setDrawerOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen]);

  function navigateWithQuery(path, params = {}) {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "")
    ).toString();
    navigate(query ? `${path}?${query}` : path);
  }

  function queryTabStyle(expected = {}) {
    const params = new URLSearchParams(location.search);
    const isShopRoute = location.pathname === "/shop";
    const matches = Object.entries(expected).every(([key, value]) => params.get(key) === value);
    return `rounded-md px-3 py-2 text-sm font-medium transition ${
      isShopRoute && matches ? "bg-amber-400 text-slate-900" : "text-white hover:bg-slate-700"
    }`;
  }

  function shopTabStyle() {
    const params = new URLSearchParams(location.search);
    const isAmazonPicks = params.get("category") === "Amazon";
    const isBestRated = params.get("sort") === "rating";
    const active = location.pathname === "/shop" && !isAmazonPicks && !isBestRated;
    return `rounded-md px-3 py-2 text-sm font-medium transition ${
      active ? "bg-amber-400 text-slate-900" : "text-white hover:bg-slate-700"
    }`;
  }

  function onDrawerItemClick(item) {
    setDrawerOpen(false);
    if (item.action === "signin") {
      navigate(currentUser ? "/account" : "/login");
      return;
    }
    if (item.to) {
      navigateWithQuery(item.to, item.query || {});
    }
  }

  const drawerSections = [
    {
      title: "Trending",
      items: [
        { label: "Bestsellers", to: "/shop", query: { sort: "rating" } },
        { label: "New Releases", to: "/shop" },
        { label: "Movers and Shakers", to: "/shop", query: { sort: "price-low" } },
      ],
    },
    {
      title: "Digital Content and Devices",
      items: [
        { label: "Echo & Alexa", to: "/shop", query: { q: "smart speaker" } },
        { label: "Fire TV", to: "/shop", query: { q: "streaming device" } },
        { label: "Kindle E-Readers & eBooks", to: "/shop", query: { q: "kindle" } },
        { label: "Audible Audiobooks", to: "/shop", query: { q: "audiobook" } },
        { label: "Amazon Prime Video", to: "/shop", query: { q: "media" } },
        { label: "Amazon Prime Music", to: "/shop", query: { q: "audio" } },
      ],
    },
    {
      title: "Shop by Category",
      items: [
        { label: "Mobiles, Computers", to: "/shop", query: { q: "mobile" } },
        { label: "TV, Appliances, Electronics", to: "/shop", query: { q: "electronics" } },
        { label: "Men's Fashion", to: "/shop", query: { q: "men fashion" } },
        { label: "Women's Fashion", to: "/shop", query: { q: "women fashion" } },
        { label: "See all", to: "/shop" },
      ],
    },
    {
      title: "Programs & Features",
      items: [
        { label: "Gift Cards", to: "/shop", query: { q: "gift card" } },
        { label: "Amazon Business", to: "/shop", query: { q: "business" } },
        { label: "Handloom and Handicrafts", to: "/shop", query: { q: "handicraft" } },
        { label: "See all", to: "/shop" },
      ],
    },
    {
      title: "Help & Settings",
      items: [
        { label: "Your Account", to: currentUser ? "/account" : "/login" },
        { label: "Customer Service", to: "/orders" },
        { label: currentUser ? "Switch Account" : "Sign in", action: "signin" },
      ],
    },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-900">
      {drawerOpen ? (
        <div className="fixed inset-0 z-50 bg-black/60">
          <aside className="h-full w-[360px] max-w-[92vw] overflow-y-auto bg-white shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between bg-slate-800 px-4 py-3 text-white">
              <p className="text-2xl font-bold">{currentUser ? `Hello, ${currentUser.name}` : "Hello, sign in"}</p>
              <button
                onClick={() => setDrawerOpen(false)}
                className="rounded border border-white/70 px-2 py-1 text-xs font-bold"
              >
                X
              </button>
            </div>
            <div className="divide-y divide-slate-200">
              {drawerSections.map((section) => (
                <section key={section.title} className="px-6 py-5">
                  <h3 className="text-2xl font-black text-slate-900">{section.title}</h3>
                  <ul className="mt-3 space-y-3 text-sm text-slate-700">
                    {section.items.map((item) => (
                      <li key={`${section.title}-${item.label}`}>
                        <button
                          onClick={() => onDrawerItemClick(item)}
                          className="flex w-full items-center justify-between text-left text-sm text-slate-700 transition hover:text-slate-900"
                        >
                          <span>{item.label}</span>
                          {item.label.toLowerCase().includes("see all") ? (
                            <span className="text-slate-400">⌄</span>
                          ) : (
                            <span className="text-slate-400">{">"}</span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </aside>
          <button
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 -z-10 h-full w-full"
            aria-label="Close menu overlay"
          />
        </div>
      ) : null}

      <div className="bg-slate-900 px-3 py-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center">
          <Link to="/" className="text-2xl font-black tracking-tight text-white">
            NovaCart.in
          </Link>
          <form onSubmit={onHeaderSearchSubmit} className="flex w-full overflow-hidden rounded-md">
            <select className="hidden border-r border-slate-200 bg-slate-100 px-3 text-sm text-slate-700 sm:block">
              <option>All</option>
            </select>
            <input
              value={headerQuery}
              onChange={(event) => setHeaderQuery(event.target.value)}
              placeholder="Search NovaCart"
              className="w-full bg-white px-4 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-500"
            />
            <button
              type="submit"
              className="bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-amber-300"
            >
              Search
            </button>
          </form>
          <div className="flex items-center gap-2 text-sm">
            <NavLink to="/wishlist" className={navStyle}>
              Wishlist ({wishlistItems.length})
            </NavLink>
            <NavLink to="/cart" className={navStyle}>
              Cart ({cartCount})
            </NavLink>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 px-3 py-2 sm:px-4 md:px-6 lg:px-8">
        <nav className="flex items-center gap-2 overflow-x-auto whitespace-nowrap">
          <button
            onClick={() => setDrawerOpen(true)}
            className="inline-flex items-center rounded-md px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
            aria-label="Open menu"
          >
            <span className="text-base">☰</span>
          </button>
          <NavLink to="/" className={navStyle} end>
            Home
          </NavLink>
          <NavLink to="/shop" className={shopTabStyle()}>
            Shop
          </NavLink>
          <NavLink to="/orders" className={navStyle}>
            Orders
          </NavLink>
          <NavLink to={currentUser ? "/account" : "/login"} className={navStyle}>
            {currentUser ? "Account" : "Login"}
          </NavLink>
          <NavLink
            to="/shop?category=Amazon"
            className={queryTabStyle({ category: "Amazon" })}
          >
            Amazon Picks
          </NavLink>
          <NavLink
            to="/shop?sort=rating"
            className={queryTabStyle({ sort: "rating" })}
          >
            Best Rated
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
