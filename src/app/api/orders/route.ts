import { cartLines, cartTotal, formatPrice, MENU, type Cart } from "@/lib/menu";

// In-memory only: restarting the server starts again at #1.
let nextOrderNumber = 1;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { cart?: unknown } | null;
  const cart = sanitizeCart(body?.cart);
  const lines = cartLines(cart);
  if (lines.length === 0) {
    return Response.json({ error: "Your order is empty." }, { status: 400 });
  }

  const orderNumber = nextOrderNumber++;
  const summary = lines.map(({ item, quantity }) => `${quantity}× ${item.name}`).join(", ");
  // Shows up in the terminal running the site, i.e. on the computer.
  console.log(`🧾 Order #${orderNumber}: ${summary} (${formatPrice(cartTotal(cart))})`);

  return Response.json({ orderNumber, readyInMinutes: 3 + lines.length * 2 });
}

/** Keeps only known items with sensible quantities; prices always come from MENU. */
function sanitizeCart(value: unknown): Cart {
  if (typeof value !== "object" || value === null) return {};
  const cart: Cart = {};
  for (const item of MENU) {
    const quantity = (value as Record<string, unknown>)[item.id];
    if (Number.isInteger(quantity) && (quantity as number) > 0 && (quantity as number) <= 20) {
      cart[item.id] = quantity as number;
    }
  }
  return cart;
}
