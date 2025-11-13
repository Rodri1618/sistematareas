import { useState, useEffect } from "react";

function ModalComentarios({
  supabase,
  currentUser,
  tareaId,
  tareas,
  onClose,
  mostrarAlerta,
}) {
  const [comentarios, setComentarios] = useState([]);
  const [nuevoComentario, setNuevoComentario] = useState("");
  const [cargando, setCargando] = useState(false);

  const tarea = tareas.find((t) => t.id === tareaId);

  useEffect(() => {
    if (tareaId) {
      cargarComentarios();
    }
  }, [tareaId]);

  const cargarComentarios = async () => {
    try {
      const { data, error } = await supabase
        .from("comentarios")
        .select("*")
        .eq("tarea_id", tareaId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setComentarios(data || []);
    } catch (error) {
      console.error("Error cargando comentarios:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nuevoComentario.trim()) return;

    setCargando(true);
    try {
      const { error } = await supabase.from("comentarios").insert([
        {
          tarea_id: tareaId,
          user_id: currentUser.id,
          user_email: currentUser.email,
          user_name:
            currentUser.user_metadata?.name || currentUser.email.split("@")[0],
          user_avatar: currentUser.user_metadata?.picture || "",
          comentario: nuevoComentario,
        },
      ]);

      if (error) throw error;

      setNuevoComentario("");
      await cargarComentarios();
      mostrarAlerta("Comentario agregado", "success");
    } catch (error) {
      console.error("Error guardando comentario:", error);
      mostrarAlerta("Error al guardar comentario", "error");
    } finally {
      setCargando(false);
    }
  };

  if (!tarea) return null;

  return (
    <div className="modal" style={{ display: "block" }} onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <span className="close" onClick={onClose}>
          &times;
        </span>

        <h2>💬 Comentarios de la Tarea</h2>

        <div className="tarea-info">
          <h3>{tarea.titulo}</h3>
          <p>
            <strong>Materia:</strong> {tarea.materia}
          </p>
          <p>
            <strong>Descripción:</strong> {tarea.descripcion}
          </p>
          <p>
            <strong>Fecha de entrega:</strong>{" "}
            {new Date(tarea.fecha_entrega + "T00:00").toLocaleDateString(
              "es-ES"
            )}
          </p>
          <span className={`status-badge status-${tarea.status}`}>
            {tarea.status.replace("_", " ").toUpperCase()}
          </span>
        </div>

        <div className="comentarios-list">
          {comentarios.length === 0 ? (
            <p className="no-comments">
              No hay comentarios aún. ¡Sé el primero en comentar!
            </p>
          ) : (
            comentarios.map((comentario) => (
              <div key={comentario.id} className="comentario">
                <div className="comentario-header">
                  <img
                    src={
                      comentario.user_avatar || "https://via.placeholder.com/32"
                    }
                    className="comentario-avatar"
                    alt="Avatar"
                  />
                  <div>
                    <strong>{comentario.user_name}</strong>
                    <small>
                      {new Date(comentario.created_at).toLocaleString("es-ES")}
                    </small>
                  </div>
                </div>
                <p className="comentario-texto">{comentario.comentario}</p>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <textarea
            value={nuevoComentario}
            onChange={(e) => setNuevoComentario(e.target.value)}
            placeholder="Escribe tu comentario..."
            rows="3"
            required
          />
          <button type="submit" className="btn btn-primary" disabled={cargando}>
            {cargando ? "Enviando..." : "Enviar Comentario"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ModalComentarios;
