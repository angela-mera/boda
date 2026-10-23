/**
 * Backend de confirmaciones: Google Sheets + Apps Script.
 * Pega este archivo en Extensiones > Apps Script de tu Google Sheet (ver README).
 */

// Enlace de la invitación publicada (termina en /)
const SITE_URL = 'https://boda-valentina-y-santiago.lat/';
const FECHA_LIMITE = new Date('2026-12-01T23:59:59-05:00');
const NOVIOS = 'Valentina & Santiago';

const HOJA_INV = 'Invitados';
const HOJA_RESP = 'Respuestas';
const HOJA_RESUMEN = 'Resumen';

// Columnas de "Invitados" (1 = A)
const C_CODIGO = 1, C_NOMBRE = 2, C_ADULTOS = 3, C_NINOS = 4, C_PASES = 5, C_ENLACE = 6, C_WHATSAPP = 7;
const C_PRIMERA = 8, C_ULTIMA = 9, C_VECES = 10;    // cuándo abrieron la invitación
const ZONA_HORARIA = 'America/Bogota';
const ENCABEZADOS_INV = [
  'Código', 'Invitación (como se muestra)', 'Adultos (separados por coma)', 'Niños (separados por coma)',
  'Pases', 'Enlace', 'WhatsApp', 'Primera vez abierta', 'Última vez abierta', 'Veces abierta'
];
const ENCABEZADOS_RESP = ['Fecha', 'Código', 'Invitación', 'Persona', '¿Asiste?', 'Alergias', 'Tipo'];

/* ====================== Menú en la hoja ====================== */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('💌 Boda')
    .addItem('1. Preparar hojas', 'prepararHojas')
    .addItem('2. Generar códigos y enlaces', 'generarEnlaces')
    .addItem('3. Rehacer resumen', 'rehacerResumen')
    .addToUi();
}

function prepararHojas() {
  const ss = SpreadsheetApp.getActive();

  if (!ss.getSheetByName(HOJA_INV)) {
    const inv = ss.insertSheet(HOJA_INV);
    inv.getRange(1, 1, 1, ENCABEZADOS_INV.length).setValues([ENCABEZADOS_INV]);
    inv.getRange(2, 2, 3, 3).setValues([
      ['Ana y Luis', 'Ana, Luis', ''],
      ['Familia Pérez', 'Carlos Pérez, Marta Gómez', 'Sofía Pérez'],
      ['Julián Torres', 'Julián Torres', '']
    ]);
    estilizarEncabezado(inv, ENCABEZADOS_INV.length);
    inv.setColumnWidth(C_CODIGO, 90);
    inv.setColumnWidths(C_NOMBRE, 3, 240);
    inv.setColumnWidth(C_PASES, 60);
    inv.setColumnWidths(C_ENLACE, 3, 220);
  }

  if (!ss.getSheetByName(HOJA_RESP)) {
    const resp = ss.insertSheet(HOJA_RESP);
    resp.getRange(1, 1, 1, ENCABEZADOS_RESP.length).setValues([ENCABEZADOS_RESP]);
    estilizarEncabezado(resp, ENCABEZADOS_RESP.length);
    resp.setColumnWidths(1, ENCABEZADOS_RESP.length, 170);
  }

  if (!ss.getSheetByName(HOJA_RESUMEN)) crearResumen(ss.insertSheet(HOJA_RESUMEN, 0));
  asegurarEstructura();

  SpreadsheetApp.getUi().alert('Listo ✅\n\nLlena la hoja "Invitados" (columnas B, C y D) y luego usa 💌 Boda > 2. Generar códigos y enlaces.');
}

/**
 * Actualiza hojas creadas con versiones anteriores del código, sin perder datos:
 * - Invitados: agrega la columna "Niños" después de "Adultos" (las demás se corren solas).
 * - Respuestas: la columna G pasa a ser "Tipo" (Adulto / Niño).
 * - Invitados: quita la columna "Estado" (las respuestas ya están en la pestaña Respuestas).
 * - Invitados: agrega las columnas de aperturas (primera vez, última vez y veces).
 */
