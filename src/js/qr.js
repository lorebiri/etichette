"use strict";
/* ============================================================
   QR CODE — generatore nativo (byte mode, ECC L, mask 0, v1–v5)
   ============================================================ */
const QR_CAP = [0,17,32,53,78,106];   // capacità in byte per versione (ECC L)
const QR_EC  = [0,7,10,15,20,26];     // codeword di correzione errori
const QR_TOT = [0,26,44,70,100,134];  // codeword totali

function qrMatrix(testo){
  let dati = Array.from(new TextEncoder().encode(testo));
  let v = QR_CAP.findIndex(c => dati.length <= c);
  if(v < 1){ v = 5; dati = dati.slice(0, QR_CAP[5]); }
  const nData = QR_TOT[v] - QR_EC[v];

  // bitstream: modo byte (0100) + conteggio (8 bit) + dati + terminatore + padding
  const bits = [];
  const push = (val, n) => { for(let i = n-1; i >= 0; i--) bits.push((val >> i) & 1); };
  push(4, 4); push(dati.length, 8);
  dati.forEach(b => push(b, 8));
  push(0, Math.min(4, nData * 8 - bits.length));
  while(bits.length % 8) bits.push(0);
  const cw = [];
  for(let i = 0; i < bits.length; i += 8){ let b = 0; for(let j = 0; j < 8; j++) b = (b << 1) | bits[i+j]; cw.push(b); }
  const pad = [236, 17]; let pi = 0;
  while(cw.length < nData) cw.push(pad[pi++ % 2]);

  // Reed-Solomon su GF(256)
  const EXP = new Array(512), LOG = new Array(256);
  for(let i = 0, x = 1; i < 255; i++){ EXP[i] = x; LOG[x] = i; x <<= 1; if(x & 256) x ^= 0x11d; }
  for(let i = 255; i < 512; i++) EXP[i] = EXP[i-255];
  const mul = (a, b) => (a && b) ? EXP[LOG[a] + LOG[b]] : 0;
  let gen = [1];
  for(let i = 0; i < QR_EC[v]; i++){
    const np = new Array(gen.length + 1).fill(0);
    for(let j = 0; j < gen.length; j++){ np[j] ^= gen[j]; np[j+1] ^= mul(gen[j], EXP[i]); }
    gen = np;
  }
  const msg = cw.concat(new Array(QR_EC[v]).fill(0));
  for(let i = 0; i < cw.length; i++){
    const c = msg[i];
    if(c) for(let j = 0; j < gen.length; j++) msg[i+j] ^= mul(gen[j], c);
  }
  const finali = cw.concat(msg.slice(cw.length));

  // matrice: pattern funzionali
  const size = 17 + 4 * v;
  const M = Array.from({length: size}, () => new Array(size).fill(null));
  function finder(r, c){
    for(let dr = -1; dr <= 7; dr++) for(let dc = -1; dc <= 7; dc++){
      const rr = r + dr, cc = c + dc;
      if(rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
      const dentro = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6;
      M[rr][cc] = dentro && (dr === 0 || dr === 6 || dc === 0 || dc === 6 || (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4));
    }
  }
  finder(0, 0); finder(0, size - 7); finder(size - 7, 0);
  for(let i = 8; i < size - 8; i++){ M[6][i] = i % 2 === 0; M[i][6] = i % 2 === 0; }
  if(v >= 2){
    const p = 4 * v + 10;
    for(let dr = -2; dr <= 2; dr++) for(let dc = -2; dc <= 2; dc++)
      M[p+dr][p+dc] = Math.max(Math.abs(dr), Math.abs(dc)) !== 1;
  }
  M[4*v + 9][8] = true; // modulo scuro
  for(let i = 0; i < 9; i++){ if(M[8][i] === null) M[8][i] = false; if(M[i][8] === null) M[i][8] = false; }
  for(let i = size - 8; i < size; i++){ if(M[8][i] === null) M[8][i] = false; if(M[i][8] === null) M[i][8] = false; }

  // dati a zigzag con mask 0 ((r+c) % 2 === 0)
  const flusso = [];
  finali.forEach(b => { for(let i = 7; i >= 0; i--) flusso.push((b >> i) & 1); });
  let bi = 0, salita = true;
  for(let col = size - 1; col > 0; col -= 2){
    if(col === 6) col--;
    for(let k = 0; k < size; k++){
      const r = salita ? size - 1 - k : k;
      for(const c of [col, col - 1]){
        if(M[r][c] === null){
          const bit = bi < flusso.length ? flusso[bi] : 0; bi++;
          M[r][c] = (bit ^ ((r + c) % 2 === 0 ? 1 : 0)) === 1;
        }
      }
    }
    salita = !salita;
  }

  // informazione di formato (ECC L, mask 0) con BCH(15,5)
  const fdata = (0b01 << 3) | 0;
  let fd = fdata << 10;
  const G = 0b10100110111;
  for(let i = 14; i >= 10; i--) if((fd >> i) & 1) fd ^= G << (i - 10);
  const F = ((fdata << 10) | fd) ^ 0b101010000010010;
  const fb = []; for(let i = 14; i >= 0; i--) fb.push((F >> i) & 1);
  const posA = [[8,0],[8,1],[8,2],[8,3],[8,4],[8,5],[8,7],[8,8],[7,8],[5,8],[4,8],[3,8],[2,8],[1,8],[0,8]];
  posA.forEach((p, i) => M[p[0]][p[1]] = fb[i] === 1);
  for(let i = 0; i < 7; i++) M[size-1-i][8] = fb[i] === 1;
  for(let i = 0; i < 8; i++) M[8][size-8+i] = fb[7+i] === 1;
  return M;
}
