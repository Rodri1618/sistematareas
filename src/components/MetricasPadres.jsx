import { useState, useEffect } from "react";

function MetricasPadres({ supabase, tareas }) {
  const [accesos, setAccesos] = useState([]);
  const [tiempoSesion, setTiempoSesion] = useState({
    tiempoPromedio: 0,
    totalSesiones: 0,
  });

  useEffect(() => {
    cargarAccesos();
  }, []);

  const cargarAccesos = async () => {
    try {
      const { data, error } = await supabase
        .from("accesos_padres")
        .select("*")
        .order("fecha_acceso", { ascending: false })
        .limit(50);

      if (error) throw error;
      setAccesos(data || []);
      calcularTiempoSesion(data || []);
    } catch (error) {
      console.error("Error cargando accesos:", error);
    }
  };

  const calcularTiempoSesion = (accesosData) => {
    if (accesosData.length < 2) {
      setTiempoSesion({ tiempoPromedio: 0, totalSesiones: 0 });
      return;
    }

    const sesiones = {};
    accesosData.forEach((acceso) => {
      if (!sesiones[acceso.user_email]) {
        sesiones[acceso.user_email] = [];
      }
      sesiones[acceso.user_email].push(new Date(acceso.fecha_acceso));
    });

    let sumaTiempos = 0;
    let conteoSesiones = 0;

    Object.values(sesiones).forEach((fechas) => {
      fechas.sort((a, b) => a - b);
      for (let i = 0; i < fechas.length - 1; i++) {
        const diferencia = fechas[i + 1] - fechas[i];
        const minutos = diferencia / (1000 * 60);

        if (minutos < 120) {
          sumaTiempos += minutos;
          conteoSesiones++;
        }
      }
    });

    const tiempoPromedio =
      conteoSesiones > 0 ? Math.round(sumaTiempos / conteoSesiones) : 0;
    setTiempoSesion({ tiempoPromedio, totalSesiones: conteoSesiones });
  };

  const calcularMetricasPadres = () => {
    if (!tareas || tareas.length === 0) {
      return { totalPadresActivos: 0, padresConTareasPendientes: 0 };
    }

    const padresUnicos = new Set();
    tareas.forEach((tarea) => padresUnicos.add(tarea.user_email));

    const padresConPendientes = new Set();
    tareas.forEach((tarea) => {
      if (tarea.status === "pendiente" || tarea.status === "en_progreso") {
        padresConPendientes.add(tarea.user_email);
      }
    });

    return {
      totalPadresActivos: padresUnicos.size,
      padresConTareasPendientes: padresConPendientes.size,
    };
  };

  const metricas = calcularMetricasPadres();

  return (
    <>
      <div className="reporte-seccion">
        <h3>👥 Métricas de Padres</h3>
        <div className="metricas-dashboard">
          <div className="metrica-card info">
            <div className="metrica-icono">👥</div>
            <div className="metrica-valor">{metricas.totalPadresActivos}</div>
            <div className="metrica-label">Padres Activos</div>
          </div>

          <div
            className={`metrica-card ${
              metricas.padresConTareasPendientes > 0 ? "warning" : "success"
            }`}
          >
            <div className="metrica-icono">⚠️</div>
            <div className="metrica-valor">
              {metricas.padresConTareasPendientes}
            </div>
            <div className="metrica-label">Con Tareas Pendientes</div>
          </div>
        </div>
      </div>

      <div className="reporte-seccion">
        <h3>🕐 Registro de Accesos</h3>

        {accesos.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              color: "var(--text-light)",
              padding: "2rem",
            }}
          >
            No hay registros de acceso aún
          </div>
        ) : (
          <>
            <div
              style={{
                marginBottom: "1.5rem",
                padding: "1rem",
                background: "linear-gradient(135deg, #E8F2FF 0%, #D1E7FF 100%)",
                borderRadius: "12px",
                border: "2px solid #B3D9FF",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-around",
                  textAlign: "center",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "2rem",
                      fontWeight: "700",
                      color: "var(--primary)",
                    }}
                  >
                    {accesos.length}
                  </div>
                  <div
                    style={{ fontSize: "0.85rem", color: "var(--text-light)" }}
                  >
                    Total Accesos
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "2rem",
                      fontWeight: "700",
                      color: "var(--primary)",
                    }}
                  >
                    {tiempoSesion.tiempoPromedio}
                  </div>
                  <div
                    style={{ fontSize: "0.85rem", color: "var(--text-light)" }}
                  >
                    Min. Promedio
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                overflowX: "auto",
                maxHeight: "300px",
                overflowY: "auto",
                borderRadius: "10px",
                border: "1px solid var(--border)",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "0.9rem",
                }}
              >
                <thead
                  style={{
                    position: "sticky",
                    top: 0,
                    zIndex: 10,
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  }}
                >
                  <tr style={{ background: "var(--primary)", color: "white" }}>
                    <th style={{ padding: "0.8rem", textAlign: "left" }}>
                      Padre
                    </th>
                    <th style={{ padding: "0.8rem", textAlign: "center" }}>
                      Dispositivo
                    </th>
                    <th style={{ padding: "0.8rem", textAlign: "center" }}>
                      Fecha
                    </th>
                    <th style={{ padding: "0.8rem", textAlign: "center" }}>
                      Hora
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {accesos.map((acceso, idx) => {
                    const fecha = new Date(acceso.fecha_acceso);
                    return (
                      <tr
                        key={acceso.id || idx}
                        style={{
                          background: idx % 2 === 0 ? "#F8F9FA" : "white",
                        }}
                      >
                        <td style={{ padding: "0.8rem" }}>
                          <strong>{acceso.user_name}</strong>
                          <br />
                          <small style={{ color: "var(--text-light)" }}>
                            {acceso.user_email}
                          </small>
                        </td>
                        <td style={{ padding: "0.8rem", textAlign: "center" }}>
                          <span
                            style={{
                              background: "#E8F2FF",
                              padding: "0.3rem 0.8rem",
                              borderRadius: "10px",
                              fontSize: "0.85rem",
                            }}
                          >
                            {acceso.dispositivo || "💻 PC/Laptop"}
                          </span>
                        </td>
                        <td style={{ padding: "0.8rem", textAlign: "center" }}>
                          {fecha.toLocaleDateString("es-ES")}
                        </td>
                        <td style={{ padding: "0.8rem", textAlign: "center" }}>
                          {fecha.toLocaleTimeString("es-ES", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default MetricasPadres;