function asegurarEstructura() {
  const ss = SpreadsheetApp.getActive();
  let cambio = false;

  const inv = ss.getSheetByName(HOJA_INV);
  if (inv && String(inv.getRange(1, C_NINOS).getValue()).indexOf('Pases') === 0) {
    inv.insertColumnAfter(C_ADULTOS);
    inv.getRange(1, C_ADULTOS, 1, 2).setValues([[ENCABEZADOS_INV[C_ADULTOS - 1], ENCABEZADOS_INV[C_NINOS - 1]]]);
    estilizarEncabezado(inv, ENCABEZADOS_INV.length);
    inv.setColumnWidth(C_NINOS, 240);
    cambio = true;
  }

  if (inv && inv.getRange(1, 8).getValue() === 'Estado') {
    inv.deleteColumn(8);                           // las columnas de aperturas se corren a la izquierda
    cambio = true;
  }

  if (inv && !inv.getRange(1, C_PRIMERA).getValue()) {
    inv.getRange(1, C_PRIMERA, 1, 3).setValues([ENCABEZADOS_INV.slice(C_PRIMERA - 1, C_VECES)]);
    estilizarEncabezado(inv, ENCABEZADOS_INV.length);
    inv.setColumnWidths(C_PRIMERA, 2, 150);
    inv.setColumnWidth(C_VECES, 100);
    cambio = true;
  }

  const resp = ss.getSheetByName(HOJA_RESP);
  if (resp && resp.getRange('G1').getValue() !== 'Tipo') {
    resp.getRange('G1').setValue('Tipo');
    estilizarEncabezado(resp, ENCABEZADOS_RESP.length);
    // Las respuestas guardadas antes de este cambio eran todas de adultos
    if (resp.getLastRow() > 1) resp.getRange(2, 7, resp.getLastRow() - 1, 1).setValue('Adulto');
    cambio = true;
  }

  if (cambio && ss.getSheetByName(HOJA_RESUMEN)) crearResumen(ss.getSheetByName(HOJA_RESUMEN));
}

// Menú "3. Rehacer resumen": borra el contenido de la pestaña Resumen y la vuelve a armar
function rehacerResumen() {
  const ss = SpreadsheetApp.getActive();
  asegurarEstructura();
  crearResumen(ss.getSheetByName(HOJA_RESUMEN) || ss.insertSheet(HOJA_RESUMEN, 0));
  SpreadsheetApp.getUi().alert('Resumen actualizado ✅');
}

// Pestaña Resumen: etiqueta en la columna B y total en la C, cada fila en su recuadro
function crearResumen(res) {
  res.clear();
  const filas = [
    // fila, etiqueta, fórmula, color de fondo
    [2, 'Total Invitaciones Enviadas', '=COUNTA(Invitados!B2:B)', null],
    // Personas = pases (adultos) + niños de la columna D (cuenta los nombres separados por coma)
    [4, 'Total Personas invitadas', '=SUM(Invitados!E2:E)+SUMPRODUCT((LEN(TRIM(Invitados!D2:D))>0)*(LEN(Invitados!D2:D)-LEN(SUBSTITUTE(Invitados!D2:D,",",""))+1))', null],
    [5, '✓ Asisten', '=COUNTIF(Respuestas!E2:E,"Sí")', '#D9EAD3'],
    [6, '✗ No asisten', '=COUNTIF(Respuestas!E2:E,"No")', '#F4CCCC'],
    [8, 'Personas sin responder', '=C4-C5-C6', null],
    // Invitaciones con código que todavía no tienen ninguna fila en Respuestas
    [9, 'Invitaciones sin responder', '=SUMPRODUCT((Invitados!A2:A<>"")*(COUNTIF(Respuestas!B2:B,Invitados!A2:A)=0))', null],
    [10, 'Invitaciones sin abrir', '=COUNTIFS(Invitados!B2:B,"<>",Invitados!H2:H,"")', null],
    [12, 'Niños que asisten', '=COUNTIFS(Respuestas!E2:E,"Sí",Respuestas!G2:G,"Niño")', null]
  ];
  filas.forEach(([fila, etiqueta, formula, color]) => {
    res.getRange(fila, 2).setValue(etiqueta);
    res.getRange(fila, 3).setFormula(formula).setHorizontalAlignment('center').setFontWeight('bold');
    const recuadro = res.getRange(fila, 2, 1, 2).setBorder(true, true, true, true, true, false);
    if (color) recuadro.setBackground(color);
  });

  // Alergias: una línea por persona, "Nombre — alergia"
  res.getRange('B14').setValue('Alergias reportadas').setFontWeight('bold')
    .setBorder(true, true, true, true, false, false);
  res.getRange('B15')
    .setFormula('=IFERROR(FILTER(Respuestas!D2:D&" — "&Respuestas!F2:F,Respuestas!F2:F<>""),"Ninguna por ahora")')
    .setBorder(true, true, true, true, false, false);

  res.getRange('B2:C15').setFontSize(11).setVerticalAlignment('middle');
  res.setColumnWidth(1, 40);
  res.setColumnWidth(2, 230);
  res.setColumnWidth(3, 140);
}

