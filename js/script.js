// CONFIGURACIÓN: sustituye este número por el WhatsApp de confirmaciones.
const WHATSAPP_NUMBER = "528712427294"; // 8662557778 Código de país + número, sin espacios ni signos.
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyL2R_HFNaAQ716uoasi2NnmOpibbWGVctwc2fYnm68Yfrjm4AULIm_UytwKF8oD6AAjw/exec";
const EVENT_DATE = new Date("2026-12-19T21:00:00-06:00");


/********************************************************
 * CONTROL DE CONFIRMACIONES Y FECHA LÍMITE
 ********************************************************/

const RSVP_DEADLINE = new Date("2026-12-10T00:00:00-06:00");

let respuestaConfirmada = false;
let modificandoRespuesta = false;

function fechaLimiteCumplida() {
  return new Date() >= RSVP_DEADLINE;
}


// Consultar el estado de confirmación mediante JSONP.
function consultarEstadoConfirmacion(codigo) {

  return new Promise((resolve, reject) => {

    const callbackName = "handleConfirmacionResponse";
    const script = document.createElement("script");

    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("No se pudo consultar la confirmación."));
    }, 15000);

    function cleanup() {
      clearTimeout(timeout);
      script.remove();
      delete window[callbackName];
    }

    window[callbackName] = (data) => {
      cleanup();
      resolve(data);
    };

    const url = new URL(GOOGLE_SCRIPT_URL);

    url.searchParams.set("action", "consultarConfirmacion");
    url.searchParams.set("codigo", codigo);
    url.searchParams.set("callback", callbackName);

    script.src = url.toString();

    script.onerror = () => {
      cleanup();
      reject(new Error("Error consultando la confirmación."));
    };

    document.body.appendChild(script);

  });

}


// Bloquear o habilitar el formulario.
function establecerEstadoConfirmacion(data) {

  const name = document.getElementById("guestName");
  const count = document.getElementById("guestCount");
  const attendees = document.getElementById("attendeeNames");

  const form = document.getElementById("rsvpForm");
  const submitButton = form.querySelector('button[type="submit"]');

  const editButton = document.getElementById("editRsvpButton");
  const status = document.getElementById("rsvpStatus");

  const campos = [name, count, attendees];

  respuestaConfirmada = data.confirmado === true;
  modificandoRespuesta = false;

  if (respuestaConfirmada) {

    name.value = data.nombre || "";
    count.value = data.cantidad || 1;
    attendees.value = data.asistentes || "";

    campos.forEach(campo => campo.disabled = true);

    submitButton.disabled = true;
    editButton.hidden = false;

    status.textContent = fechaLimiteCumplida()
      ? "Tu asistencia está confirmada. El periodo de modificaciones ha finalizado."
      : "Tu asistencia ya está confirmada.";

  } else {

    editButton.hidden = true;

    if (fechaLimiteCumplida()) {

      campos.forEach(campo => campo.disabled = true);
      submitButton.disabled = true;

      status.textContent = "El periodo de confirmación ha finalizado.";

    } else {

      campos.forEach(campo => campo.disabled = false);
      submitButton.disabled = false;

      status.textContent = "Tienes hasta el 10 de diciembre para confirmar.";

    }

  }

}


// Botón para modificar una respuesta existente.
document.getElementById("editRsvpButton").addEventListener("click", () => {

  if (fechaLimiteCumplida()) {
    alert("El periodo de modificaciones ha finalizado.");
    return;
  }

  modificandoRespuesta = true;

  const form = document.getElementById("rsvpForm");

  form.querySelectorAll("input, textarea").forEach(campo => {
    campo.disabled = false;
  });

  form.querySelector('button[type="submit"]').disabled = false;

  document.getElementById("editRsvpButton").hidden = true;

  document.getElementById("rsvpStatus").textContent =
    "Modifica tus datos y guarda nuevamente tu respuesta.";

});

/*******************************************************
 * IDENTIFICACIÓN DE LA FAMILIA
 *******************************************************/

let invitadoActual = null;

