/* =========================================================
   CONFIGURACIÓN DE LA INVITACIÓN
   Todo lo que necesitas cambiar está en este archivo.
   ========================================================= */
window.BODA = {
  novia: 'Valentina',
  novio: 'Santiago',
  iniciales: 'V & S',

  // Fecha y hora de la ceremonia con la zona horaria del lugar (-05:00 = Colombia).
  // La cuenta regresiva queda correcta sin importar desde qué país se abra.
  fechaEvento: '2026-12-19T14:00:00-05:00',

  // Último momento para confirmar (debe coincidir con FECHA_LIMITE en Code.gs)
  fechaLimite: '2026-12-01T23:59:59-05:00',
  fechaLimiteTexto: '1 de diciembre de 2026',

  ceremonia: {
    hora: '2:00 p.m.',
    lugar: 'Catedral Nuestra Señora de la Pobreza',
    direccion: 'Cra. 7 # 21-37, Pereira, Risaralda',
    mapa: 'https://maps.app.goo.gl/TAWMbbZKQxCorFJi7'          
  },

  recepcion: {
    hora: '7:00 p.m.',
    lugar: 'Finca Campestre Puente Nuevo',
    direccion: 'Pereira-La Florida Km 3, Risaralda.',
    mapa: 'https://maps.app.goo.gl/qEG9RxmiwGYSmjPQ6' 
  },

  historia:
    'Nos conocimos una tarde cualquiera que terminó siendo la más importante de nuestras vidas. ' +
    'Entre risas, viajes y sueños compartidos, descubrimos que queríamos caminar juntos para siempre.',

  // Fotos del carrusel "Nuestra historia" (reemplaza por tus .jpg, idealmente verticales ~800px de alto)
  fotos: [
    'assets/fotos/foto1.svg',
    'assets/fotos/foto2.svg',
    'assets/fotos/foto3.svg',
    'assets/fotos/foto4.svg',
    'assets/fotos/foto5.svg',
    'assets/fotos/foto6.svg'
  ],

  // Fondos de las secciones. Puede ser un video (.mp4, sin sonido, < 5 MB) o una imagen (.jpg ~1600px, < 400 KB).
  // Se mueven suavemente al hacer scroll.
  fondos: {
    eventos: 'assets/fondos/218958.mp4',   // ceremonia y recepción → pon aquí tu video, ej. 'assets/video/eventos.mp4'
    rsvp: 'assets/fondos/227111.mp4'       // confirmación de asistencia
  },

  // Video de fondo de la portada (MP4, sin sonido, ideal < 3 MB). Si aún no existe, se muestra la imagen "poster".
  video: 'assets/video/326106.mp4',
  poster: '',                         // opcional: imagen que se ve mientras carga el video (ej. 'assets/fotos/portada.jpg')

  // URL de la App web de Google Apps Script (ver README). Vacío = modo demostración.
  apiUrl: ''
};
