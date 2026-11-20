"use strict";
/* ============================================================
   MOTORE DI IMPAGINAZIONE DELL'ETICHETTA → SVG vettoriale
   Tutte le misure sono in millimetri. Il testo viene misurato con
   canvas e mandato a capo a mano: così si può garantire che nulla
   esca dai bordi (il testo si rimpicciolisce e, se proprio non entra,
   si tolgono gli elementi meno importanti, segnalandolo).
   ============================================================ */
const PT = 0.352778;                 // 1 punto tipografico in mm
const FONT_ET = "Arial, 'Liberation Sans', Helvetica, sans-serif";
const INTERLINEA = 1.2;              // interlinea ≥ 120 % del corpo (CLP riveduto)
const X_HEIGHT = 0.519;              // altezza della "x" di Arial rispetto al corpo
const FONT_MIN_ASSOLUTO = 1.1;       // corpo minimo (mm) sotto cui non si scende mai (~3,1 pt)

const _ctx = (typeof document !== "undefined") ? document.createElement("canvas").getContext("2d") : null;
const _cacheW = new Map();
/* larghezza in mm di un testo con corpo sizeMm */
function larghezzaTesto(t, sizeMm, bold){
  const k = (bold ? "b|" : "n|") + t;
  let w = _cacheW.get(k);
  if(w === undefined){
    _ctx.font = (bold ? "bold " : "") + "100px " + FONT_ET;
    w = _ctx.measureText(t).width / 100;
    if(_cacheW.size > 20000) _cacheW.clear();
    _cacheW.set(k, w);
  }
  return w * sizeMm;
}

function escXml(s){ return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
const r2 = v => Math.round(v * 100) / 100;

/* ---------- Paragrafi ----------
   Un paragrafo è {runs:[{t, b}], f: fattore di corpo, al: "l"|"c", maiusc}
   ------------------------------------------------------------- */
function par(runs, f, opz){ return Object.assign({ runs, f: f || 1, al: "l" }, opz || {}); }

/* manda a capo un paragrafo; restituisce le righe [{segs:[{t,b,w}], w}] */
function aCapo(p, larg, size){
  const s = size * p.f;
  const spazio = larghezzaTesto(" ", s, false);
  const parole = [];
  p.runs.forEach(r => {
    const testo = p.maiusc ? r.t.toUpperCase() : r.t;
    testo.replace(/ (%|°C|ml|L|g|mg|kg|M|mM)(?=$|[ ,;.)])/g, "\u00a0$1").replace(/([≥≤<>~]) /g, "$1\u00a0").split(/[ \t\n]+/).filter(Boolean).forEach(w => parole.push({ t: w, b: !!r.b }));
  });
  const righe = [];
  let riga = { segs: [], w: 0 };
  const chiudi = () => { if(riga.segs.length) righe.push(riga); riga = { segs: [], w: 0 }; };
  parole.forEach(pw => {
    let w = larghezzaTesto(pw.t, s, pw.b);
    if(w > larg){
      // parola più lunga della riga: la spezzo carattere per carattere (ultima risorsa)
      _spezzate++;
      chiudi();
      let pezzo = "";
      for(const ch of pw.t){
        if(larghezzaTesto(pezzo + ch, s, pw.b) > larg && pezzo){
          righe.push({ segs: [{ t: pezzo, b: pw.b, w: larghezzaTesto(pezzo, s, pw.b) }], w: larghezzaTesto(pezzo, s, pw.b) });
          pezzo = "";
        }
        pezzo += ch;
      }
      pw = { t: pezzo, b: pw.b }; w = larghezzaTesto(pezzo, s, pw.b);
    }
    const extra = riga.segs.length ? spazio : 0;
    if(riga.w + extra + w > larg && riga.segs.length) chiudi();
    const e2 = riga.segs.length ? spazio : 0;
    riga.segs.push({ t: pw.t, b: pw.b, w, sp: e2 });
    riga.w += e2 + w;
  });
  chiudi();
  return righe;
}

