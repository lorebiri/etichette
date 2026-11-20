"use strict";
/* ============================================================
   REGOLE (CLP + luoghi di lavoro) — vedi docs/REGOLE-ETICHETTE.md
   Valori: Reg. (CE) 1272/2008, Allegato I, tabella 1.3 (in vigore a nov. 2026);
   altezza minima della "x" del Reg. (UE) 2024/2865, applicabile dal 1.1.2028
   (rinvio del Reg. (UE) 2025/2439). Le misure dei pittogrammi si riferiscono
   al ROMBO (il quadrato appoggiato su un vertice), non al quadrato che lo contiene.
   ============================================================ */
const RAD2 = Math.SQRT2;

/* classi di capacità (litri) */
const CLASSI_CLP = [
  { max: 3,        et: [74, 52],   etTesto: "se possibile almeno 52 × 74", obbl: false, pitto: 16, pittoAss: 10, xh: null },
  { max: 50,       et: [105, 74],  etTesto: "almeno 74 × 105",  obbl: true, pitto: 23, pittoAss: 23 },
  { max: 500,      et: [148, 105], etTesto: "almeno 105 × 148", obbl: true, pitto: 32, pittoAss: 32 },
  { max: Infinity, et: [210, 148], etTesto: "almeno 148 × 210", obbl: true, pitto: 46, pittoAss: 46 }
];

function capacitaInLitri(cap, unita){
  const v = Math.max(0, parseFloat(cap) || 0);
  if(unita === "ml" || unita === "g") return v / 1000;   // per i solidi il peso è usato come stima
  return v;
}
function classeCLP(litri){ return CLASSI_CLP.findIndex(c => litri <= c.max); }

/* altezza minima della x dal 1.1.2028 (Reg. 2024/2865) */
function xHeightMin2028(litri){
  if(litri <= 0.5) return 1.2;
  if(litri <= 3) return 1.4;
  if(litri <= 50) return 1.8;
  return 2.0;
}

/* lato minimo del rombo del pittogramma per una capacità.
   Per ≤ 3 l: "non inferiore a 10 mm; se possibile 16 mm". */
function pittoMinimo(litri){
  const c = CLASSI_CLP[classeCLP(litri)];
  return { consigliato: c.pitto, assoluto: c.pittoAss };
}
/* conversioni rombo ↔ quadrato di ingombro */
const romboDaRiquadro = l => l / RAD2;
const riquadroDaRombo = r => r * RAD2;

const fmt = v => (Math.round(v * 10) / 10).toString().replace(".", ",");

/* ============================================================
   AVVISI — mai bloccanti: spiegano quando una scelta è ammessa
   ctx: {litri, uso, w, h, info, contenuto, pittoManuale, nPicto, picto[], H[], superficie}
   restituisce [{tipo: "ok"|"info"|"avviso", testo}]
   ============================================================ */
