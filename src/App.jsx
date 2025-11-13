import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import Login from "./components/Login.jsx";
import Header from "./components/Header.jsx";
import AdminPanel from "./components/AdminPanel.jsx";
import FormTarea from "./components/FormTarea.jsx";
import Calendario from "./components/Calendario.jsx";
import ModalComentarios from "./components/ModalComentarios.jsx";
import ModalReportes from "./components/ModalReportes.jsx";

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState("padre");
  const [tareas, setTareas] = useState([]);
  const [mesActual, setMesActual] = useState(new Date().getMonth());
  const [anioActual, setAnioActual] = useState(new Date().getFullYear());
  const [alertas, setAlertas] = useState({ mensaje: "", tipo: "" });
  const [modalComentarios, setModalComentarios] = useState({
    visible: false,
    tareaId: null,
  });
  const [modalReportes, setModalReportes] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);

  // Inicializar autenticación
  useEffect(() => {
    // Verificar sesión actual
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setCurrentUser(session.user);
        verificarRol(session.user);
        setIsOnline(true);
      }
      setLoading(false);
    });

    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        setCurrentUser(session.user);
        await verificarRol(session.user);
        setIsOnline(true);
      } else if (event === "SIGNED_OUT") {
        // Limpiar todo el estado
        setCurrentUser(null);
        setUserRole("padre");
        setIsOnline(false);
        setTareas([]);
        setModalComentarios({ visible: false, tareaId: null });
        setModalReportes(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Cargar tareas cuando hay usuario
  useEffect(() => {
    if (currentUser) {
      cargarTareas();

      const channel = supabase
        .channel("tareas_changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "tareas" },
          () => cargarTareas()
        )
        .subscribe();

      return () => supabase.removeChannel(channel);
    }
  }, [currentUser]);

  // Verificar rol del usuario
  const verificarRol = async (user) => {
    try {
      const { data, error } = await supabase
        .from("usuarios_roles")
        .select("rol")
        .eq("user_email", user.email)
        .single();

      if (data) {
        setUserRole(data.rol);
      } else {
        await supabase.from("usuarios_roles").insert([
          {
            user_id: user.id,
            user_email: user.email,
            rol: "padre",
          },
        ]);
        setUserRole("padre");
      }
    } catch (error) {
      console.error("Error verificando rol:", error);
      setUserRole("padre");
    }
  };

  // Cargar tareas
  const cargarTareas = async () => {
    try {
      const { data, error } = await supabase
        .from("tareas")
        .select("*")
        .order("fecha_entrega", { ascending: true });

      if (error) throw error;
      setTareas(data || []);
    } catch (error) {
      console.error("Error cargando tareas:", error);
      mostrarAlerta("Error cargando tareas", "error");
    }
  };

  // Mostrar alertas
  const mostrarAlerta = (mensaje, tipo = "info") => {
    setAlertas({ mensaje, tipo });
    setTimeout(() => setAlertas({ mensaje: "", tipo: "" }), 5000);
  };

  // Login con Google
  const handleGoogleLogin = async () => {
    try {
      const redirectTo = import.meta.env.VITE_REDIRECT_URL;

      if (!redirectTo) {
        console.error("URL no definida");
        return;
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
          redirectTo: redirectTo,
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error("Error en login:", error);
      mostrarAlerta("Error al iniciar sesión", "error");
    }
  };

  // Logout mejorado
  const handleLogout = async () => {
    try {
      // 1. Limpiar estado local inmediatamente
      setTareas([]);
      setModalComentarios({ visible: false, tareaId: null });
      setModalReportes(false);
      setCurrentUser(null);
      setUserRole("padre");
      setIsOnline(false);

      // 2. Intentar cerrar sesión en Supabase
      try {
        const { error } = await supabase.auth.signOut({ scope: "local" });
        if (error) {
          console.warn("Error en signOut (ignorado):", error.message);
        }
      } catch (signOutError) {
        console.warn("Excepción en signOut (ignorada):", signOutError.message);
      }

      // 3. Limpiar localStorage manualmente (por si acaso)
      try {
        const keys = Object.keys(localStorage);
        keys.forEach((key) => {
          if (key.includes("supabase") || key.includes("sb-")) {
            localStorage.removeItem(key);
          }
        });
      } catch (storageError) {
        console.warn("Error limpiando storage:", storageError);
      }

      mostrarAlerta("Sesión cerrada correctamente", "success");

      // 4. Recargar la página después de un momento
      setTimeout(() => {
        window.location.href = "/";
      }, 800);
    } catch (error) {
      console.error("Error general en logout:", error);
      // Forzar limpieza y recarga de todos modos
      setCurrentUser(null);
      setUserRole("padre");
      setIsOnline(false);
      setTareas([]);
      setTimeout(() => (window.location.href = "/"), 500);
    }
  };

  // Navegación del calendario
  const cambiarMes = (direccion) => {
    if (direccion === "anterior") {
      if (mesActual === 0) {
        setMesActual(11);
        setAnioActual(anioActual - 1);
      } else {
        setMesActual(mesActual - 1);
      }
    } else {
      if (mesActual === 11) {
        setMesActual(0);
        setAnioActual(anioActual + 1);
      } else {
        setMesActual(mesActual + 1);
      }
    }
  };

  // Mostrar loading mientras verifica sesión
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <p>Cargando...</p>
      </div>
    );
  }

  // Si no hay usuario, mostrar login
  if (!currentUser) {
    return <Login onGoogleLogin={handleGoogleLogin} />;
  }

  return (
    <div className="app-container" style={{ display: "block" }}>
      <Header
        user={currentUser}
        userRole={userRole}
        isOnline={isOnline}
        onLogout={handleLogout}
        tareas={tareas} // 👈 AGREGAR
        mostrarAlerta={mostrarAlerta} // 👈 AGREGAR
      />

      <header>
        <h1>Sistema de Monitoreo de Tareas</h1>
        <p>Control y seguimiento de tareas escolares</p>
      </header>

      {userRole === "admin" && (
        <AdminPanel
          onVerReportes={() => setModalReportes(true)}
          supabase={supabase} // 👈 AGREGAR
          tareas={tareas} // 👈 AGREGAR
          mostrarAlerta={mostrarAlerta} // 👈 AGREGAR
        />
      )}

      <div className="container">
        {alertas.mensaje && (
          <div id="alertas">
            <div className={`alert alert-${alertas.tipo}`}>
              {alertas.mensaje}
            </div>
          </div>
        )}

        {userRole === "admin" && (
          <FormTarea
            supabase={supabase}
            currentUser={currentUser}
            onTareaGuardada={() => {
              cargarTareas();
              mostrarAlerta("Tarea guardada exitosamente", "success");
            }}
            mostrarAlerta={mostrarAlerta}
          />
        )}

        <Calendario
          tareas={tareas}
          mesActual={mesActual}
          anioActual={anioActual}
          currentUser={currentUser}
          userRole={userRole}
          onCambiarMes={cambiarMes}
          onAbrirComentarios={(tareaId) =>
            setModalComentarios({ visible: true, tareaId })
          }
          onCambiarStatus={async (tareaId, nuevoStatus) => {
            try {
              await supabase
                .from("tareas")
                .update({ status: nuevoStatus })
                .eq("id", tareaId);
              cargarTareas();
              mostrarAlerta("Estado actualizado", "success");
            } catch (error) {
              mostrarAlerta("Error actualizando estado", "error");
            }
          }}
          onEliminarTarea={async (tareaId) => {
            if (!window.confirm("¿Eliminar esta tarea?")) return;
            try {
              await supabase.from("tareas").delete().eq("id", tareaId);
              cargarTareas();
              mostrarAlerta("Tarea eliminada", "success");
            } catch (error) {
              mostrarAlerta("Error eliminando tarea", "error");
            }
          }}
        />
      </div>

      {modalComentarios.visible && (
        <ModalComentarios
          supabase={supabase}
          currentUser={currentUser}
          tareaId={modalComentarios.tareaId}
          tareas={tareas}
          onClose={() => setModalComentarios({ visible: false, tareaId: null })}
          mostrarAlerta={mostrarAlerta}
        />
      )}

      {modalReportes && (
        <ModalReportes
          supabase={supabase}
          tareas={tareas}
          onClose={() => setModalReportes(false)}
        />
      )}
    </div>
  );
}

export default App;
