import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CATEGORIES, getProductsByCategory } from "../data/catalog";
import { useCart } from "../context/CartContext";
import { useWallet } from "../context/WalletContext";

export default function Catalog() {
  const [categoryId, setCategoryId] = useState("");
  const products = getProductsByCategory(categoryId || undefined);
  const { add, cartCount } = useCart();
  const { account } = useWallet();
  const navigate = useNavigate();

  return (
    <div>
      <h1>Каталог</h1>
      <div className="input-group" style={{ maxWidth: 200 }}>
        <label>Категория</label>
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">Все</option>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-products" style={{ marginTop: "1rem" }}>
        {products.map((p) => (
          <div key={p.id} className="card">
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{p.image}</div>
            <h3 style={{ margin: "0 0 0.25rem" }}>{p.name}</h3>
            <p style={{ color: "var(--muted)", margin: "0 0 0.75rem" }}>{p.priceEth} ETH</p>
            <button
              className="btn btn-primary"
              onClick={() => add(p.id)}
              disabled={!account}
            >
              В корзину
            </button>
          </div>
        ))}
      </div>
      {cartCount > 0 && (
        <p style={{ marginTop: "1rem" }}>
          <button className="btn btn-primary" onClick={() => navigate("/cart")}>
            В корзину ({cartCount})
          </button>
        </p>
      )}
    </div>
  );
}
