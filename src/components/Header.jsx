function Header({ user, userRole, isOnline, onLogout }) {
  const primerNombre = (user.user_metadata?.name || user.email).split(" ")[0];

  return (
    <>
      <div className="user-info">
        <img
          className="user-avatar"
          src={
            user.user_metadata?.picture || user.user_metadata?.avatar_url || ""
          }
          alt="Avatar"
        />
        {primerNombre}
        <span className={`role-badge role-${userRole}`}>
          {userRole === "admin" ? "Admin" : "Padre"}
        </span>
        <button onClick={onLogout} className="logout-btn">
          Salir
        </button>
      </div>

      <div
        className={`status-indicator ${
          isOnline ? "status-online" : "status-offline"
        }`}
      >
        {isOnline ? "🟢 online" : "🔴 offline"}
      </div>
    </>
  );
}

export default Header;