function estilizarEncabezado(hoja, columnas) {
  hoja.getRange(1, 1, 1, columnas).setFontWeight('bold').setBackground('#EED9D4');
  hoja.setFrozenRows(1);
}

function generarEnlaces() {
  asegurarEstructura();
  const hoja = SpreadsheetApp.getActive().getSheetByName(HOJA_INV);
  const n = hoja.getLastRow() - 1;
  if (n < 1) return;
  const datos = hoja.getRange(2, 1, n, C_WHATSAPP).getValues();
  const usados = new Set(datos.map(f => String(f[0]).trim().toUpperCase()).filter(Boolean));

  datos.forEach(fila => {
    const nombre = String(fila[C_NOMBRE - 1]).trim();
    if (!nombre) return;
    let codigo = String(fila[C_CODIGO - 1]).trim().toUpperCase();
    if (!codigo) {
      do { codigo = codigoAleatorio(); } while (usados.has(codigo));
      usados.add(codigo);
    }
    const adultos = listaPersonas(fila[C_ADULTOS - 1], nombre).length;
    const total = adultos + listaNombres(fila[C_NINOS - 1]).length;   // para el singular/plural del mensaje
    const enlace = SITE_URL + '?i=' + codigo;
    // Una persona → "te"; varias → "los" (ustedes).
    // El corazón va como código (\u{1F90D} = 🤍) para que no se dañe al copiar y pegar el archivo.
    // Los emojis van como código para que no se dañen al copiar: 🤍 ✨ 💍 💌
    const corazon = '\u{1F90D}', brillo = '\u{2728}', anillo = '\u{1F48D}', carta = '\u{1F48C}';
    const una = total === 1;
    const texto =
      `¡Hola, ${nombre}! ${corazon}${brillo}\n\n` +
      `Con mucha ilusión y amor, queremos ${una ? 'invitarte' : 'invitarlos'} a celebrar con nosotros ` +
      `uno de los días más especiales de nuestras vidas: ¡nuestra boda!\n\n` +
      `${anillo} Nos haría muy felices compartir este momento tan bonito ${una ? 'contigo' : 'con ustedes'}. ${corazon}\n\n` +
      `${carta} ${una ? 'Descubre tu' : 'Descubran su'} invitación aquí: ${enlace}\n\n` +
      `Con cariño,\n*${NOVIOS}*`;   // *texto* = negrita en WhatsApp
    fila[C_CODIGO - 1] = codigo;
    fila[C_PASES - 1] = adultos;                                       // pases: solo adultos
    fila[C_ENLACE - 1] = enlace;
    fila[C_WHATSAPP - 1] = 'https://api.whatsapp.com/send?text=' + encodeURIComponent(texto);
  });

  hoja.getRange(2, 1, n, C_WHATSAPP).setValues(datos);
  SpreadsheetApp.getUi().alert('Códigos y enlaces generados ✅\nAbre el enlace de la columna WhatsApp para enviar cada invitación.');
}

function codigoAleatorio() {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 5; i++) s += abc[Math.floor(Math.random() * abc.length)];
  return s;
}

// Nombres separados por coma ("Ana, Luis" → ["Ana", "Luis"])
function listaNombres(celda) {
  return String(celda || '').split(',').map(s => s.trim()).filter(Boolean);
}

// Adultos: si la celda está vacía, se usa el nombre de la invitación
function listaPersonas(celda, respaldo) {
  const lista = listaNombres(celda);
  return lista.length ? lista : [respaldo];
}

