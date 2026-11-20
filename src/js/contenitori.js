"use strict";
/* ============================================================
   CATALOGO CONTENITORI
   Misure tipiche (mm) di articoli da laboratorio comuni: possono variare
   leggermente tra produttori. d = diametro esterno del corpo,
   hEt = altezza utile della zona etichettabile (parte cilindrica),
   per i contenitori piatti wEt × hEt = faccia etichettabile.
   cap = capacità nominale in ml (per i solidi: g).
   layout = disposizione consigliata dell'etichetta.
   ============================================================ */
const CONTENITORI = [
  // --- Microprovette ---
  {id:"pcr02", gruppo:"micro", nome:"Provetta PCR 0,2 ml", cap:0.2, d:6, hEt:8, icona:"pcr", layout:"bandiera", flagW:20,
   nota:"Troppo piccola per un'etichetta: usa un'etichetta a bandiera (o un codice sul tappo) e l'etichetta completa sul rack o sulla scatola."},
  {id:"epp05", gruppo:"micro", nome:"Eppendorf 0,5 ml", cap:0.5, d:8, hEt:12, icona:"eppendorf", layout:"bandiera", flagW:22},
  {id:"epp15", gruppo:"micro", nome:"Eppendorf 1,5 ml", cap:1.5, d:10.8, hEt:18, icona:"eppendorf", layout:"avvolgente"},
  {id:"epp2",  gruppo:"micro", nome:"Eppendorf 2 ml", cap:2, d:10.8, hEt:22, icona:"eppendorf", layout:"avvolgente"},
  {id:"cryo2", gruppo:"micro", nome:"Criovial 2 ml", cap:2, d:12.5, hEt:28, icona:"criovial", layout:"avvolgente",
   nota:"Per azoto liquido / −80 °C usa etichette criogeniche: le etichette di carta normali si staccano."},
  // --- Provette ---
  {id:"fal15", gruppo:"provette", nome:"Provetta conica 15 ml (tipo Falcon)", cap:15, d:17, hEt:55, icona:"falcon", layout:"avvolgente"},
  {id:"fal50", gruppo:"provette", nome:"Provetta conica 50 ml (tipo Falcon)", cap:50, d:29, hEt:65, icona:"falcon", layout:"verticale"},
  {id:"prov16", gruppo:"provette", nome:"Provetta in vetro 16×100 mm", cap:10, d:16, hEt:55, icona:"provetta", layout:"avvolgente"},
  // --- Vial ---
  {id:"vial2",  gruppo:"vial", nome:"Vial 2 ml (12×32 mm, HPLC)", cap:2, d:12, hEt:16, icona:"vial", layout:"avvolgente"},
  {id:"vial4",  gruppo:"vial", nome:"Vial 4 ml (15×45 mm)", cap:4, d:15, hEt:24, icona:"vial", layout:"avvolgente"},
  {id:"vial20", gruppo:"vial", nome:"Vial 20 ml (28×61 mm, scintillazione)", cap:20, d:28, hEt:35, icona:"vial", layout:"orizzontale"},
  // --- Flaconi e bottiglie ---
  {id:"fl100",  gruppo:"flaconi", nome:"Flacone 100 ml (GL45)", cap:100, d:56, hEt:45, icona:"flacone", layout:"orizzontale"},
  {id:"fl250",  gruppo:"flaconi", nome:"Flacone 250 ml (GL45)", cap:250, d:70, hEt:65, icona:"flacone", layout:"auto"},
  {id:"fl500",  gruppo:"flaconi", nome:"Flacone 500 ml (GL45)", cap:500, d:86, hEt:90, icona:"flacone", layout:"auto"},
  {id:"fl1000", gruppo:"flaconi", nome:"Flacone 1000 ml (GL45)", cap:1000, d:101, hEt:120, icona:"flacone", layout:"auto"},
  {id:"reag25", gruppo:"flaconi", nome:"Bottiglia reagenti 2,5 L (vetro ambrato)", cap:2500, d:130, hEt:150, icona:"reagente", layout:"auto"},
  {id:"spruz",  gruppo:"flaconi", nome:"Spruzzetta 500 ml", cap:500, d:75, hEt:80, icona:"spruzzetta", layout:"auto",
   nota:"Spruzzette e contenitori di travaso: anche per uso quotidiano serve almeno nome della sostanza e pittogrammi."},
  {id:"bar100", gruppo:"flaconi", nome:"Barattolo per solidi 100 g", cap:100, unita:"g", d:50, hEt:40, icona:"barattolo", layout:"orizzontale",
   nota:"Etichetta sul corpo, non sul coperchio (i coperchi si scambiano). Per i solidi indica il peso."},
  {id:"bar500", gruppo:"flaconi", nome:"Barattolo per solidi 500 g", cap:500, unita:"g", d:85, hEt:70, icona:"barattolo", layout:"auto",
   nota:"Etichetta sul corpo, non sul coperchio (i coperchi si scambiano). Per i solidi indica il peso."},
  // --- Siringhe ---
  {id:"sir1",  gruppo:"siringhe", nome:"Siringa 1 ml", cap:1, d:6.5, hEt:50, icona:"siringa", layout:"bandiera", flagW:24},
  {id:"sir5",  gruppo:"siringhe", nome:"Siringa 5 ml", cap:5, d:13, hEt:40, icona:"siringa", layout:"bandiera", flagW:28},
  {id:"sir10", gruppo:"siringhe", nome:"Siringa 10 ml", cap:10, d:16, hEt:50, icona:"siringa", layout:"avvolgente"},
  {id:"sir20", gruppo:"siringhe", nome:"Siringa 20 ml", cap:20, d:20, hEt:60, icona:"siringa", layout:"avvolgente"},
  {id:"sir50", gruppo:"siringhe", nome:"Siringa 50 ml", cap:50, d:29, hEt:80, icona:"siringa", layout:"avvolgente"},
  // --- Piastre e vetreria ---
  {id:"petri", gruppo:"vetreria", nome:"Piastra Petri 90 mm", cap:25, wEt:50, hEt:30, icona:"petri", layout:"orizzontale",
   nota:"Etichetta sul fondo della piastra (non sul coperchio), lasciando libera la zona centrale se devi osservare."},
  {id:"pia96", gruppo:"vetreria", nome:"Piastra multipozzetto (96 / 24 / 6)", cap:20, wEt:70, hEt:35, icona:"piastra", layout:"orizzontale"},
  {id:"becher", gruppo:"vetreria", nome:"Becher 250 ml", cap:250, d:70, hEt:50, icona:"becher", layout:"orizzontale",
   nota:"Vetreria da lavoro, non da conservazione: se la sostanza vi rimane oltre l'uso immediato serve almeno nome + pittogrammi; a fine giornata travasa in un contenitore etichettato."},
  {id:"beuta", gruppo:"vetreria", nome:"Beuta 250 ml", cap:250, wEt:50, hEt:38, icona:"beuta", layout:"orizzontale"},
  {id:"matr", gruppo:"vetreria", nome:"Matraccio tarato 100 ml", cap:100, wEt:40, hEt:30, icona:"matraccio", layout:"orizzontale"},
  // --- Grandi contenitori ---
  {id:"tan5",  gruppo:"grandi", nome:"Tanica 5 L", cap:5000, wEt:140, hEt:110, icona:"tanica", layout:"auto"},
  {id:"tan10", gruppo:"grandi", nome:"Tanica 10 L", cap:10000, wEt:180, hEt:140, icona:"tanica", layout:"auto"},
  {id:"tan25", gruppo:"grandi", nome:"Tanica 25 L", cap:25000, wEt:250, hEt:180, icona:"tanica", layout:"auto",
   nota:"Etichetta sul fianco, ben visibile in posizione di stoccaggio. Per il trasporto su strada valgono anche le norme ADR."},
  {id:"fusto", gruppo:"grandi", nome:"Fusto 200 L", cap:200000, wEt:400, hEt:400, icona:"fusto", layout:"auto"},
  {id:"sacco", gruppo:"grandi", nome:"Sacco 25 kg", cap:25000, unita:"g", wEt:300, hEt:220, icona:"sacco", layout:"auto"},
  {id:"bomb",  gruppo:"grandi", nome:"Bombola gas 50 L", cap:50000, wEt:120, hEt:150, icona:"bombola", layout:"auto",
   nota:"Bombole: valgono regole specifiche (CLP All. I, 1.3.1; norma EN ISO 7225 per l'etichetta sull'ogiva). Ricorda GHS04 se pertinente."},
  // --- Imballaggio esterno ---
  {id:"scatola", gruppo:"esterni", nome:"Scatola / rack per provette", cap:50, wEt:120, hEt:60, icona:"scatola", layout:"auto",
   nota:"Imballaggio esterno: qui va l'etichetta completa quando sui singoli contenitori piccoli c'è solo l'etichetta ridotta."},
  {id:"pers", gruppo:"esterni", nome:"Misura personalizzata", cap:1000, wEt:74, hEt:52, icona:"personalizzato", layout:"auto", personalizzato:true}
];

