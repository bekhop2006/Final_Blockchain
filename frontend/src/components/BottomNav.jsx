import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { IconHome, IconCatalog, IconCart, IconUser } from "./Icons";

const navItems = [
  { to: "/", label: "Главная", Icon: IconHome },
  { to: "/catalog", label: "Каталог", Icon: IconCatalog },
  { to: "/cart", label: "Корзина", Icon: IconCart },
  { to: "/profile", label: "Профиль", Icon: IconUser },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="bottom-nav">
      {navItems.map(({ to, label, Icon }) => {
        const isActive = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
        return (
          <NavLink
            key={to}
            to={to}
            className={`bottom-nav__item ${isActive ? "bottom-nav__item--active" : ""}`}
          >
            <span className="bottom-nav__icon"><Icon width={24} height={24} /></span>
            <span className="bottom-nav__label">{label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
