// Off-chain каталог товаров (JSON)

export const CATEGORIES = [
  { id: "food", name: "Еда", slug: "food" },
  { id: "tech", name: "Техника", slug: "tech" },
  { id: "clothes", name: "Одежда", slug: "clothes" },
  { id: "home", name: "Дом", slug: "home" },
];

export const PRODUCTS = [
  { id: "1", name: "Пицца Маргарита", categoryId: "food", priceEth: "0.01", image: "🍕" },
  { id: "2", name: "Бургер с картошкой", categoryId: "food", priceEth: "0.015", image: "🍔" },
  { id: "3", name: "Суши сет", categoryId: "food", priceEth: "0.025", image: "🍣" },
  { id: "4", name: "Кофе и круассан", categoryId: "food", priceEth: "0.008", image: "☕" },
  { id: "5", name: "Наушники", categoryId: "tech", priceEth: "0.05", image: "🎧" },
  { id: "6", name: "Зарядка USB-C", categoryId: "tech", priceEth: "0.012", image: "🔌" },
  { id: "7", name: "Чехол для телефона", categoryId: "tech", priceEth: "0.02", image: "📱" },
  { id: "8", name: "Футболка", categoryId: "clothes", priceEth: "0.03", image: "👕" },
  { id: "9", name: "Кроссовки", categoryId: "clothes", priceEth: "0.08", image: "👟" },
  { id: "10", name: "Свеча ароматическая", categoryId: "home", priceEth: "0.015", image: "🕯️" },
  { id: "11", name: "Горшок для цветов", categoryId: "home", priceEth: "0.022", image: "🪴" },
];

export function getProductsByCategory(categoryId) {
  if (!categoryId) return PRODUCTS;
  return PRODUCTS.filter((p) => p.categoryId === categoryId);
}

export function getProductById(id) {
  return PRODUCTS.find((p) => p.id === id);
}