/* impagina un elenco di paragrafi in una colonna larga larg; restituisce altezza e righe posizionate */
let _spezzate = 0;
function impagina(paras, larg, size, gapPar){
  const sp0 = _spezzate;
  const g = gapPar === undefined ? 0.25 : gapPar;
  let y = 0;
  const out = [];
  paras.forEach((p, i) => {
    const s = size * p.f;
    const righe = aCapo(p, larg, size);
    if(i > 0) y += s * g + (p.gapPrima || 0) * size;
    righe.forEach(rg => {
      out.push({ y: y + s * 0.93, s, al: p.al, segs: rg.segs, w: rg.w, colore: p.colore });
      y += s * INTERLINEA;
    });
  });
  return { h: y, righe: out, spezzate: _spezzate - sp0 };
}

/* corpo più grande (tra min e max) con cui i paragrafi entrano in larg × alt */
function corpoMassimo(paras, larg, alt, min, max){
  if(!paras.length) return max;
  if(impagina(paras, larg, min).h > alt + 1e-6) return null;
  if(impagina(paras, larg, max).h <= alt) return max;
  let lo = min, hi = max;
  for(let i = 0; i < 14; i++){
    const m = (lo + hi) / 2;
    if(impagina(paras, larg, m).h <= alt) lo = m; else hi = m;
  }
  return lo;
}

/* ---------- Disegno ---------- */
function svgRighe(righe, x0, y0, larg){
  let o = "";
  righe.forEach(r => {
    let x = x0;
    if(r.al === "c") x = x0 + (larg - r.w) / 2;
    o += '<text x="' + r2(x) + '" y="' + r2(y0 + r.y) + '" font-size="' + r2(r.s) + '"' +
      (r.colore ? ' fill="' + r.colore + '"' : "") + ' xml:space="preserve" data-w="' + r2(r.w) + '">';
    r.segs.forEach(sg => {
      o += (sg.sp ? " " : "") + (sg.b ? '<tspan font-weight="bold">' + escXml(sg.t) + "</tspan>" : escXml(sg.t));
    });
    o += "</text>";
  });
  return o;
}
function svgPitto(cod, x, y, lato){
  const p = PICTO[cod];
  if(!p) return "";
  return '<svg x="' + r2(x) + '" y="' + r2(y) + '" width="' + r2(lato) + '" height="' + r2(lato) + '" viewBox="' + p.vb + '" class="et-picto" data-cod="' + cod + '">' + p.inner + "</svg>";
}
function svgQR(matrice, x, y, lato){
  const n = matrice.length, q = 2, tot = n + 2 * q, m = lato / tot;
  let d = "";
  for(let i = 0; i < n; i++){
    let j = 0;
    while(j < n){
      if(matrice[i][j]){
        let k = j; while(k < n && matrice[i][k]) k++;
        d += "M" + (j + q) + " " + (i + q) + "h" + (k - j) + "v1h-" + (k - j) + "z";
        j = k;
      } else j++;
    }
  }
  return '<g class="et-qr" transform="translate(' + r2(x) + " " + r2(y) + ") scale(" + (m).toFixed(5) + ')"><rect width="' + tot + '" height="' + tot + '" fill="#fff"/><path d="' + d + '" fill="#000" shape-rendering="crispEdges"/></g>';
}

/* migliore griglia per n quadrati in w × h: restituisce {lato, col, righe} */
function grigliaPitto(n, w, h, gap){
  let best = { lato: 0, col: n, righe: 1 };
  for(let col = 1; col <= n; col++){
    const righe = Math.ceil(n / col);
    const lato = Math.min((w - gap * (col - 1)) / col, (h - gap * (righe - 1)) / righe);
    if(lato > best.lato + 1e-9) best = { lato, col, righe };
  }
  return best;
}

/* ============================================================
   CONTENUTO: livelli progressivi di riduzione
   ============================================================ */
const LIVELLI = [
  { id: 0, nome: "completa" },
  { id: 1, nome: "frasi P solo codici", pCodici: true },
  { id: 2, nome: "senza QR", pCodici: true, noQR: true },
  { id: 3, nome: "frasi H e P solo codici", pCodici: true, hCodici: true, noQR: true },
  { id: 4, nome: "senza dati di laboratorio", pCodici: true, hCodici: true, noQR: true, noMeta: true },
  { id: 5, nome: "senza frasi P", noP: true, hCodici: true, noQR: true, noMeta: true },
  { id: 6, nome: "ridotta (nome, CAS, pittogrammi, avvertenza, codici H)", ridotta: true },
  { id: 7, nome: "minima (nome e pittogrammi)", minima: true }
];

