// Stampa su fogli A4, coda, esportazione PDF/PNG, QR, ricerca e recenti.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const jsQR = require("jsqr");
const { apri } = require("./helpers");

let ctx;
before(async () => { ctx = await apri(); });
after(async () => { await ctx.browser.close(); });

async function prepara(page){
  await page.evaluate(() => {
    nuovaEtichetta();
    applicaPreset(PRESETS.find(p => p.nome === "Acetone"));
    selezionaContenitore("vial20");
    vaiStep(4);
    render();
  });
}

test("foglio a griglia: 30 copie su fogli da 24 → 2 pagine, partenza dalla posizione 5", async () => {
  const { page } = ctx;
  await prepara(page);
  const r = await page.evaluate(() => {
    document.getElementById("inFoglio").value = "a4x24"; aggiornaCampiFoglio();
    document.getElementById("inCopie").value = 30;
    document.getElementById("inInizio").value = 5;
    const c = composizionePagine(vociDaStampare());
    return { pagine: c.pagine.map(p => p.pezzi.length), primo: c.pagine[0].pezzi[0], totale: c.totale };
  });
  assert.deepEqual(r.pagine, [20, 10]);
  assert.equal(r.totale, 30);
  // posizione 5 su un foglio 3×8 da 70×37: riga 2 (indice 1), colonna 2 (indice 1)
  assert.ok(Math.abs(r.primo.x - 70) < 0.01 && Math.abs(r.primo.y - (0.5 + 37)) < 0.01, JSON.stringify(r.primo));
});

test("foglio a griglia: l'etichetta si reimpagina alla misura della cella senza uscire", async () => {
  const { page } = ctx;
  const ok = await page.evaluate(() => {
    document.getElementById("inFoglio").value = "a4x65"; aggiornaCampiFoglio();
    document.getElementById("inCopie").value = 3; document.getElementById("inInizio").value = 1;
    const c = composizionePagine(vociDaStampare());
    const d = document.createElement("div"); d.id = "provaFoglio"; d.innerHTML = svgPagina(c.pagine[0].pezzi); document.body.appendChild(d);
    const etich = d.querySelectorAll("svg.pagina-svg > svg");
    return { n: etich.length, w: etich[0].getAttribute("width"), h: etich[0].getAttribute("height") };
  });
  assert.equal(ok.n, 3);
  assert.equal(+ok.w, 38.1); assert.equal(+ok.h, 21.2);
});

test("ritaglio libero: tutte le etichette dentro la pagina e senza sovrapposizioni", async () => {
  const { page } = ctx;
  const r = await page.evaluate(() => {
    document.getElementById("inFoglio").value = "libero"; aggiornaCampiFoglio();
    document.getElementById("inCopie").value = 25;
    const c = composizionePagine(vociDaStampare());
    const w = ultimo.o.w, h = ultimo.o.h;
    let errori = 0;
    c.pagine.forEach(p => {
      p.pezzi.forEach((a, i) => {
        if(a.x < 0 || a.y < 0 || a.x + w > 210 + 0.01 || a.y + h > 297 + 0.01) errori++;
        p.pezzi.slice(i + 1).forEach(b => { if(a.x < b.x + w - 0.01 && b.x < a.x + w - 0.01 && a.y < b.y + h - 0.01 && b.y < a.y + h - 0.01) errori++; });
      });
    });
    return { errori, pagine: c.pagine.length, totale: c.totale };
  });
  assert.equal(r.errori, 0);
  assert.equal(r.totale, 25);
});

test("coda di stampa: etichette diverse sullo stesso foglio + stampa", async () => {
  const { page } = ctx;
  await page.evaluate(() => {
    document.getElementById("inFoglio").value = "a4x21"; aggiornaCampiFoglio();
    window.__stampato = 0; window.print = () => { window.__stampato++; };
    document.getElementById("inCopie").value = 2;
    aggiungiCoda();
    applicaPreset(PRESETS.find(p => p.nome === "Metanolo"));
    document.getElementById("inCopie").value = 3;
  });
  const r = await page.evaluate(() => { stampa(); return { coda: CODA.length, stampato: window.__stampato, pagine: document.querySelectorAll("#printArea svg.pagina-svg").length, etich: document.querySelectorAll("#printArea svg.pagina-svg > svg").length }; });
  assert.equal(r.coda, 1);
  assert.equal(r.stampato, 1);
  assert.equal(r.pagine, 1);
  assert.equal(r.etich, 5);
  // in stampa si vede solo l'area di stampa, a misura A4
  await page.emulateMedia({ media: "print" });
  const vis = await page.evaluate(() => ({ main: getComputedStyle(document.querySelector(".pagina")).display, area: getComputedStyle(document.getElementById("printArea")).display,
    w: document.querySelector("#printArea svg").getBoundingClientRect().width }));
  await page.emulateMedia({ media: "screen" });
  assert.equal(vis.main, "none");
  assert.equal(vis.area, "block");
  assert.ok(Math.abs(vis.w - 210 / 25.4 * 96) < 2, "larghezza pagina " + vis.w);
  await page.evaluate(() => { CODA = []; aggiornaCoda(); });
});