function consultarInvitado(codigo) {

  return new Promise((resolve, reject) => {

    const callbackName = "handleInvitadoResponse";

    const script = document.createElement("script");
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("Tiempo de espera agotado"));
    }, 15000);

    function cleanup() {
      clearTimeout(timeout);
      script.remove();
      delete window[callbackName];
    }

    window[callbackName] = (data) => {
      cleanup();
      resolve(data);
    };

    const url = new URL(GOOGLE_SCRIPT_URL);

    url.searchParams.set("action", "buscarInvitado");
    url.searchParams.set("codigo", codigo);
    url.searchParams.set("callback", callbackName);

    script.src = url.toString();

    script.onerror = () => {
      cleanup();
      reject(new Error("No se pudo consultar la invitación"));
    };

    document.body.appendChild(script);

  });

}


async function inicializarInvitacion() {

  const greeting = document.getElementById("familyGreeting");
  const form = document.getElementById("rsvpForm");
  const submitButton = form.querySelector('button[type="submit"]');

  const params = new URLSearchParams(window.location.search);
  const codigo = (params.get("codigo") || "").trim().toUpperCase();

  if (!/^XVG\d{3}$/.test(codigo)) {

    greeting.textContent =
      "No encontramos un código de invitación válido.";

    try {

  const estado = await consultarEstadoConfirmacion(codigo);

  if (!estado.success) {
    throw new Error("No se pudo verificar la confirmación.");
  }

  establecerEstadoConfirmacion(estado);

} catch (error) {

  console.error(error);

  submitButton.disabled = true;

  document.getElementById("rsvpStatus").textContent =
    "No pudimos verificar tu confirmación. Recarga la página.";

}
    return;

  }

  try {

    const resultado = await consultarInvitado(codigo);

    if (!resultado.success) {
      throw new Error(resultado.message || "Invitación no encontrada");
    }

    invitadoActual = {
      codigo: resultado.codigo,
      familia: resultado.familia
    };

    greeting.textContent =
      `¡Bienvenidos, ${resultado.familia}!`;

    submitButton.disabled = false;
    document.querySelector(
  '#wishesForm button[type="submit"]'
).disabled = false;

  } catch (error) {

    console.error("Error al identificar la familia:", error);

    greeting.textContent =
      "No pudimos validar esta invitación. Revisa el enlace.";

    submitButton.disabled = true;

  }

}

inicializarInvitacion();

// Abrir invitación e iniciar la música.
document.getElementById("openInvitation").addEventListener("click", async () => {

  // Desplazar hacia la bienvenida.
  document.getElementById("bienvenida").scrollIntoView({
    behavior: "smooth"
  });

  // Intentar reproducir la música.
  try {
    await music.play();

    musicLabel.textContent = "Pausar música";
    musicButton.setAttribute("aria-label", "Pausar música");

  } catch (error) {
    console.log("No se pudo iniciar la música:", error);
  }

});

// Cuenta regresiva.
function updateCountdown() {
  const now = new Date();
  const distance = EVENT_DATE - now;
  const values = {
    days: Math.max(0, Math.floor(distance / (1000 * 60 * 60 * 24))),
    hours: Math.max(0, Math.floor((distance / (1000 * 60 * 60)) % 24)),
    minutes: Math.max(0, Math.floor((distance / (1000 * 60)) % 60)),
    seconds: Math.max(0, Math.floor((distance / 1000) % 60))
  };
  Object.entries(values).forEach(([id, value]) => {
    document.getElementById(id).textContent = String(value).padStart(2, "0");
  });
}
updateCountdown();
setInterval(updateCountdown, 1000);

// Reproductor: los navegadores requieren una acción del usuario.
const music = document.getElementById("backgroundMusic");
const musicButton = document.getElementById("musicButton");
const musicLabel = document.getElementById("musicLabel");
musicButton.addEventListener("click", async () => {
  try {
    if (music.paused) {
      await music.play();
      musicLabel.textContent = "Pausar música";
      musicButton.setAttribute("aria-label", "Pausar música");
    } else {
      music.pause();
      musicLabel.textContent = "Reproducir música";
      musicButton.setAttribute("aria-label", "Reproducir música");
    }
  } catch (error) {
    musicLabel.textContent = "No se pudo reproducir";
  }
});

