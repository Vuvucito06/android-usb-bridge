"use client";

import { useState } from "react";

import {
  CAFE_NAME,
  CATEGORIES,
  cartLines,
  cartTotal,
  formatPrice,
  MENU,
  type Cart,
  type Category,
} from "@/lib/menu";

import styles from "./CafeApp.module.css";

interface PlacedOrder {
  orderNumber: number;
  readyInMinutes: number;
}

export default function CafeApp() {
  const [category, setCategory] = useState<Category>(CATEGORIES[0]);
  const [cart, setCart] = useState<Cart>({});
  const [sheetOpen, setSheetOpen] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string>();
  const [placed, setPlaced] = useState<PlacedOrder>();

  const count = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
  const total = cartTotal(cart);

  function changeQuantity(id: string, delta: number) {
    setCart((current) => {
      const next = { ...current };
      const quantity = (next[id] ?? 0) + delta;
      if (quantity > 0) next[id] = quantity;
      else delete next[id];
      return next;
    });
  }

  async function placeOrder() {
    setPlacing(true);
    setError(undefined);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Something went wrong.");
      setPlaced(data);
      setCart({});
      setSheetOpen(false);
    } catch (e) {
      // fetch() throws TypeError when the computer can't be reached.
      setError(
        e instanceof TypeError
          ? "Can't reach the café. Is the phone still plugged in?"
          : (e as Error).message,
      );
    } finally {
      setPlacing(false);
    }
  }

  if (placed) {
    return (
      <div className={`${styles.app} ${styles.success}`}>
        <div className={styles.check}>✓</div>
        <h1>Order #{placed.orderNumber} placed!</h1>
        <p>
          It&apos;ll be ready in about {placed.readyInMinutes} minutes. We&apos;ll call your
          number at the counter.
        </p>
        <button className={styles.primary} onClick={() => setPlaced(undefined)}>
          Order something else
        </button>
      </div>
    );
  }

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1>{CAFE_NAME}</h1>
        <p>Open today · 8:00 – 20:00</p>
      </header>

      <nav className={styles.tabs}>
        {CATEGORIES.map((name) => (
          <button
            key={name}
            className={name === category ? styles.tabActive : styles.tab}
            onClick={() => setCategory(name)}
          >
            {name}
          </button>
        ))}
      </nav>

      <main className={styles.list}>
        {MENU.filter((item) => item.category === category).map((item) => (
          <article key={item.id} className={styles.item}>
            <span className={styles.emoji} aria-hidden>
              {item.emoji}
            </span>
            <div className={styles.itemText}>
              <h2>{item.name}</h2>
              <p>{item.description}</p>
              <strong>{formatPrice(item.price)}</strong>
            </div>
            <Stepper
              label={item.name}
              quantity={cart[item.id] ?? 0}
              onChange={(delta) => changeQuantity(item.id, delta)}
            />
          </article>
        ))}
      </main>

      {count > 0 && (
        <button className={styles.cartBar} onClick={() => setSheetOpen(true)}>
          <span className={styles.badge}>{count}</span>
          View order
          <span className={styles.cartTotal}>{formatPrice(total)}</span>
        </button>
      )}

      {sheetOpen && count > 0 && (
        <div className={styles.backdrop} onClick={() => setSheetOpen(false)}>
          <section
            className={styles.sheet}
            role="dialog"
            aria-label="Your order"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.handle} />
            <h2>Your order</h2>
            <ul className={styles.lines}>
              {cartLines(cart).map(({ item, quantity }) => (
                <li key={item.id} className={styles.line}>
                  <span aria-hidden>{item.emoji}</span>
                  <span className={styles.lineName}>{item.name}</span>
                  <Stepper
                    label={item.name}
                    quantity={quantity}
                    onChange={(delta) => changeQuantity(item.id, delta)}
                  />
                </li>
              ))}
            </ul>
            <div className={styles.totalRow}>
              <span>Total</span>
              <strong>{formatPrice(total)}</strong>
            </div>
            {error && <p className={styles.error}>{error}</p>}
            <button className={styles.primary} disabled={placing} onClick={placeOrder}>
              {placing ? "Placing order…" : `Place order · ${formatPrice(total)}`}
            </button>
          </section>
        </div>
      )}
    </div>
  );
}

function Stepper({
  label,
  quantity,
  onChange,
}: {
  label: string;
  quantity: number;
  onChange: (delta: number) => void;
}) {
  if (quantity === 0) {
    return (
      <button className={styles.add} aria-label={`Add ${label}`} onClick={() => onChange(1)}>
        +
      </button>
    );
  }
  return (
    <div className={styles.stepper}>
      <button aria-label={`Remove one ${label}`} onClick={() => onChange(-1)}>
        −
      </button>
      <span>{quantity}</span>
      <button aria-label={`Add one more ${label}`} onClick={() => onChange(1)}>
        +
      </button>
    </div>
  );
}
