import React from "react";
import { HashRouter, Routes, Route, NavLink } from "react-router-dom";
import { WalletProvider, useWallet } from "./context/WalletContext";
import { CartProvider } from "./context/CartContext";
import Catalog from "./pages/Catalog";
import Cart from "./pages/Cart";
import Campaigns from "./pages/Campaigns";
import "./App.css";

function Layout({ children }) {
  const { account, balanceEth, balanceToken, nftCount, chainName, isCorrectNetwork, connect, switchNetwork, error } = useWallet();

  return (
    <div className="app">
      <header className="header">
        <NavLink to="/" className="logo">Crypto Delivery</NavLink>
        <nav className="nav">
          <NavLink to="/" end>Каталог</NavLink>
          <NavLink to="/cart">Корзина</NavLink>
          <NavLink to="/campaigns">Заказы</NavLink>
        </nav>
        <div className="wallet">
          {!account ? (
            <button className="btn btn-primary" onClick={connect} disabled={!!error}>
              {error || "Connect Wallet"}
            </button>
          ) : (
            <div className="wallet-info">
              {!isCorrectNetwork ? (
                <button className="btn btn-warning" onClick={switchNetwork}>Switch to Testnet</button>
              ) : (
                <>
                  <span className="chain">{chainName}</span>
                  <span className="addr" title={account}>{account.slice(0, 6)}…{account.slice(-4)}</span>
                  <span className="bal">ETH: {(Number(balanceEth) / 1e18).toFixed(4)}</span>
                  <span className="bal">CDR: {balanceToken}</span>
                  <span className="bal">NFT: {nftCount}</span>
                </>
              )}
            </div>
          )}
        </div>
      </header>
      <main className="main">{children}</main>
    </div>
  );
}

function App() {
  return (
    <WalletProvider>
      <CartProvider>
        <HashRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Catalog />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/campaigns" element={<Campaigns />} />
            </Routes>
          </Layout>
        </HashRouter>
      </CartProvider>
    </WalletProvider>
  );
}

export default App;
