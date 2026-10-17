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

  // Fondos (imagen o video) con efecto parallax. Los videos solo se reproducen mientras se ven.
  const esVideo = src => /\.(mp4|webm|mov)$/i.test(src);
  const videosFondo = new IntersectionObserver(entradas => entradas.forEach(e => {
    if (e.isIntersecting) e.target.play().catch(() => {});
    else e.target.pause();
  }));
  const fondos = $$('[data-fondo]').map(sec => {
    const src = B.fondos[sec.dataset.fondo];
    const capa = document.createElement('div');
    capa.className = 'fondo';
    capa.setAttribute('aria-hidden', 'true');
    let medio;
    if (esVideo(src)) {
      medio = Object.assign(document.createElement('video'), { muted: true, loop: true, playsInline: true, preload: 'metadata', src });
      medio.setAttribute('muted', '');          // necesario en iPhone para reproducir sin tocar
      medio.setAttribute('playsinline', '');
      videosFondo.observe(medio);
    } else {
      medio = Object.assign(document.createElement('img'), { src, alt: '', loading: 'lazy' });
    }
    capa.appendChild(medio);
    sec.prepend(capa);
    return capa;
  });
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let pendiente = false;
    const mover = () => {
      pendiente = false;
      const alto = innerHeight;
      fondos.forEach(capa => {
        const r = capa.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > alto) return;
        const desplazamiento = (r.top + r.height / 2 - alto / 2) * -0.12;
        capa.style.transform = `translate3d(0, ${desplazamiento.toFixed(1)}px, 0)`;
      });
    };
    addEventListener('scroll', () => { if (!pendiente) { pendiente = true; requestAnimationFrame(mover); } }, { passive: true });
    addEventListener('resize', mover);
    mover();
  }
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
      medio = Object.assign(document.createElement('img'), { src, loading: 'lazy' });
      medio.alt = i < B.fotos.length ? `Foto ${i + 1} de ${B.novia} y ${B.novio}` : '';
    }
    fig.appendChild(medio);
    pista.appendChild(fig);
  });
  // Velocidad constante sin importar cuántas fotos haya: ~8 s por foto
  pista.style.animationDuration = `${tanda.length * 8}s`;

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
    const tela = '#2A301D', hueco = '#57603F';
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

  // Invitaciones de prueba: ?i=DEMO (pareja) y ?i=DEMO1 (una persona). No guardan nada.
  const DEMOS = {
    DEMO: { ok: true, invitacion: 'Ana y Luis', personas: ['Ana', 'Luis'], respuestas: {}, ninos: '' },
    DEMO1: { ok: true, invitacion: 'Julián Torres', personas: ['Julián Torres'], respuestas: {}, ninos: '' }
  };

  async function api(metodo, datos) {
    const demo = DEMOS[codigo];
    if (!B.apiUrl || demo) {                          // modo demostración
      await new Promise(r => setTimeout(r, 600));
      if (metodo === 'GET') return demo || { ok: false, error: 'no_encontrada' };
      datos.respuestas.forEach(r => (demo.respuestas[r.persona] = r));
      demo.ninos = datos.ninos;
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

  const esUna = () => !!invitacion && invitacion.personas.length === 1;
  const ninosTexto = n => (n > 0 ? `${n} ${n === 1 ? 'niño' : 'niños'}` : 'sin niños');

  function personalizar(inv) {
    // Invitación para una sola persona: los textos pasan a singular (ustedes → ti)
    if (inv.personas.length === 1) $$('[data-singular]').forEach(e => (e.textContent = e.dataset.singular));
    const para = $('#sobre-para');
    if (para) {
      para.replaceChildren('Para', el('strong', { textContent: inv.invitacion }));
      para.hidden = false;
    }
    const saludo = $('#saludo');
    saludo.textContent = inv.invitacion;
    saludo.hidden = false;
  }

  function pintarFormulario() {
    caja.style.textAlign = '';
    const n = invitacion.personas.length;
    const form = el('form', { noValidate: true });
    form.append(
      el('p', { className: 'rsvp-hola', textContent: invitacion.invitacion }),
      el('p', { className: 'rsvp-pases', textContent: n === 1 ? 'Hemos reservado 1 lugar para ti' : `Hemos reservado ${n} lugares para ustedes` })
    );

    invitacion.personas.forEach((nombre, i) => {
      const previa = invitacion.respuestas[nombre] || {};
      const alergiaInput = el('input', {
        type: 'text', id: `alergia-${i}`, maxLength: 200, 
        placeholder: 'Ej: maní, salsas… (opcional)',
        value: previa.alergias || ''
      });
      const alergia = el('div', { className: 'alergia', hidden: previa.asiste !== 'Sí' },
        el('label', { htmlFor: `alergia-${i}`, textContent: '¿Es alérgico(a) a alguna comida o bebida?' }),
        alergiaInput
      );
      const opcion = (valor, texto) => {
        const input = el('input', { type: 'radio', name: `p${i}`, value: valor });
        if ((valor === 'si' && previa.asiste === 'Sí') || (valor === 'no' && previa.asiste === 'No')) input.checked = true;
        input.addEventListener('change', () => (alergia.hidden = valor !== 'si'));
        return el('label', {}, input, el('span', { textContent: texto }));
      };
      form.append(el('div', { className: 'persona' },
        el('p', { className: 'persona-nombre', textContent: nombre }),
        el('div', { className: 'opciones', role: 'radiogroup', ariaLabel: `Asistencia de ${nombre}` },
          opcion('si', 'Asistiré'), opcion('no', 'No podré ir')),
        alergia
      ));
    });

    // ¿Vienen niños? Solo se pregunta si al menos una persona asiste.
    const ninosPrevios = Number(invitacion.ninos) || 0;
    const yaRespondioNinos = invitacion.ninos !== undefined && invitacion.ninos !== '';
    const cantidad = el('input', {
      type: 'number', id: 'ninos-cantidad', min: 1, max: 10, inputMode: 'numeric',
      value: ninosPrevios || 1
    });
    const cuantos = el('div', { className: 'alergia', hidden: !ninosPrevios },
      el('label', { htmlFor: 'ninos-cantidad', textContent: '¿Cuántos niños?' }), cantidad);
    const opcionNinos = (valor, texto) => {
      const input = el('input', { type: 'radio', name: 'ninos', value: valor });
      input.checked = valor === 'si' ? ninosPrevios > 0 : yaRespondioNinos && ninosPrevios === 0;
      input.addEventListener('change', () => (cuantos.hidden = valor !== 'si'));
      return el('label', {}, input, el('span', { textContent: texto }));
    };
    const bloqueNinos = el('div', { className: 'persona bloque-ninos' },
      el('p', { className: 'persona-nombre', textContent: esUna() ? '¿Vendrás con niños?' : '¿Vendrán con niños?' }),
      el('div', { className: 'opciones' }, opcionNinos('no', 'No'), opcionNinos('si', 'Sí')),
      cuantos
    );
    const algunoAsiste = () => invitacion.personas.some((_, i) => form.querySelector(`input[name="p${i}"][value="si"]:checked`));
    const revisarNinos = () => (bloqueNinos.hidden = !algunoAsiste());
    form.addEventListener('change', revisarNinos);

    const error = el('p', { className: 'rsvp-error', hidden: true });
    const boton = el('button', { className: 'boton', type: 'submit', textContent: 'Confirmar asistencia' });
    form.append(bloqueNinos, boton, error);
    revisarNinos();

    form.addEventListener('submit', async ev => {
      ev.preventDefault();
      const respuestas = invitacion.personas.map((persona, i) => {
        const marcado = form.querySelector(`input[name="p${i}"]:checked`);
        return marcado && {
          persona,
          asiste: marcado.value === 'si' ? 'Sí' : 'No',
          alergias: marcado.value === 'si' ? form.querySelector(`#alergia-${i}`).value.trim() : ''
        };
      });
      if (respuestas.some(r => !r)) {
        error.textContent = esUna() ? 'Por favor indica si asistirás.' : 'Por favor indica si asistirá cada persona.';
        error.hidden = false;
        return;
      }
      let ninos = 0;
      if (algunoAsiste()) {
        const marcado = form.querySelector('input[name="ninos"]:checked');
        if (!marcado) {
          error.textContent = esUna() ? 'Por favor indica si vendrás con niños.' : 'Por favor indica si vendrán con niños.';
          error.hidden = false;
          return;
        }
        ninos = marcado.value === 'si' ? Math.min(10, Math.max(1, parseInt(cantidad.value, 10) || 1)) : 0;
      }
      error.hidden = true;
      boton.disabled = true;
      boton.textContent = 'Enviando…';
      try {
        const r = await api('POST', { i: codigo, respuestas, ninos });
        if (!r.ok) throw new Error(r.error);
        respuestas.forEach(x => (invitacion.respuestas[x.persona] = x));
        invitacion.ninos = ninos;
        pintarGracias();
      } catch (e) {
        error.textContent = e.message === 'cerrado'
          ? 'El plazo para confirmar ya terminó.'
          : 'No pudimos enviar tu respuesta. Revisa tu conexión e inténtalo de nuevo.';
        error.hidden = false;
        boton.disabled = false;
        boton.textContent = 'Confirmar asistencia';
      }
    });

    caja.replaceChildren(form);
  }

  function pintarGracias() {
    caja.style.textAlign = '';
    const lista = el('ul', { className: 'rsvp-resumen' });
    invitacion.personas.forEach(p => {
      const r = invitacion.respuestas[p];
      if (!r) return;
      const extra = r.alergias ? ` · Alergias: ${r.alergias}` : '';
      lista.append(el('li', { textContent: `${r.asiste === 'Sí' ? '✓' : '✗'}  ${p} — ${r.asiste === 'Sí' ? 'Asistirá' : 'No asistirá'}${extra}` }));
    });
    const algunoVa = invitacion.personas.some(p => invitacion.respuestas[p]?.asiste === 'Sí');
    if (algunoVa && invitacion.ninos !== undefined && invitacion.ninos !== '') {
      lista.append(el('li', { textContent: `Niños: ${ninosTexto(Number(invitacion.ninos) || 0)}` }));
    }
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
      invitacion = r;
      personalizar(r);
      const respondio = r.personas.every(p => r.respuestas[p]);
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