function paragrafiTesto(d, L){
  const blocchi = { _picto: d.picto };
  // intestazione
  const testa = [par([{ t: d.nome || "—", b: true }], 1.45)];
  if(!L.minima){
    if(d.cas || d.conc) testa.push(par([{ t: [d.cas ? "CAS " + d.cas : "", d.conc].filter(Boolean).join(" · ") }], 0.95));
    if(d.contiene && !L.ridotta) testa.push(par([{ t: "Contiene: " + d.contiene }], 0.85));
  }
  blocchi.testa = testa;
  const corpo = [];
  if(!L.minima && d.avv) corpo.push(par([{ t: d.avv, b: true }], 1.3, { maiusc: true }));
  if(!L.minima && d.H.length){
    if(L.ridotta || L.hCodici || d.H.every(x => !x.testo)) corpo.push(par([{ t: d.H.map(x => x.cod).join(" "), b: true }], 1));
    else d.H.forEach(x => corpo.push(par([{ t: x.cod, b: true }, { t: x.testo }], 1)));
  }
  if(!L.minima && !L.ridotta && !L.noP && d.P.length){
    if(L.pCodici || d.P.every(x => !x.testo)) corpo.push(par([{ t: d.P.map(x => x.cod).join(" "), b: true }], 0.92, { gapPrima: 0.25 }));
    else d.P.forEach((x, i) => corpo.push(par([{ t: x.cod, b: true }, { t: x.testo }], 0.92, { gapPrima: i === 0 ? 0.25 : 0 })));
  }
  blocchi.corpo = corpo;
  blocchi.meta = (!L.minima && !L.ridotta && !L.noMeta && d.meta.length) ? [par([{ t: d.meta.join(" · ") }], 0.85)] : [];
  blocchi.qr = (!L.minima && !L.ridotta && !L.noQR && d.qr) ? d.qr : null;
  return blocchi;
}

/* ============================================================
   IMPAGINAZIONE DI UN PANNELLO RETTANGOLARE
   d: dati; box: {x,y,w,h}; o: opzioni
   Restituisce {svg, info} oppure null se non entra al livello dato
   ============================================================ */
function impaginaPannello(d, box, L, o){
  const B = paragrafiTesto(d, L);
  const n = d.picto.length;
  const gapP = 0.6;
  const W = box.w, H = box.h;
  const fMin = o.fontMin, fMax = o.fontMax * (L.minima ? 2 : 1);
  const pittoFisso = o.pittoLato > 0 ? o.pittoLato : null;
  const candidati = [];

  const valuta = (tipo, lato, extra) => {
    // calcola il corpo massimo per una disposizione data
    let r = null;
    if(tipo === "pila") r = dispPila(B, n, lato, W, H, fMin, fMax, gapP);
    else r = dispLato(B, n, lato, extra, W, H, fMin, fMax, gapP);
    if(r) candidati.push(r);
  };

  const latiDa = (latoMax) => {
    if(!n) return [0];
    if(pittoFisso) return [Math.min(pittoFisso, latoMax)];
    const l = [];
    for(let v = latoMax; v >= Math.min(3, latoMax); v *= 0.91) l.push(v);
    return l;
  };
  // disposizione "a pila": testa, pittogrammi, testo, piede
  if(o.disposizione !== "lato" || !n) latiDa(Math.min(W, H * 0.6)).forEach(lato => valuta("pila", lato));
  // disposizione "di lato": colonna pittogrammi a sinistra
  if(n && o.disposizione !== "pila"){
    for(let col = 1; col <= Math.min(n, 3); col++){
      const righe = Math.ceil(n / col);
      const latoMax = Math.min((H - gapP * (righe - 1)) / righe, (W * (L.minima ? 0.75 : 0.6) - gapP * (col - 1)) / col);
      if(latoMax <= 2) continue;
      latiDa(latoMax).forEach(lato => valuta("lato", lato, col));
    }
  }
  if(!candidati.length) return null;
  // punteggio: pittogrammi il più vicino possibile al lato consigliato (o al massimo ottenibile),
  // testo leggibile; i pittogrammi pesano di più perché comunicano il pericolo
  const pT = o.pittoTarget || 10, fT = o.fontTarget || 2.2;
  const maxLato = Math.max(...candidati.map(c => c.lato)), maxFont = Math.max(...candidati.map(c => c.font));
  const pRef = Math.min(pT, maxLato) || 1, fRef = Math.min(fT, maxFont) || 1;
  candidati.forEach(c => {
    const pp = n ? Math.min(c.lato / pRef, 1) : 1;
    const ff = Math.min(c.font / fRef, 1);
    c.punti = pp * 120 + ff * 80 + c.font * 2 + (n ? c.lato * 0.3 : 0) - (c.tipo === "lato" ? 0.5 : 0) - (c.spez ? 300 : 0);
  });
  candidati.sort((a, b) => b.punti - a.punti);
  const c = candidati[0];
  return { svg: c.disegna(box.x, box.y), font: c.font, lato: c.lato, tipo: c.tipo };
}

