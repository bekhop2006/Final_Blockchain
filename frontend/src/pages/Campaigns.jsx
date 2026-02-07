import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import { useWallet } from "../context/WalletContext";

const STATUS_NAMES = { 0: "Активен", 1: "Завершён", 2: "Успех", 3: "Неудача" };

export default function Campaigns() {
  const { account, deliveryContract, provider, updateBalances } = useWallet();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [goal, setGoal] = useState("0.01");
  const [deadlineMinutes, setDeadlineMinutes] = useState("60");
  const [creating, setCreating] = useState(false);
  const [finalizing, setFinalizing] = useState(null);
  const [refunding, setRefunding] = useState(null);

  useEffect(() => {
    if (!deliveryContract || !provider) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const count = await deliveryContract.getCampaignCount();
        const list = [];
        for (let i = 0; i < Number(count); i++) {
          const c = await deliveryContract.getCampaign(i);
          list.push({
            id: Number(c.id),
            title: c.title,
            goal: c.goal.toString(),
            deadline: Number(c.deadline),
            totalContributed: c.totalContributed.toString(),
            status: Number(c.status),
            creator: c.creator,
          });
        }
        if (!cancelled) setCampaigns(list);
      } catch (e) {
        console.warn(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [deliveryContract, provider]);

  const createCampaign = async () => {
    if (!deliveryContract || !title || !goal || !deadlineMinutes) return;
    setCreating(true);
    try {
      const deadline = Math.floor(Date.now() / 1000) + parseInt(deadlineMinutes, 10) * 60;
      const goalWei = BigInt(Math.ceil(parseFloat(goal) * 1e18));
      await (await deliveryContract.createCampaign(title, goalWei, deadline)).wait();
      setTitle("");
      setGoal("0.01");
      setDeadlineMinutes("60");
      setCreateOpen(false);
      const count = await deliveryContract.getCampaignCount();
      const c = await deliveryContract.getCampaign(Number(count) - 1);
      setCampaigns((prev) => [...prev, {
        id: Number(count) - 1,
        title: c.title,
        goal: c.goal.toString(),
        deadline: Number(c.deadline),
        totalContributed: c.totalContributed.toString(),
        status: Number(c.status),
        creator: c.creator,
      }]);
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  const finalize = async (id) => {
    if (!deliveryContract) return;
    setFinalizing(id);
    try {
      await (await deliveryContract.finalize(id)).wait();
      setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, status: 2 } : c)));
      updateBalances();
    } catch (e) {
      console.error(e);
    } finally {
      setFinalizing(null);
    }
  };

  const refund = async (id) => {
    if (!deliveryContract) return;
    setRefunding(id);
    try {
      await (await deliveryContract.refund(id)).wait();
      updateBalances();
      setCampaigns((prev) => prev.map((c) => {
        if (c.id !== id) return c;
        return { ...c, totalContributed: "0" };
      }));
    } catch (e) {
      console.error(e);
    } finally {
      setRefunding(null);
    }
  };

  return (
    <div className="page page--campaigns">
      <Header showSearch={false} />
      <main className="main main--with-nav">
      <h1 className="page-title">Заказы</h1>
      {!account && <div className="card"><p style={{ margin: 0 }}>Подключите кошелёк.</p></div>}
      {account && !deliveryContract && <div className="card"><p style={{ margin: 0 }}>Переключитесь на Sepolia/Holesky и задайте адреса контрактов в .env.</p></div>}

      {account && deliveryContract && (
        <>
          <button type="button" className="btn btn--primary" onClick={() => setCreateOpen(true)} style={{ marginBottom: "1rem" }}>
            Создать заказ (кампанию)
          </button>
          {createOpen && (
            <div className="card" style={{ marginBottom: "1rem" }}>
              <h3>Новая кампания</h3>
              <div className="input-group">
                <label>Название</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Заказ #1" />
              </div>
              <div className="input-group">
                <label>Цель (ETH)</label>
                <input type="number" step="0.001" value={goal} onChange={(e) => setGoal(e.target.value)} />
              </div>
              <div className="input-group">
                <label>Дедлайн (минут)</label>
                <input type="number" value={deadlineMinutes} onChange={(e) => setDeadlineMinutes(e.target.value)} />
              </div>
              <button type="button" className="btn btn--primary" onClick={createCampaign} disabled={creating}>Создать</button>
              <button type="button" className="btn" onClick={() => setCreateOpen(false)} style={{ marginLeft: "0.5rem" }}>Отмена</button>
            </div>
          )}

          {loading ? <p>Загрузка...</p> : (
            <div className="grid grid-campaigns">
              {campaigns.map((c) => (
                <div key={c.id} className="card">
                  <h3>#{c.id} {c.title}</h3>
                  <p>Цель: {(Number(c.goal) / 1e18).toFixed(4)} ETH</p>
                  <p>Собрано: {(Number(c.totalContributed) / 1e18).toFixed(4)} ETH</p>
                  <p>Дедлайн: {new Date(c.deadline * 1000).toLocaleString()}</p>
                  <p>Статус: <strong>{STATUS_NAMES[c.status] ?? c.status}</strong></p>
                  {c.status === 0 && c.creator?.toLowerCase() === account?.toLowerCase() && c.deadline * 1000 < Date.now() && (
                    <button type="button" className="btn btn--primary" onClick={() => finalize(c.id)} disabled={finalizing === c.id}>
                      {finalizing === c.id ? "..." : "Завершить"}
                    </button>
                  )}
                  {c.status === 3 && (
                    <button type="button" className="btn btn--danger" onClick={() => refund(c.id)} disabled={refunding === c.id}>
                      {refunding === c.id ? "..." : "Вернуть средства"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
      <div className="main__bottom-pad" />
      </main>
    </div>
  );
}
