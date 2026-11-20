"use strict";
/* ============================================================
   APPLICAZIONE: interfaccia, ricerca, stato, anteprima dal vivo, stampa
   ============================================================ */
const $ = id => document.getElementById(id);
const val = id => ($(id) ? $(id).value.trim() : "");
function esc(s){ return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

const stato = {
  pictoSel: new Set(), hSel: new Set(), pSel: new Set(),
  cid: null,          // CID PubChem dell'ultima sostanza importata
  componenti: [],     // miscela: {nome, cas, perc, avv, picto[], h[]}
  contId: "fl1000",
  gruppo: "tutti",
  zoom: "adatta"
};
let stepCorrente = 1;
let ultimo = null;    // ultima etichetta generata {svg, info, d, o}

/* formule delle sostanze dell'archivio locale (per la ricerca per formula) */
const FORMULE = {
  "67-64-1":["C3H6O","CH3COCH3"], "64-17-5":["C2H6O","C2H5OH"], "67-56-1":["CH4O","CH3OH"], "67-63-0":["C3H8O"],
  "7647-01-0":["HCl"], "7664-93-9":["H2SO4"], "7697-37-2":["HNO3"], "64-19-7":["C2H4O2","CH3COOH"], "1310-73-2":["NaOH"],
  "1336-21-6":["NH4OH","NH3"], "7722-84-1":["H2O2"], "7681-52-9":["NaClO","NaOCl"], "108-88-3":["C7H8"], "75-09-2":["CH2Cl2"],
  "67-66-3":["CHCl3"], "75-05-8":["C2H3N","CH3CN"], "60-29-7":["C4H10O"], "110-54-3":["C6H14"], "50-00-0":["CH2O","HCHO"],
  "67-68-5":["C2H6OS"], "7732-18-5":["H2O"], "7727-37-9":["N2"]
};
const normFormula = f => f.replace(/[\s·.()]/g, "").toUpperCase();
const sembraFormula = q => /^(?:[A-Z][a-z]?\d*){2,}$/.test(q.replace(/\s/g, ""));

/* ============================================================
   RICERCA: archivio locale + PubChem (nome, CAS, formula)
   ============================================================ */
const PUBCHEM = "https://pubchem.ncbi.nlm.nih.gov/rest";
let timerRicerca = null;

function setStato(msg, err, spinner){
  const d = $("statoRicerca");
  d.className = "stato-ricerca" + (err ? " err" : "");
  d.innerHTML = (spinner ? '<span class="spinner" aria-hidden="true"></span>' : "") + (msg || "");
}

function costruisciPreset(filtro){
  const box = $("presetList");
  const f = (filtro || "").trim().toLowerCase();
  const fF = normFormula(filtro || "");
  box.innerHTML = "";
  if(!f){ return box; }
  PRESETS.filter(p => p.nome.toLowerCase().includes(f) || p.cas.includes(f) ||
      (FORMULE[p.cas] || []).some(x => normFormula(x) === fF || (fF.length >= 3 && normFormula(x).startsWith(fF))))
    .forEach(p => aggiungiRiga(box, "<b>" + esc(p.nome) + "</b> <span class='cas'>CAS " + p.cas +
      (FORMULE[p.cas] ? " · " + esc(FORMULE[p.cas][0]) : "") + " · " + esc(p.conc) + "</span>", "loc", "archivio locale", () => applicaPreset(p)));
  return box;
}
function aggiungiRiga(box, html, badgeCls, badgeTxt, onclick){
  const d = document.createElement("div");
  d.setAttribute("role", "option");
  d.tabIndex = 0;
  d.innerHTML = "<span>" + html + "</span><span class='badge " + badgeCls + "'>" + badgeTxt + "</span>";
  d.onclick = onclick;
  d.onkeydown = e => { if(e.key === "Enter" || e.key === " "){ e.preventDefault(); onclick(); } };
  box.appendChild(d);
}

function cercaTutto(query){
  const box = costruisciPreset(query);
  const q = query.trim();
  if(q.length < 2){ setStato(""); return; }
  if(/^\d{2,7}-\d{2}-\d$/.test(q)){
    aggiungiRiga(box, "Cerca CAS <b>" + esc(q) + "</b> nel database globale", "pub", "PubChem", () => importaDaPubChem(q));
    setStato(box.children.length > 1 ? "" : "Premi Invio o scegli la riga per cercare il CAS nel database globale.");
    return;
  }
  if(q.length < 3 && !sembraFormula(q)){ setStato("Continua a digitare… (almeno 3 caratteri per il database globale)"); return; }
  clearTimeout(timerRicerca);
  timerRicerca = setTimeout(async () => {
    try{
      if(sembraFormula(q)){
        setStato("Cerco la formula «" + esc(q) + "» nel database globale…", false, true);
        const r = await fetch(PUBCHEM + "/pug/compound/fastformula/" + encodeURIComponent(q.replace(/\s/g, "")) + "/cids/JSON?MaxRecords=8");
        const cids = r.ok ? ((await r.json()).IdentifierList || {}).CID || [] : [];
        if($("cercaGlobale").value.trim() !== q) return;
        if(cids.length){
          const rp = await fetch(PUBCHEM + "/pug/compound/cid/" + cids.slice(0, 8).join(",") + "/property/Title,MolecularFormula/JSON");
          const props = rp.ok ? (await rp.json()).PropertyTable.Properties : [];
          props.forEach(p => aggiungiRiga(box, esc(p.Title || ("CID " + p.CID)) + " <span class='cas'>" + esc(p.MolecularFormula || "") + "</span>", "pub", "PubChem", () => importaDaPubChem({ cid: p.CID })));
        }
        setStato(cids.length ? "Seleziona una voce: la classificazione GHS verrà importata automaticamente." : "Nessuna sostanza trovata con questa formula.");
        if(cids.length) return;
      }
      const trad = traduci(q);
      const qPub = trad || q;
      setStato(trad ? "Cerco nel database globale come «" + esc(trad) + "»…" : "Cerco nel database globale…", false, true);
      const r = await fetch(PUBCHEM + "/autocomplete/compound/" + encodeURIComponent(qPub) + "/json?limit=8");
      const j = await r.json();
      const voci = (j.dictionary_terms && j.dictionary_terms.compound) || [];
      if($("cercaGlobale").value.trim() !== q) return;
      voci.forEach(v => aggiungiRiga(box, esc(v), "pub", "PubChem", () => importaDaPubChem(v)));
      setStato(voci.length ? "Seleziona una voce: la classificazione GHS verrà importata automaticamente."
        : "Nessun risultato nel database globale (prova con il nome inglese o il CAS). Premi Invio per cercare comunque «" + esc(q) + "».");
    }catch(e){
      setStato("Database globale non raggiungibile (sei offline?). L'archivio locale resta disponibile.", true);
    }
  }, 350);
}

/* Gerarchia di severità delle frasi H: la chiave "copre" i codici elencati */
const COPRE_H = { "H314":["H315","H316","H318","H319","H320"], "H318":["H319","H320"],
  "H300":["H301","H302","H303"], "H301":["H302","H303"], "H310":["H311","H312","H313"], "H311":["H312","H313"],
  "H330":["H331","H332","H333"], "H331":["H332","H333"], "H350":["H351"], "H340":["H341"], "H360":["H361"],
  "H370":["H371"], "H372":["H373"], "H410":["H400","H401","H402","H411","H412","H413"],
  "H411":["H412","H413","H402"], "H400":["H401"] };
function filtraRidondanzeH(hSet){
  const coperte = new Set();
  hSet.forEach(sel => sel.split("+").forEach(s => {
    const base = s.replace(/[a-z]+$/i, "").slice(0, 4);
    (COPRE_H[base] || COPRE_H[s] || []).forEach(c => coperte.add(c));
  }));
  return new Set([...hSet].filter(c => !coperte.has(c)));
}
function raccogliInfo(sez, out){
  (sez.Information || []).forEach(i => out.push(i));
  (sez.Section || []).forEach(s => raccogliInfo(s, out));
  return out;
}
function stringheDi(info){ return ((info.Value || {}).StringWithMarkup || []).map(s => s.String || ""); }

async function importaDaPubChem(arg){
  let nome = typeof arg === "object" ? "" : arg;
  try{
    setStato("Recupero la classificazione GHS di «" + esc(nome || ("CID " + arg.cid)) + "» dal database globale…", false, true);
    let cid;
    if(typeof arg === "object") cid = arg.cid;
    else {
      const rc = await fetch(PUBCHEM + "/pug/compound/name/" + encodeURIComponent(nome) + "/cids/JSON");
      if(!rc.ok) throw new Error("notfound");
      cid = (await rc.json()).IdentifierList.CID[0];
    }
    stato.cid = cid;
    const [rg, rcas, rtit] = await Promise.all([
      fetch(PUBCHEM + "/pug_view/data/compound/" + cid + "/JSON?heading=GHS+Classification"),
      fetch(PUBCHEM + "/pug/compound/cid/" + cid + "/synonyms/JSON").catch(() => null),
      fetch(PUBCHEM + "/pug/compound/cid/" + cid + "/property/Title/JSON").catch(() => null)
    ]);
    let titolo = "";
    if(rtit && rtit.ok){ try{ titolo = (await rtit.json()).PropertyTable.Properties[0].Title || ""; }catch(e){} }
    if(titolo) nome = titolo;
    // CAS
    let cas = "";
    if(rcas && rcas.ok){
      try{
        const sin = (await rcas.json()).InformationList.Information[0].Synonym || [];
        cas = sin.find(x => /^\d{2,7}-\d{2}-\d$/.test(x)) || "";
      }catch(e){}
    }
    const nomeLeggibile = () => {
      let nb = nome === nome.toUpperCase() ? nome.charAt(0) + nome.slice(1).toLowerCase() : nome;
      nb = nb.charAt(0).toUpperCase() + nb.slice(1);
      const loc = cas && PRESETS.find(p => p.cas === cas);
      if(loc) nb = (loc.nome.toLowerCase().startsWith(nb.toLowerCase()) || loc.nome.includes("(")) ? loc.nome : loc.nome + " (" + nb + ")";
      return nb;
    };
    if(!rg.ok){
      $("inNome").value = nomeLeggibile();
      if(cas) $("inCas").value = cas;
      setStato("«" + esc(nome) + "» trovata nel database globale (CID " + cid + ") ma <b>senza classificazione GHS registrata</b>: probabilmente non è classificata come pericolosa. Verifica comunque sulla SDS; puoi proseguire e selezionare manualmente eventuali pericoli.");
      aggiornaBtnComp(); pianificaRender();
      return;
    }
    const record = (await rg.json()).Record;
    let info = raccogliInfo(record, []);
    const riferimenti = record.Reference || [];
    let fonte = "tutte le fonti aggregate";
    const cerca = (re) => riferimenti.filter(r => re.test(r.SourceName || "")).map(r => r.ReferenceNumber);
    let scelti = cerca(/1272\/2008/);
    if(scelti.length) fonte = "classificazione armonizzata UE — Reg. (CE) 1272/2008 (CLP)";
    else { scelti = cerca(/European Chemicals|ECHA/i); if(scelti.length) fonte = "ECHA — notifiche C&L"; }
    const infoTutte = info;
    if(scelti.length){
      const set = new Set(scelti);
      const filtrata = info.filter(i => set.has(i.ReferenceNumber));
      if(filtrata.length) info = filtrata;
    }
    const refEcha = new Set(cerca(/European Chemicals|ECHA/i));
    const estraiH = (lista) => {
      const s = new Set();
      lista.filter(i => /Hazard Statements/.test(i.Name || "")).forEach(i => stringheDi(i).forEach(t => {
        const m = t.match(/^((?:EU)?H\d{3}[A-Za-z]*(?:\+H\d{3}[A-Za-z]*)*)/);
        if(m){ s.add(m[1]); if(!FRASI_H[m[1]]) FRASI_H[m[1]] = (t.replace(/^[^:]*:\s*/, "").replace(/\s*\[.*$/, "") || "—") + " [testo EN da PubChem]"; }
      }));
      return s;
    };
    const hEcha = estraiH(infoTutte.filter(i => refEcha.has(i.ReferenceNumber)));
    const picto = new Set();
    info.filter(i => /^Pictogram/.test(i.Name || "")).forEach(i =>
      ((i.Value || {}).StringWithMarkup || []).forEach(s => (s.Markup || []).forEach(m => {
        const mm = ((m.Extra || "") + " " + (m.URL || "")).match(/GHS0\d/);
        if(mm && PICTO[mm[0]]) picto.add(mm[0]);
      })));
    if(picto.has("GHS06")) picto.delete("GHS07");   // precedenza CLP art. 26
    let avv = "";
    info.filter(i => i.Name === "Signal").forEach(i => stringheDi(i).forEach(s => {
      if(/danger/i.test(s)) avv = "Pericolo";
      else if(/warning/i.test(s) && avv !== "Pericolo") avv = "Attenzione";
    }));
    let hSel = estraiH(info);
    const nHPrima = hSel.size;
    hSel = filtraRidondanzeH(hSel);
    const hRimosse = nHPrima - hSel.size;
    const hExtra = [...filtraRidondanzeH(new Set([...hEcha, ...hSel]))].filter(c => !hSel.has(c)).sort();
    const pTotali = new Set();
    info.filter(i => /Precautionary Statement/.test(i.Name || "")).forEach(i => stringheDi(i).forEach(s =>
      (s.match(/P\d{3}(?:\+P\d{3})*/g) || []).forEach(c => { if(FRASI_P[c]) pTotali.add(c); })));
    const PRIORITA_P = ["P210","P280","P305+P351+P338","P305+P354+P338","P303+P361+P353","P302+P361+P354","P301+P310","P301+P330+P331","P301+P312","P304+P340","P316","P310","P260","P261","P273","P233","P240","P271","P403+P235","P403+P233","P331","P391","P405","P501"];
    const rango = c => { const i = PRIORITA_P.indexOf(c); return i < 0 ? 99 : i; };
    const nCandidate = pTotali.size;
    const pSel = new Set([...pTotali].sort((a, b) => rango(a) - rango(b)).slice(0, 6));

    setStato(!picto.size && !hSel.size ? "«" + esc(nome) + "» trovata (CID " + cid + ") ma senza classificazione GHS registrata: potrebbe essere non pericolosa. Nome e CAS sono stati compilati; verifica sulla SDS." : "");
    $("inNome").value = nomeLeggibile();
    if(cas) $("inCas").value = cas;
    $("inAvvertenza").value = avv;
    stato.pictoSel = picto; stato.hSel = hSel; stato.pSel = pSel;
    aggiornaPicto(); costruisciListaFrasi("H"); costruisciListaFrasi("P"); suggerisciP();
    mostraFonte("🌐 Classificazione importata dal database globale <b>PubChem</b> (CID " + cid +
      ") — fonte: <b>" + fonte + "</b> · pittogrammi: " + picto.size + " · frasi H: " + hSel.size + " · frasi P: " + pSel.size +
      (nCandidate > 6 ? " (scelte automaticamente le 6 più rilevanti tra " + nCandidate + ": puoi modificarle qui sotto)" : "") +
      (hRimosse > 0 ? " · " + hRimosse + " frasi H ridondanti escluse (tenuta la più severa)" : "") +
      ". Controlla e adatta alla concentrazione del tuo prodotto." +
      (/notifiche/.test(fonte) ? "<br>ℹ️ Questa sostanza <b>non ha una classificazione armonizzata UE</b>: i dati sono l'insieme delle notifiche dei fornitori (spesso più severo del necessario). Confronta con la SDS del tuo prodotto." : "") +
      (hExtra.length ? "<br>⚠️ Le notifiche ECHA segnalano anche: <b>" + hExtra.join(", ") + "</b> — " + hExtra.map(c => esc(FRASI_H[c] || "")).join(" · ") +
        " <button type='button' class='btn mini' id='btnHExtra'>➕ aggiungi</button>" : ""));
    $("fonteBanner").dataset.hextra = hExtra.join(",");
    const bx = $("btnHExtra"); if(bx) bx.onclick = aggiungiHExtra;
    dopoImport();
  }catch(e){
    setStato(e.message === "notfound"
      ? "«" + esc(nome) + "» non trovata nel database globale: prova con il nome inglese, la formula o il numero CAS."
      : "Impossibile recuperare la classificazione (connessione o dati mancanti). Usa l'archivio locale o compila a mano.", true);
  }
}
function mostraFonte(html){ const b = $("fonteBanner"); b.hidden = false; b.innerHTML = html; }

/* ---------- Miscele ---------- */
let modalitaMiscela = false;
function toggleMiscela(){
  modalitaMiscela = !modalitaMiscela;
  $("miscelaCorpo").hidden = !modalitaMiscela;
  $("btnMiscelaToggle").textContent = modalitaMiscela ? "✕ Annulla la miscela" : "Sì — componi la miscela passo per passo";
  if(modalitaMiscela){ setStato("🧪 Modalità miscela attiva: cerca il primo componente nella barra di ricerca qui sopra."); $("cercaGlobale").focus(); }
  else { stato.componenti = []; aggiornaComponenti(); setStato(""); }
  aggiornaBtnComp();
}
function dopoImport(){
  pianificaRender();
  if(modalitaMiscela){
    vaiStep(1); aggiornaBtnComp();
    setStato("✔️ «" + esc(val("inNome")) + "» caricato: nel riquadro miscela scrivi la percentuale e premi Aggiungi.");
    $("miscelaBox").scrollIntoView({ behavior: "smooth", block: "center" });
    $("inPercComp").focus();
  } else vaiStep(2);
}
function aggiornaBtnComp(){
  const b = $("btnAggComp"), nome = val("inNome");
  b.disabled = !nome;
  b.textContent = nome ? "➕ Aggiungi «" + nome + "» alla miscela" : "➕ Aggiungi (prima cerca un componente)";
}
function creaMiscela(){
  if(!stato.componenti.length){ setStato("Aggiungi almeno un componente prima di creare la miscela.", true); return; }
  const nomeM = val("inNomeMiscela");
  if(!nomeM){ setStato("Scrivi il nome della miscela (es. «Etanolo 70 % v/v») nel riquadro qui sotto.", true); $("inNomeMiscela").focus(); return; }
  $("inNome").value = nomeM;
  modalitaMiscela = false;
  $("miscelaCorpo").hidden = true;
  $("btnMiscelaToggle").textContent = "Sì — componi la miscela passo per passo";
  combinaComponenti();
}
function aggiungiComponente(){
  const nome = val("inNome");
  if(!nome){ setStato("Prima cerca (o compila) la sostanza da aggiungere come componente.", true); return; }
  stato.componenti.push({ nome, cas: val("inCas"), perc: val("inPercComp"), avv: $("inAvvertenza").value, picto: [...stato.pictoSel], h: [...stato.hSel] });
  $("inPercComp").value = "";
  ["inNome", "inCas", "inConc"].forEach(id => $(id).value = "");
  $("inAvvertenza").value = "";
  stato.pictoSel = new Set(); stato.hSel = new Set(); stato.pSel = new Set(); stato.cid = null;
  aggiornaPicto(); costruisciListaFrasi("H"); costruisciListaFrasi("P"); suggerisciP(); aggiornaBtnComp();
  setStato("✅ Componente aggiunto (" + stato.componenti.length + " nella miscela). Cerca il prossimo qui sopra, oppure completa al punto 4.");
  aggiornaComponenti(); pianificaRender();
}
function rimuoviComponente(i){ stato.componenti.splice(i, 1); aggiornaComponenti(); pianificaRender(); }
function aggiornaComponenti(){
  $("listaComponenti").innerHTML = stato.componenti.map((c, i) =>
    '<div class="coda-item"><span><b>' + esc(c.nome) + "</b>" + (c.cas ? " · CAS " + esc(c.cas) : "") + (c.perc ? " · " + esc(c.perc) + " %" : "") +
    (c.picto.length || c.h.length ? " · " + c.picto.length + " pittogrammi, " + c.h.length + " frasi H" : " · nessun pericolo") +
    '</span><button type="button" title="Rimuovi" aria-label="Rimuovi ' + esc(c.nome) + '" data-rimcomp="' + i + '">✕</button></div>').join("");
  $("finaleMiscela").hidden = !stato.componenti.length;
}
function combinaComponenti(){
  if(!stato.componenti.length) return;
  const picto = new Set(), h = new Set(); let avv = "";
  stato.componenti.forEach(c => {
    c.picto.forEach(p => picto.add(p)); c.h.forEach(x => h.add(x));
    if(c.avv === "Pericolo") avv = "Pericolo"; else if(c.avv && avv !== "Pericolo") avv = "Attenzione";
  });
  if(picto.has("GHS06")) picto.delete("GHS07");
  stato.pictoSel = picto; stato.hSel = filtraRidondanzeH(h); stato.cid = null;
  $("inAvvertenza").value = avv;
  aggiornaPicto(); costruisciListaFrasi("H"); costruisciListaFrasi("P"); suggerisciP();
  mostraFonte("⚗️ <b>Classificazione combinata</b>: unione dei pericoli di " + stato.componenti.length +
    " componenti (ridondanze e pittogrammi incompatibili rimossi). <b>Attenzione:</b> per le miscele il CLP prevede il <b>metodo di calcolo</b> con limiti di concentrazione (Titolo II): l'unione è una stima <i>prudente</i> — per soluzioni diluite la classificazione reale può essere più lieve. Se esiste una SDS della miscela, fa fede quella. Deseleziona qui sotto ciò che non si applica.");
  pianificaRender();
  vaiStep(2);
}
function aggiungiHExtra(){
  const b = $("fonteBanner");
  const codici = (b.dataset.hextra || "").split(",").filter(Boolean);
  if(!codici.length) return;
  codici.forEach(c => stato.hSel.add(c));
  b.dataset.hextra = "";
  costruisciListaFrasi("H", $("filtroH").value); suggerisciP();
  b.insertAdjacentHTML("beforeend", " <b>✓ aggiunte.</b>");
  pianificaRender();
}
function applicaPreset(p){
  stato.cid = null;
  $("inNome").value = p.nome; $("inCas").value = p.cas; $("inConc").value = p.conc; $("inAvvertenza").value = p.avv;
  stato.pictoSel = new Set(p.picto);
  stato.hSel = new Set(p.h.filter(c => FRASI_H[c]));
  stato.pSel = new Set(p.p.filter(c => FRASI_P[c]));
  aggiornaPicto(); costruisciListaFrasi("H"); costruisciListaFrasi("P"); suggerisciP();
  mostraFonte("📗 Dati precompilati dall'<b>archivio locale</b> (classificazione tipica per " + esc(p.nome) + " " + esc(p.conc) + "). Verifica con la SDS del tuo fornitore.");
  setStato("");
  dopoImport();
}

/* ---------- Pittogrammi e frasi ---------- */
function htmlPittoSvg(cod){ const p = PICTO[cod]; return '<svg viewBox="' + p.vb + '" aria-hidden="true">' + p.inner + "</svg>"; }
function costruisciPicto(){
  const g = $("pictoGrid");
  g.innerHTML = "";
  Object.entries(PICTO).forEach(([cod, o]) => {
    const c = document.createElement("button");
    c.type = "button"; c.className = "picto-card"; c.dataset.cod = cod;
    c.setAttribute("aria-pressed", "false");
    c.innerHTML = "<span class='picto-thumb'>" + htmlPittoSvg(cod) + "</span><span class='pcod'>" + cod + "</span><span class='pnome'>" + o.nome + "</span>";
    c.onclick = () => { stato.pictoSel.has(cod) ? stato.pictoSel.delete(cod) : stato.pictoSel.add(cod); aggiornaPicto(); pianificaRender(); };
    g.appendChild(c);
  });
}
function aggiornaPicto(){
  document.querySelectorAll(".picto-card").forEach(c => {
    const s = stato.pictoSel.has(c.dataset.cod);
    c.classList.toggle("sel", s); c.setAttribute("aria-pressed", s ? "true" : "false");
  });
}
function costruisciListaFrasi(tipo, filtro){
  const dati = tipo === "H" ? FRASI_H : FRASI_P;
  const sel = tipo === "H" ? stato.hSel : stato.pSel;
  const box = $("lista" + tipo);
  const f = (filtro || "").trim().toLowerCase();
  const frag = document.createDocumentFragment();
  // prima le frasi selezionate, poi le altre
  const voci = Object.entries(dati).filter(([cod, testo]) => !f || cod.toLowerCase().includes(f) || testo.toLowerCase().includes(f));
  voci.sort((a, b) => (sel.has(b[0]) ? 1 : 0) - (sel.has(a[0]) ? 1 : 0));
  voci.forEach(([cod, testo]) => {
    const l = document.createElement("label");
    const ck = document.createElement("input");
    ck.type = "checkbox"; ck.checked = sel.has(cod);
    ck.onchange = () => { ck.checked ? sel.add(cod) : sel.delete(cod); if(tipo === "H") suggerisciP(); contaFrasi(); pianificaRender(); };
    l.appendChild(ck);
    const sp = document.createElement("span");
    sp.innerHTML = "<b>" + cod + "</b> — " + esc(testo);
    l.appendChild(sp);
    frag.appendChild(l);
  });
  box.innerHTML = ""; box.appendChild(frag);
  contaFrasi();
}
function contaFrasi(){
  $("contaH").textContent = stato.hSel.size ? "(" + stato.hSel.size + " selezionate)" : "";
  $("contaP").textContent = stato.pSel.size ? "(" + stato.pSel.size + " selezionate" + (stato.pSel.size > 6 ? " — il CLP consiglia max 6" : "") + ")" : "";
}
const MAPPA_P = {
  infiammabile:{test:c=>/^H2(2[0-8]|4|5)/.test(c), p:["P210","P233","P403+P235"], msg:"prodotto infiammabile → considera P210, P233, P403+P235"},
  corrosivo:{test:c=>c==="H314"||c==="H318", p:["P280","P305+P351+P338","P310"], msg:"corrosivo/lesioni oculari → considera P280, P305+P351+P338, P310"},
  tossico:{test:c=>/^H3(00|01|10|11|30|31)/.test(c), p:["P260","P280","P301+P310","P304+P340"], msg:"tossicità acuta → considera P260, P280, P301+P310, P304+P340"},
  cmr:{test:c=>/^H3(4|5|6)\d/.test(c)||c==="H350"||c==="H350i", p:["P201","P280","P308+P313"], msg:"CMR (cancerogeno/mutageno/reprotossico) → considera P201, P280, P308+P313"},
  ambiente:{test:c=>/^H4/.test(c), p:["P273","P391","P501"], msg:"pericoloso per l'ambiente → considera P273, P391, P501"}
};
function suggerisciP(){
  const div = $("consiglioP");
  const msgs = [], codici = new Set();
  Object.values(MAPPA_P).forEach(m => {
    if([...stato.hSel].some(m.test)){ msgs.push(m.msg); m.p.forEach(c => { if(FRASI_P[c] && !stato.pSel.has(c)) codici.add(c); }); }
  });
  if(msgs.length){
    div.hidden = false;
    div.innerHTML = "<b>💡 Suggerimento:</b> in base alle frasi H selezionate — " + msgs.join("; ") +
      ". <i>(Il CLP raccomanda di non superare 6 frasi P salvo necessità.)</i>" +
      (codici.size ? "<br><button type='button' class='btn piccolo' id='btnSuggP' style='margin-top:8px'>➕ Aggiungi " + codici.size + " frasi P suggerite</button>" : "");
    div.dataset.codici = [...codici].join(",");
    const b = $("btnSuggP"); if(b) b.onclick = applicaSuggerimentiP;
  } else div.hidden = true;
}
function applicaSuggerimentiP(){
  ($("consiglioP").dataset.codici || "").split(",").filter(Boolean).forEach(c => stato.pSel.add(c));
  costruisciListaFrasi("P", $("filtroP").value); suggerisciP(); pianificaRender();
}

/* ============================================================
   CONTENITORI E FORMATO
   ============================================================ */
const contCorrente = () => CONTENITORI.find(c => c.id === stato.contId) || CONTENITORI[CONTENITORI.length - 1];
const litriCorrenti = () => capacitaInLitri($("inCapacita").value, $("inUnita").value);
const r1 = v => Math.round(v * 10) / 10;

function costruisciContenitori(){
  const chips = $("gruppiCont");
  chips.innerHTML = [["tutti", "Tutti"], ...Object.entries(GRUPPI_CONT)].map(([k, n]) =>
    '<button type="button" class="chip" role="tab" data-gruppo="' + k + '" aria-selected="' + (k === stato.gruppo) + '">' + n + "</button>").join("");
  chips.onclick = e => { const b = e.target.closest("[data-gruppo]"); if(!b) return; stato.gruppo = b.dataset.gruppo; costruisciContenitori(); };
  const g = $("contGrid");
  g.innerHTML = CONTENITORI.filter(c => stato.gruppo === "tutti" || c.gruppo === stato.gruppo).map(c => {
    const s = superficieContenitore(c);
    const dim = c.personalizzato ? "le tue misure" : c.d ? "Ø " + String(c.d).replace(".", ",") + " mm · zona alta " + c.hEt + " mm" : "zona " + c.wEt + " × " + c.hEt + " mm";
    return '<button type="button" class="cont-card" role="radio" data-cont="' + c.id + '" aria-checked="' + (c.id === stato.contId) + '">' +
      iconaContenitore(c, 56) + '<span class="cont-nome">' + esc(c.nome) + '</span><span class="cont-dim">' + dim + "</span></button>";
  }).join("");
}

/* formati proposti per il contenitore e la capacità attuali */
function proposteFormato(){
  const c = contCorrente();
  const litri = litriCorrenti();
  const cl = CLASSI_CLP[classeCLP(litri)];
  const [mw, mh] = cl.et;
  const s = superficieContenitore(c);
  const [sw, sh] = s.piatta;
  const out = [];
  const piatta = () => {
    const entra = (a, b) => a <= sw + 0.5 && b <= sh + 0.5;
    if(entra(mw, mh)) return { w: mw, h: mh, layout: "auto", nome: "Minimo CLP " + mh + " × " + mw };
    if(entra(mh, mw)) return { w: mh, h: mw, layout: "auto", nome: "Minimo CLP " + mh + " × " + mw + " (verticale)" };
    const w = Math.max(10, Math.floor(sw * 0.92)), h = Math.max(8, Math.floor(sh * 0.9));
    return { w, h, layout: "auto", nome: "Massima sul contenitore " + w + " × " + h };
  };
  if(c.d){
    const circ = Math.PI * c.d;
    const avv = { w: r1(circ + 3), h: Math.max(8, Math.min(c.hEt, 40)), layout: "avvolgente", d: c.d, nome: "Avvolgente " + r1(circ + 3) + " × " + Math.max(8, Math.min(c.hEt, 40)) };
    const fw = c.flagW || Math.max(20, Math.min(35, Math.round(c.hEt * 0.8)));
    const fh = Math.max(10, Math.min(c.hEt, 22));
    const ban = { w: r1(2 * fw + circ), h: fh, layout: "bandiera", d: c.d, flagW: fw, nome: "A bandiera 2 × " + fw + " × " + fh };
    const pia = piatta();
    const ord = c.layout === "bandiera" ? [ban, avv, pia] : c.layout === "avvolgente" ? [avv, ban, pia] : [pia, avv];
    ord.forEach(x => out.push(x));
  } else out.push(piatta());
  out[0].consigliato = true;
  const clp = { w: mw, h: mh, layout: "auto", nome: "Minimo CLP " + mh + " × " + mw };
  if(!out.some(x => x.layout !== "avvolgente" && x.layout !== "bandiera" && x.w === mw && x.h === mh)) out.push(clp);
  out.push({ pers: true, nome: "Misura personalizzata" });
  return out;
}
let formatoScelto = 0;
function mostraFormati(){
  const pr = proposteFormato();
  $("formatiProposti").innerHTML = pr.map((p, i) =>
    '<button type="button" class="formato" role="radio" data-formato="' + i + '" aria-checked="' + (i === formatoScelto) + '">' +
    "<b>" + esc(p.nome) + (p.pers ? "" : " mm") + "</b>" + (p.consigliato ? '<span class="badge loc">consigliato</span>' : "") + "</button>").join("");
}
function applicaFormato(i){
  const pr = proposteFormato();
  const p = pr[i]; if(!p) return;
  formatoScelto = i;
  if(!p.pers){
    $("inW").value = p.w; $("inH").value = p.h; $("inLayout").value = p.layout;
    if(p.d) $("inDiam").value = p.d;
    if(p.flagW) $("inFlag").value = p.flagW;
  }
  mostraFormati(); aggiornaCampiMisura(); pianificaRender();
  if(p.pers) $("inW").focus();
}
function selezionaContenitore(id){
  stato.contId = id;
  const c = contCorrente();
  if(!c.personalizzato){
    const ml = c.unita === "g" ? c.cap : c.cap;
    if(ml >= 1000 && ml % 1000 === 0){ $("inCapacita").value = ml / 1000; $("inUnita").value = c.unita === "g" ? "kg" : "l"; }
    else { $("inCapacita").value = ml; $("inUnita").value = c.unita === "g" ? "g" : "ml"; }
    if(c.d) $("inDiam").value = c.d;
  }
  // contenitori piccoli: contenuto automatico ma pittogrammi automatici
  costruisciContenitori();
  formatoScelto = 0;
  applicaFormato(0);
  aggiornaNoteContenitore();
}
function aggiornaCampiMisura(){
  const lay = $("inLayout").value;
  document.querySelectorAll(".solo-tubo").forEach(e => e.hidden = !(lay === "avvolgente" || lay === "bandiera"));
  document.querySelectorAll(".solo-bandiera").forEach(e => e.hidden = lay !== "bandiera");
  const bandiera = lay === "bandiera";
  $("inW").readOnly = bandiera;
  if(bandiera) $("inW").value = r1(2 * (parseFloat($("inFlag").value) || 20) + Math.PI * (parseFloat($("inDiam").value) || 10));
  const d = parseFloat($("inDiam").value) || 10;
  $("notaMisure").innerHTML = lay === "avvolgente"
    ? "Avvolgente: la larghezza è la circonferenza del tubo (π × " + String(d).replace(".", ",") + " = " + String(r1(Math.PI * d)).replace(".", ",") + " mm) più una piccola zona di sovrapposizione (tratteggiata). Davanti: nome e pittogrammi; dietro: frasi e dati."
    : bandiera ? "A bandiera: le due metà si incollano schiena contro schiena attorno al tubo (linee di piega tratteggiate). Ogni bandiera riporta l'etichetta intera; la parte centrale avvolge il tubo."
    : "La disposizione automatica sceglie tra pittogrammi in colonna a sinistra o in riga sopra il testo, quella che rende tutto più leggibile.";
}
function aggiornaNoteContenitore(){
  const c = contCorrente();
  const litri = litriCorrenti();
  const note = [];
  if(c.nota) note.push(c.nota);
  if(c.gruppo === "micro" || c.gruppo === "provette" || c.gruppo === "vial" || c.gruppo === "siringhe")
    note.push("Se l'etichetta completa non entra, metti sul contenitore un'etichetta ridotta (nome + pittogrammi) e l'etichetta completa sull'imballaggio esterno (rack, scatola, busta): scegli «Scatola / rack» e aggiungila alla coda.");
  if(c.gruppo === "flaconi") note.push("Etichetta sul corpo del contenitore, leggibile in orizzontale con il contenitore in posizione normale, mai sul tappo.");
  if(litri > 0 && litri <= 0.125) note.push("Contenitore ≤ 125 ml: per alcune categorie di pericolo «lievi» il CLP permette di omettere le frasi H e P (All. I, 1.5.2.1).");
  if(c.personalizzato) note.push("Regola generale: etichetta sul corpo, leggibile con il contenitore in posizione normale; se lo spazio non basta, etichetta completa sull'imballaggio esterno ed etichetta ridotta sul contenitore.");
  $("noteContenitore").innerHTML = "<b>Indicazioni per «" + esc(c.nome) + "»:</b><ul>" + note.map(n => "<li>" + n + "</li>").join("") + "</ul>";
  $("noteContenitore").hidden = !note.length;
  $("tabDim").innerHTML = htmlTabellaCLP(litri);
}

/* ============================================================
   DATI E OPZIONI DELL'ETICHETTA
   ============================================================ */
const dataIt = id => val(id) ? val(id).split("-").reverse().join("/") : "";
const ORDINE_PICTO = ["GHS01","GHS02","GHS03","GHS04","GHS05","GHS06","GHS07","GHS08","GHS09"];

function testoQR(){
  const modo = $("inQrModo").value, cas = val("inCas");
  if(modo === "cas" && cas) return "CAS " + cas;
  if(modo === "sds" && cas) return "https://www.google.com/search?q=" + encodeURIComponent('"' + cas + '" SDS filetype:pdf');
  if(modo === "link" && val("inQrTesto")) return val("inQrTesto");
  if(modo === "pubchem"){
    if(stato.cid) return "https://pubchem.ncbi.nlm.nih.gov/compound/" + stato.cid + "#section=Safety-and-Hazards";
    if(cas) return "https://pubchem.ncbi.nlm.nih.gov/#query=" + encodeURIComponent(cas);
  }
  return [val("inNome"), cas && "CAS " + cas, val("inLotto") && "Lotto " + val("inLotto"), dataIt("inData"), val("inLab")].filter(Boolean).join(" | ");
}

function datiEtichetta(){
  const testiH = $("ckTestiH").checked, testiP = $("ckTestiP").checked;
  const meta = [];
  const cap = val("inCapacita"), un = $("inUnita").value;
  if($("ckQuantita").checked && cap && parseFloat(cap) > 0) meta.push("Quantità: " + cap.replace(".", ",") + " " + (un === "l" ? "L" : un));
  if($("ckMeta").checked){
    if(val("inData")) meta.push("Prep.: " + dataIt("inData"));
    if(val("inApertura")) meta.push("Apert.: " + dataIt("inApertura"));
    if(val("inScadenza")) meta.push("Scad.: " + dataIt("inScadenza"));
    if(val("inOperatore")) meta.push("Resp.: " + val("inOperatore"));
    if(val("inLotto")) meta.push("Lotto: " + val("inLotto"));
    if(val("inLab")) meta.push("Lab: " + val("inLab"));
    if(val("inEnte")) meta.push(val("inEnte"));
  }
  const tq = $("ckQR").checked ? testoQR() : "";
  return {
    nome: val("inNome"), cas: val("inCas"), conc: val("inConc"),
    contiene: stato.componenti.map(c => c.nome + (c.cas ? " (CAS " + c.cas + ")" : "") + (c.perc ? " " + c.perc + " %" : "")).join(", "),
    avv: $("inAvvertenza").value,
    picto: ORDINE_PICTO.filter(c => stato.pictoSel.has(c)),
    H: [...stato.hSel].sort().map(c => ({ cod: c, testo: testiH ? (FRASI_H[c] || "") : "" })),
    P: [...stato.pSel].sort().map(c => ({ cod: c, testo: testiP ? (FRASI_P[c] || "") : "" })),
    meta,
    qr: tq ? qrMatrix(tq) : null
  };
}
function contenutoScelto(){ const r = document.querySelector("input[name=contenuto]:checked"); return r ? r.value : "auto"; }
function opzioniEtichetta(){
  const litri = litriCorrenti();
  const pm = pittoMinimo(litri);
  const lay = $("inLayout").value;
  const w = Math.max(8, Math.min(420, parseFloat($("inW").value) || 74));
  const h = Math.max(6, Math.min(420, parseFloat($("inH").value) || 52));
  return {
    w, h,
    layout: lay === "avvolgente" || lay === "bandiera" ? lay : "piana",
    disposizione: lay === "orizzontale" ? "lato" : lay === "verticale" ? "pila" : null,
    d: parseFloat($("inDiam").value) || 10,
    flagW: parseFloat($("inFlag").value) || 20,
    contenuto: contenutoScelto(),
    pittoLato: $("ckPittoAuto").checked ? 0 : riquadroDaRombo(parseFloat($("inPitto").value)),
    pittoTarget: riquadroDaRombo(pm.consigliato),
    pittoAccettabile: riquadroDaRombo(pm.assoluto),
    fontMax: parseFloat($("inFont").value) * PT,
    fontMin: 1.4,
    fontTarget: xHeightMin2028(litri) / X_HEIGHT,
    bordo: $("ckBordo").checked
  };
}

/* ============================================================
   ANTEPRIMA DAL VIVO
   ============================================================ */
let _rafRender = 0;
function pianificaRender(){ if(!_rafRender) _rafRender = requestAnimationFrame(() => { _rafRender = 0; render(); }); }

function render(){
  const d = datiEtichetta(), o = opzioniEtichetta();
  const r = generaEtichetta(d, o);
  ultimo = { svg: r.svg, info: r.info, d, o };
  const wrap = $("anteprimaWrap");
  wrap.innerHTML = r.svg;
  dimensionaAnteprima();
  const c = contCorrente();
  $("anteprimaCont").innerHTML = iconaContenitore(c, 40) + "<div><b>" + esc(c.nome) + "</b><br><span>" +
    fmt(o.w) + " × " + fmt(o.h) + " mm · " + ({ avvolgente: "avvolgente", bandiera: "a bandiera" }[o.layout] || ($("inLayout").value === "auto" ? "disposizione automatica" : $("inLayout").value)) + "</span></div>";
  const inf = r.info;
  const chip = (t, cls) => '<span class="chip-info ' + (cls || "") + '">' + t + "</span>";
  $("infoEtichetta").innerHTML =
    chip("Testo " + fmt(inf.fontPt) + " pt <small>(x " + fmt(inf.xHeight) + " mm)</small>", inf.xHeight < 1.2 ? "giallo" : "") +
    (inf.latoPitto ? chip("Pittogrammi " + fmt(romboDaRiquadro(inf.latoPitto)) + " mm", romboDaRiquadro(inf.latoPitto) < pittoMinimo(litriCorrenti()).assoluto - 0.05 ? "giallo" : "") : "") +
    chip(inf.livello.id === 0 ? "Contenuto completo" : inf.livello.minima ? "Solo nome + pittogrammi" : inf.livello.ridotta ? "Contenuto ridotto" : "Accorciata: " + inf.livello.nome, inf.livello.id > 0 && contenutoScelto() === "auto" ? "giallo" : "");
  // output degli slider
  $("outPitto").textContent = $("ckPittoAuto").checked ? "automatica (" + fmt(romboDaRiquadro(inf.latoPitto || 0)) + " mm)" : fmt(parseFloat($("inPitto").value)) + " mm";
  $("outFont").textContent = fmt(parseFloat($("inFont").value)) + " pt";
  const pm = pittoMinimo(litriCorrenti());
  $("minPitto").innerHTML = "Misura del <b>lato del rombo</b>. Minimo CLP per questa capacità: " +
    (pm.assoluto === pm.consigliato ? "<b>" + pm.consigliato + " mm</b>" : "<b>" + pm.assoluto + " mm</b> (se possibile " + pm.consigliato + " mm)") + ".";
  if($("ckPittoAuto").checked) $("inPitto").value = r1(romboDaRiquadro(inf.latoPitto || riquadroDaRombo(16)));
  // regole e controlli
  const regole = valutaRegole({
    litri: litriCorrenti(), uso: $("inUso").value, w: o.w, h: o.h, layout: o.layout, info: inf, contenuto: o.contenuto,
    pittoManuale: !$("ckPittoAuto").checked, nPicto: d.picto.length, picto: d.picto, H: d.H.map(x => x.cod),
    superficie: contCorrente().personalizzato ? null : superficieContenitore(contCorrente())
  });
  const ctrl = controlliCompletezza();
  const html = regole.concat(ctrl).map(a => '<div class="nota-regola ' + a.tipo + '">' + a.testo + "</div>").join("");
  $("avvisiRegole").innerHTML = html;
  const nAvv = regole.concat(ctrl).filter(a => a.tipo === "avviso").length, nInfo = regole.concat(ctrl).filter(a => a.tipo === "info").length;
  $("contaRegole").textContent = nAvv || nInfo ? "(" + [nAvv && nAvv + " da controllare", nInfo && nInfo + " note"].filter(Boolean).join(", ") + ")" : "✅";
  // avviso sui pittogrammi accanto allo slider (step 4)
  const avP = regole.filter(a => /Pittogrammi di|solo pittogrammi/.test(a.testo));
  $("avvisiEtichetta").innerHTML = avP.map(a => '<div class="nota-regola ' + a.tipo + '">' + a.testo + "</div>").join("") +
    (!$("ckPittoAuto").checked && inf.latoPitto && romboDaRiquadro(inf.latoPitto) < parseFloat($("inPitto").value) - 0.3
      ? '<div class="nota-regola info">I pittogrammi sono di ' + fmt(romboDaRiquadro(inf.latoPitto)) + " mm invece di " + fmt(parseFloat($("inPitto").value)) + " mm: sull'etichetta non c'è più spazio.</div>" : "");
  aggiornaRiepilogoFoglio();
}
function controlliCompletezza(){
  const a = [];
  const add = (t, tipo) => a.push({ tipo: tipo || "avviso", testo: t });
  if(!val("inNome")) add("✏️ Manca il <b>nome della sostanza</b> (obbligatorio).");
  if(stato.pictoSel.size && !$("inAvvertenza").value) add("Hai scelto pittogrammi ma nessuna <b>avvertenza</b> (Pericolo/Attenzione).");
  if(stato.pictoSel.size && !stato.hSel.size) add("Hai scelto pittogrammi ma nessuna <b>frase H</b>.");
  if(stato.hSel.size && !stato.pSel.size && contenutoScelto() === "auto") add("Nessuna <b>frase P</b>: per un'etichetta CLP completa servono i consigli di prudenza.", "info");
  if(stato.pSel.size > 6) add("Più di 6 frasi P: il CLP raccomanda le 6 più pertinenti (art. 28).", "info");
  if(stato.componenti.length && (stato.pictoSel.size || stato.hSel.size)) add("Etichetta di <b>miscela</b>: la classificazione è l'unione prudenziale dei componenti; per quella formale vale il metodo di calcolo CLP o la SDS della miscela.", "info");
  if(stato.hSel.has("EUH019") && !val("inApertura")) add("Sostanza che può formare <b>perossidi esplosivi</b> (EUH019): indica la <b>data di apertura</b> (step 1).");
  if(val("inScadenza") && val("inData") && val("inScadenza") < val("inData")) add("La <b>scadenza</b> è precedente alla data di preparazione: controlla le date.");
  if($("ckQR").checked){
    const n = new TextEncoder().encode(testoQR()).length;
    if(n > 106) add("Il testo del QR è di " + n + " byte, il massimo è 106: verrà <b>troncato</b> (un link troncato non funziona). Usa un link più corto.");
    if($("inQrModo").value === "link" && !val("inQrTesto")) add("QR personalizzato: scrivi il link della scheda di sicurezza o un testo (step 4).", "info");
  }
  if(val("inNome") && !val("inLab")) add("Indica il <b>laboratorio</b> (step 1, dati di laboratorio): serve a identificare la provenienza del campione.", "info");
  if(val("inNome") && !stato.pictoSel.size && !stato.hSel.size) add("Nessun pericolo selezionato: etichetta di sola identificazione. Verifica sulla SDS che la sostanza non sia classificata.", "info");
  return a;
}
function dimensionaAnteprima(){
  const svg = $("anteprimaWrap").querySelector("svg");
  if(!svg || !ultimo) return;
  const { w, h } = ultimo.o;
  if(stato.zoom === "reale"){ svg.style.width = w + "mm"; svg.style.height = h + "mm"; }
  else {
    const box = $("anteprimaWrap");
    const maxW = Math.max(160, box.clientWidth - 24);
    const maxH = window.matchMedia("(max-width: 900px)").matches ? 140 : 420;
    const s = Math.min(maxW / w, maxH / h, 12);   // px per mm
    svg.style.width = (w * s) + "px"; svg.style.height = (h * s) + "px";
  }
  $("btnZoomReale").setAttribute("aria-pressed", stato.zoom === "reale");
  $("btnZoomAdatta").setAttribute("aria-pressed", stato.zoom !== "reale");
}

/* ============================================================
   STAMPA, FOGLI, CODA, ESPORTAZIONE
   ============================================================ */
function foglioCorrente(){
  const f = FOGLI.find(x => x.id === $("inFoglio").value) || FOGLI[0];
  if(f.personalizzato){
    const n = id => parseFloat($(id).value) || 0;
    return { id: "pers", nome: f.nome, col: Math.max(1, n("fgCol")), row: Math.max(1, n("fgRow")), w: n("fgW"), h: n("fgH"), top: n("fgTop"), left: n("fgLeft"), gx: n("fgGx"), gy: n("fgGy") };
  }
  return f;
}
function aggiornaCampiFoglio(){
  const f = FOGLI.find(x => x.id === $("inFoglio").value) || FOGLI[0];
  const libero = f.id === "libero";
  document.querySelectorAll(".solo-griglia").forEach(e => e.hidden = libero);
  document.querySelectorAll(".solo-pers").forEach(e => e.hidden = !f.personalizzato);
  if(!libero && !f.personalizzato){
    [["fgCol", f.col], ["fgRow", f.row], ["fgW", f.w], ["fgH", f.h], ["fgTop", f.top], ["fgLeft", f.left], ["fgGx", f.gx], ["fgGy", f.gy]].forEach(([id, v]) => $(id).value = v);
  }
}
let CODA = [];
function voceCorrente(){ return { d: datiEtichetta(), o: opzioniEtichetta(), copie: copieCorrenti(), nome: val("inNome") || "—", snap: istantanea() }; }
function copieCorrenti(){ return Math.max(1, Math.min(500, parseInt($("inCopie").value, 10) || 1)); }

/* composizione delle pagine A4 */
function composizionePagine(voci){
  const f = foglioCorrente();
  const dx = parseFloat($("fgDx").value) || 0, dy = parseFloat($("fgDy").value) || 0;
  const pagine = [];
  if(f.id === "libero"){
    const lista = [];
    voci.forEach(v => {
      const r = generaEtichetta(v.d, Object.assign({}, v.o, { bordo: true }));
      for(let i = 0; i < v.copie; i++) lista.push({ svg: r.svg, w: v.o.w, h: v.o.h });
    });
    const marg = Math.max(0, parseFloat($("fgMarg").value) || 0);
    impaccaLibero(lista, marg, 2).forEach(p => pagine.push({ pezzi: p.map(x => ({ svg: x.e.svg, x: x.x + dx, y: x.y + dy })), vuote: [] }));
    return { pagine, foglio: f, totale: lista.length };
  }
  const celle = celleFoglio(f, dx, dy);
  const adatta = $("ckAdattaCella").checked;
  let pos = Math.max(0, Math.min(celle.length - 1, (parseInt($("inInizio").value, 10) || 1) - 1));
  let pag = { pezzi: [], vuote: [] }, tot = 0;
  const nuova = () => { pagine.push(pag); pag = { pezzi: [], vuote: [] }; pos = 0; };
  voci.forEach(v => {
    const o = adatta ? Object.assign({}, v.o, { w: f.w, h: f.h, bordo: false }, v.o.layout === "bandiera" && f.w < 2 * 12 + Math.PI * v.o.d ? { layout: "piana" } : {}) : Object.assign({}, v.o, { bordo: false });
    const r = generaEtichetta(v.d, o);
    for(let i = 0; i < v.copie; i++){
      if(pos >= celle.length) nuova();
      const c = celle[pos++];
      pag.pezzi.push({ svg: r.svg, x: c.x + (adatta ? 0 : Math.max(0, (c.w - o.w) / 2)), y: c.y + (adatta ? 0 : Math.max(0, (c.h - o.h) / 2)) });
      tot++;
    }
  });
  if(pag.pezzi.length) pagine.push(pag);
  // celle guida (solo anteprima)
  pagine.forEach((p, i) => { p.vuote = celle; });
  return { pagine, foglio: f, totale: tot };
}
function vociDaStampare(){ return CODA.concat(val("inNome") ? [voceCorrente()] : []); }
function aggiornaRiepilogoFoglio(){
  const voci = vociDaStampare();
  const f = foglioCorrente();
  const n = voci.reduce((s, v) => s + v.copie, 0);
  let t = n ? n + (n > 1 ? " etichette" : " etichetta") : "Nessuna etichetta da stampare";
  if(n && f.id !== "libero"){
    const perPag = f.col * f.row;
    const inizio = (parseInt($("inInizio").value, 10) || 1) - 1;
    const pagine = Math.ceil((n + inizio) / perPag);
    t += " su " + pagine + (pagine > 1 ? " fogli" : " foglio") + " da " + perPag + " (" + fmt(f.w) + " × " + fmt(f.h) + " mm)" + ($("ckAdattaCella").checked ? ": l'etichetta viene reimpaginata alla misura della cella." : ".");
  }
  $("riepilogoFoglio").textContent = n ? t : "";
  $("btnStampa").textContent = CODA.length ? "🖨️ Stampa coda (" + n + " etichette)" : "🖨️ Stampa";
}
function controllaPrimaDiStampare(){
  const voci = vociDaStampare();
  if(!voci.length){ vaiStep(1); setStato("Niente da stampare: compila una sostanza o aggiungi etichette alla coda.", true); return null; }
  return voci;
}
function stampa(){
  const voci = controllaPrimaDiStampare(); if(!voci) return;
  if(val("inNome")) salvaRecente();
  const { pagine } = composizionePagine(voci);
  $("printArea").innerHTML = pagine.map(p => svgPagina(p.pezzi)).join("");
  window.print();
}
function anteprimaFoglio(){
  const voci = controllaPrimaDiStampare(); if(!voci) return;
  const { pagine } = composizionePagine(voci);
  $("foglioPreview").innerHTML = pagine.map((p, i) => '<figure><figcaption>Foglio ' + (i + 1) + " di " + pagine.length + "</figcaption>" + svgPagina(p.pezzi, p.vuote) + "</figure>").join("");
  $("dlgFoglio").hidden = false;
  $("btnChiudiFoglio").focus();
}
function aggiungiCoda(){
  if(!val("inNome")){ vaiStep(1); setStato("Compila prima una sostanza: l'etichetta è vuota.", true); return; }
  const v = voceCorrente();
  CODA.push(v);
  salvaRecente();
  aggiornaCoda();
  nuovaEtichetta(true);
  setStato("✅ «" + esc(v.nome) + "» aggiunta alla coda (" + v.copie + (v.copie > 1 ? " copie" : " copia") + "). Compila la prossima sostanza: laboratorio, responsabile e contenitore sono rimasti.");
}
function aggiornaCoda(){
  $("codaWrap").hidden = !CODA.length;
  $("listaCoda").innerHTML = CODA.map((c, i) =>
    '<div class="coda-item"><span><b>' + esc(c.nome) + "</b> — " + fmt(c.o.w) + " × " + fmt(c.o.h) + " mm</span>" +
    '<span class="nowrap">copie <input type="number" min="1" max="500" value="' + c.copie + '" style="width:64px" aria-label="Copie di ' + esc(c.nome) + '" data-copiecoda="' + i + '">' +
    '<button type="button" title="Rimuovi" aria-label="Rimuovi ' + esc(c.nome) + ' dalla coda" data-rimcoda="' + i + '">✕</button></span></div>').join("");
  pianificaRender();
}
function nuovaEtichetta(mantieniContenitore){
  ["inNome", "inCas", "inConc", "inLotto", "inApertura", "inScadenza", "inQrTesto", "inPercComp", "cercaGlobale", "inNomeMiscela"].forEach(id => $(id).value = "");
  $("inAvvertenza").value = "";
  $("inCopie").value = 1;
  stato.pictoSel = new Set(); stato.hSel = new Set(); stato.pSel = new Set();
  stato.cid = null; stato.componenti = [];
  modalitaMiscela = false;
  $("miscelaCorpo").hidden = true;
  $("btnMiscelaToggle").textContent = "Sì — componi la miscela passo per passo";
  aggiornaBtnComp(); aggiornaPicto(); costruisciListaFrasi("H"); costruisciListaFrasi("P"); suggerisciP(); aggiornaComponenti();
  $("fonteBanner").hidden = true;
  costruisciPreset("");
  setStato("");
  vaiStep(1);
  $("cercaGlobale").focus();
  pianificaRender();
}

async function conAttesa(btn, fn){
  const t = btn.textContent; btn.disabled = true; btn.textContent = "⏳ " + t;
  try{ await fn(); }catch(e){ alert("Esportazione non riuscita: " + e.message); }
  finally{ btn.disabled = false; btn.textContent = t; }
}

/* ============================================================
   ETICHETTE RECENTI E PREFERENZE (localStorage)
   ============================================================ */
const CAMPI_STATO = ["inNome","inCas","inConc","inData","inOperatore","inLotto","inLab","inEnte","inApertura","inScadenza","inAvvertenza",
  "inCapacita","inUnita","inUso","inLayout","inW","inH","inDiam","inFlag","inPitto","inFont","inCopie","inQrModo","inQrTesto"];
const CHECK_STATO = ["ckPittoAuto","ckTestiH","ckTestiP","ckMeta","ckQuantita","ckQR","ckBordo"];
function istantanea(){
  const v = { t: Date.now(), campi: {}, check: {}, picto: [...stato.pictoSel], h: [...stato.hSel], p: [...stato.pSel], cid: stato.cid, componenti: stato.componenti, contId: stato.contId, contenuto: contenutoScelto() };
  CAMPI_STATO.forEach(id => v.campi[id] = $(id).value);
  CHECK_STATO.forEach(id => v.check[id] = $(id).checked);
  return v;
}
function leggiRecenti(){ try{ return JSON.parse(localStorage.getItem("ghs-recenti") || "[]"); }catch(e){ return []; } }
function salvaRecente(){
  try{
    const voce = istantanea();
    if(!voce.campi.inNome.trim()) return;
    let rec = leggiRecenti().filter(r => !(r.campi.inNome === voce.campi.inNome && r.campi.inConc === voce.campi.inConc));
    rec.unshift(voce);
    localStorage.setItem("ghs-recenti", JSON.stringify(rec.slice(0, 20)));
    mostraRecenti();
  }catch(e){}
}
function mostraRecenti(){
  const rec = leggiRecenti();
  $("recentiWrap").hidden = !rec.length;
  const box = $("listaRecenti");
  box.innerHTML = "";
  rec.forEach((r, i) => {
    const c = CONTENITORI.find(x => x.id === r.contId);
    aggiungiRiga(box, "<b>" + esc(r.campi.inNome) + "</b> <span class='cas'>" + (r.campi.inCas ? "CAS " + esc(r.campi.inCas) + " · " : "") +
      (c ? esc(c.nome) + " · " : "") + new Date(r.t).toLocaleDateString("it-IT") + "</span>", "rec", "<span class='riga-x' role='button' tabindex='0' aria-label='Elimina' data-del='" + i + "'>✕</span>", () => caricaRecente(i));
  });
}
function eliminaRecente(i){
  try{ const rec = leggiRecenti(); rec.splice(i, 1); localStorage.setItem("ghs-recenti", JSON.stringify(rec)); mostraRecenti(); }catch(e){}
}
function applicaIstantanea(r){
  CAMPI_STATO.forEach(id => { if(r.campi[id] !== undefined && $(id)) $(id).value = r.campi[id]; });
  Object.entries(r.check || {}).forEach(([id, v]) => { if($(id)) $(id).checked = v; });
  if(r.qr !== undefined && !(r.check && "ckQR" in r.check)) $("ckQR").checked = !!r.qr;   // formato vecchio
  stato.pictoSel = new Set(r.picto); stato.hSel = new Set(r.h); stato.pSel = new Set(r.p);
  stato.cid = r.cid || null;
  stato.componenti = r.componenti || [];
  if(r.contId && CONTENITORI.some(c => c.id === r.contId)) stato.contId = r.contId;
  const rc = document.querySelector("input[name=contenuto][value='" + (r.contenuto || "auto") + "']"); if(rc) rc.checked = true;
  $("inPitto").disabled = $("ckPittoAuto").checked;
  aggiornaComponenti(); aggiornaPicto(); costruisciListaFrasi("H"); costruisciListaFrasi("P"); suggerisciP();
  costruisciContenitori(); mostraFormati(); aggiornaCampiMisura(); aggiornaNoteContenitore();
  $("boxQR").hidden = !$("ckQR").checked;
}
function caricaRecente(i){
  const r = leggiRecenti()[i]; if(!r) return;
  applicaIstantanea(r);
  formatoScelto = proposteFormato().length - 1;   // misure salvate = personalizzate
  mostraFormati();
  mostraFonte("🕘 Etichetta caricata dalle <b>recenti</b> (" + esc(r.campi.inNome) + "). Verifica che i dati siano ancora attuali.");
  pianificaRender();
  vaiStep(4);
}
const CAMPI_PREF = ["inLab", "inOperatore", "inEnte", "inFoglio", "fgDx", "fgDy", "fgMarg", "fgCol", "fgRow", "fgW", "fgH", "fgTop", "fgLeft", "fgGx", "fgGy"];
function salvaPreferenze(){
  try{
    if(!$("ckRicorda").checked){ localStorage.removeItem("ghs-preferenze"); return; }
    const p = {}; CAMPI_PREF.forEach(id => p[id] = $(id).value);
    localStorage.setItem("ghs-preferenze", JSON.stringify(p));
  }catch(e){}
}
function caricaPreferenze(){
  try{
    const p = JSON.parse(localStorage.getItem("ghs-preferenze") || "null");
    if(!p) return;
    CAMPI_PREF.forEach(id => { if(p[id] !== undefined && $(id)) $(id).value = p[id]; });
  }catch(e){}
}

/* ============================================================
   NAVIGAZIONE
   ============================================================ */
function vaiStep(n){
  stepCorrente = n;
  document.querySelectorAll(".step").forEach((s, i) => s.classList.toggle("visible", i + 1 === n));
  document.querySelectorAll("#stepper button").forEach((b, i) => {
    b.classList.toggle("active", i + 1 === n);
    b.classList.toggle("done", i + 1 < n);
    if(i + 1 === n) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current");
  });
  if(n === 3) aggiornaNoteContenitore();
  pianificaRender();
  const top = document.querySelector(".colonna-passi").getBoundingClientRect().top + window.scrollY - 8;
  if(window.scrollY > top) window.scrollTo({ top, behavior: "smooth" });
}

/* ============================================================
   AVVIO
   ============================================================ */
function avvia(){
  $("inFoglio").innerHTML = FOGLI.map(f => '<option value="' + f.id + '">' + esc(f.nome) + "</option>").join("");
  $("inData").value = new Date().toISOString().slice(0, 10);
  caricaPreferenze();
  const campo = $("cercaGlobale");
  campo.addEventListener("input", e => cercaTutto(e.target.value));
  const cercaInvio = () => {
    const q = campo.value.trim();
    if(q.length < 2){ setStato("Scrivi almeno 3 lettere del nome (o il CAS, o la formula), poi premi Cerca.", true); campo.focus(); return; }
    const primo = $("presetList").querySelector("[role=option]");
    if(primo && /archivio locale/.test(primo.textContent)) { primo.click(); return; }
    importaDaPubChem(sembraFormula(q) ? q : (traduci(q) || q));
  };
  $("btnCerca").onclick = cercaInvio;
  campo.addEventListener("keydown", e => {
    if(e.key === "Enter"){ e.preventDefault(); cercaInvio(); }
    if(e.key === "ArrowDown"){ const p = $("presetList").querySelector("[role=option]"); if(p){ e.preventDefault(); p.focus(); } }
  });
  $("presetList").addEventListener("keydown", e => {
    if(e.key === "ArrowDown" && e.target.nextElementSibling){ e.preventDefault(); e.target.nextElementSibling.focus(); }
    if(e.key === "ArrowUp"){ e.preventDefault(); (e.target.previousElementSibling || campo).focus(); }
  });
  $("filtroH").addEventListener("input", e => costruisciListaFrasi("H", e.target.value));
  $("filtroP").addEventListener("input", e => costruisciListaFrasi("P", e.target.value));
  $("btnMiscelaToggle").onclick = toggleMiscela;
  $("btnAggComp").onclick = aggiungiComponente;
  $("btnCreaMiscela").onclick = creaMiscela;
  $("listaComponenti").onclick = e => { const b = e.target.closest("[data-rimcomp]"); if(b) rimuoviComponente(+b.dataset.rimcomp); };
  $("inNome").addEventListener("input", aggiornaBtnComp);
  $("btnNuova").onclick = () => nuovaEtichetta(true);
  document.querySelectorAll("[data-vai]").forEach(b => b.onclick = () => vaiStep(+b.dataset.vai));
  document.querySelectorAll("#stepper button").forEach(b => b.onclick = () => vaiStep(+b.dataset.step));

  // contenitori e formato
  $("contGrid").onclick = e => { const b = e.target.closest("[data-cont]"); if(b) selezionaContenitore(b.dataset.cont); };
  $("formatiProposti").onclick = e => { const b = e.target.closest("[data-formato]"); if(b) applicaFormato(+b.dataset.formato); };
  ["inCapacita", "inUnita"].forEach(id => $(id).addEventListener("input", () => { mostraFormati(); aggiornaNoteContenitore(); }));
  ["inW", "inH"].forEach(id => $(id).addEventListener("input", () => { formatoScelto = proposteFormato().length - 1; mostraFormati(); }));
  ["inLayout", "inDiam", "inFlag"].forEach(id => $(id).addEventListener("input", aggiornaCampiMisura));
  $("inStandard").addEventListener("change", e => {
    if(!e.target.value) return;
    const [w, h] = e.target.value.split("x").map(Number);
    if($("inLayout").value === "avvolgente" || $("inLayout").value === "bandiera") $("inLayout").value = "auto";
    $("inW").value = w; $("inH").value = h; e.target.value = "";
    formatoScelto = proposteFormato().length - 1; mostraFormati(); aggiornaCampiMisura(); pianificaRender();
  });

  // step 4
  $("ckPittoAuto").addEventListener("change", () => { $("inPitto").disabled = $("ckPittoAuto").checked; });
  $("inPitto").addEventListener("input", () => { $("ckPittoAuto").checked = false; });
  $("ckQR").addEventListener("change", () => { $("boxQR").hidden = !$("ckQR").checked; });
  $("inFoglio").addEventListener("change", aggiornaCampiFoglio);
  $("btnStampa").onclick = stampa;
  $("btnCoda").onclick = aggiungiCoda;
  $("btnAnteprimaFoglio").onclick = anteprimaFoglio;
  $("btnChiudiFoglio").onclick = () => { $("dlgFoglio").hidden = true; $("btnAnteprimaFoglio").focus(); };
  $("dlgFoglio").addEventListener("click", e => { if(e.target.id === "dlgFoglio") $("btnChiudiFoglio").click(); });
  document.addEventListener("keydown", e => { if(e.key === "Escape" && !$("dlgFoglio").hidden) $("btnChiudiFoglio").click(); });
  $("listaCoda").addEventListener("input", e => { const i = e.target.dataset.copiecoda; if(i !== undefined){ CODA[+i].copie = Math.max(1, Math.min(500, parseInt(e.target.value, 10) || 1)); pianificaRender(); } });
  $("listaCoda").addEventListener("click", e => { const b = e.target.closest("[data-rimcoda]"); if(b){ CODA.splice(+b.dataset.rimcoda, 1); aggiornaCoda(); } });
  $("listaRecenti").addEventListener("click", e => { const b = e.target.closest("[data-del]"); if(b){ e.stopPropagation(); eliminaRecente(+b.dataset.del); } }, true);
  $("btnPng").onclick = () => conAttesa($("btnPng"), () => esportaPNG(ultimo.svg, ultimo.o.w, ultimo.o.h, val("inNome"), 600));
  $("btnPdf").onclick = () => conAttesa($("btnPdf"), () => esportaPDF([{ svg: ultimo.svg, wMm: ultimo.o.w, hMm: ultimo.o.h }], val("inNome"), 600));
  $("btnSvg").onclick = () => esportaSVG(ultimo.svg, val("inNome"));
  $("btnPdfFoglio").onclick = () => conAttesa($("btnPdfFoglio"), async () => {
    const voci = controllaPrimaDiStampare(); if(!voci) return;
    const { pagine } = composizionePagine(voci);
    await esportaPDF(pagine.map(p => ({ svg: svgPagina(p.pezzi), wMm: 210, hMm: 297 })), "etichette-" + (val("inNome") || "foglio"), 300);
  });
  // zoom e pannello mobile
  $("btnZoomReale").onclick = () => { stato.zoom = "reale"; dimensionaAnteprima(); };
  $("btnZoomAdatta").onclick = () => { stato.zoom = "adatta"; dimensionaAnteprima(); };
  $("btnApriAnteprima").onclick = () => {
    const p = $("pannelloAnteprima"); const chiuso = p.classList.toggle("chiuso");
    $("btnApriAnteprima").setAttribute("aria-expanded", !chiuso); $("btnApriAnteprima").textContent = chiuso ? "▴" : "▾";
  };
  window.addEventListener("resize", dimensionaAnteprima);
  // qualsiasi modifica → anteprima aggiornata dal vivo
  document.addEventListener("input", e => { if(!e.target.closest("#dlgFoglio")) pianificaRender(); if(CAMPI_PREF.includes(e.target.id) || e.target.id === "ckRicorda") salvaPreferenze(); });
  document.addEventListener("change", pianificaRender);

  if(window.matchMedia("(max-width: 900px)").matches) $("boxRegole").open = false;
  costruisciPicto();
  costruisciListaFrasi("H");
  costruisciListaFrasi("P");
  costruisciContenitori();
  aggiornaCampiFoglio();
  mostraRecenti();
  selezionaContenitore(stato.contId);
  vaiStep(1);
  render();
  campo.focus({ preventScroll: true });
}
document.addEventListener("DOMContentLoaded", avvia);
