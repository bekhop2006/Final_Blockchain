import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../components/Header";
import { useAuth } from "../context/AuthContext";

export default function Auth() {
  const [tab, setTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login, register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Уже авторизован — редирект туда, откуда пришли, или на главную
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || "/";
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location.state?.from?.pathname]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (tab === "login") {
        await login(email, password);
      } else {
        await register(email, password, fullName, phone, address);
      }
      const from = location.state?.from?.pathname || "/profile";
      navigate(from, { replace: true });
    } catch (e) {
      setError(e.message || "Ошибка");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page page--auth">
      <Header showSearch={false} />
      <main className="main main--with-nav">
        <h1 className="page-title">Вход в аккаунт</h1>
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${tab === "login" ? "auth-tab--active" : ""}`}
            onClick={() => { setTab("login"); setError(""); }}
          >
            Вход
          </button>
          <button
            type="button"
            className={`auth-tab ${tab === "register" ? "auth-tab--active" : ""}`}
            onClick={() => { setTab("register"); setError(""); }}
          >
            Регистрация
          </button>
        </div>
        <form className="card auth-form" onSubmit={handleSubmit}>
          {tab === "register" && (
            <>
              <div className="input-group">
                <label>ФИО</label>
                <input
                  type="text"
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Иванов Иван Иванович"
                  required={tab === "register"}
                />
              </div>
              <div className="input-group">
                <label>Номер телефона</label>
                <input
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+7 999 123-45-67"
                  required={tab === "register"}
                />
              </div>
              <div className="input-group">
                <label>Адрес</label>
                <input
                  type="text"
                  autoComplete="street-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Город, улица, дом, квартира"
                  required={tab === "register"}
                />
              </div>
            </>
          )}
          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@mail.com"
              required
            />
          </div>
          <div className="input-group">
            <label>Пароль</label>
            <input
              type="password"
              autoComplete={tab === "login" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={tab === "register" ? "минимум 6 символов" : ""}
              required
              minLength={tab === "register" ? 6 : undefined}
            />
          </div>
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
            {submitting ? "…" : tab === "login" ? "Войти" : "Зарегистрироваться"}
          </button>
        </form>
        <p className="auth-note">
          Аккаунт хранится в локальной MongoDB. Кошелёк MetaMask подключается отдельно в шапке или в профиле.
        </p>
        <div className="main__bottom-pad" />
      </main>
    </div>
  );
}
