# Invitación digital — XV años de Grethell

## Estructura
- `index.html`: contenido de la invitación.
- `css/style.css`: diseño adaptable.
- `js/script.js`: cuenta regresiva, carrusel, música y confirmación por WhatsApp.
- `assets/img/`: fotografías.
- `assets/audio/`: archivo de música.

## Antes de publicar
1. Coloca una fotografía en `assets/img/foto-portada.jpg`.
2. Coloca seis fotografías: `foto-1.jpg` a `foto-6.jpg`.
3. Coloca el archivo de audio autorizado como `assets/audio/la-medalla.mp3`.
4. En `js/script.js`, sustituye `52XXXXXXXXXX` por el número de WhatsApp real, con código de país y sin símbolos.
5. Revisa las ubicaciones de Google Maps en `index.html`; los enlaces actuales son búsquedas generales.

## Publicar con GitHub Pages
1. Crea un repositorio público en GitHub, por ejemplo `xv-grethell`.
2. Sube el contenido de esta carpeta (no solamente el ZIP).
3. En el repositorio abre **Settings → Pages**.
4. En **Build and deployment**, selecciona **Deploy from a branch**.
5. Selecciona `main` y `/ (root)`, y guarda.
6. GitHub generará la dirección pública del sitio.

## Notas
- La música no inicia automáticamente: los navegadores suelen bloquear la reproducción automática. El visitante debe tocar el botón.
- El RSVP abre WhatsApp con el mensaje preparado. Esta versión no guarda las respuestas en Google Sheets.
- El libro de buenos deseos se conectará en una siguiente etapa con Google Sheets y Apps Script.
- No hay códigos QR en esta versión.
