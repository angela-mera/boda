/**
 * Backend de confirmaciones: Google Sheets + Apps Script.
 * Pega este archivo en Extensiones > Apps Script de tu Google Sheet (ver README).
 */

// ⚠️ Cambia esto por el enlace real de tu invitación publicada (termina en /)
const SITE_URL = 'https://TU-USUARIO.github.io/boda/';
const FECHA_LIMITE = new Date('2026-12-01T23:59:59-05:00');
const NOVIOS = 'Valentina & Santiago';

const HOJA_INV = 'Invitados';
const HOJA_RESP = 'Respuestas';
const HOJA_RESUMEN = 'Resumen';

// Columnas de "Invitados" (1 = A)
const C_CODIGO = 1, C_NOMBRE = 2, C_PERSONAS = 3, C_PASES = 4, C_ENLACE = 5, C_WHATSAPP = 6, C_ESTADO = 7;

/* ====================== Menú en la hoja ====================== */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('💌 Boda')
    .addItem('1. Preparar hojas', 'prepararHojas')
    .addItem('2. Generar códigos y enlaces', 'generarEnlaces')
    .addToUi();
}

function prepararHojas() {
  const ss = SpreadsheetApp.getActive();

  let inv = ss.getSheetByName(HOJA_INV);
  if (!inv) {
    inv = ss.insertSheet(HOJA_INV);
    inv.getRange(1, 1, 1, 7).setValues([[
      'Código', 'Invitación (como se muestra)', 'Personas (separadas por coma)', 'Pases', 'Enlace', 'WhatsApp', 'Estado'
    ]]);
    inv.getRange(2, 2, 3, 2).setValues([
      ['Ana y Luis', 'Ana, Luis'],
      ['Familia Pérez', 'Carlos Pérez, Marta Gómez, Sofía Pérez'],
      ['Julián Torres', 'Julián Torres']
    ]);
    estilizarEncabezado(inv, 7);
    inv.setColumnWidths(1, 1, 90);
    inv.setColumnWidths(2, 2, 260);
    inv.setColumnWidths(4, 1, 60);
    inv.setColumnWidths(5, 3, 220);
  }

  let resp = ss.getSheetByName(HOJA_RESP);
  if (!resp) {
    resp = ss.insertSheet(HOJA_RESP);
    resp.getRange(1, 1, 1, 6).setValues([['Fecha', 'Código', 'Invitación', 'Persona', '¿Asiste?', 'Alergias']]);
    estilizarEncabezado(resp, 6);
    resp.setColumnWidths(1, 6, 170);
  }

  let res = ss.getSheetByName(HOJA_RESUMEN);
  if (!res) {
    res = ss.insertSheet(HOJA_RESUMEN, 0);
    const filas = [
      ['Invitaciones', '=COUNTA(Invitados!B2:B)'],
      ['Personas invitadas', '=SUM(Invitados!D2:D)'],
      ['✓ Asisten', '=COUNTIF(Respuestas!E2:E,"Sí")'],
      ['✗ No asisten', '=COUNTIF(Respuestas!E2:E,"No")'],
      ['Personas sin responder', '=B2-B3-B4'],
      ['Invitaciones sin responder', '=COUNTIFS(Invitados!B2:B,"<>",Invitados!G2:G,"")']
    ];
    res.getRange(1, 1, filas.length, 2).setValues(filas);
    res.getRange('A1:A6').setFontWeight('bold');
    res.getRange('B1:B6').setFontSize(14).setHorizontalAlignment('center');
    res.getRange('A8').setValue('Alergias reportadas').setFontWeight('bold');
    res.getRange('A9').setFormula('=IFERROR(FILTER(Respuestas!D2:F,Respuestas!F2:F<>""),"Ninguna por ahora")');
    res.setColumnWidth(1, 230);
    res.setColumnWidth(2, 260);
  }

  SpreadsheetApp.getUi().alert('Listo ✅\n\nLlena la hoja "Invitados" (columnas B y C) y luego usa 💌 Boda > 2. Generar códigos y enlaces.');
}

function estilizarEncabezado(hoja, columnas) {
  hoja.getRange(1, 1, 1, columnas).setFontWeight('bold').setBackground('#EED9D4');
  hoja.setFrozenRows(1);
}