/* altezza di un blocco; se una parola va spezzata e si può ancora rimpicciolire, conta come "non entra" */
function hBlocco(paras, larg, f, fMin){
  if(!paras.length) return 0;
  const r = impagina(paras, larg, f);
  if(r.spezzate && fMin !== undefined && f > fMin + 1e-6) return 1e6;
  return r.h;
}

/* altezza del piede (meta + QR a destra) */
function piede(B, larg, f, H){
  if(!B.meta.length && !B.qr) return { h: 0 };
  let qrLato = 0;
  if(B.qr){
    qrLato = Math.max(9, Math.min(16, H * 0.22, larg * 0.3));
    if(qrLato > larg * 0.45) qrLato = 0;
  }
  const largMeta = qrLato ? larg - qrLato - 1 : larg;
  const hm = hBlocco(B.meta, largMeta, f);
  return { h: Math.max(hm, qrLato) + f * 0.5, qrLato, largMeta, hm };
}

function dispPila(B, n, lato, W, H, fMin, fMax, gap){
  let col = 0, righe = 0, hP = 0;
  if(n){
    col = Math.max(1, Math.floor((W + gap) / (lato + gap)));
    if(col > n) col = n;
    righe = Math.ceil(n / col);
    hP = righe * lato + (righe - 1) * gap;
    if(hP > H) return null;
  }
  const altTesto = (f) => {
    const sep = f * 0.45;
    let h = hBlocco(B.testa, W, f, fMin);
    if(n) h += sep + hP;
    if(B.corpo.length) h += sep + hBlocco(B.corpo, W, f, fMin);
    const pd = piede(B, W, f, H);
    if(pd.h) h += sep + pd.h;
    return h;
  };
  // ricerca binaria del corpo
  if(altTesto(fMin) > H) return null;
  let lo = fMin, hi = fMax;
  if(altTesto(fMax) <= H) lo = fMax;
  else for(let i = 0; i < 14; i++){ const m = (lo + hi) / 2; if(altTesto(m) <= H) lo = m; else hi = m; }
  const f = lo;
  const sp0 = _spezzate; altTesto(f); const spez = _spezzate - sp0;
  return {
    tipo: "pila", font: f, lato: n ? lato : 0, spez,
    disegna: (x0, y0) => {
      let o = "", y = y0;
      const sep = f * 0.45;
      const t = impagina(B.testa, W, f);
      o += svgRighe(t.righe, x0, y, W); y += t.h;
      if(n){
        y += sep;
        const larRiga = (k) => k * lato + (k - 1) * gap;
        for(let i = 0; i < n; i++){
          const rr = Math.floor(i / col), cc = i % col;
          const nellaRiga = Math.min(col, n - rr * col);
          const xr = x0 + (W - larRiga(nellaRiga)) / 2;
          o += svgPitto(B._picto[i], xr + cc * (lato + gap), y + rr * (lato + gap), lato);
        }
        y += hP;
      }
      if(B.corpo.length){ y += sep; const c = impagina(B.corpo, W, f); o += svgRighe(c.righe, x0, y, W); y += c.h; }
      const pd = piede(B, W, f, H);
      if(pd.h){
        const yP = y0 + H - pd.h + f * 0.5;  // piede ancorato in basso
        o += '<line x1="' + r2(x0) + '" x2="' + r2(x0 + W) + '" y1="' + r2(yP - f * 0.3) + '" y2="' + r2(yP - f * 0.3) + '" stroke="#000" stroke-width="0.2"/>';
        if(B.meta.length){ const m = impagina(B.meta, pd.largMeta, f); o += svgRighe(m.righe, x0, yP + (pd.h - f * 0.5 - m.h), pd.largMeta); }
        if(pd.qrLato) o += svgQR(B.qr, x0 + W - pd.qrLato, yP, pd.qrLato);
      }
      return o;
    }
  };
}

