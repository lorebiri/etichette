// Unisce i sorgenti di src/ in un unico index.html autonomo (pubblicato da GitHub Pages).
// Uso: node build.mjs        (--check: verifica che index.html sia aggiornato, per la CI)
import { readFileSync, writeFileSync } from "node:fs";
const ORDINE = ["dati-pittogrammi", "dati-frasi", "contenitori", "qr", "layout", "regole", "fogli", "esporta", "app"];
const leggi = p => readFileSync(new URL(p, import.meta.url), "utf8");
const js = ORDINE.map(n => `/* ===== src/js/${n}.js ===== */\n` + leggi(`src/js/${n}.js`).replace(/^"use strict";\n/, "")).join("\n");
const css = leggi("src/style.css");
const html = leggi("src/index.html")
  .replace("/*@CSS*/", () => css)
  .replace("/*@JS*/", () => '"use strict";\n' + js.replace(/<\/script/gi, "<\\/script"));
const finale = html.replace("<!DOCTYPE html>\n", "<!DOCTYPE html>\n<!-- File generato da build.mjs: non modificarlo a mano, modifica i sorgenti in src/ -->\n");
if(process.argv.includes("--check")){
  const attuale = leggi("index.html");
  if(attuale !== finale){ console.error("index.html non è aggiornato: esegui `node build.mjs`"); process.exit(1); }
  console.log("index.html aggiornato ✔");
} else {
  writeFileSync(new URL("index.html", import.meta.url), finale);
  console.log("index.html scritto (" + Math.round(finale.length / 1024) + " KB)");
}