function generarEnlaces() {
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
    const personas = listaPersonas(fila[C_PERSONAS - 1], nombre);
    const enlace = SITE_URL + '?i=' + codigo;
    const texto = `¡Hola ${nombre}! 🤍 Con mucha ilusión queremos invitarte a nuestra boda. ` +
      `Abre tu invitación aquí: ${enlace}\n\n${NOVIOS}`;
    fila[C_CODIGO - 1] = codigo;
    fila[C_PASES - 1] = personas.length;
    fila[C_ENLACE - 1] = enlace;
    fila[C_WHATSAPP - 1] = 'https://wa.me/?text=' + encodeURIComponent(texto);
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

function listaPersonas(celda, respaldo) {
  const lista = String(celda || '').split(',').map(s => s.trim()).filter(Boolean);
  return lista.length ? lista : [respaldo];
}

/* ====================== API web ====================== */
function buscarInvitacion(codigo) {
  const hoja = SpreadsheetApp.getActive().getSheetByName(HOJA_INV);
  const n = hoja.getLastRow() - 1;
  if (!codigo || n < 1) return null;
  const datos = hoja.getRange(2, 1, n, C_PERSONAS).getValues();
  for (let i = 0; i < datos.length; i++) {
    if (String(datos[i][0]).trim().toUpperCase() === codigo) {
      const nombre = String(datos[i][C_NOMBRE - 1]).trim();
      return { fila: i + 2, codigo, nombre, personas: listaPersonas(datos[i][C_PERSONAS - 1], nombre) };
    }
  }
  return null;
}

function doGet(e) {
  const codigo = String((e.parameter && e.parameter.i) || '').trim().toUpperCase();
  const inv = buscarInvitacion(codigo);
  if (!inv) return json({ ok: false, error: 'no_encontrada' });

  const respuestas = {};
  const hoja = SpreadsheetApp.getActive().getSheetByName(HOJA_RESP);
  if (hoja.getLastRow() > 1) {
    hoja.getRange(2, 1, hoja.getLastRow() - 1, 6).getValues().forEach(f => {
      if (String(f[1]).toUpperCase() === codigo) {
        respuestas[f[3]] = { persona: f[3], asiste: f[4], alergias: String(f[5]).replace(/^'/, '') };
      }
    });
  }
  return json({ ok: true, invitacion: inv.nombre, personas: inv.personas, respuestas });
}

function doPost(e) {
  let datos;
  try { datos = JSON.parse(e.postData.contents); } catch (err) { return json({ ok: false, error: 'formato' }); }
  if (new Date() > FECHA_LIMITE) return json({ ok: false, error: 'cerrado' });

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const inv = buscarInvitacion(String(datos.i || '').trim().toUpperCase());
    if (!inv) return json({ ok: false, error: 'no_encontrada' });

    // Solo se aceptan las personas registradas en la invitación
    const recibidas = Array.isArray(datos.respuestas) ? datos.respuestas : [];
    const filas = inv.personas.map(persona => {
      const r = recibidas.find(x => x && x.persona === persona);
      if (!r) return null;
      const asiste = r.asiste === 'Sí' ? 'Sí' : 'No';
      const alergias = asiste === 'Sí' ? seguro(String(r.alergias || '').slice(0, 200)) : '';
      return [new Date(), inv.codigo, inv.nombre, persona, asiste, alergias];
    });
    if (filas.some(f => !f)) return json({ ok: false, error: 'incompleto' });

    // Si ya había respondido, se reemplaza su respuesta anterior
    const hoja = SpreadsheetApp.getActive().getSheetByName(HOJA_RESP);
    for (let r = hoja.getLastRow(); r >= 2; r--) {
      if (String(hoja.getRange(r, 2).getValue()).toUpperCase() === inv.codigo) hoja.deleteRow(r);
    }
    hoja.getRange(hoja.getLastRow() + 1, 1, filas.length, 6).setValues(filas);

    const si = filas.filter(f => f[4] === 'Sí').length;
    SpreadsheetApp.getActive().getSheetByName(HOJA_INV)
      .getRange(inv.fila, C_ESTADO)
      .setValue(`✓ ${si} asiste(n) · ✗ ${filas.length - si} no`);

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