function dispLato(B, n, lato, col, W, H, fMin, fMax, gap){
  const righe = Math.ceil(n / col);
  const wP = col * lato + (col - 1) * gap;
  const hP = righe * lato + (righe - 1) * gap;
  if(hP > H + 1e-6) return null;
  const sepX = Math.max(1, lato * 0.1);
  const Wt = W - wP - sepX;
  if(Wt < 6) return null;
  const altTesto = (f) => {
    const sep = f * 0.45;
    let h = hBlocco(B.testa, Wt, f, fMin);
    if(B.corpo.length) h += sep + hBlocco(B.corpo, Wt, f, fMin);
    const pd = piede(B, Wt, f, H);
    if(pd.h) h += sep + pd.h;
    return h;
  };
  if(altTesto(fMin) > H) return null;
  let lo = fMin, hi = fMax;
  if(altTesto(fMax) <= H) lo = fMax;
  else for(let i = 0; i < 14; i++){ const m = (lo + hi) / 2; if(altTesto(m) <= H) lo = m; else hi = m; }
  const f = lo;
  const sp0 = _spezzate; altTesto(f); const spez = _spezzate - sp0;
  return {
    tipo: "lato", font: f, lato, spez,
    disegna: (x0, y0) => {
      let o = "";
      const yP0 = y0 + (H - hP) / 2;
      for(let i = 0; i < n; i++){
        const rr = Math.floor(i / col), cc = i % col;
        o += svgPitto(B._picto[i], x0 + cc * (lato + gap), yP0 + rr * (lato + gap), lato);
      }
      const xt = x0 + wP + sepX;
      let y = y0;
      const sep = f * 0.45;
      const t = impagina(B.testa, Wt, f); o += svgRighe(t.righe, xt, y, Wt); y += t.h;
      if(B.corpo.length){ y += sep; const c = impagina(B.corpo, Wt, f); o += svgRighe(c.righe, xt, y, Wt); y += c.h; }
      const pd = piede(B, Wt, f, H);
      if(pd.h){
        const yP = y0 + H - pd.h + f * 0.5;
        o += '<line x1="' + r2(xt) + '" x2="' + r2(xt + Wt) + '" y1="' + r2(yP - f * 0.3) + '" y2="' + r2(yP - f * 0.3) + '" stroke="#000" stroke-width="0.2"/>';
        if(B.meta.length){ const m = impagina(B.meta, pd.largMeta, f); o += svgRighe(m.righe, xt, yP + (pd.h - f * 0.5 - m.h), pd.largMeta); }
        if(pd.qrLato) o += svgQR(B.qr, xt + Wt - pd.qrLato, yP, pd.qrLato);
      }
      return o;
    }
  };
}

/* prova i livelli di contenuto: si scende di livello finché i pittogrammi
   non raggiungono una dimensione adeguata (≥ 80 % del lato consigliato o
   ≥ 80 % del massimo ottenibile). Così si tolgono testi prima di rimpicciolire troppo i simboli. */
