"use strict";
/* ============================================================
   ESPORTAZIONE PNG / PDF / SVG — tutto nel browser, nessun servizio esterno
   ============================================================ */

/* disegna una SVG (con width/height in mm) su un canvas alla risoluzione dpi */
function svgSuCanvas(svg, wMm, hMm, dpi){
  return new Promise((ok, ko) => {
    const px = v => Math.max(1, Math.round(v / 25.4 * dpi));
    const W = px(wMm), H = px(hMm);
    const s2 = svg.replace(/ width="[\d.]+mm" height="[\d.]+mm"/, ' width="' + W + '" height="' + H + '"');
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = W; c.height = H;
      const g = c.getContext("2d");
      g.fillStyle = "#fff"; g.fillRect(0, 0, W, H);
      g.drawImage(img, 0, 0, W, H);
      ok(c);
    };
    img.onerror = () => ko(new Error("svg"));
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(s2);
  });
}

/* CRC32 per i blocchi PNG */
const _crcTab = (() => { const t = new Uint32Array(256); for(let n = 0; n < 256; n++){ let c = n; for(let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(b){ let c = 0xffffffff; for(let i = 0; i < b.length; i++) c = _crcTab[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }

/* aggiunge al PNG il blocco pHYs: chi lo apre/stampa conosce la dimensione reale */
async function pngConDpi(blob, dpi){
  const b = new Uint8Array(await blob.arrayBuffer());
  const ppm = Math.round(dpi / 0.0254);
  const chunk = new Uint8Array(21);
  const dv = new DataView(chunk.buffer);
  dv.setUint32(0, 9);
  chunk.set([0x70, 0x48, 0x59, 0x73], 4);     // "pHYs"
  dv.setUint32(8, ppm); dv.setUint32(12, ppm); chunk[16] = 1;
  dv.setUint32(17, crc32(chunk.subarray(4, 17)));
  const fineIHDR = 8 + 25;
  const out = new Uint8Array(b.length + 21);
  out.set(b.subarray(0, fineIHDR), 0); out.set(chunk, fineIHDR); out.set(b.subarray(fineIHDR), fineIHDR + 21);
  return new Blob([out], { type: "image/png" });
}

function scarica(blob, nome){
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = nome;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
function nomeFile(s){ return (s || "etichetta").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\w.-]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 60) || "etichetta"; }

async function esportaPNG(svg, wMm, hMm, nome, dpi){
  dpi = dpi || 600;
  const c = await svgSuCanvas(svg, wMm, hMm, dpi);
  const blob = await new Promise(ok => c.toBlob(ok, "image/png"));
  const finale = await pngConDpi(blob, dpi);
  scarica(finale, nomeFile(nome) + ".png");
  return finale;
}

/* compressione zlib (FlateDecode) con l'API del browser */
async function deflate(bytes){
  if(typeof CompressionStream === "undefined") return null;
  const cs = new CompressionStream("deflate");
  const st = new Blob([bytes]).stream().pipeThrough(cs);
  return new Uint8Array(await new Response(st).arrayBuffer());
}

/* PDF minimale: una immagine per pagina, a dimensione reale.
   pagine: [{canvas, wMm, hMm}] */
async function creaPDF(pagine){
  const enc = new TextEncoder();
  const parti = [];
  let off = 0;
  const offs = [];
  const scrivi = (x) => { const b = typeof x === "string" ? enc.encode(x) : x; parti.push(b); off += b.length; };
  scrivi("%PDF-1.4\n%âãÏÓ\n");
  const nPag = pagine.length;
  // oggetti: 1 catalogo, 2 pagine, poi per pagina: pagina, contenuto, immagine
  const idPag = i => 3 + i * 3;
  const obj = (n, corpo) => { offs[n] = off; scrivi(n + " 0 obj\n"); corpo(); scrivi("\nendobj\n"); };
  obj(1, () => scrivi("<< /Type /Catalog /Pages 2 0 R >>"));
  obj(2, () => scrivi("<< /Type /Pages /Count " + nPag + " /Kids [" + pagine.map((_, i) => idPag(i) + " 0 R").join(" ") + "] >>"));
  for(let i = 0; i < nPag; i++){
    const p = pagine[i];
    const wPt = (p.wMm / 25.4 * 72).toFixed(3), hPt = (p.hMm / 25.4 * 72).toFixed(3);
    const W = p.canvas.width, H = p.canvas.height;
    const rgba = p.canvas.getContext("2d").getImageData(0, 0, W, H).data;
    const rgb = new Uint8Array(W * H * 3);
    for(let j = 0, k = 0; j < rgba.length; j += 4){ rgb[k++] = rgba[j]; rgb[k++] = rgba[j + 1]; rgb[k++] = rgba[j + 2]; }
    let dati = await deflate(rgb), filtro = "/Filter /FlateDecode ";
    if(!dati){ dati = rgb; filtro = ""; }
    const cont = "q " + wPt + " 0 0 " + hPt + " 0 0 cm /Im0 Do Q";
    obj(idPag(i), () => scrivi("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 " + wPt + " " + hPt + "] /Resources << /XObject << /Im0 " + (idPag(i) + 2) + " 0 R >> >> /Contents " + (idPag(i) + 1) + " 0 R >>"));
    obj(idPag(i) + 1, () => { scrivi("<< /Length " + cont.length + " >>\nstream\n" + cont + "\nendstream"); });
    obj(idPag(i) + 2, () => {
      scrivi("<< /Type /XObject /Subtype /Image /Width " + W + " /Height " + H + " /ColorSpace /DeviceRGB /BitsPerComponent 8 " + filtro + "/Length " + dati.length + " >>\nstream\n");
      scrivi(dati); scrivi("\nendstream");
    });
  }
  const nObj = 3 + nPag * 3;
  const xref = off;
  let x = "xref\n0 " + nObj + "\n0000000000 65535 f \n";
  for(let n = 1; n < nObj; n++) x += String(offs[n]).padStart(10, "0") + " 00000 n \n";
  scrivi(x + "trailer\n<< /Size " + nObj + " /Root 1 0 R >>\nstartxref\n" + xref + "\n%%EOF\n");
  return new Blob(parti, { type: "application/pdf" });
}

async function esportaPDF(elencoSvg, nome, dpi){
  const pagine = [];
  for(const p of elencoSvg) pagine.push({ canvas: await svgSuCanvas(p.svg, p.wMm, p.hMm, dpi), wMm: p.wMm, hMm: p.hMm });
  const blob = await creaPDF(pagine);
  scarica(blob, nomeFile(nome) + ".pdf");
  return blob;
}

function esportaSVG(svg, nome){
  scarica(new Blob(['<?xml version="1.0" encoding="UTF-8"?>\n' + svg], { type: "image/svg+xml" }), nomeFile(nome) + ".svg");
}
