import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import ProductCard from "../components/ProductCard";
import BannerCarousel from "../components/BannerCarousel";
import { CATEGORIES, PRODUCTS } from "../data/catalog";

export default function Home() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    if (!search.trim()) return PRODUCTS;
    const q = search.toLowerCase();
    return PRODUCTS.filter((p) => p.name.toLowerCase().includes(q) || CATEGORIES.find((c) => c.id === p.categoryId)?.name.toLowerCase().includes(q));
  }, [search]);

  const food = useMemo(() => filtered.filter((p) => p.categoryId === "food"), [filtered]);
  const popular = useMemo(() => [...filtered].slice(0, 6), [filtered]);

  return (
    <div className="page page--home">
      <Header searchQuery={search} onSearchChange={setSearch} showSearch />
      <main className="main main--with-nav">
        <BannerCarousel />

        <section className="section">
          <h2 className="section__title">Что заказать</h2>
          <div className="categories-scroll">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                className="category-chip"
                onClick={() => navigate("/catalog", { state: { categoryId: c.id } })}
              >
                {c.name}
              </button>
            ))}
            <button type="button" className="category-chip category-chip--all" onClick={() => navigate("/catalog")}>
              Все
            </button>
          </div>
        </section>

        <section className="section">
          <div className="section__head">
            <h2 className="section__title">Специально для вас</h2>
            <button type="button" className="section__link" onClick={() => navigate("/catalog")}>
              Все &gt;
            </button>
          </div>
          <div className="products-scroll">
            {popular.map((p) => (
              <ProductCard key={p.id} product={p} variant="compact" />
            ))}
          </div>
        </section>

        {food.length > 0 && (
          <section className="section">
            <div className="section__head">
              <h2 className="section__title">Еда</h2>
              <button type="button" className="section__link" onClick={() => navigate("/catalog", { state: { categoryId: "food" } })}>
                Все &gt;
              </button>
            </div>
            <div className="products-scroll">
              {food.slice(0, 5).map((p) => (
                <ProductCard key={p.id} product={p} variant="compact" />
              ))}
            </div>
          </section>
        )}

        <section className="section">
          <div className="section__head">
            <h2 className="section__title">Популярные</h2>
            <button type="button" className="section__link" onClick={() => navigate("/catalog")}>
              Все &gt;
            </button>
          </div>
          <div className="products-grid">
            {filtered.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>

        <div className="main__bottom-pad" />
      </main>
    </div>
  );
}
