(function () {
  'use strict';

  const B = window.BODA;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const codigo = (new URLSearchParams(location.search).get('i') || '').trim().toUpperCase();

  /* ---------------- Contenido desde config.js ---------------- */
  $$('[data-novia]').forEach(el => (el.textContent = B.novia));
  $$('[data-novio]').forEach(el => (el.textContent = B.novio));
  $$('[data-iniciales]').forEach(el => (el.textContent = B.iniciales));
  $$('[data-ev]').forEach(el => {
    const [evento, campo] = el.dataset.ev.split('.');
    el.textContent = B[evento][campo];
  });
  // Mapas: siempre en una pestaña/ventana nueva (en celular abre la app de Google Maps)
  $$('[data-mapa]').forEach(a => {
    a.href = B[a.dataset.mapa].mapa;
    a.addEventListener('click', ev => {
      ev.preventDefault();
      window.open(a.href, '_blank', 'noopener');
    });
  });

  // Fondos (imagen o video): quedan fijos del tamaño de la pantalla mientras el contenido
  // pasa por encima (ver .fondo-fijo en styles.css). Los videos solo se reproducen mientras se ven.
  const esVideo = src => /\.(mp4|webm|mov)(\?|$)/i.test(src);   // acepta "video.mp4?v=2"
  const videosFondo = new IntersectionObserver(entradas => entradas.forEach(e => {
    if (e.isIntersecting) e.target.play().catch(() => {});
    else e.target.pause();
  }));
  $$('[data-fondo]').forEach(sec => {
    const src = B.fondos[sec.dataset.fondo];
    const capa = document.createElement('div');
    capa.className = 'fondo';
    capa.setAttribute('aria-hidden', 'true');
    const fijo = document.createElement('div');
    fijo.className = 'fondo-fijo';
    capa.appendChild(fijo);
    let medio;
    if (esVideo(src)) {
      medio = Object.assign(document.createElement('video'), { muted: true, loop: true, playsInline: true, preload: 'metadata', src });
      medio.setAttribute('muted', '');          // necesario en iPhone para reproducir sin tocar
      medio.setAttribute('playsinline', '');
      videosFondo.observe(medio);
    } else {
      medio = Object.assign(document.createElement('img'), { src, alt: '', loading: 'lazy' });
    }
    fijo.appendChild(medio);
    sec.prepend(capa);
  });
  $('#historia-texto').textContent = B.historia;
  $('#rsvp-limite').innerHTML = `Por favor confírmanos antes del <strong>${B.fechaLimiteTexto}</strong>.`;

  // Video de portada (si el archivo no existe, queda la imagen poster / fondo pastel)
  const video = $('#portada-video');
  if (B.poster) video.poster = B.poster;
  video.src = B.video;

  // Carrusel: si hay pocas fotos se repiten hasta llenar la pantalla, y luego
  // todo se duplica para que el recorrido sea infinito sin saltos.
  const pista = $('#marquee-pista');
  let tanda = [...B.fotos];
  while (tanda.length < 8) tanda = tanda.concat(B.fotos);
  [...tanda, ...tanda].forEach((src, i) => {
    const fig = document.createElement('figure');
    fig.className = 'foto';
    fig.style.margin = '0';
    if (i >= B.fotos.length) fig.setAttribute('aria-hidden', 'true');
    let medio;
    if (esVideo(src)) {
      // Videos del carrusel: sin sonido y en bucle (solo se reproducen mientras se ven)
      medio = Object.assign(document.createElement('video'), { muted: true, loop: true, playsInline: true, preload: 'metadata', src });
      medio.setAttribute('muted', '');
      medio.setAttribute('playsinline', '');
      videosFondo.observe(medio);
    } else {
      medio = Object.assign(document.createElement('img'), { src, loading: 'lazy', draggable: false });
      medio.alt = i < B.fotos.length ? `Foto ${i + 1} de ${B.novia} y ${B.novio}` : '';
    }
    fig.appendChild(medio);
    pista.appendChild(fig);
  });

  // Movimiento del carrusel: avanza solo (~8 s por foto). Con el dedo o el mouse
  // se puede arrastrar a los lados; al soltar, sigue avanzando solo.
  // El desplazamiento vertical de la página no se bloquea (touch-action: pan-y).
  const marquee = pista.parentElement;
  const sinMovimiento = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let x = 0, periodo = 0, velocidad = 0, arrastrando = false, ultimoX = 0, antes = 0;
  function medirCarrusel() {
    periodo = pista.children[tanda.length].offsetLeft - pista.children[0].offsetLeft; // ancho de una tanda
    velocidad = (pista.children[1].offsetLeft - pista.children[0].offsetLeft) / 8;   // px por segundo
  }
  function moverCarrusel(t) {
    const dt = antes ? Math.min((t - antes) / 1000, 0.1) : 0;
    antes = t;
    if (!arrastrando && !sinMovimiento) x -= velocidad * dt;
    if (periodo) {                                   // recorrido infinito: vuelve al inicio sin que se note
      while (x <= -periodo) x += periodo;
      while (x > 0) x -= periodo;
    }
    pista.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0)`;
    requestAnimationFrame(moverCarrusel);
  }
  medirCarrusel();
  addEventListener('resize', medirCarrusel);
  requestAnimationFrame(moverCarrusel);

  marquee.addEventListener('pointerdown', e => {
    arrastrando = true;
    ultimoX = e.clientX;
    marquee.setPointerCapture(e.pointerId);
  });
  marquee.addEventListener('pointermove', e => {
    if (!arrastrando) return;
    x += e.clientX - ultimoX;
    ultimoX = e.clientX;
  });
  const soltar = () => (arrastrando = false);
  marquee.addEventListener('pointerup', soltar);
  marquee.addEventListener('pointercancel', soltar);  // p. ej. cuando el dedo hace scroll vertical

  /* ---------------- Sobre ---------------- */
  const pantalla = $('#pantalla-sobre');
  const sobre = $('#btn-abrir');
  const encaje = $('#encaje');

  // Forma de la solapa según la pantalla + encaje dibujado a lo largo de sus bordes
  function dibujarSobre() {
    const W = innerWidth, H = innerHeight;
    const horizontal = W > H;
    const lado = Math.round(H * (horizontal ? 0.36 : 0.42));
    const punta = Math.round(H * (horizontal ? 0.60 : 0.56));
    pantalla.style.setProperty('--lado', lado + 'px');
    pantalla.style.setProperty('--punta', punta + 'px');

    const k = Math.min(Math.max(W / 375, 1), 1.5);           // escala del encaje
    const banda = 16 * k, radio = 7 * k, paso = 13 * k;
    const tela = '#3E5141', hueco = '#728A73';
    let franjas = '', ondas = '', huecos = '', puntos = '', bordes = '';

    [[0, lado, W / 2, punta], [W, lado, W / 2, punta]].forEach(([ax, ay, bx, by]) => {
      const L = Math.hypot(bx - ax, by - ay);
      const ux = (bx - ax) / L, uy = (by - ay) / L;
      let nx = -uy, ny = ux;
      if (ny < 0) { nx = -nx; ny = -ny; }                    // normal hacia abajo (fuera de la solapa)
      const p = (d, o) => [(ax + ux * d + nx * o).toFixed(1), (ay + uy * d + ny * o).toFixed(1)];
      franjas += `M${p(0, 0)}L${p(L, 0)}L${p(L, banda)}L${p(0, banda)}Z`;
      bordes += `M${p(0, 0)}L${p(L, 0)}`;
      for (let d = paso / 2; d < L; d += paso) {
        const [cx, cy] = p(d, banda);
        ondas += `<circle cx="${cx}" cy="${cy}" r="${radio.toFixed(1)}"/>`;
        const [hx, hy] = p(d, banda * 0.32);
        huecos += `<circle cx="${hx}" cy="${hy}" r="${(2.2 * k).toFixed(1)}"/>`;
        const [jx, jy] = p(d + paso / 2, banda * 0.72);        // segunda fila de calado, intercalada
        huecos += `<circle cx="${jx}" cy="${jy}" r="${(1.6 * k).toFixed(1)}"/>`;
        const [ox, oy] = p(d, banda + radio * 0.45);
        huecos += `<circle cx="${ox}" cy="${oy}" r="${(1.4 * k).toFixed(1)}"/>`;
        const [qx, qy] = p(d + paso / 2, banda + radio + 2.5 * k);
        puntos += `<circle cx="${qx}" cy="${qy}" r="${(1.1 * k).toFixed(1)}"/>`;
      }
    });

    encaje.setAttribute('viewBox', `0 0 ${W} ${H}`);
    encaje.innerHTML =
      `<g fill="${tela}" opacity=".92"><path d="${franjas}"/>${ondas}${puntos}</g>` +
      `<g fill="${hueco}">${huecos}</g>` +
      `<path d="${bordes}" fill="none" stroke="#EDE4CF" stroke-opacity=".28" stroke-width="1"/>`;
  }
  dibujarSobre();
  addEventListener('resize', () => { if (document.contains(pantalla)) dibujarSobre(); });

  /* ---------------- Música de fondo ---------------- */
  // Los navegadores no dejan sonar audio sin que la persona toque la pantalla:
  // por eso empieza justo al tocar el sobre.
  const musica = $('#musica');
  const btnMusica = $('#btn-musica');
  let silenciada = false;
  if (B.musica) musica.src = B.musica;

  function pintarBotonMusica() {
    btnMusica.setAttribute('aria-pressed', String(silenciada));
    btnMusica.setAttribute('aria-label', silenciada ? 'Activar música' : 'Silenciar música');
    btnMusica.firstElementChild.className = `ph-light ${silenciada ? 'ph-speaker-slash' : 'ph-speaker-high'}`;
    btnMusica.classList.toggle('sonando', !silenciada);
  }
  function sonar() {
    musica.volume = 0;
    musica.play().then(() => {
      let v = 0;                                              // sube el volumen poco a poco
      const subir = setInterval(() => {
        v = Math.min(0.6, v + 0.03);
        musica.volume = v;
        if (v >= 0.6) clearInterval(subir);
      }, 100);
    }).catch(() => { silenciada = true; pintarBotonMusica(); });
  }
  btnMusica.addEventListener('click', () => {
    silenciada = !silenciada;
    if (silenciada) musica.pause(); else sonar();
    pintarBotonMusica();
  });
  // Si el invitado cambia de app o bloquea el celular, se pausa y al volver retoma
  document.addEventListener('visibilitychange', () => {
    if (!B.musica || silenciada || btnMusica.hidden) return;
    if (document.hidden) musica.pause(); else musica.play().catch(() => {});
  });

  sobre.addEventListener('click', () => {
    if (sobre.classList.contains('abierto')) return;
    sobre.classList.add('abierto');                           // sello → solapa → carta (ver styles.css)
    video.play().catch(() => {});
    if (B.musica) {
      sonar();
      btnMusica.hidden = false;
      pintarBotonMusica();
    }
    setTimeout(() => {
      pantalla.classList.add('salir');
      document.body.classList.remove('bloqueado');
      document.body.classList.add('revelado');
      window.scrollTo(0, 0);
    }, 2900);
    setTimeout(() => pantalla.remove(), 4100);
  });

  /* ---------------- Animación al hacer scroll ---------------- */
  const io = new IntersectionObserver(entradas => {
    entradas.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal').forEach(el => io.observe(el));

  /* ---------------- Cuenta regresiva ---------------- */
  const objetivo = new Date(B.fechaEvento).getTime();
  const celdas = {};
  $$('[data-c]').forEach(el => (celdas[el.dataset.c] = el));
  function tick() {
    const d = Math.max(0, objetivo - Date.now());
    celdas.dias.textContent = Math.floor(d / 864e5);
    celdas.horas.textContent = String(Math.floor(d / 36e5) % 24).padStart(2, '0');
    celdas.min.textContent = String(Math.floor(d / 6e4) % 60).padStart(2, '0');
    celdas.seg.textContent = String(Math.floor(d / 1e3) % 60).padStart(2, '0');
  }
  tick();
  setInterval(tick, 1000);

  /* ---------------- Confirmación (RSVP) ---------------- */
  const caja = $('#rsvp-caja');
  const cerrado = () => Date.now() > new Date(B.fechaLimite).getTime();
  let invitacion = null;

  // Invitaciones de prueba (no guardan nada):
  //   ?i=DEMO  → pareja sin niños · ?i=DEMO1 → una persona · ?i=DEMO2 → familia con una niña
  const DEMOS = {
    DEMO: { ok: true, invitacion: 'Ana y Luis', personas: ['Ana', 'Luis'], menores: [], respuestas: {} },
    DEMO1: { ok: true, invitacion: 'Julián Torres', personas: ['Julián Torres'], menores: [], respuestas: {} },
    DEMO2: { ok: true, invitacion: 'Familia Pérez Cardona', personas: ['Ana María', 'Luis Carlos', 'Pedro'], menores: ['Lucía'], respuestas: {} }
  };

  async function api(metodo, datos) {
    const demo = DEMOS[codigo];
    if (!B.apiUrl || demo) {                          // modo demostración
      await new Promise(r => setTimeout(r, 600));
      if (metodo === 'GET') return demo || { ok: false, error: 'no_encontrada' };
      datos.respuestas.forEach(r => (demo.respuestas[r.persona] = r));
      return { ok: true };
    }
    const res = metodo === 'GET'
      ? await fetch(`${B.apiUrl}?i=${encodeURIComponent(codigo)}`)
      : await fetch(B.apiUrl, { method: 'POST', body: JSON.stringify(datos) }); // text/plain: sin preflight CORS
    return res.json();
  }

  function el(tag, props = {}, ...hijos) {
    const n = Object.assign(document.createElement(tag), props);
    hijos.forEach(h => n.append(h));
    return n;
  }

  function mensaje(texto) {
    caja.replaceChildren(el('p', { className: 'texto-suave', textContent: texto }));
    caja.style.textAlign = 'center';
  }

  // Adultos y niños de la invitación, tal como están en la hoja de Google
  const adultos = () => invitacion.personas;
  const menores = () => invitacion.menores || [];
  const todos = () => [...adultos(), ...menores()];
  const esUna = () => !!invitacion && todos().length === 1;
  const etiquetaNinos = () => (menores().length === 1 ? 'Niño(a)' : 'Niños(as)');

  function personalizar(inv) {
    invitacion = inv;
    // Invitación para una sola persona: los textos pasan a singular (ustedes → ti)
    if (esUna()) $$('[data-singular]').forEach(e => (e.textContent = e.dataset.singular));
    const para = $('#sobre-para');
    if (para) {
      para.replaceChildren('Para', el('strong', { textContent: inv.invitacion }));
      para.hidden = false;
    }
    const saludo = $('#saludo');
    saludo.textContent = inv.invitacion;
    saludo.hidden = false;
  }

  // Bloque de una persona: nombre (o pregunta), opciones y campo de alergias
  function bloquePersona(nombre, id, nino) {
    const previa = invitacion.respuestas[nombre] || {};
    const alergia = el('div', { className: 'alergia', hidden: previa.asiste !== 'Sí' },
      el('label', { htmlFor: `alergia-${id}`, textContent: '¿Es alérgico(a) a alguna comida o bebida?' }),
      el('input', {
        type: 'text', id: `alergia-${id}`, maxLength: 200,
        placeholder: 'Ej: maní, salsas… (opcional)',
        value: previa.alergias || ''
      })
    );
    const opcion = (valor, texto) => {
      const input = el('input', { type: 'radio', name: id, value: valor });
      input.checked = (valor === 'si' && previa.asiste === 'Sí') || (valor === 'no' && previa.asiste === 'No');
      input.addEventListener('change', () => (alergia.hidden = valor !== 'si'));
      return el('label', {}, input, el('span', { textContent: texto }));
    };
    return el('div', { className: nino ? 'persona bloque-ninos' : 'persona' },
      el('p', { className: 'persona-nombre', textContent: nombre }),
      el('div', { className: 'opciones', role: 'radiogroup', ariaLabel: `Asistencia de ${nombre}` },
        nino ? opcion('si', 'Asistirá') : opcion('si', 'Asistiré'),
        nino ? opcion('no', 'No asistirá') : opcion('no', 'No podré ir')),
      alergia
    );
  }

  function pintarFormulario() {
    caja.style.textAlign = '';
    // Asientos: solo cuentan los adultos (los niños no tienen puesto individual asignado)
    const nA = adultos().length;
    const form = el('form', { noValidate: true });
    form.append(
      el('p', { className: 'rsvp-hola', textContent: invitacion.invitacion }),
      el('p', { className: 'rsvp-pases', textContent: esUna()
        ? 'Hemos reservado 1 asiento para ti'
        : `Hemos reservado ${nA} ${nA === 1 ? 'asiento' : 'asientos'} para ustedes` })
    );

    // Cada persona tiene un id: a0, a1… (adultos) y n0, n1… (niños)
    const ids = [];
    adultos().forEach((nombre, i) => { ids.push(`a${i}`); form.append(bloquePersona(nombre, `a${i}`, false)); });
    if (menores().length) {
      form.append(el('p', { className: 'rsvp-pases rsvp-subtitulo',
        textContent: etiquetaNinos() }));
      menores().forEach((nombre, j) => { ids.push(`n${j}`); form.append(bloquePersona(nombre, `n${j}`, true)); });
    }

    const error = el('p', { className: 'rsvp-error', hidden: true });
    const boton = el('button', { className: 'boton', type: 'submit', textContent: 'Confirmar asistencia' });
    form.append(boton, error);

    form.addEventListener('submit', async ev => {
      ev.preventDefault();
      const respuestas = todos().map((persona, k) => {
        const id = ids[k];
        const marcado = form.querySelector(`input[name="${id}"]:checked`);
        return marcado && {
          persona,
          asiste: marcado.value === 'si' ? 'Sí' : 'No',
          alergias: marcado.value === 'si' ? form.querySelector(`#alergia-${id}`).value.trim() : ''
        };
      });
      const fallo = texto => { error.textContent = texto; error.hidden = false; };
      if (respuestas.some(r => !r)) {
        return fallo(esUna() ? 'Por favor indica si asistirás.' : 'Por favor responde por cada persona.');
      }
      // Los niños solo pueden ir acompañados de al menos un adulto de la invitación
      const vaUnAdulto = respuestas.slice(0, adultos().length).some(r => r.asiste === 'Sí');
      const vaUnNino = respuestas.slice(adultos().length).some(r => r.asiste === 'Sí');
      if (vaUnNino && !vaUnAdulto) {
        return fallo('Los niños deben asistir acompañados de un adulto de la invitación.');
      }
      error.hidden = true;
      boton.disabled = true;
      boton.textContent = 'Enviando…';
      try {
        const r = await api('POST', { i: codigo, respuestas });
        if (!r.ok) throw new Error(r.error);
        respuestas.forEach(x => (invitacion.respuestas[x.persona] = x));
        pintarGracias();
      } catch (e) {
        fallo(e.message === 'cerrado'
          ? 'El plazo para confirmar ya terminó.'
          : 'No pudimos enviar tu respuesta. Revisa tu conexión e inténtalo de nuevo.');
        boton.disabled = false;
        boton.textContent = 'Confirmar asistencia';
      }
    });

    caja.replaceChildren(form);
  }

  function pintarGracias() {
    caja.style.textAlign = '';
    const linea = p => {
      const r = invitacion.respuestas[p];
      if (!r) return null;
      const extra = r.alergias ? ` · Alergias: ${r.alergias}` : '';
      return el('li', { textContent: `${r.asiste === 'Sí' ? '✓' : '✗'}  ${p} — ${r.asiste === 'Sí' ? 'Asistirá' : 'No asistirá'}${extra}` });
    };
    const lista = el('ul', { className: 'rsvp-resumen' });
    adultos().forEach(p => { const li = linea(p); if (li) lista.append(li); });
    const listaNinos = el('ul', { className: 'rsvp-resumen' });
    menores().forEach(p => { const li = linea(p); if (li) listaNinos.append(li); });

    const algunoVa = todos().some(p => invitacion.respuestas[p]?.asiste === 'Sí');
    const tu = esUna() ? 'tu' : 'su';
    const ok = el('div', { className: 'rsvp-ok' },
      el('div', { className: 'check', textContent: '✓' }),
      el('p', { className: 'rsvp-hola', textContent: '¡Gracias!' }),
      el('p', { className: 'texto' },
        algunoVa ? `Ya recibimos ${tu} confirmación.` : `Ya recibimos ${tu} respuesta.`,
        el('br'),
        algunoVa ? '¡Nos vemos el 19 de diciembre!' : `¡${esUna() ? 'Te' : 'Los'} extrañaremos!`),
      el('p', { className: 'rsvp-pases', textContent: `Resumen de ${tu} respuesta` }),
      lista
    );
    if (listaNinos.children.length) {
      ok.append(el('p', { className: 'rsvp-pases rsvp-subtitulo', textContent: etiquetaNinos() }), listaNinos);
    }
    if (!cerrado()) {
      const cambiar = el('button', { className: 'enlace', type: 'button', textContent: esUna() ? '¿Deseas modificar tu respuesta?' : '¿Desean modificar su respuesta?' });
      cambiar.addEventListener('click', pintarFormulario);
      ok.append(cambiar);
    }
    caja.replaceChildren(ok);
  }

  async function iniciarRsvp() {
    if (!codigo) {
      mensaje('Para confirmar, abre el enlace personal que te enviamos por mensaje.');
      return;
    }
    try {
      const r = await api('GET');
      if (!r.ok) {
        mensaje('No encontramos tu invitación. Verifica el enlace que te enviamos.');
        return;
      }
      personalizar(r);
      const respondio = todos().every(p => r.respuestas[p]);
      if (respondio) {
        pintarGracias();
        const aviso = $('#aviso-confirmado');
        aviso.textContent = `✓ ${esUna() ? 'Ya confirmaste tu' : 'Ya confirmaron su'} asistencia · Ver resumen`;
        aviso.hidden = false;
      }
      else if (cerrado()) mensaje('El plazo para confirmar asistencia terminó el ' + B.fechaLimiteTexto + '. Si necesitas ayuda, escríbenos directamente.');
      else pintarFormulario();
    } catch (e) {
      mensaje('No pudimos cargar tu invitación. Revisa tu conexión y recarga la página.');
    }
  }

  iniciarRsvp();
})();
