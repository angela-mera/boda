# 💌 Invitación · Valentina & Santiago

Invitación web personalizada. Todo es gratis:

- **Página:** HTML, CSS y JS, publicada en GitHub Pages.
- **Confirmaciones:** una hoja de Google Sheets. El enlace de esa hoja es donde revisan quién va.

```
index.html      estructura de la invitación
styles.css      diseño y animaciones
app.js          sobre, cuenta regresiva, carrusel y confirmaciones
config.js       ✏️ LO ÚNICO QUE NECESITAS EDITAR: textos, horas, lugares, mapas, fotos
assets/fotos/   fotos del carrusel
assets/video/   video de la portada (portada.mp4)
google-apps-script/Code.gs   código que conecta con Google Sheets
```

---

## 1. Probarla en tu computador

Abre `index.html` en el navegador. Para ver cómo se ve un invitado de prueba, agrega `?i=DEMO` al final de la dirección.
Mientras `apiUrl` esté vacío en `config.js`, la página funciona en **modo demostración** y no guarda nada.

## 2. Conectar Google Sheets (una sola vez, unos 10 minutos)

1. Crea una hoja nueva en <https://sheets.new> y llámala, por ejemplo, "Boda V&S".
2. Ve a **Extensiones → Apps Script**. Borra lo que aparece y pega todo el contenido de `google-apps-script/Code.gs`.
3. En la línea `SITE_URL`, pon el enlace donde quedará la invitación (paso 3). Por ejemplo: `https://tu-usuario.github.io/boda/`.
4. Guarda (💾). En la lista de funciones elige **prepararHojas** y pulsa **▶ Ejecutar**.
   Google pedirá permisos: *Revisar permisos → tu cuenta → Configuración avanzada → Ir a (no seguro) → Permitir*. Es normal porque el script es tuyo.
5. Pulsa **Implementar → Nueva implementación**:
   - Tipo: **App web**
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier usuario**
6. Copia la **URL de la app web** (termina en `/exec`) y pégala en `config.js` → `apiUrl: 'https://script.google.com/.../exec'`.

> Si más adelante cambias `Code.gs`, entra a **Implementar → Gestionar implementaciones → ✏️ → Versión: Nueva versión**. Así la URL sigue siendo la misma.

### Hojas que se crean

| Hoja | Para qué sirve |
|---|---|
| **Invitados** | Llenas la columna B (cómo se muestra, por ejemplo "Familia Pérez") y la C (personas separadas por coma: `Carlos, Marta, Sofía`). |
| **Respuestas** | Se llena sola. Una fila por persona con Sí o No y sus alergias. |
| **Resumen** | Totales de cuántos asisten, cuántos no y cuántos faltan, más la lista de alergias. |

Después de llenar los invitados, recarga la hoja y usa el menú **💌 Boda → 2. Generar códigos y enlaces**. Ese menú llena el código, los pases, el enlace personal y un **enlace de WhatsApp listo para enviar**.

- Si agregas invitados después, vuelve a usar el mismo menú. Los códigos que ya existen no cambian.
- Los **pases** son la cantidad de nombres en la columna C. Para un acompañante sin nombre, escribe "Acompañante".
- Si alguien confirma otra vez, su respuesta anterior se reemplaza.
- Después del **1 de diciembre** ya no se aceptan confirmaciones.

Para revisar las confirmaciones, basta con abrir la hoja o compartir su enlace con los novios.

## 3. Publicarla gratis en GitHub Pages

1. En GitHub crea un repositorio **público** llamado `boda`.
2. Sube todos los archivos de esta carpeta: *Add file → Upload files* y arrastra todo.
3. Ve a **Settings → Pages → Source: Deploy from a branch → main / (root) → Save**.
4. En uno o dos minutos queda publicada en `https://tu-usuario.github.io/boda/`.

Cada invitado recibe su propio enlace: `https://tu-usuario.github.io/boda/?i=K7P2Q`.
Si alguien abre el enlace sin código, ve toda la invitación, pero el formulario le pide usar su enlace personal.

## 4. Poner tu contenido

- **Lugares y mapas:** en `config.js`, edita `ceremonia` y `recepcion`. En Google Maps busca el lugar → *Compartir* → *Copiar vínculo* y pégalo en `mapa`.
- **Fotos:** copia 6 fotos verticales a `assets/fotos/` (por ejemplo `foto1.jpg`) y cambia los nombres en `config.js → fotos`. Para que carguen rápido, que pesen menos de 300 KB cada una. Puedes comprimirlas gratis en <https://squoosh.app>.
- **Fondos** (ceremonia y recepción, y confirmación): en `config.js → fondos` pon un video `.mp4` sin sonido de menos de 5 MB, o una foto horizontal de unos 1600 px que pese menos de 400 KB. Los videos solo se reproducen cuando la sección está en pantalla.
- **Monograma:** está en `assets/monograma.png`. Si lo cambias, usa uno con fondo blanco o transparente.
- **Íconos:** son de [Phosphor Icons](https://phosphoricons.com). Para cambiar uno, busca el nombre en esa página y reemplaza la clase en `index.html` (por ejemplo `ph-church` → `ph-heart`).
- **Video:** guárdalo como `assets/video/portada.mp4`. Debe ser corto (5 a 10 s), sin audio, de 720p y pesar **menos de 3 MB**. Si tienes un GIF, conviértelo a MP4 en <https://ezgif.com/gif-to-mp4>.
- **Vista previa en WhatsApp:** agrega una foto horizontal `assets/fotos/portada.jpg` y cambia el enlace de `og:image` en `index.html` por tu dirección real.
- **Después de cada cambio publicado:** en `index.html`, sube el número `?v=` de `styles.css`, `config.js` y `app.js` (por ejemplo de `?v=6` a `?v=7`). Así los invitados ven la versión nueva y no una guardada en su celular.
- **Textos:** el anuncio y la vestimenta están en `index.html`, y la historia en `config.js`.
