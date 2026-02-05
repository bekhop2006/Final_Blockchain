import React, { useState } from "react";
import { useCart } from "../context/CartContext";
import { useWallet } from "../context/WalletContext";
import { getProductById } from "../data/catalog";

export default function Cart() {
  const { items, setQty, remove, totalEth, clear } = useCart();
  const { account, deliveryContract, updateBalances } = useWallet();
  const [campaignId, setCampaignId] = useState("");
  const [paying, setPaying] = useState(false);
  const [txResult, setTxResult] = useState(null);

  const totalWei = BigInt(Math.ceil(totalEth * 1e18));

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
      <div>
        <h1>Корзина</h1>
        <p className="card">Корзина пуста. Добавьте товары из каталога.</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Корзина</h1>
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
                <button className="btn" style={{ background: "var(--danger)", color: "#fff" }} onClick={() => remove(productId)}>Удалить</button>
              </li>
            );
          })}
        </ul>
        <p><strong>Итого: {totalEth.toFixed(4)} ETH</strong></p>
      </div>

      {account && deliveryContract && (
        <div className="card">
          <h3>Оплата криптовалютой (ETH)</h3>
          <p style={{ color: "var(--muted)" }}>
            Кэшбек NFT: заказ &lt; 0.1 ETH → 1%, ≥ 0.1 ETH → 3%, ≥ 0.5 ETH → 5%. Бонусные токены CDR начисляются автоматически.
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
          <button className="btn btn-primary" onClick={campaignId === "" ? handleCreateAndPay : handlePay} disabled={paying || totalEth <= 0}>
            {paying ? "Ожидание..." : campaignId === "" ? `Создать заказ и оплатить ${totalEth.toFixed(4)} ETH` : `Оплатить в кампанию #${campaignId}`}
          </button>
        </div>
      )}

      {!account && <p className="card">Подключите кошелёк для оплаты.</p>}
      {account && !deliveryContract && <p className="card">Выберите сеть Sepolia/Holesky и укажите адреса контрактов в .env.</p>}

      {txResult && (
        <div className="card" style={{ marginTop: "1rem", background: txResult.error ? "rgba(255,107,107,0.1)" : "rgba(0,212,170,0.1)" }}>
          {txResult.error ? <p style={{ color: "var(--danger)" }}>{txResult.error}</p> : null}
          {txResult.success ? <p style={{ color: "var(--accent)" }}>Успешно! Hash: {txResult.hash}</p> : null}
        </div>
      )}
    </div>
  );
}