function impaginaConRiduzione(d, box, o, livelloIniziale){
  const ris = [];
  const pT = d.picto.length ? (o.pittoLato > 0 ? o.pittoLato * 0.98 : (o.pittoTarget || 10) * 0.8) : 0;
  for(let i = livelloIniziale; i < LIVELLI.length; i++){
    const L = LIVELLI[i];
    const r = impaginaPannello(d, box, L, o);
    if(!r) continue;
    r.livello = L;
    if(r.lato >= pT - 1e-6) return r;
    ris.push(r);
  }
  if(ris.length){
    const maxLato = Math.max(...ris.map(r => r.lato));
    return ris.find(r => r.lato >= maxLato * 0.8 - 1e-6);
  }
  // ultime risorse: carattere minimo assoluto, poi nome accorciato, poi solo pittogrammi
  const L = LIVELLI[LIVELLI.length - 1];
  const oMin = Object.assign({}, o, { fontMin: FONT_MIN_ASSOLUTO });
  let r = impaginaPannello(d, box, L, oMin);
  if(r) return Object.assign(r, { livello: L });
  const nome = d.nome || "—";
  let lo = 1, hi = nome.length - 1, best = null;
  while(lo <= hi){            // ricerca binaria della lunghezza massima del nome che entra
    const m = (lo + hi) >> 1;
    const rr = impaginaPannello(Object.assign({}, d, { nome: nome.slice(0, m) + "…" }), box, L, oMin);
    if(rr){ best = rr; lo = m + 1; } else hi = m - 1;
  }
  if(best && (!d.picto.length || best.lato > 0)) return Object.assign(best, { livello: L, troncato: true });
  // solo pittogrammi, i più grandi possibile (il nome non entra: va scritto altrove)
  const n = d.picto.length;
  if(!n) return { svg: "", font: 0, lato: 0, livello: L, troncato: true };
  const g = grigliaPitto(n, box.w, box.h, 0.4);
  let svg = "";
  const x0 = box.x + (box.w - (g.col * g.lato + (g.col - 1) * 0.4)) / 2, y0 = box.y + (box.h - (g.righe * g.lato + (g.righe - 1) * 0.4)) / 2;
  d.picto.forEach((c, i) => { svg += svgPitto(c, x0 + (i % g.col) * (g.lato + 0.4), y0 + Math.floor(i / g.col) * (g.lato + 0.4), g.lato); });
  return { svg, font: 0, lato: g.lato, livello: L, troncato: true, soloPitto: true };
}

/* ============================================================
   API PRINCIPALE
   dati: {nome, cas, conc, contiene, avv, picto[], H:[{cod,testo}], P:[...], meta[], qr(matrice|null)}
   opz:  {w, h, layout, d (diametro), flagW, contenuto: auto|ridotta|minima,
          pittoLato (0=auto), fontMax, fontMin, pittoTarget, fontTarget, bordo}
   ============================================================ */
