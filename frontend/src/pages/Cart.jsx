import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { useCart } from "../context/CartContext";
import { useWallet } from "../context/WalletContext";
import { useAuth } from "../context/AuthContext";
import { getProductById } from "../data/catalog";
import { getProductPhotoUrl } from "../data/productPhotos";
import { API_BASE_URL } from "../config";
import { ProductIcon } from "../components/Icons";

// 1 бонусный токен (CDR) = 0.0001 ETH скидки в нашем приложении; макс. 20% от заказа
const BONUS_RATE_ETH = 0.0001;
const MAX_DISCOUNT_PERCENT = 0.2;

function formatEth(value) {
  const n = Number(value);
  if (n >= 0.01) return n.toFixed(4);
  if (n >= 0.0001) return n.toFixed(6);
  return n.toFixed(8);
}

async function saveOrder(token, { items, totalEth, campaignId, txHash }) {
  const res = await fetch(`${API_BASE_URL}/api/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ items, totalEth, campaignId, txHash }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Не удалось сохранить заказ");
  }
}

export default function Cart() {
  const { items, setQty, remove, totalEth, clear } = useCart();
  const { token } = useAuth();
  const { account, balanceToken, deliveryContract, updateBalances } = useWallet();
  const [campaignId, setCampaignId] = useState("");
  const [useBonus, setUseBonus] = useState(true);
  const [paying, setPaying] = useState(false);
  const [txResult, setTxResult] = useState(null);
  const navigate = useNavigate();

  const bonusBalance = Number(balanceToken) / 1e18;
  const maxDiscountEth = totalEth * MAX_DISCOUNT_PERCENT;
  const discountByBonus = bonusBalance * BONUS_RATE_ETH;
  const discountEth = useMemo(() => {
    if (!useBonus || totalEth <= 0) return 0;
    return Math.min(discountByBonus, maxDiscountEth, totalEth);
  }, [useBonus, totalEth, discountByBonus, maxDiscountEth]);
  const payEth = totalEth - discountEth;
  const totalWei = BigInt(Math.ceil(Math.max(0, payEth) * 1e18));

  const handlePay = async () => {
    if (!account || !deliveryContract || items.length === 0) return;
    if (totalWei === 0n) {
      setTxResult({ error: "Сумма к оплате не может быть нулевой. Добавьте товары или отключите скидку бонусами." });
      return;
    }
    const cId = campaignId === "" ? 0 : parseInt(campaignId, 10);
    if (isNaN(cId) || cId < 0) {
      setTxResult({ error: "Укажите ID кампании или оставьте пустым для «Создать заказ и оплатить»." });
      return;
    }
    setPaying(true);
    setTxResult(null);
    try {
      const tx = await deliveryContract.contribute(cId, { value: totalWei });
      await tx.wait();
      if (token) {
        try {
          await saveOrder(token, { items, totalEth, campaignId: cId, txHash: tx.hash });
        } catch (saveErr) {
          console.warn("Order save failed:", saveErr);
        }
      }
      setTxResult({ success: true, hash: tx.hash });
      clear();
      updateBalances();
    } catch (e) {
      const msg = e.message || "";
      const isRevert = msg.includes("revert") || msg.includes("CALL_EXCEPTION") || msg.includes("execution reverted");
      setTxResult({
        error: isRevert
          ? "Транзакция отклонена контрактом. Убедитесь, что после деплоя вы выполнили в папке contracts: npm run transfer-ownership (передача владения токенов контракту доставки)."
          : msg || "Транзакция отклонена",
      });
    } finally {
      setPaying(false);
    }
  };

  const handleCreateAndPay = async () => {
    if (!account || !deliveryContract || items.length === 0) return;
    if (totalWei === 0n) {
      setTxResult({ error: "Сумма к оплате не может быть нулевой. Добавьте товары или отключите скидку бонусами." });
      return;
    }
    setPaying(true);
    setTxResult(null);
    try {
      const deadline = Math.floor(Date.now() / 1000) + 3600;
      const createTx = await deliveryContract.createCampaign(`Order ${totalEth.toFixed(4)} ETH`, totalWei, deadline);
      await createTx.wait();
      const count = await deliveryContract.getCampaignCount();
      const newId = Number(count) - 1;
      const contribTx = await deliveryContract.contribute(newId, { value: totalWei });
      await contribTx.wait();
      if (token) {
        try {
          await saveOrder(token, { items, totalEth, campaignId: newId, txHash: contribTx.hash });
        } catch (saveErr) {
          console.warn("Order save failed:", saveErr);
        }
      }
      setTxResult({ success: true, hash: contribTx.hash });
      clear();
      updateBalances();
    } catch (e) {
      const msg = e.message || "";
      const isRevert = msg.includes("revert") || msg.includes("CALL_EXCEPTION") || msg.includes("execution reverted");
      setTxResult({
        error: isRevert
          ? "Транзакция отклонена контрактом. Убедитесь, что после деплоя вы выполнили в папке contracts: npm run transfer-ownership (передача владения токенов контракту доставки)."
          : msg || "Транзакция отклонена",
      });
    } finally {
      setPaying(false);
    }
  };

  if (items.length === 0 && !txResult) {
    return (
      <div className="page page--cart">
        <Header showSearch={false} />
        <main className="main main--with-nav">
          <h1 className="page-title">Корзина</h1>
          <div className="card">
            <p style={{ margin: 0, color: "var(--muted)" }}>Корзина пуста. Добавьте товары из каталога.</p>
            <button className="btn btn--primary" onClick={() => navigate("/catalog")} style={{ marginTop: "1rem" }}>В каталог</button>
          </div>
          <div className="main__bottom-pad" />
        </main>
      </div>
    );
  }

  return (
    <div className="page page--cart">
      <Header showSearch={false} />
      <main className="main main--with-nav">
      <h1 className="page-title">Корзина</h1>

      <section className="card cart-section cart-section--items">
        <h2 className="cart-section__title">Товары</h2>
        <ul className="cart-items">
          {items.map(({ productId, quantity }) => {
            const p = getProductById(productId);
            if (!p) return null;
            const photoUrl = getProductPhotoUrl(productId);
            return (
              <li key={productId} className="cart-item">
                <span className="cart-item__icon">
                  {photoUrl ? (
                    <img src={photoUrl} alt="" className="cart-item__img" />
                  ) : (
                    <ProductIcon iconKey={p.icon} width={28} height={28} />
                  )}
                </span>
                <span className="cart-item__name">{p.name}</span>
                <div className="cart-item__qty-wrap">
                  <input
                    type="number"
                    min={1}
                    className="cart-item__qty"
                    value={quantity}
                    onChange={(e) => setQty(productId, parseInt(e.target.value, 10) || 0)}
                  />
                </div>
                <span className="cart-item__price">{p.priceEth} ETH × {quantity}</span>
                <button type="button" className="btn btn--danger btn--sm cart-item__remove" onClick={() => remove(productId)}>Удалить</button>
              </li>
            );
          })}
        </ul>
        <p className="cart-section__total">Сумма заказа: <strong>{formatEth(totalEth)} ETH</strong></p>
      </section>

      {account && (
        <section className="card cart-section bonus-card">
          <h2 className="cart-section__title">Бонусы</h2>
          {bonusBalance > 0 ? (
            <>
              <p className="cart-bonus__balance">
                На балансе <strong>{bonusBalance.toFixed(0)} CDR</strong>. Можно списать на скидку (макс. 20% от заказа).
              </p>
              <label className="bonus-toggle">
                <input type="checkbox" checked={useBonus} onChange={(e) => setUseBonus(e.target.checked)} />
                <span>Использовать бонусы для скидки</span>
              </label>
              {useBonus && discountEth > 0 && (
                <p className="discount-line">
                  Скидка <strong>{formatEth(discountEth)} ETH</strong> → к оплате <strong>{formatEth(payEth)} ETH</strong>
                </p>
              )}
            </>
          ) : (
            <p className="cart-bonus__info">
              После оплаты вы получите 15% от заказа бонусами (CDR) и NFT-кэшбек — их можно использовать для скидки в следующих заказах.
            </p>
          )}
        </section>
      )}

      {account && deliveryContract && (
        <section className="card cart-section payment-card">
          <h2 className="cart-section__title">Оплата ETH</h2>
          <p className="payment-summary">
            К оплате: <strong>{formatEth(payEth)} ETH</strong>
          </p>
          <p className="payment-steps">
            1. Нажмите кнопку ниже<br />
            2. Подтвердите платёж в MetaMask
          </p>
          <p className="payment-note">
            За эту оплату вы получите 15% от суммы бонусными токенами CDR и NFT-кэшбек в кошелёк.
          </p>
          <details className="payment-advanced">
            <summary>Привязать к существующему заказу</summary>
            <div className="input-group">
              <label>Номер заказа (ID)</label>
              <input
                type="number"
                min={0}
                placeholder="Оставьте пустым — создастся новый заказ"
                value={campaignId}
                onChange={(e) => setCampaignId(e.target.value)}
              />
            </div>
          </details>
          <button type="button" className="btn btn--primary btn--pay" onClick={campaignId === "" ? handleCreateAndPay : handlePay} disabled={paying || payEth <= 0 || totalWei === 0n}>
            {paying ? "Подтвердите в MetaMask…" : `Оплатить ${formatEth(payEth)} ETH`}
          </button>
        </section>
      )}

      {!account && <p className="card">Подключите кошелёк для оплаты.</p>}
      {account && !deliveryContract && <p className="card">Выберите сеть Sepolia/Holesky и укажите адреса контрактов в .env.</p>}

      {txResult && (
        <div className={`card ${txResult.error ? "card--error" : "card--success"}`}>
          {txResult.error ? <p style={{ color: "var(--danger)", margin: 0 }}>{txResult.error}</p> : null}
          {txResult.success ? <p style={{ color: "var(--accent)", margin: 0 }}>Успешно! Hash: {txResult.hash}</p> : null}
        </div>
      )}
      <div className="main__bottom-pad" />
      </main>
    </div>
  );
}
