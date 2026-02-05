import React, { createContext, useContext, useState, useCallback } from "react";
import { getProductById } from "../data/catalog";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]); // [{ productId, quantity }, ...]

  const add = useCallback((productId, quantity = 1) => {
    setItems((prev) => {
      const i = prev.findIndex((x) => x.productId === productId);
      if (i >= 0) {
        const next = [...prev];
        next[i].quantity += quantity;
        return next;
      }
      return [...prev, { productId, quantity }];
    });
  }, []);

  const remove = useCallback((productId) => {
    setItems((prev) => prev.filter((x) => x.productId !== productId));
  }, []);

  const setQty = useCallback((productId, quantity) => {
    if (quantity <= 0) remove(productId);
    else
      setItems((prev) => {
        const i = prev.findIndex((x) => x.productId === productId);
        const next = [...prev];
        if (i >= 0) next[i].quantity = quantity;
        else next.push({ productId, quantity });
        return next;
      });
  }, [remove]);

  const clear = useCallback(() => setItems([]), []);

  const totalEth = items.reduce((sum, { productId, quantity }) => {
    const p = getProductById(productId);
    return sum + (p ? Number(p.priceEth) * quantity : 0);
  }, 0);

  const cartCount = items.reduce((s, i) => s + i.quantity, 0);

  const value = {
    items,
    add,
    remove,
    setQty,
    clear,
    totalEth,
    cartCount,
    getLine: (productId) => {
      const p = getProductById(productId);
      const line = items.find((x) => x.productId === productId);
      return p && line ? { product: p, quantity: line.quantity } : null;
    },
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
