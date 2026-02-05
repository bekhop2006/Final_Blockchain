import React from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import { useWallet } from "../context/WalletContext";

function formatBonusTokens(wei) {
  const n = Number(wei) / 1e18;
  return n >= 1e6 ? (n / 1e6).toFixed(1) + "M" : n >= 1e3 ? (n / 1e3).toFixed(1) + "K" : n.toFixed(0);
}

export default function Profile() {
  const { account, balanceEth, balanceToken, nftCount, chainName, isCorrectNetwork, connect } = useWallet();

  return (
    <div className="page page--profile">
      <Header showSearch={false} />
      <main className="main main--with-nav">
        <div className="profile-header">
          <div className="profile-avatar">
            <span className="profile-avatar__icon">👤</span>
            {account && <span className="profile-avatar__badge">{nftCount}+</span>}
          </div>
          {account ? (
            <>
              <h1 className="profile-name">
                {account.slice(0, 6)}…{account.slice(-4)}
                <span className="profile-name__arrow">›</span>
              </h1>
              <p className="profile-meta">{chainName} · Кошелёк подключён</p>
            </>
          ) : (
            <>
              <h1 className="profile-name">Гость</h1>
              <p className="profile-meta">Подключите кошелёк в шапке</p>
              <button className="btn btn--primary" onClick={connect}>Подключить MetaMask</button>
            </>
          )}
        </div>

        {account && (
          <div className="profile-blocks">
            <div className="profile-block">
              <div className="profile-block__row profile-block__row--no-link">
                <span className="profile-block__icon">💳</span>
                <div className="profile-block__text">
                  <strong>Способы оплаты</strong>
                  <span className="profile-block__sub">MetaMask · ETH</span>
                </div>
              </div>
              <Link to="/cart" className="profile-block__row">
                <span className="profile-block__icon">🎁</span>
                <div className="profile-block__text">
                  <strong>Скидки и подарки</strong>
                  <span className="profile-block__sub">Бонусы: {formatBonusTokens(balanceToken)} CDR · NFT: {nftCount}</span>
                </div>
                <span className="profile-block__arrow">›</span>
              </Link>
            </div>

            <div className="profile-block">
              <Link to="/campaigns" className="profile-block__row">
                <span className="profile-block__icon">📋</span>
                <div className="profile-block__text">
                  <strong>Заказы</strong>
                  <span className="profile-block__sub">Кампании и статусы</span>
                </div>
                <span className="profile-block__arrow">›</span>
              </Link>
            </div>

            <div className="profile-block profile-block--balances">
              <div className="profile-block__row profile-block__row--no-link">
                <span className="profile-block__icon">Ξ</span>
                <div className="profile-block__text">
                  <strong>Баланс ETH</strong>
                  <span className="profile-block__sub">{(Number(balanceEth) / 1e18).toFixed(4)}</span>
                </div>
              </div>
              <div className="profile-block__row profile-block__row--no-link">
                <span className="profile-block__icon">🪙</span>
                <div className="profile-block__text">
                  <strong>Бонусные токены (CDR)</strong>
                  <span className="profile-block__sub">{formatBonusTokens(balanceToken)} — используй в приложении</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="main__bottom-pad" />
      </main>
    </div>
  );
}
