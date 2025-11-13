function AdminPanel({ onVerReportes }) {
  return (
    <div className="admin-panel">
      <h2>Panel de Administración</h2>
      <button onClick={onVerReportes} className="btn btn-warning">
        Ver Reportes
      </button>
    </div>
  );
}

export default AdminPanel;