function valutaRegole(ctx){
  const out = [];
  const k = classeCLP(ctx.litri);
  const cl = CLASSI_CLP[k];
  const [mw, mh] = cl.et;
  const pm = pittoMinimo(ctx.litri);
  const rombo = romboDaRiquadro(ctx.info.latoPitto || 0);
  const interno = ctx.uso !== "fornitura";
  const piccolo125 = ctx.litri > 0 && ctx.litri <= 0.125;
  const piccolo10 = ctx.litri > 0 && ctx.litri <= 0.010;
  const lati = [ctx.w, ctx.h].sort((a, b) => b - a);
  const sottoMinEt = lati[0] < mw - 0.01 || lati[1] < mh - 0.01;

  const QUANDO_SI = "<details><summary>Quando è ammesso?</summary>Sui <b>contenitori di lavoro usati dentro il laboratorio</b> (aliquote, soluzioni di lavoro) basta che il contenuto e i pericoli siano chiaramente riconoscibili: obbligatori i pittogrammi pertinenti, con nome o formula (D.Lgs. 81/2008, art. 227 c. 3 e All. XXVI). Per un campione <b>fornito ad altri</b> (anche gratis) vale il CLP: sul contenitore piccolo possono bastare pittogrammi, avvertenza e nome solo se l'etichetta completa è sull'<b>imballaggio esterno</b> (scatola, rack, busta) o su un <b>cartellino legato</b> (art. 29 e All. I, 1.5).</details>";

  // 1) pittogrammi sotto il minimo
  if(ctx.nPicto && rombo > 0){
    const sottoAss = rombo < pm.assoluto - 0.05;
    const sottoCons = rombo < pm.consigliato - 0.05;
    if(sottoAss || sottoCons){
      const testo = "Pittogrammi di <b>" + fmt(rombo) + " mm</b> di lato (rombo). Per un imballaggio di questa capacità il CLP chiede " +
        (cl.obbl || k > 0 ? "almeno <b>" + pm.consigliato + " mm</b>" : "<b>non meno di " + pm.assoluto + " mm</b> e, se possibile, almeno <b>" + pm.consigliato + " mm</b>") +
        " (All. I, tabella 1.3; ogni pittogramma ≥ 1/15 dell'area minima dell'etichetta e ≥ 1 cm²). ";
      out.push({ tipo: (sottoAss && !interno) ? "avviso" : "info",
        testo: "📐 " + testo + (sottoAss
          ? (ctx.pittoManuale ? "" : "Su questo formato non c'è spazio per pittogrammi più grandi: valuta l'etichetta a bandiera, «Solo pittogrammi + nome», o l'etichetta completa sull'imballaggio esterno. ") + QUANDO_SI
          : "Va bene se lo spazio sul contenitore non permette di più («se possibile»).") });
    }
  }

  // 2) modalità ridotta / minima
  if(ctx.contenuto === "minima" || (ctx.info.livello && ctx.info.livello.minima)){
    out.push({ tipo: interno ? "info" : "avviso",
      testo: "🏷️ Etichetta <b>solo pittogrammi + nome</b>. " + QUANDO_SI +
        (piccolo10 ? " Per imballaggi interni <b>≤ 10 ml</b> forniti per ricerca e sviluppo o controllo qualità, il CLP (All. I, 1.5.2.4) permette di lasciare sul contenitore solo l'identificatore e, se pertinenti, GHS01, GHS05, GHS06, GHS08, con etichetta completa sull'imballaggio esterno." : "") +
        " Stampa l'etichetta completa per la scatola/rack: scegli «Scatola / rack» allo step 3 e aggiungila alla coda." });
  } else if(ctx.contenuto === "ridotta" || (ctx.info.livello && ctx.info.livello.ridotta)){
    out.push({ tipo: "info",
      testo: "🏷️ Etichetta <b>ridotta</b> (senza testo delle frasi H e senza frasi P). " +
        (piccolo125 ? "Per imballaggi <b>≤ 125 ml</b> il CLP (All. I, 1.5.2.1) permette di omettere frasi H e P solo per alcune categorie di pericolo «lievi» (es. liquidi infiammabili cat. 2–3, irritazione cutanea/oculare cat. 2): pittogrammi e avvertenza restano. " : "") +
        QUANDO_SI });
  } else if(ctx.info.livello && ctx.info.livello.id > 0){
    out.push({ tipo: "info", testo: "✂️ Lo spazio non basta per tutto: l'etichetta è stata accorciata automaticamente (<b>" + ctx.info.livello.nome + "</b>). Per avere il testo completo scegli un formato più grande o stampa l'etichetta completa per l'imballaggio esterno." });
  }
  if(ctx.info.troncato)
    out.push({ tipo: "avviso", testo: "⚠️ Il nome non entra per intero nel formato scelto ed è stato <b>accorciato</b>. Usa un formato più grande, la disposizione a bandiera, o un nome più breve/sigla." });

  // 3) dimensione etichetta
  if(sottoMinEt && ctx.contenuto === "auto" && !(ctx.info.livello && ctx.info.livello.id >= 6)){
    out.push({ tipo: (cl.obbl && !interno) ? "avviso" : "info",
      testo: "📏 Etichetta di " + fmt(ctx.w) + " × " + fmt(ctx.h) + " mm. Per questa capacità il CLP indica " + cl.etTesto + " mm (All. I, 1.2.1.4)." +
        (cl.obbl ? "" : " Per i contenitori fino a 3 litri la misura vale «se possibile»: su contenitori piccoli si può usare meno spazio.") });
  }

  // 4) carattere
  if(ctx.info.font > 0 && (ctx.contenuto !== "minima")){
    const xh = ctx.info.xHeight;
    const xmin = xHeightMin2028(ctx.litri);
    if(xh < 1.2 - 0.005)
      out.push({ tipo: "info", testo: "🔤 Testo piccolo: altezza della «x» " + fmt(xh) + " mm (corpo " + fmt(ctx.info.fontPt) + " pt). ECHA indica 1,2 mm come riferimento di leggibilità; dal 1° gennaio 2028 il CLP chiederà almeno " + fmt(xmin) + " mm per questa capacità (i contenitori ≤ 10 ml potranno usare caratteri più piccoli). Prova un formato più grande o il contenuto «Ridotta»." });
    else if(xh < xmin - 0.005 && !interno)
      out.push({ tipo: "info", testo: "🔤 Altezza della «x» " + fmt(xh) + " mm: oggi va bene se leggibile; dal 1° gennaio 2028 il CLP chiederà almeno " + fmt(xmin) + " mm per questa capacità." });
  }

  // 5) etichetta più grande della superficie del contenitore
  if(ctx.superficie && ctx.layout !== "bandiera"){
    const [sw, sh] = ctx.layout === "avvolgente" && ctx.superficie.avvolgente ? [ctx.superficie.avvolgente[0] + 4, ctx.superficie.avvolgente[1]] : ctx.superficie.piatta;
    if(ctx.w > sw * 1.05 + 1 || ctx.h > sh * 1.05 + 1)
      out.push({ tipo: "info", testo: "📦 L'etichetta (" + fmt(ctx.w) + " × " + fmt(ctx.h) + " mm) è più grande della zona etichettabile tipica di questo contenitore (circa " + fmt(sw) + " × " + fmt(sh) + " mm)." });
  }

  // 6) imballaggi ≤ 125 ml (promemoria)
  if(piccolo125 && ctx.contenuto === "auto" && !out.some(a => /125 ml/.test(a.testo)))
    out.push({ tipo: "info", testo: "ℹ️ Contenitore ≤ 125 ml: per alcune categorie di pericolo «lievi» il CLP permette di omettere frasi H e P (All. I, 1.5.2.1). Pittogrammi e avvertenza restano." });

  // 7) precedenza dei pittogrammi
  const P = ctx.picto || [];
  if(P.includes("GHS06") && P.includes("GHS07"))
    out.push({ tipo: "avviso", testo: "☠️ Con il teschio (GHS06) il punto esclamativo (GHS07) di norma non va usato (CLP art. 26)." });
  if(P.includes("GHS05") && P.includes("GHS07"))
    out.push({ tipo: "info", testo: "ℹ️ Con GHS05 (corrosivo) il GHS07 non si usa per l'irritazione cutanea/oculare (CLP art. 26): controlla che serva per un altro pericolo." });

  if(!out.length) out.push({ tipo: "ok", testo: "✅ Dimensioni di etichetta, pittogrammi e testo nella norma per questo contenitore." });
  return out;
}

/* tabella delle dimensioni minime (step 3) */
function htmlTabellaCLP(litri){
  const k = classeCLP(litri);
  const nomi = ["≤ 3 litri", "> 3 e ≤ 50 litri", "> 50 e ≤ 500 litri", "> 500 litri"];
  return "<tr><th>Capacità dell'imballaggio</th><th>Etichetta (mm)</th><th>Pittogramma (lato del rombo)</th><th>Altezza «x» dal 2028</th></tr>" +
    CLASSI_CLP.map((c, i) => '<tr' + (i === k ? ' class="evid"' : "") + "><td>" + nomi[i] + "</td><td>" + c.etTesto + "</td><td>" +
      (i === 0 ? "≥ 10 mm, se possibile ≥ 16 mm" : "≥ " + c.pitto + " mm") + "</td><td>" +
      (i === 0 ? "1,2 mm (≤ 0,5 l) · 1,4 mm" : fmt(xHeightMin2028(c.max === Infinity ? 1000 : c.max)) + " mm") + "</td></tr>").join("");
}