test("esportazione PDF (dimensione reale) e PNG 600 dpi con pHYs", async () => {
  const { page } = ctx;
  await prepara(page);
  const [dl] = await Promise.all([page.waitForEvent("download"), page.click("#btnPdf")]);
  const pdf = fs.readFileSync(await dl.path());
  assert.equal(pdf.subarray(0, 5).toString(), "%PDF-");
  const testo = pdf.toString("latin1");
  const mb = testo.match(/\/MediaBox \[0 0 ([\d.]+) ([\d.]+)\]/);
  const w = await page.evaluate(() => ultimo.o.w), h = await page.evaluate(() => ultimo.o.h);
  assert.ok(Math.abs(+mb[1] - w / 25.4 * 72) < 0.01 && Math.abs(+mb[2] - h / 25.4 * 72) < 0.01);
  assert.match(testo, /\/FlateDecode/);
  assert.match(testo, /%%EOF\s*$/);

  const [dl2] = await Promise.all([page.waitForEvent("download"), page.click("#btnPng")]);
  const png = fs.readFileSync(await dl2.path());
  assert.equal(png.subarray(1, 4).toString(), "PNG");
  const iPhys = png.indexOf(Buffer.from("pHYs"));
  assert.ok(iPhys > 0);
  assert.equal(png.readUInt32BE(iPhys + 4), Math.round(600 / 0.0254));
  const largPx = png.readUInt32BE(16);
  assert.equal(largPx, Math.round(w / 25.4 * 600));
});

test("PDF del foglio A4: una pagina per foglio", async () => {
  const { page } = ctx;
  await page.evaluate(() => { document.getElementById("inFoglio").value = "a4x24"; aggiornaCampiFoglio(); document.getElementById("inCopie").value = 30; document.getElementById("inInizio").value = 1; });
  const [dl] = await Promise.all([page.waitForEvent("download"), page.click("#btnPdfFoglio")]);
  const testo = fs.readFileSync(await dl.path()).toString("latin1");
  assert.match(testo, /\/Count 2/);
  assert.match(testo, /\/MediaBox \[0 0 595\.276 841\.890\]/);
});

test("il QR code generato si legge correttamente", async () => {
  const { page } = ctx;
  const atteso = "CAS 67-64-1";
  const dati = await page.evaluate(async (t) => {
    const M = qrMatrix(t);
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="30mm" height="30mm" viewBox="0 0 30 30">' + svgQR(M, 0, 0, 30) + "</svg>";
    const c = await svgSuCanvas(svg, 30, 30, 300);
    const d = c.getContext("2d").getImageData(0, 0, c.width, c.height);
    return { w: c.width, h: c.height, px: Array.from(d.data) };
  }, atteso);
  const res = jsQR(Uint8ClampedArray.from(dati.px), dati.w, dati.h);
  assert.ok(res, "QR non leggibile");
  assert.equal(res.data, atteso);
});

test("ricerca per formula nell'archivio locale (senza rete)", async () => {
  const { page } = ctx;
  await page.evaluate(() => vaiStep(1));
  await page.fill("#cercaGlobale", "H2SO4");
  await page.waitForTimeout(100);
  const t = await page.locator("#presetList").innerText();
  assert.match(t, /Acido solforico/);
  await page.fill("#cercaGlobale", "7664-93");
  assert.match(await page.locator("#presetList").innerText(), /Acido solforico/);
});

test("etichette recenti: salvate sul dispositivo e ricaricate con il contenitore", async () => {
  const { page } = ctx;
  const r = await page.evaluate(() => {
    localStorage.clear();
    nuovaEtichetta();
    applicaPreset(PRESETS.find(p => p.nome === "Toluene"));
    selezionaContenitore("fal50");
    salvaRecente();
    nuovaEtichetta();
    selezionaContenitore("fl1000");
    caricaRecente(0);
    return { nome: document.getElementById("inNome").value, cont: stato.contId, picto: [...stato.pictoSel].length, n: leggiRecenti().length };
  });
  assert.deepEqual(r, { nome: "Toluene", cont: "fal50", picto: 3, n: 1 });
});

test("anteprima dal vivo già allo step 1", async () => {
  const { page } = ctx;
  await page.evaluate(() => { nuovaEtichetta(); });
  await page.fill("#inNome", "Soluzione di prova XYZ");
  await page.waitForTimeout(80);
  const t = await page.evaluate(() => [...document.querySelectorAll("#anteprimaWrap svg text")].map(e => e.textContent).join(" "));
  assert.match(t, /Soluzione di prova XYZ/);
  assert.ok(await page.locator("#step1").isVisible());
  assert.ok(await page.locator("#anteprimaWrap svg").isVisible());
});
