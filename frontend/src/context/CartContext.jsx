import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "libra3d_cart_v1";

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items]);

  const addItem = useCallback((product, qty = 1, color = null) => {
    setItems((prev) => {
      const key = `${product.id}__${color || product.colors[0]}`;
      const existing = prev.find((p) => p.key === key);
      if (existing) {
        return prev.map((p) => (p.key === key ? { ...p, qty: p.qty + qty } : p));
      }
      return [
        ...prev,
        {
          key,
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.images[0],
          material: product.material,
          color: color || product.colors[0],
          qty,
        },
      ];
    });
    setDrawerOpen(true);
  }, []);

  const updateQty = useCallback((key, qty) => {
    setItems((prev) =>
      prev
        .map((p) => (p.key === key ? { ...p, qty: Math.max(0, qty) } : p))
        .filter((p) => p.qty > 0)
    );
  }, []);

  const removeItem = useCallback((key) => {
    setItems((prev) => prev.filter((p) => p.key !== key));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const subtotal = useMemo(
    () => items.reduce((sum, p) => sum + p.price * p.qty, 0),
    [items]
  );
  const totalCount = useMemo(() => items.reduce((s, p) => s + p.qty, 0), [items]);

  const value = {
    items,
    drawerOpen,
    setDrawerOpen,
    addItem,
    updateQty,
    removeItem,
    clearCart,
    subtotal,
    totalCount,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
