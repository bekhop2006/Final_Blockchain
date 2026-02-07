import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import { useWallet } from "../context/WalletContext";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config";
import { IconUser, IconCreditCard, IconGift, IconClipboard, IconEth, IconCoin } from "../components/Icons";

function formatBonusTokens(wei) {
  const n = Number(wei) / 1e18;
  return n >= 1e6 ? (n / 1e6).toFixed(1) + "M" : n >= 1e3 ? (n / 1e3).toFixed(1) + "K" : n.toFixed(0);
}

export default function Profile() {
  const { account, balanceEth, balanceToken, nftCount, chainName, connect, disconnect } = useWallet();
  const { user, isAuthenticated, logout, linkWallet, token, setRole, updateProfile } = useAuth();
  const role = user?.role || "customer";
  const [roleLoading, setRoleLoading] = useState(false);
  const [showCourierForm, setShowCourierForm] = useState(false);
  const [courierCar, setCourierCar] = useState("");
  const [courierPlate, setCourierPlate] = useState("");
  const [editingProfile, setEditingProfile] = useState(false);
  const [editFullName, setEditFullName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editCarInfo, setEditCarInfo] = useState("");
  const [editCarPlate, setEditCarPlate] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");

  const handleLogout = () => {
    disconnect();
    logout();
  };
  const [orders, setOrders] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [assigningId, setAssigningId] = useState(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [deliveryTimeUpdatingId, setDeliveryTimeUpdatingId] = useState(null);
  const [deliveryTimeMinutes, setDeliveryTimeMinutes] = useState({});
  const [cancelingOrderId, setCancelingOrderId] = useState(null);

  const setOrderStatus = async (orderId, status) => {
    setStatusUpdatingId(orderId);
    try {
      const r = await fetch(`${API_BASE_URL}/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (r.ok) fetchCourierOrders();
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const updateDeliveryTime = async (orderId, minutes) => {
    const m = parseInt(minutes, 10);
    if (isNaN(m) || m < 1 || m > 180) return;
    setDeliveryTimeUpdatingId(orderId);
    try {
      const r = await fetch(`${API_BASE_URL}/api/orders/${orderId}/delivery-time`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ minutesFromNow: m }),
      });
      if (r.ok) {
        setDeliveryTimeMinutes((prev) => ({ ...prev, [orderId]: "" }));
        fetchCourierOrders();
      }
    } finally {
      setDeliveryTimeUpdatingId(null);
    }
  };

  const cancelOrder = async (orderId) => {
    if (!window.confirm("Отменить заказ?")) return;
    setCancelingOrderId(orderId);
    try {
      const r = await fetch(`${API_BASE_URL}/api/orders/${orderId}/cancel`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) fetchOrders();
    } finally {
      setCancelingOrderId(null);
    }
  };

  const fetchOrders = () => {
    if (!token) return;
    fetch(`${API_BASE_URL}/api/orders`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok ? r.json() : { orders: [] })
      .then((data) => setOrders(data.orders || []))
      .catch(() => setOrders([]));
  };

  const fetchCourierOrders = () => {
    if (!token) return;
    fetch(`${API_BASE_URL}/api/orders/deliveries`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok ? r.json() : { orders: [] })
      .then((data) => setDeliveries(data.orders || []))
      .catch(() => setDeliveries([]));
    fetch(`${API_BASE_URL}/api/orders/available`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok ? r.json() : { orders: [] })
      .then((data) => setAvailableOrders(data.orders || []))
      .catch(() => setAvailableOrders([]));
  };

  useEffect(() => {
    fetchOrders();
  }, [token]);

  useEffect(() => {
    if (token && role === "courier") fetchCourierOrders();
    else {
      setDeliveries([]);
      setAvailableOrders([]);
    }
  }, [token, role]);

  useEffect(() => {
    if (isAuthenticated && account && user && user.walletAddress !== account) {
      linkWallet(account);
    }
  }, [isAuthenticated, account, user?.walletAddress, linkWallet]);

  return (
    <div className="page page--profile">
      <Header showSearch={false} />
      <main className="main main--with-nav">
        {!isAuthenticated ? (
          <div className="card auth-prompt">
            <p style={{ margin: "0 0 0.75rem" }}>Войдите в аккаунт, чтобы привязать кошелёк и хранить данные в профиле.</p>
            <Link to="/auth" className="btn btn--primary">Войти / Регистрация</Link>
          </div>
        ) : (
          <>
            {/* 1. Кто вы в приложении: кошелёк */}
            <section className="profile-section">
              <h2 className="profile-section__title">Кошелёк</h2>
              <div className="card profile-wallet-card">
                <div className="profile-header">
                  <div className="profile-avatar">
                    <span className="profile-avatar__icon"><IconUser width={32} height={32} /></span>
                    {account && <span className="profile-avatar__badge">{nftCount}+</span>}
                  </div>
                  <div className="profile-header__info">
                    {account ? (
                      <>
                        <span className="profile-name profile-name--inline">{account.slice(0, 6)}…{account.slice(-4)}</span>
                        <span className="profile-meta">{chainName} · подключён</span>
                      </>
                    ) : (
                      <>
                        <span className="profile-name profile-name--inline">Не подключён</span>
                        <p className="profile-meta">Нужен для оплаты и бонусов</p>
                        <button type="button" className="btn btn--primary btn--sm" onClick={connect}>Подключить MetaMask</button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* 2. Личные данные аккаунта */}
            <section className="profile-section">
              <h2 className="profile-section__title">Аккаунт</h2>
              <div className="card profile-account-card">
                <p className="profile-account__email"><strong>{user?.email}</strong></p>
                {!editingProfile ? (
                  <>
                    {user?.fullName && <p className="profile-account__line">ФИО: {user.fullName}</p>}
                    {user?.phone && <p className="profile-account__line">Телефон: {user.phone}</p>}
                    {user?.address && <p className="profile-account__line">Адрес: {user.address}</p>}
                    {role === "courier" && (user?.carInfo || user?.carPlate) && (
                      <p className="profile-account__line">Машина: {user.carInfo || "—"} · Гос. номер: {user.carPlate || "—"}</p>
                    )}
                    <div className="profile-account__actions">
                      <button type="button" className="btn btn--primary btn--sm" onClick={() => {
                        setEditingProfile(true);
                        setEditFullName(user?.fullName || "");
                        setEditPhone(user?.phone || "");
                        setEditAddress(user?.address || "");
                        setEditCarInfo(user?.carInfo || "");
                        setEditCarPlate(user?.carPlate || "");
                        setProfileError("");
                      }}>
                        Редактировать профиль
                      </button>
                      <button type="button" className="btn btn--danger btn--sm profile-account__logout" onClick={handleLogout}>Выйти</button>
                    </div>
                  </>
                ) : (
                  <form
                    className="profile-account__form"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setProfileError("");
                      setProfileSaving(true);
                      try {
                        const ok = await updateProfile({
                          fullName: editFullName.trim(),
                          phone: editPhone.trim(),
                          address: editAddress.trim(),
                          ...(role === "courier" && { carInfo: editCarInfo.trim(), carPlate: editCarPlate.trim() }),
                        });
                        if (ok) setEditingProfile(false);
                      } catch (err) {
                        setProfileError(err.message || "Ошибка сохранения");
                      } finally {
                        setProfileSaving(false);
                      }
                    }}
                  >
                    <div className="input-group">
                      <label>ФИО</label>
                      <input type="text" value={editFullName} onChange={(e) => setEditFullName(e.target.value)} placeholder="Иванов Иван" />
                    </div>
                    <div className="input-group">
                      <label>Телефон</label>
                      <input type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="+7 999 123-45-67" />
                    </div>
                    <div className="input-group">
                      <label>Адрес</label>
                      <input type="text" value={editAddress} onChange={(e) => setEditAddress(e.target.value)} placeholder="Город, улица, дом" />
                    </div>
                    {role === "courier" && (
                      <>
                        <div className="input-group">
                          <label>Машина (марка, модель)</label>
                          <input type="text" value={editCarInfo} onChange={(e) => setEditCarInfo(e.target.value)} placeholder="Toyota Camry" />
                        </div>
                        <div className="input-group">
                          <label>Гос. номер</label>
                          <input type="text" value={editCarPlate} onChange={(e) => setEditCarPlate(e.target.value)} placeholder="123ABC01" />
                        </div>
                      </>
                    )}
                    {profileError && <p className="profile-account__error">{profileError}</p>}
                    <div className="profile-account__form-actions">
                      <button type="submit" className="btn btn--primary btn--sm" disabled={profileSaving}>
                        {profileSaving ? "Сохранение…" : "Сохранить"}
                      </button>
                      <button type="button" className="btn btn--secondary btn--sm" onClick={() => { setEditingProfile(false); setProfileError(""); }}>
                        Отмена
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </section>

            {/* 3. Роль: заказщик / курьер */}
            <section className="profile-section">
              <h2 className="profile-section__title">Роль</h2>
              <div className="card profile-role">
                <p className="profile-role__value">
                  {role === "courier" ? "Курьер" : "Заказщик"}
                </p>
                {role === "courier" && (user?.carInfo || user?.carPlate) && (
                  <p className="profile-role__car">
                    Машина: {user.carInfo || "—"} · Гос. номер: {user.carPlate || "—"}
                  </p>
                )}
                {role === "customer" && !showCourierForm && (
                  <div className="profile-role__actions">
                    <button type="button" className="btn btn--primary btn--sm" onClick={() => setShowCourierForm(true)}>
                      Стать курьером
                    </button>
                  </div>
                )}
                {role === "customer" && showCourierForm && (
                  <form
                    className="profile-role__form"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!courierCar.trim() || !courierPlate.trim()) return;
                      setRoleLoading(true);
                      await setRole("courier", { carInfo: courierCar.trim(), carPlate: courierPlate.trim() });
                      setRoleLoading(false);
                      setShowCourierForm(false);
                      setCourierCar("");
                      setCourierPlate("");
                    }}
                  >
                    <div className="input-group">
                      <label>Машина (марка, модель)</label>
                      <input type="text" value={courierCar} onChange={(e) => setCourierCar(e.target.value)} placeholder="Например: Toyota Camry" required />
                    </div>
                    <div className="input-group">
                      <label>Гос. номер</label>
                      <input type="text" value={courierPlate} onChange={(e) => setCourierPlate(e.target.value)} placeholder="Например: 123ABC01" required />
                    </div>
                    <div className="profile-role__form-actions">
                      <button type="submit" className="btn btn--primary btn--sm" disabled={roleLoading}>{roleLoading ? "…" : "Подтвердить"}</button>
                      <button type="button" className="btn btn--secondary btn--sm" onClick={() => { setShowCourierForm(false); setCourierCar(""); setCourierPlate(""); }}>Отмена</button>
                    </div>
                  </form>
                )}
                {role === "courier" && (
                  <div className="profile-role__actions">
                    <button type="button" className="btn btn--secondary btn--sm" disabled={roleLoading} onClick={async () => { setRoleLoading(true); await setRole("customer"); setRoleLoading(false); }}>
                      {roleLoading ? "…" : "Вернуться в заказчики"}
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* 4. Балансы и разделы оплаты */}
            <section className="profile-section">
              <h2 className="profile-section__title">Платежи и бонусы</h2>
              <div className="profile-blocks">
                {account && (
                  <>
                    <div className="profile-block">
                      <div className="profile-block__row profile-block__row--no-link">
                        <span className="profile-block__icon"><IconEth width={22} height={22} /></span>
                        <div className="profile-block__text">
                          <strong>Баланс ETH</strong>
                          <span className="profile-block__sub">{(Number(balanceEth) / 1e18).toFixed(4)}</span>
                        </div>
                      </div>
                      <div className="profile-block__row profile-block__row--no-link">
                        <span className="profile-block__icon"><IconCoin width={22} height={22} /></span>
                        <div className="profile-block__text">
                          <strong>Бонусы CDR</strong>
                          <span className="profile-block__sub">{formatBonusTokens(balanceToken)} · скидка до 20%</span>
                        </div>
                      </div>
                    </div>
                    <div className="profile-block">
                      <div className="profile-block__row profile-block__row--no-link">
                        <span className="profile-block__icon"><IconCreditCard width={22} height={22} /></span>
                        <div className="profile-block__text">
                          <strong>Оплата</strong>
                          <span className="profile-block__sub">MetaMask · ETH</span>
                        </div>
                      </div>
                      <Link to="/cart" className="profile-block__row">
                        <span className="profile-block__icon"><IconGift width={22} height={22} /></span>
                        <div className="profile-block__text">
                          <strong>Корзина и скидки</strong>
                          <span className="profile-block__sub">NFT: {nftCount}</span>
                        </div>
                        <span className="profile-block__arrow">›</span>
                      </Link>
                      <Link to="/campaigns" className="profile-block__row">
                        <span className="profile-block__icon"><IconClipboard width={22} height={22} /></span>
                        <div className="profile-block__text">
                          <strong>Кампании</strong>
                          <span className="profile-block__sub">Список заказов</span>
                        </div>
                        <span className="profile-block__arrow">›</span>
                      </Link>
                    </div>
                  </>
                )}
                {!account && (
                  <div className="card">
                    <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.95rem" }}>Подключите кошелёк выше, чтобы видеть балансы и оплачивать заказы.</p>
                  </div>
                )}
              </div>
            </section>

            {/* 5. Для курьера: мои доставки и доступные заказы */}
            {role === "courier" && (
              <>
                <section className="profile-section profile-orders">
                  <h2 className="profile-section__title">Мои доставки</h2>
                  {deliveries.length === 0 ? (
                    <div className="card">
                      <p style={{ margin: 0, color: "var(--muted)" }}>Пока нет назначенных доставок. Взять заказ можно из списка ниже.</p>
                    </div>
                  ) : (
                    <ul className="profile-orders__list">
                      {deliveries.map((o) => {
                        const status = o.status || "pending";
                        const nextStatus = status === "pending" ? "picked_up" : status === "picked_up" ? "on_the_way" : status === "on_the_way" ? "delivered" : null;
                        const nextLabel = nextStatus === "picked_up" ? "Забрал" : nextStatus === "on_the_way" ? "В путь" : nextStatus === "delivered" ? "Отдал заказ" : null;
                        return (
                          <li key={o.id} className="card profile-order-card profile-order-card--courier">
                            <div className="profile-order-card__row">
                              <strong>{o.totalEth} ETH</strong>
                              <span className="profile-order-card__items">{o.items?.length || 0} поз.</span>
                            </div>
                            <div className="profile-order-card__status-badge profile-order-card__status-badge--courier">
                              {status === "delivered" ? "Заказ доставлен" : status === "on_the_way" ? "В пути" : status === "picked_up" ? "Забрал" : "Ожидает"}
                            </div>
                            {o.minutesLeft != null && status !== "delivered" && (
                              <div className="profile-order-card__delivery">
                                <span className="profile-order-card__mins">
                                  До доставки: <strong>{o.minutesLeft === 0 ? "Доставить" : `${o.minutesLeft} мин`}</strong>
                                </span>
                              </div>
                            )}
                            {status !== "delivered" && (
                              <div className="profile-order-card__delivery-time">
                                <label className="profile-order-card__delivery-time-label">Изменить время доставки:</label>
                                <div className="profile-order-card__delivery-time-row">
                                  <input
                                    type="number"
                                    min={1}
                                    max={180}
                                    placeholder="мин"
                                    value={deliveryTimeMinutes[o.id] ?? ""}
                                    onChange={(e) => setDeliveryTimeMinutes((prev) => ({ ...prev, [o.id]: e.target.value }))}
                                    className="profile-order-card__delivery-time-input"
                                  />
                                  <button
                                    type="button"
                                    className="btn btn--secondary btn--sm"
                                    disabled={deliveryTimeUpdatingId === o.id || !deliveryTimeMinutes[o.id]}
                                    onClick={() => updateDeliveryTime(o.id, deliveryTimeMinutes[o.id])}
                                  >
                                    {deliveryTimeUpdatingId === o.id ? "…" : "Обновить"}
                                  </button>
                                </div>
                              </div>
                            )}
                            {o.customer && (
                              <div className="profile-order-card__courier">
                                <span>Клиент: <strong>{o.customer.fullName || "—"}</strong></span>
                                <span>Адрес: {o.customer.address || "—"}</span>
                                <span>Телефон: {o.customer.phone || "—"}</span>
                              </div>
                            )}
                            {nextLabel && (
                              <button
                                type="button"
                                className="btn btn--primary btn--sm profile-order-card__take"
                                disabled={statusUpdatingId === o.id}
                                onClick={() => setOrderStatus(o.id, nextStatus)}
                              >
                                {statusUpdatingId === o.id ? "…" : nextLabel}
                              </button>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
                <section className="profile-section profile-orders">
                  <h2 className="profile-section__title">Доступные заказы</h2>
                  <p className="profile-orders__hint">Заказы без курьера. Нажмите «Взять заказ», чтобы назначить доставку на себя.</p>
                  {availableOrders.length === 0 ? (
                    <div className="card">
                      <p style={{ margin: 0, color: "var(--muted)" }}>Нет доступных заказов. Новые появятся после оплаты клиентами.</p>
                    </div>
                  ) : (
                    <ul className="profile-orders__list">
                      {availableOrders.map((o) => (
                        <li key={o.id} className="card profile-order-card profile-order-card--available">
                          <div className="profile-order-card__row">
                            <strong>{o.totalEth} ETH</strong>
                            <span className="profile-order-card__items">{o.items?.length || 0} поз.</span>
                          </div>
                          {o.minutesLeft != null && (
                            <div className="profile-order-card__delivery">
                              <span className="profile-order-card__mins">Доставка через ~{o.minutesLeft} мин</span>
                            </div>
                          )}
                          {o.customer?.address && (
                            <div className="profile-order-card__courier">
                              <span>Адрес: {o.customer.address}</span>
                            </div>
                          )}
                          <button
                            type="button"
                            className="btn btn--primary btn--sm profile-order-card__take"
                            disabled={assigningId === o.id}
                            onClick={async () => {
                              setAssigningId(o.id);
                              try {
                                const r = await fetch(`${API_BASE_URL}/api/orders/${o.id}/assign`, {
                                  method: "PATCH",
                                  headers: { Authorization: `Bearer ${token}` },
                                });
                                if (r.ok) fetchCourierOrders();
                              } finally {
                                setAssigningId(null);
                              }
                            }}
                          >
                            {assigningId === o.id ? "…" : "Взять заказ"}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </>
            )}

            {/* 6. Ваши заказы — только для заказщика */}
            {role === "customer" && (
              <section className="profile-section profile-orders">
                <h2 className="profile-section__title">Ваши заказы</h2>
                {orders.length === 0 ? (
                  <div className="card">
                    <p style={{ margin: 0, color: "var(--muted)" }}>Пока нет заказов. Оформите заказ в каталоге и оплатите ETH.</p>
                  </div>
                ) : (
                  <ul className="profile-orders__list">
                    {orders.map((o) => {
                      const status = o.status || "pending";
                      const statusLabel =
                        status === "cancelled"
                          ? "Заказ отменён"
                          : status === "delivered"
                            ? "Заказ завершён"
                            : status === "on_the_way" || status === "picked_up"
                              ? "Курьер в пути"
                              : o.courier
                                ? "Курьер назначен"
                                : "Ожидает курьера";
                      const canCancel = status !== "delivered" && status !== "cancelled";
                      return (
                        <li key={o.id} className="card profile-order-card">
                          <div className="profile-order-card__row">
                            <strong>{o.totalEth} ETH</strong>
                            <span className="profile-order-card__items">{o.items?.length || 0} поз.</span>
                          </div>
                          <div className={`profile-order-card__status-badge profile-order-card__status-badge--${status === "cancelled" ? "cancelled" : status === "delivered" ? "done" : status === "on_the_way" || status === "picked_up" ? "progress" : "wait"}`}>
                            {statusLabel}
                          </div>
                          {status !== "delivered" && status !== "cancelled" && (
                            <div className="profile-order-card__delivery">
                              {o.minutesLeft != null ? (
                                <span className="profile-order-card__mins">
                                  До доставки: <strong>{o.minutesLeft === 0 ? "Скоро" : `${o.minutesLeft} мин`}</strong>
                                </span>
                              ) : (
                                <span className="profile-order-card__mins">Время доставки не указано</span>
                              )}
                            </div>
                          )}
                          {o.courier && status !== "cancelled" && (
                            <div className="profile-order-card__courier">
                              <span>Курьер: <strong>{o.courier.fullName || "—"}</strong></span>
                              <span>Машина: {o.courier.carInfo || "—"}</span>
                              <span>Гос. номер: {o.courier.carPlate || "—"}</span>
                            </div>
                          )}
                          {!o.courier && status !== "cancelled" && (
                            <div className="profile-order-card__courier profile-order-card__courier--none">Курьер не назначен</div>
                          )}
                          {canCancel && (
                            <button
                              type="button"
                              className="btn btn--danger btn--sm profile-order-card__cancel"
                              disabled={cancelingOrderId === o.id}
                              onClick={() => cancelOrder(o.id)}
                            >
                              {cancelingOrderId === o.id ? "…" : "Отменить заказ"}
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            )}
          </>
        )}

        <div className="main__bottom-pad" />
      </main>
    </div>
  );
}
