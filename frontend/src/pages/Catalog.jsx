import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../components/Header";
import ProductCard from "../components/ProductCard";
import { CATEGORIES, getProductsByCategory } from "../data/catalog";
import { useCart } from "../context/CartContext";
import { useWallet } from "../context/WalletContext";

export default function Catalog() {
  const location = useLocation();
  const [categoryId, setCategoryId] = useState("");
  const [search, setSearch] = useState("");
  const products = getProductsByCategory(categoryId || undefined);
  const { cartCount } = useCart();
  const { account } = useWallet();
  const navigate = useNavigate();

  useEffect(() => {
    const state = location.state;
    if (state?.categoryId) setCategoryId(state.categoryId);
  }, [location.state]);

  const filtered = search.trim()
    ? products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    : products;

  return (
    <div className="page page--catalog">
      <Header searchQuery={search} onSearchChange={setSearch} showSearch />
      <main className="main main--with-nav">
        <div className="catalog-head">
          <h1 className="page-title">Каталог</h1>
          <select
            className="catalog-filter"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">Все категории</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <p className="catalog-hint">Оплачиваешь ETH → получаешь бонусы (CDR) и NFT-кэшбек. Бонусы можно тратить на скидки.</p>
        <div className="products-grid products-grid--catalog">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} noNavigate />
          ))}
        </div>
        {cartCount > 0 && (
          <button className="btn btn--primary btn--float" onClick={() => navigate("/cart")}>
            Корзина ({cartCount})
          </button>
        )}
        <div className="main__bottom-pad" />
      </main>
    </div>
  );
}
