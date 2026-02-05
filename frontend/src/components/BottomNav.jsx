import React from "react";
import { NavLink, useLocation } from "react-router-dom";

const navItems = [
  { to: "/", label: "Главная", icon: "⌂" },
  { to: "/catalog", label: "Каталог", icon: "◇" },
  { to: "/cart", label: "Корзина", icon: "🛒" },
  { to: "/profile", label: "Профиль", icon: "👤" },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="bottom-nav">
      {navItems.map(({ to, label, icon }) => {
        const isActive = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
        return (
          <NavLink
            key={to}
            to={to}
            className={`bottom-nav__item ${isActive ? "bottom-nav__item--active" : ""}`}
          >
            <span className="bottom-nav__icon">{icon}</span>
            <span className="bottom-nav__label">{label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