/* ====================== API web ====================== */
function buscarInvitacion(codigo) {
  const hoja = SpreadsheetApp.getActive().getSheetByName(HOJA_INV);
  const n = hoja.getLastRow() - 1;
  if (!codigo || n < 1) return null;
  const datos = hoja.getRange(2, 1, n, C_NINOS).getValues();
  for (let i = 0; i < datos.length; i++) {
    if (String(datos[i][0]).trim().toUpperCase() === codigo) {
      const nombre = String(datos[i][C_NOMBRE - 1]).trim();
      return {
        fila: i + 2, codigo, nombre,
        adultos: listaPersonas(datos[i][C_ADULTOS - 1], nombre),
        menores: listaNombres(datos[i][C_NINOS - 1])
      };
    }
  }
  return null;
}

// Anota cuándo se abrió la invitación: primera vez, última vez y cuántas veces
function registrarApertura(inv) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return;                 // si está ocupado, no se anota (no frena al invitado)
  try {
    const hoja = SpreadsheetApp.getActive().getSheetByName(HOJA_INV);
    const celdas = hoja.getRange(inv.fila, C_PRIMERA, 1, 3);
    const [primera, , veces] = celdas.getValues()[0];
    const ahora = Utilities.formatDate(new Date(), ZONA_HORARIA, 'dd/MM/yyyy HH:mm');
    celdas.setValues([[primera || ahora, ahora, (Number(veces) || 0) + 1]]);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  asegurarEstructura();
  const codigo = String((e.parameter && e.parameter.i) || '').trim().toUpperCase();
  const inv = buscarInvitacion(codigo);
  if (!inv) return json({ ok: false, error: 'no_encontrada' });
  if (!e.parameter.prueba) registrarApertura(inv);   // "&prueba=1" en el enlace = no se anota

  const respuestas = {};
  const hoja = SpreadsheetApp.getActive().getSheetByName(HOJA_RESP);
  if (hoja.getLastRow() > 1) {
    hoja.getRange(2, 1, hoja.getLastRow() - 1, 6).getValues().forEach(f => {
      if (String(f[1]).toUpperCase() === codigo) {
        respuestas[f[3]] = { persona: f[3], asiste: f[4], alergias: String(f[5]).replace(/^'/, '') };
      }
    });
  }
  return json({ ok: true, invitacion: inv.nombre, personas: inv.adultos, menores: inv.menores, respuestas });
}

function doPost(e) {
  let datos;
  try { datos = JSON.parse(e.postData.contents); } catch (err) { return json({ ok: false, error: 'formato' }); }
  if (new Date() > FECHA_LIMITE) return json({ ok: false, error: 'cerrado' });

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    asegurarEstructura();
    const inv = buscarInvitacion(String(datos.i || '').trim().toUpperCase());
    if (!inv) return json({ ok: false, error: 'no_encontrada' });

    // Solo se aceptan las personas registradas en la invitación (adultos y niños por nombre)
    const recibidas = Array.isArray(datos.respuestas) ? datos.respuestas : [];
    const invitados = inv.adultos.map(p => [p, 'Adulto']).concat(inv.menores.map(p => [p, 'Niño']));
    const filas = invitados.map(([persona, tipo]) => {
      const r = recibidas.find(x => x && x.persona === persona);
      if (!r) return null;
      const asiste = r.asiste === 'Sí' ? 'Sí' : 'No';
      const alergias = asiste === 'Sí' ? seguro(String(r.alergias || '').slice(0, 200)) : '';
      return [new Date(), inv.codigo, inv.nombre, persona, asiste, alergias, tipo];
    });
    if (filas.some(f => !f)) return json({ ok: false, error: 'incompleto' });

    // Los niños solo pueden asistir si va al menos un adulto de la invitación
    const vaAdulto = filas.some(f => f[6] === 'Adulto' && f[4] === 'Sí');
    const vanNinos = filas.filter(f => f[6] === 'Niño' && f[4] === 'Sí').length;
    if (vanNinos && !vaAdulto) return json({ ok: false, error: 'sin_adulto' });

    // Si ya había respondido, se reemplaza su respuesta anterior
    const hoja = SpreadsheetApp.getActive().getSheetByName(HOJA_RESP);
    for (let r = hoja.getLastRow(); r >= 2; r--) {
      if (String(hoja.getRange(r, 2).getValue()).toUpperCase() === inv.codigo) hoja.deleteRow(r);
    }
    hoja.getRange(hoja.getLastRow() + 1, 1, filas.length, ENCABEZADOS_RESP.length).setValues(filas);

    return json({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

// Evita que un texto escrito por un invitado se interprete como fórmula
function seguro(t) {
  return /^[=+\-@]/.test(t) ? "'" + t : t;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