let _idEtichetta = 0;
function generaEtichetta(dati, opz){
  const o = Object.assign({ fontMax: 3.2, fontMin: 1.4, pittoLato: 0, contenuto: "auto", bordo: true, layout: "auto" }, opz);
  const W = o.w, H = o.h;
  const pad = Math.max(0.8, Math.min(3, Math.min(W, H) * 0.05));
  const livello0 = o.contenuto === "minima" ? 7 : o.contenuto === "ridotta" ? 6 : 0;
  let corpo = "", extra = "";
  const pannelli = [];
  const info = { pannelli, layout: o.layout, w: W, h: H };

  const pannello = (x, y, w, h, d, liv, oo) => {
    const r = impaginaConRiduzione(d, { x, y, w, h }, oo || o, liv);
    pannelli.push({ x, y, w, h, font: r.font, lato: r.lato, livello: r.livello, troncato: !!r.troncato, tipo: r.tipo });
    return r.svg;
  };

  if(o.layout === "bandiera" && (W - Math.PI * (o.d || 10)) / 2 < 8) o.layout = "piana";   // troppo stretta per le bandiere
  if(o.layout === "bandiera"){
    // [bandiera A | giro attorno al tubo | bandiera B]: piegata, A e B si incollano schiena contro schiena
    const giro = Math.PI * (o.d || 10);
    const fw = (W - giro) / 2;
    info.giro = giro; info.flagW = fw;
    const fwInt = fw - 2 * pad;
    corpo += pannello(pad, pad, fwInt, H - 2 * pad, dati, livello0);
    corpo += pannello(fw + giro + pad, pad, fwInt, H - 2 * pad, dati, livello0);
    // nella zona che avvolge il tubo: il nome, se c'è spazio
    if(giro > 6){
      const t = [par([{ t: dati.nome || "", b: true }], 1, { al: "c" })];
      const f = corpoMassimo(t, giro - 2, H - 2 * pad, 1, 3);
      if(f){ const im = impagina(t, giro - 2, f); corpo += svgRighe(im.righe, fw + 1, (H - im.h) / 2, giro - 2); }
    }
    extra += lineaPiega(fw, H) + lineaPiega(fw + giro, H);
  } else if(o.layout === "avvolgente"){
    // fronte (nome + pittogrammi + avvertenza) e retro (frasi e dati); zona di sovrapposizione a destra
    const sovr = Math.min(4, W * 0.08);
    const utile = W - sovr;
    info.sovrapposizione = sovr;
    const fronte = livello0 >= 7 ? utile : utile * 0.5;
    const retro = utile - fronte;
    const dFronte = Object.assign({}, dati, { H: [], P: [], meta: [], qr: null, cas: "", conc: "", contiene: "" });
    corpo += pannello(pad, pad, fronte - 1.5 * pad, H - 2 * pad, dFronte, Math.max(livello0, 0));
    if(retro - 2 * pad > 6 && livello0 < 7){
      const dRetro = Object.assign({}, dati, { picto: [], avv: "" });
      corpo += pannello(fronte + 0.5 * pad, pad, retro - 1.5 * pad, H - 2 * pad, dRetro, livello0);
      extra += '<line x1="' + r2(fronte) + '" x2="' + r2(fronte) + '" y1="' + r2(pad) + '" y2="' + r2(H - pad) + '" stroke="#999" stroke-width="0.15" stroke-dasharray="0.8 0.8"/>';
    }
    extra += '<rect x="' + r2(utile) + '" y="0" width="' + r2(sovr) + '" height="' + r2(H) + '" fill="url(#TRATT)"/>';
  } else {
    corpo += pannello(pad, pad, W - 2 * pad, H - 2 * pad, dati, livello0);
  }

  // riepilogo: corpo minimo usato, lato minimo pittogrammi, livello peggiore
  const conPicto = pannelli.filter(p => p.lato > 0);
  info.font = Math.min(...pannelli.map(p => p.font || 99));
  if(info.font === 99) info.font = 0;
  info.fontPt = info.font / PT;
  info.xHeight = info.font * X_HEIGHT;
  info.latoPitto = conPicto.length ? Math.min(...conPicto.map(p => p.lato)) : 0;
  info.livello = pannelli.reduce((a, p) => p.livello && p.livello.id > a.id ? p.livello : a, LIVELLI[0]);
  info.troncato = pannelli.some(p => p.troncato);
  info.pad = pad;

  const uid = "e" + (++_idEtichetta);
  const defs = '<defs><pattern id="tratt' + uid + '" width="1.2" height="1.2" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="1.2" height="1.2" fill="#fff"/><line x1="0" y1="0" x2="0" y2="1.2" stroke="#bbb" stroke-width="0.4"/></pattern>' +
    '<clipPath id="clip' + uid + '"><rect width="' + r2(W) + '" height="' + r2(H) + '"/></clipPath></defs>';
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" class="etichetta-svg" width="' + r2(W) + 'mm" height="' + r2(H) + 'mm" viewBox="0 0 ' + r2(W) + " " + r2(H) + '" font-family="' + FONT_ET.replace(/"/g, "'") + '">' +
    defs + '<g clip-path="url(#clip' + uid + ')"><rect width="' + r2(W) + '" height="' + r2(H) + '" fill="#fff"/>' + extra.replace(/TRATT/g, "tratt" + uid) + '<g class="et-corpo">' + corpo + "</g></g>" +
    (o.bordo ? '<rect x="0.1" y="0.1" width="' + r2(W - 0.2) + '" height="' + r2(H - 0.2) + '" fill="none" stroke="#9a9a9a" stroke-width="0.2" stroke-dasharray="1 0.8" class="et-bordo"/>' : "") +
    "</svg>";
  return { svg, info };
}
function lineaPiega(x, H){
  return '<line x1="' + r2(x) + '" x2="' + r2(x) + '" y1="0" y2="' + r2(H) + '" stroke="#888" stroke-width="0.2" stroke-dasharray="1.2 0.8" class="et-piega"/>';
}
