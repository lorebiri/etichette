// Calcolo delle dimensioni minime (CLP All. I, tab. 1.3) e avvisi non bloccanti.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { apri } = require("./helpers");

let ctx;
before(async () => { ctx = await apri(); });
after(async () => { await ctx.browser.close(); });

test("dimensioni minime di etichetta e pittogrammi per capacità", async () => {
  const r = await ctx.page.evaluate(() => [0.002, 1, 3, 3.1, 50, 51, 500, 501].map(l => ({
    l, classe: classeCLP(l), et: CLASSI_CLP[classeCLP(l)].et, pitto: pittoMinimo(l), xh: xHeightMin2028(l) })));
  const per = l => r.find(x => x.l === l);
  assert.deepEqual(per(0.002).et, [74, 52]);
  assert.deepEqual(per(0.002).pitto, { consigliato: 16, assoluto: 10 });
  assert.equal(per(3).classe, 0);
  assert.deepEqual(per(3.1).et, [105, 74]);
  assert.equal(per(3.1).pitto.assoluto, 23);
  assert.equal(per(50).pitto.consigliato, 23);
  assert.deepEqual(per(51).et, [148, 105]);
  assert.equal(per(500).pitto.assoluto, 32);
  assert.deepEqual(per(501).et, [210, 148]);
  assert.equal(per(501).pitto.assoluto, 46);
  assert.equal(per(0.002).xh, 1.2);
  assert.equal(per(1).xh, 1.4);
  assert.equal(per(50).xh, 1.8);
  assert.equal(per(501).xh, 2.0);
});

test("1/15 dell'area minima: il lato consigliato è coerente", async () => {
  // 52×74/15 → 16 mm; 74×105/15 → 22,8 mm (tabella: 23)
  assert.ok(Math.abs(Math.sqrt(52 * 74 / 15) - 16) < 0.1);
  assert.ok(Math.abs(Math.sqrt(74 * 105 / 15) - 23) < 0.3);
  const k = await ctx.page.evaluate(() => [romboDaRiquadro(riquadroDaRombo(16)), riquadroDaRombo(10)]);
  assert.ok(Math.abs(k[0] - 16) < 1e-9);
  assert.ok(Math.abs(k[1] - 14.142) < 0.01);
});

test("conversione capacità", async () => {
  const r = await ctx.page.evaluate(() => [capacitaInLitri(500, "ml"), capacitaInLitri(2, "l"), capacitaInLitri(25, "kg"), capacitaInLitri(100, "g")]);
  assert.deepEqual(r, [0.5, 2, 25, 0.1]);
});

test("pittogrammi rimpiccioliti sotto il minimo → avviso chiaro che spiega quando è ammesso", async () => {
  const { page } = ctx;
  const avvisi = await page.evaluate(() => {
    applicaPreset(PRESETS.find(p => p.nome === "Acetone"));
    selezionaContenitore("fl500");
    document.getElementById("ckPittoAuto").checked = false;
    document.getElementById("inPitto").value = 6;
    render();
    return { aside: document.getElementById("avvisiRegole").innerText, step4: document.getElementById("avvisiEtichetta").innerText };
  });
  assert.match(avvisi.aside, /Pittogrammi di 6 mm/);
  assert.match(avvisi.aside, /non meno di 10 mm/);
  assert.match(avvisi.step4, /Quando è ammesso/);
});

test("uso «fornitura ad altri» con pittogrammi troppo piccoli → avviso (non blocca)", async () => {
  const { page } = ctx;
  const r = await page.evaluate(() => {
    document.getElementById("inUso").value = "fornitura";
    document.getElementById("ckPittoAuto").checked = false;
    document.getElementById("inPitto").value = 6;
    render();
    const n = [...document.querySelectorAll("#avvisiRegole .nota-regola.avviso")].map(e => e.innerText).join("\n");
    document.getElementById("inUso").value = "interno";
    document.getElementById("ckPittoAuto").checked = true;
    render();
    return { n, svg: !!document.querySelector("#anteprimaWrap svg .et-picto") };
  });
  assert.match(r.n, /Pittogrammi di 6 mm/);
  assert.ok(r.svg, "l'etichetta viene comunque generata");
});

test("modalità «solo pittogrammi + nome» → avviso con le condizioni di ammissibilità", async () => {
  const t = await ctx.page.evaluate(() => {
    selezionaContenitore("epp15");
    document.querySelector("input[name=contenuto][value=minima]").checked = true;
    render();
    const s = document.getElementById("avvisiRegole").innerText;
    document.querySelector("input[name=contenuto][value=auto]").checked = true;
    render();
    return s;
  });
  assert.match(t, /solo pittogrammi \+ nome/i);
  assert.match(t, /imballaggio esterno/);
});

test("valutaRegole: tutto in regola su un flacone da 1 L con etichetta 52×74", async () => {
  const r = await ctx.page.evaluate(() => valutaRegole({ litri: 1, uso: "interno", w: 74, h: 52, layout: "piana",
    info: { latoPitto: riquadroDaRombo(17), font: 2.5, fontPt: 7, xHeight: 1.5, livello: LIVELLI[0], troncato: false },
    contenuto: "auto", nPicto: 2, picto: ["GHS02", "GHS07"], H: ["H225"] }));
  assert.equal(r.length, 1);
  assert.equal(r[0].tipo, "ok");
});
