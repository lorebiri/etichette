"use strict";
/* ============================================================
   FOGLI A4 DI ETICHETTE e composizione delle pagine
   Misure dei fogli adesivi più diffusi (mm). I codici "tipo Lxxxx" indicano
   formati compatibili molto comuni: controlla sempre le misure sulla confezione.
   ============================================================ */
const A4 = { w: 210, h: 297 };
const FOGLI = [
  { id: "libero", nome: "Ritaglio libero su A4 (con linee di taglio)" },
  { id: "a4x1",  nome: "A4 intero — 1 etichetta 210 × 297",           col: 1, row: 1,  w: 210,  h: 297,   top: 0,     left: 0,    gx: 0,   gy: 0 },
  { id: "a4x2",  nome: "2 etichette 210 × 148,5 (A5)",                col: 1, row: 2,  w: 210,  h: 148.5, top: 0,     left: 0,    gx: 0,   gy: 0 },
  { id: "a4x4",  nome: "4 etichette 105 × 148,5 (A6)",                col: 2, row: 2,  w: 105,  h: 148.5, top: 0,     left: 0,    gx: 0,   gy: 0 },
  { id: "a4x8",  nome: "8 etichette 105 × 74",                        col: 2, row: 4,  w: 105,  h: 74.25, top: 0,     left: 0,    gx: 0,   gy: 0 },
  { id: "a4x8b", nome: "8 etichette 99,1 × 67,7 (tipo L7165)",        col: 2, row: 4,  w: 99.1, h: 67.7,  top: 13.1,  left: 4.65, gx: 2.5, gy: 0 },
  { id: "a4x14", nome: "14 etichette 99,1 × 38,1 (tipo L7163)",       col: 2, row: 7,  w: 99.1, h: 38.1,  top: 15.15, left: 4.65, gx: 2.5, gy: 0 },
  { id: "a4x21", nome: "21 etichette 63,5 × 38,1 (tipo L7160)",       col: 3, row: 7,  w: 63.5, h: 38.1,  top: 15.15, left: 7.25, gx: 2.5, gy: 0 },
  { id: "a4x24", nome: "24 etichette 70 × 37",                        col: 3, row: 8,  w: 70,   h: 37,    top: 0.5,   left: 0,    gx: 0,   gy: 0 },
  { id: "a4x24b", nome: "24 etichette 63,5 × 33,9 (tipo L7159)",      col: 3, row: 8,  w: 63.5, h: 33.9,  top: 12.9,  left: 7.25, gx: 2.5, gy: 0 },
  { id: "a4x40", nome: "40 etichette 52,5 × 29,7",                    col: 4, row: 10, w: 52.5, h: 29.7,  top: 0,     left: 0,    gx: 0,   gy: 0 },
  { id: "a4x65", nome: "65 etichette 38,1 × 21,2 (tipo L7651)",       col: 5, row: 13, w: 38.1, h: 21.2,  top: 10.7,  left: 4.75, gx: 2.5, gy: 0 },
  { id: "pers",  nome: "Personalizzato (imposta le misure qui sotto)", personalizzato: true }
];

/* posizioni delle celle di una griglia (mm, origine in alto a sinistra) */
function celleFoglio(f, dx, dy){
  const out = [];
  for(let r = 0; r < f.row; r++) for(let c = 0; c < f.col; c++)
    out.push({ x: f.left + c * (f.w + f.gx) + (dx || 0), y: f.top + r * (f.h + f.gy) + (dy || 0), w: f.w, h: f.h });
  return out;
}

/* ritaglio libero: impacchetta etichette di misure diverse a "scaffali" */
function impaccaLibero(etichette, margine, gap){
  const pagine = [];
  const maxW = A4.w - 2 * margine, maxH = A4.h - 2 * margine;
  let pag = [], x = 0, y = 0, hRiga = 0;
  const nuovaPagina = () => { if(pag.length) pagine.push(pag); pag = []; x = 0; y = 0; hRiga = 0; };
  etichette.forEach(e => {
    let { w, h } = e;
    const fuori = w > maxW || h > maxH;          // troppo grande per i margini: pagina a sé, senza margini
    if(fuori){ nuovaPagina(); pagine.push([{ e, x: Math.max(0, (A4.w - w) / 2), y: Math.max(0, (A4.h - h) / 2) }]); return; }
    if(x + w > maxW + 1e-6){ x = 0; y += hRiga + gap; hRiga = 0; }
    if(y + h > maxH + 1e-6) nuovaPagina();
    pag.push({ e, x: margine + x, y: margine + y });
    x += w + gap; hRiga = Math.max(hRiga, h);
  });
  nuovaPagina();
  return pagine;
}

/* rende una etichetta SVG annidabile in un'altra SVG (misure in mm senza unità) */
function svgAnnidato(svg, x, y){
  return svg.replace(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/, '<svg x="' + r2(x) + '" y="' + r2(y) + '"')
            .replace(/ width="([\d.]+)mm" height="([\d.]+)mm"/, ' width="$1" height="$2"');
}
/* una pagina A4 come SVG unico (usata per stampa, anteprima foglio e PDF) */
function svgPagina(pezzi, celleVuote){
  let o = '<svg xmlns="http://www.w3.org/2000/svg" class="pagina-svg" width="210mm" height="297mm" viewBox="0 0 210 297"><rect width="210" height="297" fill="#fff"/>';
  (celleVuote || []).forEach(c => { o += '<rect class="cella-guida" x="' + r2(c.x) + '" y="' + r2(c.y) + '" width="' + r2(c.w) + '" height="' + r2(c.h) + '" rx="1.5" fill="none" stroke="#c9d3e0" stroke-width="0.3" stroke-dasharray="1.5 1"/>'; });
  pezzi.forEach(p => { o += svgAnnidato(p.svg, p.x, p.y); });
  return o + "</svg>";
}
