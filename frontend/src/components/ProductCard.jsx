import React from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { ProductIcon } from "./Icons";
import { getProductPhotoUrl } from "../data/productPhotos";

export default function ProductCard({ product, variant = "default", noNavigate }) {
  const { add } = useCart();
  const navigate = useNavigate();
  const priceEth = parseFloat(product.priceEth);
  const tag = priceEth >= 0.5 ? "NFT 5%" : priceEth >= 0.1 ? "NFT 3%" : "Бонусы";

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    add(product.id);
  };

  const handleCardClick = () => {
    if (!noNavigate) navigate("/catalog");
  };

  const photoUrl = getProductPhotoUrl(product.id);

  return (
    <div className={`product-card product-card--${variant}`} onClick={handleCardClick} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && handleCardClick()}>
      <div className="product-card__image">
        {photoUrl ? (
          <img src={photoUrl} alt="" className="product-card__photo" />
        ) : (
          <span className="product-card__icon"><ProductIcon iconKey={product.icon} width={40} height={40} /></span>
        )}
        <span className="product-card__tag">{tag}</span>
      </div>
      <div className="product-card__body">
        <h3 className="product-card__name">{product.name}</h3>
        <p className="product-card__meta">
          <span className="product-card__price">{product.priceEth} ETH</span>
          <span className="product-card__delivery">25–40 мин</span>
        </p>
        <button type="button" className="btn btn--primary btn--sm product-card__btn" onClick={handleAdd}>
          В корзину
        </button>
      </div>
    </div>
  );
}
