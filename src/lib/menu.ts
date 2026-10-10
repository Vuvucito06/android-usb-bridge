export const CAFE_NAME = "Bean & Brew";

export const CATEGORIES = ["Coffee", "Tea & more", "Bakery"] as const;
export type Category = (typeof CATEGORIES)[number];

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  emoji: string;
  category: Category;
}

export const MENU: MenuItem[] = [
  { id: "espresso", name: "Espresso", description: "Short, strong and smooth", price: 2.5, emoji: "☕", category: "Coffee" },
  { id: "cappuccino", name: "Cappuccino", description: "Espresso, steamed milk, thick foam", price: 3.8, emoji: "☕", category: "Coffee" },
  { id: "latte", name: "Caffè Latte", description: "Espresso with lots of silky milk", price: 4.0, emoji: "🥛", category: "Coffee" },
  { id: "flat-white", name: "Flat White", description: "Double shot, velvety micro-foam", price: 3.9, emoji: "☕", category: "Coffee" },
  { id: "iced-latte", name: "Iced Latte", description: "Cold milk and espresso over ice", price: 4.3, emoji: "🥤", category: "Coffee" },
  { id: "green-tea", name: "Green Tea", description: "Japanese sencha, freshly brewed", price: 2.8, emoji: "🍵", category: "Tea & more" },
  { id: "chai-latte", name: "Chai Latte", description: "Spiced black tea with warm milk", price: 3.9, emoji: "🍵", category: "Tea & more" },
  { id: "hot-chocolate", name: "Hot Chocolate", description: "Rich cocoa topped with cream", price: 3.5, emoji: "🍫", category: "Tea & more" },
  { id: "croissant", name: "Butter Croissant", description: "Flaky, baked every morning", price: 2.6, emoji: "🥐", category: "Bakery" },
  { id: "donut", name: "Glazed Donut", description: "Soft, sweet, a little sticky", price: 2.2, emoji: "🍩", category: "Bakery" },
  { id: "cheesecake", name: "Cheesecake", description: "New York style, berry sauce", price: 4.5, emoji: "🍰", category: "Bakery" },
  { id: "cookie", name: "Choc Chip Cookie", description: "Crispy edges, gooey centre", price: 1.9, emoji: "🍪", category: "Bakery" },
];

const priceFormat = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function formatPrice(amount: number) {
  return priceFormat.format(amount);
}

/** Item id -> quantity */
export type Cart = Record<string, number>;

export function cartLines(cart: Cart) {
  return MENU.filter((item) => cart[item.id] > 0).map((item) => ({
    item,
    quantity: cart[item.id],
  }));
}

export function cartTotal(cart: Cart) {
  return cartLines(cart).reduce((sum, { item, quantity }) => sum + item.price * quantity, 0);
}