// Carrusel adaptable: 1 foto en móvil, 3 en escritorio.
const track = document.getElementById("galleryTrack");
const photos = Array.from(track.querySelectorAll("img"));
const dotsContainer = document.getElementById("galleryDots");
let currentPage = 0;
function photosPerPage() { return window.innerWidth <= 700 ? 1 : 3; }
function pageCount() { return Math.ceil(photos.length / photosPerPage()); }
function renderGallery() {
  const perPage = photosPerPage();
  currentPage = Math.min(currentPage, pageCount() - 1);
  const gap = 16;
  const slideWidth = photos[0].getBoundingClientRect().width + gap;
  track.style.transform = `translateX(${-currentPage * perPage * slideWidth}px)`;
  dotsContainer.innerHTML = "";
  for (let i = 0; i < pageCount(); i++) {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = i === currentPage ? "active" : "";
    dot.setAttribute("aria-label", `Ver grupo ${i + 1}`);
    dot.addEventListener("click", () => { currentPage = i; renderGallery(); });
    dotsContainer.appendChild(dot);
  }
}
document.getElementById("prevPhoto").addEventListener("click", () => {
  currentPage = (currentPage - 1 + pageCount()) % pageCount(); renderGallery();
});
document.getElementById("nextPhoto").addEventListener("click", () => {
  currentPage = (currentPage + 1) % pageCount(); renderGallery();
});
window.addEventListener("resize", renderGallery);
window.addEventListener("load", renderGallery);



/*******************************************************
 * CONFIRMACION: GOOGLE SHEETS + WHATSAPP
 *******************************************************/


/********************************************************
 * CONFIRMAR O MODIFICAR ASISTENCIA
 ********************************************************/

