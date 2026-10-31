export default function GameHeader({ account, onLogout }) {
  return (
    <header className="site-header">
      <div className="brand">
        <div className="brand-icon brand-mark">S0</div>
        <div>
          <h1>СЕКТОР НОЛЬ</h1>
        </div>
      </div>
      <div className="header-actions">
        <div className="account-chip">
          <span className="account-avatar">{account.username.slice(0, 1).toUpperCase()}</span>
          <span>{account.username}</span>
        </div>
        <button className="reset-button logout-button" type="button" onClick={onLogout}>
          Выйти
        </button>
      </div>
    </header>
  );
}
