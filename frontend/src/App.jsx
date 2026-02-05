import React from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import { WalletProvider } from "./context/WalletContext";
import { CartProvider } from "./context/CartContext";
import BottomNav from "./components/BottomNav";
import Home from "./pages/Home";
import Catalog from "./pages/Catalog";
import Cart from "./pages/Cart";
import Campaigns from "./pages/Campaigns";
import Profile from "./pages/Profile";
import "./App.css";

function Layout({ children }) {
  return (
    <div className="app">
      {children}
      <BottomNav />
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
              <Route path="/" element={<Home />} />
              <Route path="/catalog" element={<Catalog />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/campaigns" element={<Campaigns />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
          </Layout>
        </HashRouter>
      </CartProvider>
    </WalletProvider>
  );
}

export default App;
