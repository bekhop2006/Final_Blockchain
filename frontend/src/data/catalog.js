// Off-chain каталог товаров. Цены в ETH = эквивалент в тенге (₸) при курсе 1 ETH = 1 000 000 ₸.

export const CATEGORIES = [
  { id: "food", name: "Еда", slug: "food" },
  { id: "tech", name: "Техника", slug: "tech" },
  { id: "clothes", name: "Одежда", slug: "clothes" },
  { id: "home", name: "Дом", slug: "home" },
];

export const PRODUCTS = [
  { id: "1", name: "Пицца Маргарита", categoryId: "food", priceEth: "0.0012", priceKzt: 1200, icon: "pizza", photo: "margaritta_pizza.png" },
  { id: "2", name: "Бургер с картошкой", categoryId: "food", priceEth: "0.0015", priceKzt: 1500, icon: "burger", photo: "burgerandfries.png" },
  { id: "3", name: "Суши сет", categoryId: "food", priceEth: "0.0028", priceKzt: 2800, icon: "sushi", photo: "sushiset.png" },
  { id: "4", name: "Кофе и круассан", categoryId: "food", priceEth: "0.0009", priceKzt: 900, icon: "coffee", photo: "coffeeandcrousaint.png" },
  { id: "5", name: "Наушники", categoryId: "tech", priceEth: "0.018", priceKzt: 18000, icon: "headphones", photo: "headphones.png" },
  { id: "6", name: "Зарядка USB-C", categoryId: "tech", priceEth: "0.0035", priceKzt: 3500, icon: "plug", photo: "usbc.png" },
  { id: "7", name: "Чехол для телефона", categoryId: "tech", priceEth: "0.0025", priceKzt: 2500, icon: "phone", photo: "caseforphone.png" },
  { id: "8", name: "Футболка", categoryId: "clothes", priceEth: "0.0045", priceKzt: 4500, icon: "shirt", photo: "t-shirt.png" },
  { id: "9", name: "Кроссовки", categoryId: "clothes", priceEth: "0.022", priceKzt: 22000, icon: "shoe", photo: "sneackers.png" },
  { id: "10", name: "Свеча ароматическая", categoryId: "home", priceEth: "0.0018", priceKzt: 1800, icon: "candle", photo: "Scentedcandle.png" },
  { id: "11", name: "Горшок для цветов", categoryId: "home", priceEth: "0.0032", priceKzt: 3200, icon: "plant", photo: "gorshock.png" },
];

export function getProductsByCategory(categoryId) {
  if (!categoryId) return PRODUCTS;
  return PRODUCTS.filter((p) => p.categoryId === categoryId);
}

export function getProductById(id) {
  return PRODUCTS.find((p) => p.id === id);
}
