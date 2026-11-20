// Adattamento del layout: per ogni contenitore e formato proposto, nessun testo fuori dai bordi
// e nessuna sovrapposizione tra testo e pittogrammi.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { apri, verificaEtichetta } = require("./helpers");

let ctx;
before(async () => { ctx = await apri(); });
after(async () => { await ctx.browser.close(); });

/* sostanza "pesante": nome lungo, 4 pittogrammi, molte frasi */
async function caricaSostanzaPesante(page, nome){
  await page.evaluate((nome) => {
    const p = PRESETS.find(x => x.nome === "n-Esano");
    applicaPreset(p);
    document.getElementById("inNome").value = nome || p.nome;
    document.getElementById("inLab").value = "Lab 12 — Chimica Organica";
    document.getElementById("inOperatore").value = "M. Rossi";
    document.getElementById("inLotto").value = "LB-2026-014";
    document.getElementById("ckQR").checked = true;
    render();
  }, nome);
}

test("nessun errore JavaScript all'avvio", () => {
  assert.deepEqual(ctx.errori, []);
});

test("ogni contenitore × ogni formato proposto × ogni contenuto: tutto dentro i bordi", async () => {
  const { page } = ctx;
  await caricaSostanzaPesante(page, "Formaldeide soluzione acquosa stabilizzata con metanolo (formalina)");
  const ids = await page.evaluate(() => CONTENITORI.map(c => c.id));
  let casi = 0;
  const problemi = [];
  for(const id of ids){
    const nFormati = await page.evaluate((id) => { selezionaContenitore(id); return proposteFormato().filter(p => !p.pers).length; }, id);
    for(let f = 0; f < nFormati; f++){
      for(const contenuto of ["auto", "ridotta", "minima"]){
        await page.evaluate(([f, contenuto]) => {
          applicaFormato(f);
          document.querySelector("input[name=contenuto][value=" + contenuto + "]").checked = true;
          render();
        }, [f, contenuto]);
        const r = await verificaEtichetta(page, "#anteprimaWrap svg");
        casi++;
        if(r.fuori.length || r.sovrapp.length || r.maxScarto > 0.3 || !r.nPicto || r.nPicto % 4)
          problemi.push({ id, f, contenuto, w: r.w, h: r.h, fuori: r.fuori.slice(0, 2), sovrapp: r.sovrapp.slice(0, 2), scarto: r.maxScarto, nPicto: r.nPicto });
      }
    }
  }
  assert.ok(casi > 100, "casi provati: " + casi);
  assert.deepEqual(problemi, [], JSON.stringify(problemi, null, 1));
});

test("misure estreme e pittogrammi impostati a mano: il testo non esce mai", async () => {
  const { page } = ctx;
  await caricaSostanzaPesante(page);
  const misure = [[10, 6], [15, 10], [30, 8], [8, 40], [74, 52], [52, 74], [210, 297], [297, 105], [40, 12]];
  const problemi = [];
  for(const [w, h] of misure){
    for(const pitto of [0, 4, 12, 40]){
      for(const layout of ["auto", "orizzontale", "verticale", "avvolgente"]){
        await page.evaluate(([w, h, pitto, layout]) => {
          document.getElementById("inLayout").value = layout;
          document.getElementById("inW").value = w; document.getElementById("inH").value = h;
          document.getElementById("inDiam").value = Math.max(3, w / Math.PI - 1);
          document.getElementById("ckPittoAuto").checked = !pitto;
          if(pitto) document.getElementById("inPitto").value = pitto;
          document.querySelector("input[name=contenuto][value=auto]").checked = true;
          render();
        }, [w, h, pitto, layout]);
        const r = await verificaEtichetta(page, "#anteprimaWrap svg");
        if(r.fuori.length || r.sovrapp.length) problemi.push({ w, h, pitto, layout, fuori: r.fuori.slice(0, 2), sovrapp: r.sovrapp.slice(0, 1) });
      }
    }
  }
  assert.deepEqual(problemi, [], JSON.stringify(problemi, null, 1));
});

test("etichetta a bandiera: due bandiere identiche e linee di piega", async () => {
  const { page } = ctx;
  await caricaSostanzaPesante(page);
  const info = await page.evaluate(() => {
    selezionaContenitore("sir1");
    render();
    const svg = document.querySelector("#anteprimaWrap svg");
    return { layout: ultimo.info.layout, pieghe: svg.querySelectorAll(".et-piega").length, pannelli: ultimo.info.pannelli.length,
             picto: svg.querySelectorAll(".et-picto").length };
  });
  assert.equal(info.layout, "bandiera");
  assert.equal(info.pieghe, 2);
  assert.equal(info.pannelli, 2);
  assert.equal(info.picto, 8);   // 4 pittogrammi per ciascuna bandiera
  const r = await verificaEtichetta(page, "#anteprimaWrap svg");
  assert.deepEqual(r.fuori, []);
});

test("contenitore grande: l'etichetta CLP completa resta completa", async () => {
  const { page } = ctx;
  await caricaSostanzaPesante(page);
  const info = await page.evaluate(() => {
    selezionaContenitore("fl1000");
    document.querySelector("input[name=contenuto][value=auto]").checked = true;
    document.getElementById("ckPittoAuto").checked = true;
    render();
    return { livello: ultimo.info.livello.id, w: ultimo.o.w, h: ultimo.o.h, rombo: romboDaRiquadro(ultimo.info.latoPitto) };
  });
  assert.equal(info.w, 74); assert.equal(info.h, 52);
  assert.ok(info.livello <= 1, "livello di riduzione " + info.livello);
  assert.ok(info.rombo >= 10, "rombo " + info.rombo);
});

test("solo pittogrammi + nome: niente frasi H/P sull'etichetta", async () => {
  const { page } = ctx;
  await caricaSostanzaPesante(page);
  const testi = await page.evaluate(() => {
    selezionaContenitore("epp15");
    document.querySelector("input[name=contenuto][value=minima]").checked = true;
    render();
    return [...document.querySelectorAll("#anteprimaWrap svg .et-corpo text")].map(t => t.textContent).join(" ");
  });
  assert.doesNotMatch(testi, /H\d{3}|P\d{3}|PERICOLO/);
  assert.match(testi, /Esano/);
});
