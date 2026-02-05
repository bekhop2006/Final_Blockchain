import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useWallet } from "../context/WalletContext";

function formatBonusTokens(wei) {
  const n = Number(wei) / 1e18;
  return n >= 1e6 ? (n / 1e6).toFixed(1) + "M" : n >= 1e3 ? (n / 1e3).toFixed(1) + "K" : n.toFixed(0);
}

export default function Header({ searchQuery = "", onSearchChange, showSearch = true }) {
  const { account, balanceEth, balanceToken, nftCount, chainName, isCorrectNetwork, connect, switchNetwork, error } = useWallet();
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <header className="header header--delivery">
      <div className="header__top">
        <Link to="/" className="header__logo">
          <span className="header__logo-icon">📦</span>
          <span>Crypto Delivery</span>
        </Link>
        {!account ? (
          <button className="btn btn--primary btn--sm" onClick={connect} disabled={!!error}>
            {error ? "Ошибка" : "Подключить кошелёк"}
          </button>
        ) : (
          <div className="header__wallet">
            {!isCorrectNetwork ? (
              <button className="btn btn--warning btn--sm" onClick={switchNetwork}>Сеть</button>
            ) : (
              <Link to="/profile" className="header__wallet-pill" title={account}>
                <span className="header__chain">{chainName}</span>
                <span>{account.slice(0, 6)}…{account.slice(-4)}</span>
                <span className="header__bal">{(Number(balanceEth) / 1e18).toFixed(2)} ETH</span>
              </Link>
            )}
          </div>
        )}
      </div>
      {showSearch && (
        <div className={`header__search-wrap ${searchFocused ? "header__search-wrap--focused" : ""}`}>
          <span className="header__search-icon">🔍</span>
          <input
            type="text"
            className="header__search"
            placeholder="Поиск"
            value={searchQuery}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
        </div>
      )}
    </header>
  );
}
