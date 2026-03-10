export function normalizeProduct(item, index = 0) {
  return {
    id: String(item.id ?? `item-${index}`),
    name: item.name || item.title || "Untitled Product",
    category: item.category || "General",
    price: Number(item.price || 0),
    rating: Number(item.rating || item.stars || 4),
    reviews: Number(item.reviews || item.reviewCount || 0),
    stock: Number(item.stock || 20),
    badge: item.badge || null,
    description: item.description || "No description available.",
    image:
      item.image ||
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80",
  };
}

export function getCategories(products) {
  return ["All", ...new Set(products.map((item) => item.category).filter(Boolean))];
}
