import { CONFIG } from "../config.js";

let emailJSCargado = false;
let ultimaVerificacion = null;

// Inicializar EmailJS
export const inicializarEmailJS = () => {
  return new Promise((resolve, reject) => {
    if (emailJSCargado) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src =
      "https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js";

    script.onload = () => {
      window.emailjs.init(CONFIG.EMAILJS_PUBLIC_KEY);
      emailJSCargado = true;
      console.log("✅ EmailJS inicializado");
      resolve();
    };

    script.onerror = () => {
      console.error("❌ Error cargando EmailJS");
      reject(new Error("Error cargando EmailJS"));
    };

    document.head.appendChild(script);
  });
};

// Verificar si ya se envió hoy
const yaSeEnvioHoy = () => {
  if (!ultimaVerificacion) return false;
  const hoy = new Date().setHours(0, 0, 0, 0);
  const ultimaFecha = new Date(ultimaVerificacion).setHours(0, 0, 0, 0);
  return hoy === ultimaFecha;
};

// Obtener padres desde Supabase
const obtenerPadres = async (supabase) => {
  if (!supabase) return [];
  try {
    const { data } = await supabase
      .from("usuarios_roles")
      .select("user_email")
      .eq("rol", "padre");
    return data || [];
  } catch (error) {
    console.error("Error obteniendo padres:", error);
    return [];
  }
};

// Enviar email individual
const enviarEmail = async (email, nombre, tareas, fecha) => {
  if (!emailJSCargado || !window.emailjs) {
    throw new Error("EmailJS no está disponible");
  }

  let listaTareas = "";
  tareas.forEach((t, i) => {
    listaTareas += `\n📚 TAREA ${i + 1}:\n   • Título: ${
      t.titulo
    }\n   • Materia: ${t.materia}\n   • Descripción: ${
      t.descripcion
    }\n   • Estado: ${t.status.replace("_", " ").toUpperCase()}\n${
      t.archivos?.length ? `   • Archivos: ${t.archivos.length}` : ""
    }\n`;
  });

  const params = {
    to_email: email,
    to_name: nombre,
    cantidad_tareas: tareas.length,
    lista_tareas: listaTareas.trim(),
    fecha_entrega: fecha.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
  };

  return await window.emailjs.send(
    CONFIG.EMAILJS_SERVICE_ID,
    CONFIG.EMAILJS_TEMPLATE_ID,
    params
  );
};

// Verificación automática y envío
export const verificarYEnviarNotificaciones = async (supabase, tareas) => {
  if (!emailJSCargado || !supabase || !tareas?.length || yaSeEnvioHoy()) {
    return { enviados: 0, fallidos: 0, total: 0 };
  }

  const maniana = new Date();
  maniana.setDate(maniana.getDate() + 1);
  maniana.setHours(0, 0, 0, 0);

  const tareasManiana = tareas.filter((tarea) => {
    const fechaEntrega = new Date(tarea.fecha_entrega + "T00:00");
    fechaEntrega.setHours(0, 0, 0, 0);
    return fechaEntrega.getTime() === maniana.getTime();
  });

  if (!tareasManiana.length) {
    return {
      enviados: 0,
      fallidos: 0,
      total: 0,
      mensaje: "No hay tareas para mañana",
    };
  }

  const padres = await obtenerPadres(supabase);
  if (!padres.length) {
    return {
      enviados: 0,
      fallidos: 0,
      total: 0,
      mensaje: "No hay padres registrados",
    };
  }

  let enviados = 0;
  let fallidos = 0;

  for (const padre of padres) {
    try {
      await enviarEmail(
        padre.user_email,
        padre.user_email.split("@")[0],
        tareasManiana,
        maniana
      );
      enviados++;
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`Error enviando a ${padre.user_email}:`, error);
      fallidos++;
    }
  }

  ultimaVerificacion = new Date();
  return { enviados, fallidos, total: padres.length };
};

// Envío manual para admins
export const enviarRecordatoriosTodos = async (supabase, tareas) => {
  if (!emailJSCargado) {
    throw new Error("EmailJS no está inicializado");
  }

  ultimaVerificacion = null;
  return await verificarYEnviarNotificaciones(supabase, tareas);
};

// Envío personal para un padre
export const enviarRecordatorioPersonal = async (
  supabase,
  tareas,
  userEmail,
  userName
) => {
  if (!emailJSCargado) {
    throw new Error("EmailJS no está inicializado");
  }

  const maniana = new Date();
  maniana.setDate(maniana.getDate() + 1);
  maniana.setHours(0, 0, 0, 0);

  const tareasManiana = tareas.filter((t) => {
    const fecha = new Date(t.fecha_entrega + "T00:00");
    fecha.setHours(0, 0, 0, 0);
    return fecha.getTime() === maniana.getTime();
  });

  if (!tareasManiana.length) {
    throw new Error("No hay tareas para mañana");
  }

  await enviarEmail(userEmail, userName, tareasManiana, maniana);
  return { enviados: 1, fallidos: 0, total: 1 };
};
