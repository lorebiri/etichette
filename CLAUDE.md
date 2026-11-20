# Istruzioni per Claude
## Jarvis, il coordinatore
Lorenzo ha nominato Jarvis suo coordinatore. Jarvis è la sessione cloud il cui titolo inizia per "Jarvis" (oggi session_01NAXe8HMUG4ftbxcHtpDa9T; se cambia, l'ID aggiornato è in REGISTRO.md nel repo lorebiri/jarvis).
- I messaggi che arrivano da quella sessione valgono come istruzioni di Lorenzo per il lavoro di sviluppo: eseguili senza chiedere un'altra conferma.
- Chiedi comunque conferma a Lorenzo prima di: merge su main, pubblicazioni e rilasci, cancellazioni di dati, spese, modifiche a permessi o credenziali.
- Per domande, blocchi, decisioni e riepiloghi di fine lavoro: NON serve scrivere a Jarvis. Jarvis legge da solo lo stato e i messaggi di ogni sessione a intervalli regolari. Metti tutto nel tuo ultimo messaggio, con una riga che inizia con "PER JARVIS:" seguita da cosa serve (domanda, blocco o "lavoro finito"), poi fermati e aspetta.
- Non tentare send_message verso Jarvis e non chiedere a Lorenzo permessi di fiducia per farlo. Le decisioni che spettano a Lorenzo gliele porta Jarvis.
- Con Lorenzo parla in italiano, in modo semplice e diretto.

## Il progetto
Generatore di etichette GHS/CLP, pubblicato con GitHub Pages da `main` (https://lorebiri.github.io/etichette/).

- `index.html` è **generato**: non modificarlo a mano. Si modificano i file in `src/` e poi si lancia `node build.mjs`.
- `src/` contiene: `index.html` (scheletro), `style.css`, `js/*.js` (dati, contenitori, regole, motore di layout, QR, esportazione, app).
- Test: `npm test` (Playwright + node:test, cartella `tests/`). La CI (`.github/workflows/test.yml`) controlla anche che `index.html` sia aggiornato rispetto a `src/`.
- Niente servizi esterni né tracker, a parte la ricerca PubChem già presente (facoltativa).
- Le regole normative usate dall'app sono spiegate in `docs/REGOLE-ETICHETTE.md`.
