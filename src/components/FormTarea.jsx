import { useState } from "react";
import { CONFIG } from "../config.jsx";

function FormTarea({ supabase, currentUser, onTareaGuardada, mostrarAlerta }) {
  const [materia, setMateria] = useState("");
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fechaAsignacion, setFechaAsignacion] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [fechaEntrega, setFechaEntrega] = useState(() => {
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    return manana.toISOString().split("T")[0];
  });
  const [archivos, setArchivos] = useState([]);
  const [guardando, setGuardando] = useState(false);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const validos = files.filter((f) => f.size <= CONFIG.MAX_FILE_SIZE);
    setArchivos(validos);

    if (validos.length < files.length) {
      mostrarAlerta("Algunos archivos superan los 10MB", "error");
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.style.borderColor = "var(--primary)";
    e.currentTarget.style.background = "#F8F9FF";
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.currentTarget.style.borderColor = "var(--border)";
    e.currentTarget.style.background = "#FAFBFC";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.style.borderColor = "var(--border)";
    e.currentTarget.style.background = "#FAFBFC";

    const files = Array.from(e.dataTransfer.files);
    const validos = files.filter((f) => f.size <= CONFIG.MAX_FILE_SIZE);
    setArchivos(validos);

    if (validos.length < files.length) {
      mostrarAlerta("Algunos archivos superan los 10MB", "error");
    }
  };

  const eliminarArchivo = (index) => {
    const nuevosArchivos = archivos.filter((_, i) => i !== index);
    setArchivos(nuevosArchivos);
    mostrarAlerta("Archivo eliminado de la lista", "info");
  };

  const subirArchivo = async (file) => {
    const timestamp = Date.now();
    const fileName = `${currentUser.id}/${timestamp}_${file.name}`;

    const { error } = await supabase.storage
      .from("archivos-tareas")
      .upload(fileName, file);

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from("archivos-tareas")
      .getPublicUrl(fileName);

    return {
      nombre: file.name,
      url: urlData.publicUrl,
      size: file.size,
      path: fileName,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);

    try {
      let archivosSubidos = [];

      for (const file of archivos) {
        const archivoData = await subirArchivo(file);
        archivosSubidos.push(archivoData);
      }

      await supabase.from("tareas").insert([
        {
          materia,
          titulo,
          descripcion,
          fecha_asignacion: fechaAsignacion,
          fecha_entrega: fechaEntrega,
          archivos: archivosSubidos,
          status: "pendiente",
          user_id: currentUser.id,
          user_email: currentUser.email,
          user_name:
            currentUser.user_metadata?.name || currentUser.email.split("@")[0],
          user_avatar: currentUser.user_metadata?.picture || "",
        },
      ]);

      setMateria("");
      setTitulo("");
      setDescripcion("");
      setArchivos([]);
      document.getElementById("fileInput").value = "";

      onTareaGuardada();
    } catch (error) {
      console.error("Error:", error);
      mostrarAlerta("Error al guardar tarea", "error");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="card">
      <h2>📝 Nueva Tarea</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Materia</label>
          <select
            value={materia}
            onChange={(e) => setMateria(e.target.value)}
            required
          >
            <option value="">🎯 Selecciona una materia</option>
            <option>🔢 Matemáticas</option>
            <option>📖 Comunicación</option>
            <option>🔬 Ciencia y Tecnología</option>
            <option>🏛️ Personal Social</option>
            <option>⛪ Educación Religiosa</option>
            <option>🎨 Arte</option>
            <option>🌎 Phonics</option>
            <option>🌎 Language Arts</option>
            <option>💃🏻 Folklore</option>
            <option>👩🏻‍🏫 Tutoría</option>
          </select>
        </div>

        <div className="form-group">
          <label>Título de la Tarea</label>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ej: Resolver ejercicios de fracciones"
            required
          />
        </div>

        <div className="form-group">
          <label>Descripción de la Tarea</label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Describe la tarea en detalle..."
            rows="4"
            required
          />
        </div>

        <div className="form-group">
          <label>Fecha de Asignación</label>
          <input
            type="date"
            value={fechaAsignacion}
            onChange={(e) => setFechaAsignacion(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Fecha de Entrega</label>
          <input
            type="date"
            value={fechaEntrega}
            onChange={(e) => setFechaEntrega(e.target.value)}
            required
          />
        </div>

        {/* SECCIÓN DE ARCHIVOS  */}
        <div className="form-group">
          <label>Archivos y materiales</label>

          {/* Área de Drag & Drop */}
          <div
            className="file-area"
            onClick={() => document.getElementById("fileInput").click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}></div>
            <p>Arrastra archivos aquí o haz clic para seleccionar</p>
            <small>Máximo 10MB por archivo</small>
          </div>

          {/* Input oculto */}
          <input
            id="fileInput"
            type="file"
            onChange={handleFileChange}
            multiple
            accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.txt"
            style={{ display: "none" }}
          />

          {/* Lista de archivos */}
          {archivos.length > 0 && (
            <div id="fileList" className="file-list">
              {archivos.map((file, i) => (
                <div key={i} className="file-item valid">
                  <span>✅</span>
                  <div>
                    <strong>{file.name}</strong>
                    <small> ({(file.size / 1024 / 1024).toFixed(2)} MB)</small>
                  </div>
                  <button
                    type="button"
                    onClick={() => eliminarArchivo(i)}
                    className="btn-remove"
                  >
                    ✖
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button type="submit" className="btn btn-primary" disabled={guardando}>
          {guardando ? "⏳ Guardando..." : "💾 Guardar Tarea"}
        </button>
      </form>
    </div>
  );
}

export default FormTarea;