document.getElementById("rsvpForm").addEventListener("submit", async (event) => {

  event.preventDefault();

  if (!invitadoActual) {
    alert("No se ha podido validar tu invitación.");
    return;
  }

  if (fechaLimiteCumplida()) {
    alert("El periodo de confirmación ha finalizado.");
    establecerEstadoConfirmacion({
      confirmado: respuestaConfirmada
    });
    return;
  }

  const form = event.currentTarget;
  const button = form.querySelector('button[type="submit"]');

  const nombre = document.getElementById("guestName").value.trim();
  const cantidad = Number(document.getElementById("guestCount").value);
  const asistentes = document.getElementById("attendeeNames").value.trim();

  if (
    !nombre ||
    !asistentes ||
    !Number.isInteger(cantidad) ||
    cantidad < 1 ||
    cantidad > 200
  ) {
    alert("Revisa los datos de tu confirmación.");
    return;
  }

  const modificar = modificandoRespuesta;

  const data = {
    action: "confirmar",
    codigo: invitadoActual.codigo,
    nombre: nombre,
    cantidad: cantidad,
    asistentes: asistentes,
    modificar: modificar
  };

  const message = [
    "Hola, confirmo nuestra asistencia a los XV años de Grethell.",
    "",
    `Familia: ${invitadoActual.familia}`,
    `Código: ${invitadoActual.codigo}`,
    `Persona que confirma: ${nombre}`,
    `Total de asistentes: ${cantidad}`,
    `Nombres: ${asistentes}`,
    modificar ? "Esta es una modificación de nuestra confirmación." : ""
  ].filter(Boolean).join("\n");

  const whatsappURL =
    `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

  button.disabled = true;
  button.textContent = "Guardando respuesta...";

  // Abrir una ventana para WhatsApp durante el clic del usuario.
const whatsappWindow = window.open("about:blank", "_blank");

  try {

    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain;charset=UTF-8"
      },
      body: JSON.stringify(data)
    });

    // Verificar en Sheets que los datos nuevos estén guardados.
    let estado = null;

    for (let intento = 0; intento < 4; intento++) {

      await new Promise(resolve => setTimeout(resolve, 800));

      estado = await consultarEstadoConfirmacion(invitadoActual.codigo);

      if (
        estado.success &&
        estado.confirmado &&
        estado.nombre === nombre &&
        Number(estado.cantidad) === cantidad &&
        estado.asistentes === asistentes
      ) {
        break;
      }

    }

    if (
      !estado ||
      !estado.confirmado ||
      estado.nombre !== nombre ||
      Number(estado.cantidad) !== cantidad ||
      estado.asistentes !== asistentes
    ) {
      throw new Error("No se pudo verificar el guardado de la respuesta.");
    }

    // Bloquear los campos después de confirmar.
    establecerEstadoConfirmacion(estado);

    alert(
      modificar
        ? "Tu respuesta fue actualizada correctamente."
        : "Tu asistencia quedó confirmada correctamente."
    );

    // Abrir WhatsApp para enviar la notificación.
    if (whatsappWindow) {
  whatsappWindow.location.href = whatsappURL;
}

  } catch (error) {

    console.error(error);

    if (whatsappWindow) {
  whatsappWindow.close();
}

    alert(
      "No pudimos verificar el registro. " +
      "Tu formulario permanecerá disponible para volver a intentarlo."
    );

    button.disabled = false;

  } finally {

    button.textContent = "Confirmar por WhatsApp";

  }

});



// Animación discreta al entrar cada sección en pantalla.
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll(".reveal").forEach(section => observer.observe(section));


/********************************************************
 * LIBRO DE BUENOS DESEOS
 ********************************************************/

// Consultar mensajes aprobados en Google Sheets.
function cargarBuenosDeseos() {

  const callbackName = "handleBuenosDeseos";

  const script = document.createElement("script");
  const status = document.getElementById("wishesList");

  const timeout = setTimeout(() => {
    cleanup();
    status.textContent = "No fue posible cargar los mensajes.";
  }, 15000);

  function cleanup() {
    clearTimeout(timeout);
    script.remove();
    delete window[callbackName];
  }

  window[callbackName] = (data) => {

    cleanup();

    if (!data.success) {
      status.textContent = "No fue posible cargar los mensajes.";
      return;
    }

    mostrarBuenosDeseos(data.mensajes);

  };

  const url = new URL(GOOGLE_SCRIPT_URL);

  url.searchParams.set("action", "listarBuenosDeseos");
  url.searchParams.set("callback", callbackName);

  script.src = url.toString();

  script.onerror = () => {
    cleanup();
    status.textContent = "No fue posible conectar con el libro de buenos deseos.";
  };

  document.body.appendChild(script);

}


// Mostrar únicamente los mensajes publicados.
function mostrarBuenosDeseos(mensajes) {

  const container = document.getElementById("wishesList");
  container.innerHTML = "";

  if (!mensajes || mensajes.length === 0) {

    const empty = document.createElement("p");
    empty.className = "coming-soon";
    empty.textContent = "Sé el primero en compartir tus buenos deseos.";

    container.appendChild(empty);
    return;

  }

  mensajes.forEach((item) => {

    const card = document.createElement("article");
    card.className = "wish-card";

    const message = document.createElement("p");
    message.className = "wish-card-message";
    message.textContent = item.mensaje;

    const author = document.createElement("p");
    author.className = "wish-card-author";
    author.textContent = `— ${item.nombre}`;

    const family = document.createElement("p");
    family.className = "wish-card-family";
    family.textContent = item.familia;

    card.appendChild(message);
    card.appendChild(author);
    card.appendChild(family);

    container.appendChild(card);

  });

}


// Enviar un nuevo mensaje.
document.getElementById("wishesForm").addEventListener("submit", async (event) => {

  event.preventDefault();

  const form = event.currentTarget;
  const button = form.querySelector('button[type="submit"]');
  const status = document.getElementById("wishStatus");

  if (!invitadoActual) {
    status.textContent = "No se ha podido validar tu invitación.";
    return;
  }

  const nombre = document.getElementById("wishName").value.trim();
  const mensaje = document.getElementById("wishMessage").value.trim();

  if (!nombre || !mensaje) {
    status.textContent = "Completa tu nombre y tu mensaje.";
    return;
  }

  const data = {
    action: "buenosDeseos",
    codigo: invitadoActual.codigo,
    nombre: nombre,
    mensaje: mensaje
  };

  button.disabled = true;
  button.textContent = "Enviando mensaje...";
  status.textContent = "";

  try {

    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain;charset=UTF-8"
      },
      body: JSON.stringify(data)
    });

    status.textContent =
      "Tu mensaje fue enviado para revisión. Gracias por compartirlo.";

    form.reset();

  } catch (error) {

    console.error("Error al enviar buenos deseos:", error);

    status.textContent =
      "No fue posible enviar tu mensaje. Inténtalo nuevamente.";

  } finally {

    button.disabled = false;
    button.textContent = "Enviar buenos deseos";

  }

});


// Cargar los mensajes al abrir la invitación.
cargarBuenosDeseos();

