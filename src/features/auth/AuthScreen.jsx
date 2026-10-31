import { useState } from "react";
import { api } from "@/shared/api/api.js";

export default function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await api(`/api/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      onAuthenticated(result);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  function toggleMode() {
    setMode((current) => (current === "login" ? "register" : "login"));
    setError("");
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="brand auth-brand">
          <div className="brand-icon brand-mark">S0</div>
          <div>
            <h1>СЕКТОР НОЛЬ</h1>
            <p>Исследуй. Автоматизируй. Перезапускай.</p>
          </div>
        </div>
        <div className="auth-intro">
          <span className="auth-kicker">СОХРАНЕНИЕ ПРОГРЕССА</span>
          <h2>{mode === "login" ? "С возвращением" : "Создать аккаунт"}</h2>
          <p>Войди или зарегистрируйся — прогресс будет сохранён отдельно для аккаунта.</p>
        </div>
        <form className="auth-form" onSubmit={submit}>
          <label htmlFor="username">Ник пользователя</label>
          <input
            id="username"
            name="username"
            autoComplete="username"
            minLength={3}
            maxLength={20}
            required
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Например, ClickMaster"
          />
          <label htmlFor="password">Пароль</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            minLength={8}
            maxLength={128}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Минимум 8 символов"
          />
          {mode === "register" && (
            <p className="field-note">Ник: 3–20 букв, цифр, дефисов или подчёркиваний.</p>
          )}
          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}
          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? "Секунду..." : mode === "login" ? "Войти в игру" : "Создать аккаунт"}
          </button>
        </form>
        <div className="auth-switch">
          {mode === "login" ? "Впервые здесь?" : "Уже есть аккаунт?"}
          <button type="button" onClick={toggleMode}>
            {mode === "login" ? "Регистрация" : "Войти"}
          </button>
        </div>
        <div className="auth-footnote">
          <span>SECURE</span>
          <span>Пароль хранится в защищённом виде. У каждого игрока своя база игры.</span>
        </div>
      </section>
    </main>
  );
}
