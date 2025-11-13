import MetricasPadres from "./MetricasPadres.jsx";

function ModalReportes({ supabase, tareas, onClose }) {
  const totalTareas = tareas.length;
  const pendientes = tareas.filter((t) => t.status === "pendiente").length;
  const enProgreso = tareas.filter((t) => t.status === "en_progreso").length;
  const completadas = tareas.filter((t) => t.status === "completada").length;

  const porMateria = {};
  tareas.forEach((t) => {
    porMateria[t.materia] = (porMateria[t.materia] || 0) + 1;
  });

  const porcentaje = (valor) => {
    return totalTareas > 0 ? ((valor / totalTareas) * 100).toFixed(1) : 0;
  };

  return (
    <div className="modal" style={{ display: "block" }} onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <span className="close" onClick={onClose}>
          &times;
        </span>

        <h2>📊 Panel de Indicadores de Avance</h2>

        <div style={{ marginBottom: "2rem" }}>
          <p
            style={{
              color: "var(--text-light)",
              margin: "0.3rem 0 0 0",
              fontSize: "0.9rem",
            }}
          >
            Actualizado: {new Date().toLocaleString("es-ES")}
          </p>
        </div>

        <MetricasPadres supabase={supabase} tareas={tareas} />

        <div className="reporte-seccion">
          <h3>📊 Resumen General de Tareas</h3>
          <div className="reporte-grid">
            <div className="reporte-card">
              <div className="reporte-numero">{totalTareas}</div>
              <div className="reporte-label">Total de Tareas</div>
            </div>
            <div className="reporte-card warning">
              <div className="reporte-numero">{pendientes}</div>
              <div className="reporte-label">
                Pendientes ({porcentaje(pendientes)}%)
              </div>
            </div>
            <div className="reporte-card info">
              <div className="reporte-numero">{enProgreso}</div>
              <div className="reporte-label">
                En Progreso ({porcentaje(enProgreso)}%)
              </div>
            </div>
            <div className="reporte-card success">
              <div className="reporte-numero">{completadas}</div>
              <div className="reporte-label">
                Completadas ({porcentaje(completadas)}%)
              </div>
            </div>
          </div>
        </div>

        <div className="reporte-seccion">
          <h3>📚 Tareas por Materia</h3>
          {Object.keys(porMateria).length === 0 ? (
            <p
              style={{
                textAlign: "center",
                color: "var(--text-light)",
                padding: "2rem",
              }}
            >
              No hay tareas registradas
            </p>
          ) : (
            Object.entries(porMateria).map(([materia, cantidad]) => (
              <div key={materia} className="reporte-item">
                <span>{materia}</span>
                <span>
                  <strong>{cantidad}</strong> ({porcentaje(cantidad)}%)
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default ModalReportes;
