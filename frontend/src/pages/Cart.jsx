import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { useCart } from "../context/CartContext";
import { useWallet } from "../context/WalletContext";
import { getProductById } from "../data/catalog";

// 1 бонусный токен (CDR) = 0.0001 ETH скидки в нашем приложении; макс. 20% от заказа
const BONUS_RATE_ETH = 0.0001;
const MAX_DISCOUNT_PERCENT = 0.2;

export default function Cart() {
  const { items, setQty, remove, totalEth, clear } = useCart();
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
      setTxResult({ success: true, hash: tx.hash });
      clear();
      updateBalances();
    } catch (e) {
      setTxResult({ error: e.message || "Транзакция отклонена" });
    } finally {
      setPaying(false);
    }
  };

  const handleCreateAndPay = async () => {
    if (!account || !deliveryContract || items.length === 0) return;
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
      setTxResult({ success: true, hash: contribTx.hash });
      clear();
      updateBalances();
    } catch (e) {
      setTxResult({ error: e.message || "Транзакция отклонена" });
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
      <div className="card" style={{ marginBottom: "1rem" }}>
        <h3>Товары</h3>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {items.map(({ productId, quantity }) => {
            const p = getProductById(productId);
            if (!p) return null;
            return (
              <li key={productId} style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.5rem" }}>
                <span>{p.image} {p.name}</span>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQty(productId, parseInt(e.target.value, 10) || 0)}
                  style={{ width: 60 }}
                />
                <span>{p.priceEth} ETH × {quantity}</span>
                <button type="button" className="btn btn--danger" onClick={() => remove(productId)}>Удалить</button>
              </li>
            );
          })}
        </ul>
        <p><strong>Сумма заказа: {totalEth.toFixed(4)} ETH</strong></p>
      </div>

      {account && (
        <div className="card bonus-card">
          <h3>Использование бонусов в приложении</h3>
          <p style={{ color: "var(--muted)", marginBottom: "0.75rem" }}>
            У тебя <strong>{bonusBalance.toFixed(0)} CDR</strong> — это наши бонусные токены за прошлые оплаты. Их можно использовать здесь для скидки: 1 CDR = {BONUS_RATE_ETH} ETH (макс. 20% от заказа).
          </p>
          {bonusBalance > 0 && totalEth > 0 ? (
            <label className="bonus-toggle">
              <input type="checkbox" checked={useBonus} onChange={(e) => setUseBonus(e.target.checked)} />
              <span>Списать бонусы на скидку</span>
            </label>
          ) : null}
          {useBonus && discountEth > 0 && (
            <p className="discount-line">
              Скидка: −{discountEth.toFixed(4)} ETH → <strong>К оплате: {payEth.toFixed(4)} ETH</strong>
            </p>
          )}
        </div>
      )}

      {account && deliveryContract && (
        <div className="card">
          <h3>Оплата криптовалютой (ETH)</h3>
          <p style={{ color: "var(--muted)" }}>
            Платишь ETH → получаешь бонусные токены (CDR) и NFT-кэшбек. Кэшбек: &lt; 0.1 ETH → 1%, ≥ 0.1 ETH → 3%, ≥ 0.5 ETH → 5%.
          </p>
          <div className="input-group">
            <label>Оплатить в существующую кампанию (ID, опционально)</label>
            <input
              type="number"
              min={0}
              placeholder="Оставьте пустым для «Создать заказ и оплатить»"
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
            />
          </div>
          <button type="button" className="btn btn--primary" onClick={campaignId === "" ? handleCreateAndPay : handlePay} disabled={paying || payEth <= 0}>
            {paying ? "Ожидание..." : campaignId === "" ? `Создать заказ и оплатить ${payEth.toFixed(4)} ETH` : `Оплатить в кампанию #${campaignId} — ${payEth.toFixed(4)} ETH`}
          </button>
        </div>
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
