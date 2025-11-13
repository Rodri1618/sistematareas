import { MESES } from "../config.jsx";

function Calendario({
  tareas,
  mesActual,
  anioActual,
  currentUser,
  userRole,
  onCambiarMes,
  onAbrirComentarios,
  onCambiarStatus,
  onEliminarTarea,
}) {
  const diasEnMes = new Date(anioActual, mesActual + 1, 0).getDate();
  const primerDia = new Date(anioActual, mesActual, 1).getDay();

  const hoy = new Date();
  const esHoy = (dia) => {
    return (
      dia === hoy.getDate() &&
      mesActual === hoy.getMonth() &&
      anioActual === hoy.getFullYear()
    );
  };

  const obtenerTareasDelDia = (dia) => {
    return tareas.filter((tarea) => {
      const fechaTarea = new Date(tarea.fecha_entrega + "T00:00");
      return (
        fechaTarea.getDate() === dia &&
        fechaTarea.getMonth() === mesActual &&
        fechaTarea.getFullYear() === anioActual
      );
    });
  };

  const dias = [];

  for (let i = 0; i < primerDia; i++) {
    dias.push(
      <div
        key={`vacio-${i}`}
        className="dia"
        style={{ visibility: "hidden" }}
      />
    );
  }

  for (let dia = 1; dia <= diasEnMes; dia++) {
    const tareasDelDia = obtenerTareasDelDia(dia);

    dias.push(
      <div key={dia} className={`dia ${esHoy(dia) ? "today" : ""}`}>
        <strong>{dia}</strong>

        {tareasDelDia.map((tarea) => {
          const esPropia = tarea.user_id === currentUser.id;
          const archivos = Array.isArray(tarea.archivos) ? tarea.archivos : [];

          return (
            <div key={tarea.id} className={`tarea tarea-${tarea.status}`}>
              <div className="tarea-header">
                <strong>{tarea.titulo}</strong>
                <span className={`status-badge status-${tarea.status}`}>
                  {tarea.status.replace("_", " ")}
                </span>
              </div>

              <small className="tarea-materia">{tarea.materia}</small>

              <p className="tarea-descripcion">
                {tarea.descripcion.substring(0, 80)}
                {tarea.descripcion.length > 80 ? "..." : ""}
              </p>

              <small className="user">
                👤 {tarea.user_name || tarea.user_email.split("@")[0]}
                {esPropia ? " (Tú)" : ""}
              </small>

              {/* SECCIÓN DE ARCHIVOS */}
              {archivos.length > 0 && (
                <div style={{ marginTop: "0.5rem" }}>
                  <small
                    style={{
                      display: "block",
                      fontWeight: "600",
                      color: "var(--primary)",
                      marginBottom: "0.3rem",
                    }}
                  >
                    {archivos.length} archivo(s):
                  </small>
                  <ul
                    style={{
                      fontSize: "0.8rem",
                      listStyle: "none",
                      padding: 0,
                      margin: 0,
                    }}
                  >
                    {archivos.map((archivo, index) => {
                      // Detectar si es imagen
                      const esImagen = /\.(jpg|jpeg|png|gif|webp)$/i.test(
                        archivo.nombre
                      );

                      return (
                        <li key={index} style={{ margin: "0.3rem 0" }}>
                          <a
                            href={archivo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              textDecoration: "none",
                              color: "#0066cc",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.3rem",
                            }}
                          >
                            {esImagen}
                            {archivo.nombre.length > 20
                              ? archivo.nombre.substring(0, 10) + " .img"
                              : archivo.nombre}
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              <div className="tarea-acciones">
                <button
                  className="btn btn-small"
                  onClick={() => onAbrirComentarios(tarea.id)}
                >
                  💬 Comentarios
                </button>

                {(userRole === "admin" || esPropia) && (
                  <select
                    value={tarea.status}
                    onChange={(e) => onCambiarStatus(tarea.id, e.target.value)}
                    className="status-select"
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="en_progreso">En Progreso</option>
                    <option value="completada">Completada</option>
                  </select>
                )}

                {esPropia && userRole === "admin" && (
                  <button
                    className="btn btn-danger btn-small"
                    onClick={() => onEliminarTarea(tarea.id)}
                  >
                    Eliminar
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <>
      <div className="calendar-navigation">
        <button
          className="btn btn-primary"
          onClick={() => onCambiarMes("anterior")}
        >
          ⬅️ Anterior
        </button>

        <h2>
          📅 {MESES[mesActual]} {anioActual}
        </h2>

        <button
          className="btn btn-primary"
          onClick={() => onCambiarMes("siguiente")}
        >
          Siguiente ➡️
        </button>
      </div>

      <div className="card">
        <div className="calendar-headers">
          <div className="day-header">Dom</div>
          <div className="day-header">Lun</div>
          <div className="day-header">Mar</div>
          <div className="day-header">Mié</div>
          <div className="day-header">Jue</div>
          <div className="day-header">Vie</div>
          <div className="day-header">Sáb</div>
        </div>

        <div id="calendario">{dias}</div>
      </div>
    </>
  );
}

export default Calendario;
