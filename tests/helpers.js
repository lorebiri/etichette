// Utilità condivise dai test: apre index.html in Chromium senza rete esterna.
const path = require("node:path");
const { chromium } = require("playwright");

const URL_APP = "file://" + path.resolve(__dirname, "..", "index.html");

async function apri(opz = {}){
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: opz.viewport || { width: 1400, height: 950 }, acceptDownloads: true });
  const page = await context.newPage();
  const errori = [];
  page.on("pageerror", e => errori.push(e.message));
  await page.route(/^https?:\/\//, r => r.abort());   // nessuna chiamata esterna nei test
  await page.goto(URL_APP);
  await page.waitForFunction(() => typeof generaEtichetta === "function" && document.querySelector("#anteprimaWrap svg"));
  return { browser, context, page, errori };
}

/* controlla nel browser che nessun elemento esca dai bordi e che testi e pittogrammi non si sovrappongano */
async function verificaEtichetta(page, svgSelector){
  return page.evaluate((sel) => {
    const svg = document.querySelector(sel);
    const vb = svg.viewBox.baseVal;
    const R = svg.getBoundingClientRect();
    const k = vb.width / R.width;     // mm per px
    const box = el => { const b = el.getBoundingClientRect(); return { x: (b.left - R.left) * k, y: (b.top - R.top) * k, w: b.width * k, h: b.height * k }; };
    const fuori = [], sovrapp = [];
    const tol = 0.15;
    const testi = [...svg.querySelectorAll(".et-corpo text")].filter(t => t.textContent.trim());
    const picto = [...svg.querySelectorAll(".et-corpo .et-picto")];
    const qr = [...svg.querySelectorAll(".et-corpo .et-qr")];
    const tutti = testi.map(e => ["testo", e]).concat(picto.map(e => ["picto", e]), qr.map(e => ["qr", e]));
    tutti.forEach(([tipo, e]) => {
      const b = box(e);
      if(b.x < -tol || b.y < -tol || b.x + b.w > vb.width + tol || b.y + b.h > vb.height + tol)
        fuori.push({ tipo, testo: e.textContent.slice(0, 40), b });
    });
    // larghezza misurata vs reale: il testo non deve essere più largo di quanto previsto dal motore
    const scarti = testi.map(t => { const real = t.getComputedTextLength(); const prev = parseFloat(t.getAttribute("data-w")); return real - prev; });
    // sovrapposizioni testo ↔ pittogramma (il rombo è inscritto: si usa un margine)
    const inter = (a, b, m) => a.x + m < b.x + b.w && b.x + m < a.x + a.w && a.y + m < b.y + b.h && b.y + m < a.y + a.h;
    testi.forEach(t => { const bt = box(t); picto.concat(qr).forEach(p => { const bp = box(p); if(inter(bt, bp, 0.3)) sovrapp.push({ testo: t.textContent.slice(0, 30), bt, bp }); }); });
    for(let i = 0; i < picto.length; i++) for(let j = i + 1; j < picto.length; j++)
      if(inter(box(picto[i]), box(picto[j]), 0.2)) sovrapp.push({ testo: "picto-picto" });
    return { fuori, sovrapp, maxScarto: Math.max(0, ...scarti), nTesti: testi.length, nPicto: picto.length, w: vb.width, h: vb.height };
  }, svgSelector);
}

module.exports = { apri, verificaEtichetta, URL_APP };