const GRUPPI_CONT = {
  micro:"Microprovette", provette:"Provette", vial:"Vial", flaconi:"Flaconi e barattoli",
  siringhe:"Siringhe", vetreria:"Piastre e vetreria", grandi:"Grandi contenitori", esterni:"Scatole e altro"
};

/* ---------- Disegni SVG originali (viewBox 0 0 64 64) ----------
   Il rettangolo giallo tratteggiato indica la zona dove si applica l'etichetta. */
const ICONE_CONT = (() => {
  const S = 'stroke="#2b3a55" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"';
  const vetro = 'fill="#eaf2fb" ' + S;
  const plast = 'fill="#f7f9fc" ' + S;
  const et = (x, y, w, h) => '<rect class="ic-et" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="1" fill="#ffe08a" stroke="#c99a06" stroke-width="1" stroke-dasharray="2 1.5"/>';
  const liquido = (d) => '<path d="' + d + '" fill="#9cc7ef" opacity=".7"/>';
  return {
    pcr: liquido("M27 40 L37 40 L33 52 L31 52 Z") +
      '<path d="M26 24 h12 v12 l-5 18 h-2 l-5 -18 z" ' + plast + '/>' +
      '<rect x="24" y="19" width="16" height="5" rx="1.5" ' + plast + '/>' + '<path d="M40 21 q6 -1 6 -7 h-8" fill="none" ' + S + '/>' + et(26.5, 27, 11, 7),
    eppendorf: liquido("M25 40 L39 40 L34 54 L30 54 Z") +
      '<path d="M23 18 h18 v16 l-7 21 h-4 l-7 -21 z" ' + plast + '/>' +
      '<rect x="21" y="13" width="22" height="5" rx="1.5" ' + plast + '/>' +
      '<path d="M43 15 q8 0 8 -8 h-10 v3" fill="none" ' + S + '/>' + et(23.5, 20, 17, 12),
    criovial: liquido("M24 34 h16 v18 a3 3 0 0 1 -3 3 h-10 a3 3 0 0 1 -3 -3 z") +
      '<rect x="22" y="6" width="20" height="10" rx="2" fill="#7fb2e5" ' + S + '/><path d="M24 16 h16 v37 a4 4 0 0 1 -4 4 h-8 a4 4 0 0 1 -4 -4 z" ' + plast + '/>' + et(24.5, 22, 15, 24),
    falcon: liquido("M24 34 h16 v18 l-6 7 h-4 l-6 -7 z") +
      '<rect x="22" y="3" width="20" height="8" rx="1.5" fill="#4f8fd6" ' + S + '/><path d="M23 11 h18 v41 l-7 8 h-4 l-7 -8 z" ' + plast + '/>' + et(24.5, 16, 15, 28),
    provetta: liquido("M26 34 h12 v18 a6 6 0 0 1 -12 0 z") +
      '<path d="M25 6 h14 M26 6 v46 a6 6 0 0 0 12 0 v-46" ' + vetro + '/>' + et(27, 14, 10, 26),
    vial: liquido("M22 36 h20 v16 a3 3 0 0 1 -3 3 h-14 a3 3 0 0 1 -3 -3 z") +
      '<rect x="24" y="8" width="16" height="9" rx="1.5" fill="#d64545" ' + S + '/><path d="M26 17 h12 v4 h4 v31 a3 3 0 0 1 -3 3 h-14 a3 3 0 0 1 -3 -3 v-31 h4 z" ' + vetro + '/>' + et(23.5, 27, 17, 18),
    flacone: liquido("M15 36 h34 v18 a4 4 0 0 1 -4 4 h-26 a4 4 0 0 1 -4 -4 z") +
      '<rect x="23" y="4" width="18" height="9" rx="2" fill="#3c78c3" ' + S + '/><path d="M26 13 h12 v5 q11 3 11 12 v24 a4 4 0 0 1 -4 4 h-26 a4 4 0 0 1 -4 -4 v-24 q0 -9 11 -12 z" ' + vetro + '/>' + et(18, 32, 28, 18),
    reagente: '<rect x="25" y="3" width="14" height="8" rx="1.5" fill="#222" ' + S + '/><path d="M27 11 h10 v6 q12 4 12 14 v25 a3 3 0 0 1 -3 3 h-28 a3 3 0 0 1 -3 -3 v-25 q0 -10 12 -14 z" fill="#b8742a" ' + S + '/>' + et(19, 31, 26, 20),
    spruzzetta: liquido("M18 40 h28 v14 a4 4 0 0 1 -4 4 h-20 a4 4 0 0 1 -4 -4 z") +
      '<path d="M30 14 q0 -10 14 -10 l8 -1" fill="none" ' + S + '/><rect x="24" y="12" width="16" height="7" rx="1.5" fill="#e14b4b" ' + S + '/><path d="M20 19 h24 q2 2 2 5 v30 a4 4 0 0 1 -4 4 h-20 a4 4 0 0 1 -4 -4 v-30 q0 -3 2 -5 z" ' + plast + '/>' + et(20, 28, 24, 18),
    barattolo: '<rect x="14" y="10" width="36" height="8" rx="2" fill="#6b7a90" ' + S + '/><path d="M15 18 h34 v36 a4 4 0 0 1 -4 4 h-26 a4 4 0 0 1 -4 -4 z" ' + plast + '/>' +
      '<path d="M18 46 l4 -3 4 2 5 -4 5 3 4 -2 5 3 v7 h-27 z" fill="#d9d2c4"/>' + et(19, 24, 26, 16),
    siringa: liquido("M14 28 h20 v8 h-20 z") +
      '<path d="M8 25 h34 v14 h-34 z" ' + plast + '/><path d="M42 29 h4 v6 h-4 M46 31.5 h12" fill="none" ' + S + '/><path d="M8 32 h-4 M4 26 v12 M8 22 v20" fill="none" ' + S + '/>' + et(15, 26, 22, 12),
    petri: '<ellipse cx="32" cy="38" rx="26" ry="12" ' + vetro + '/><ellipse cx="32" cy="33" rx="26" ry="12" ' + vetro + '/>' +
      '<circle cx="24" cy="33" r="2" fill="#f2b84b"/><circle cx="36" cy="30" r="2.5" fill="#e98a6a"/><circle cx="40" cy="37" r="1.6" fill="#f2b84b"/>' + et(14, 41, 36, 8),
    piastra: '<path d="M6 22 h52 v26 h-52 z" ' + plast + '/>' +
      [0,1,2,3,4,5].map(c => [0,1,2,3].map(r => '<circle cx="' + (12 + c * 8) + '" cy="' + (25.5 + r * 5) + '" r="1.8" fill="#cfe0f3" stroke="#2b3a55" stroke-width=".7"/>').join("")).join("") +
      et(9, 43, 46, 4),
    becher: liquido("M17 34 h30 v20 a3 3 0 0 1 -3 3 h-24 a3 3 0 0 1 -3 -3 z") +
      '<path d="M13 10 h36 M15 10 v44 a3 3 0 0 0 3 3 h28 a3 3 0 0 0 3 -3 v-44" ' + vetro + '/><path d="M42 18 h7 M44 26 h5 M42 34 h7" ' + S + ' fill="none"/>' + et(19, 22, 20, 14),
    beuta: liquido("M16 46 h32 l6 8 a3 3 0 0 1 -3 4 h-38 a3 3 0 0 1 -3 -4 z") +
      '<path d="M26 6 h12 M27 6 v18 l-17 30 a3 3 0 0 0 3 4 h38 a3 3 0 0 0 3 -4 l-17 -30 v-18" ' + vetro + '/>' + et(22, 34, 20, 10),
    matraccio: liquido("M18 46 a14 10 0 0 0 28 0 z") +
      '<path d="M29 4 h6 M30 4 v26 a14 14 0 1 0 4 0 v-26" ' + vetro + '/><path d="M28 14 h8" ' + S + '/>' + et(22, 38, 20, 8),
    tanica: '<path d="M10 16 h30 l6 -6 h8 v48 a3 3 0 0 1 -3 3 h-38 a3 3 0 0 1 -3 -3 z" ' + plast + '/><rect x="38" y="4" width="10" height="6" rx="1" fill="#e0a526" ' + S + '/><path d="M14 16 v-6 h16 v6" fill="none" ' + S + '/>' + et(15, 26, 30, 24),
    fusto: '<path d="M12 8 h40 v48 h-40 z" fill="#4f7cbf" ' + S + '/><path d="M12 22 h40 M12 42 h40" ' + S + '/><ellipse cx="32" cy="8" rx="20" ry="3" fill="#6d95cf" ' + S + '/>' + et(20, 25, 24, 14),
    sacco: '<path d="M12 10 q20 -4 40 0 l4 46 q-24 5 -48 0 z" fill="#efe3c8" ' + S + '/><path d="M14 14 q18 -3 36 0" fill="none" ' + S + '/>' + et(18, 24, 28, 22),
    bombola: '<path d="M24 14 a8 8 0 0 1 16 0 v42 a3 3 0 0 1 -3 3 h-10 a3 3 0 0 1 -3 -3 z" fill="#9ab0c8" ' + S + '/><rect x="28" y="2" width="8" height="6" fill="#555" ' + S + '/><path d="M32 8 v-2" ' + S + '/>' + et(25, 10, 14, 10),
    scatola: '<path d="M8 20 l24 -8 24 8 v30 l-24 8 -24 -8 z" fill="#efe9dd" ' + S + '/><path d="M8 20 l24 8 24 -8 M32 28 v30" fill="none" ' + S + '/>' + et(12, 32, 16, 12),
    personalizzato: '<rect x="10" y="14" width="44" height="36" rx="3" fill="#fff" stroke="#2b3a55" stroke-width="1.6" stroke-dasharray="4 3"/>' +
      '<path d="M10 56 h44 M10 53 v6 M54 53 v6 M4 14 v36 M1 14 h6 M1 50 h6" stroke="#c8102e" stroke-width="1.4" fill="none"/>' +
      '<text x="32" y="36" font-size="9" text-anchor="middle" font-family="Arial" fill="#2b3a55">mm</text>'
  };
})();

function iconaContenitore(c, px){
  const s = px || 64;
  return '<svg class="ic-cont" viewBox="0 0 64 64" width="' + s + '" height="' + s + '" aria-hidden="true">' +
    (ICONE_CONT[c.icona] || ICONE_CONT.personalizzato) + '</svg>';
}

/* Superficie etichettabile e formato consigliato per un contenitore */
function circonferenza(d){ return Math.PI * d; }

function superficieContenitore(c){
  if(c.d){
    const circ = circonferenza(c.d);
    // un'etichetta piatta su un cilindro resta leggibile fino a circa metà circonferenza
    return { piatta: [Math.round(Math.min(circ * 0.5, 250)), c.hEt], avvolgente: [Math.round(circ * 10) / 10, c.hEt], d: c.d };
  }
  return { piatta: [c.wEt, c.hEt], d: null };
}
