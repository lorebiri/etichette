"use strict";

/* ============================================================
   FRASI H / EUH (testo italiano)
   ============================================================ */
const FRASI_H = {
 "H200":"Esplosivo instabile.","H201":"Esplosivo; pericolo di esplosione di massa.","H202":"Esplosivo; grave pericolo di proiezione.","H203":"Esplosivo; pericolo di incendio, di spostamento d'aria o di proiezione.","H204":"Pericolo di incendio o di proiezione.",
 "H220":"Gas altamente infiammabile.","H221":"Gas infiammabile.","H222":"Aerosol altamente infiammabile.","H223":"Aerosol infiammabile.",
 "H224":"Liquido e vapori altamente infiammabili.","H225":"Liquido e vapori facilmente infiammabili.","H226":"Liquido e vapori infiammabili.","H228":"Solido infiammabile.",
 "H240":"Rischio di esplosione per riscaldamento.","H241":"Rischio d'incendio o di esplosione per riscaldamento.","H242":"Rischio d'incendio per riscaldamento.",
 "H250":"Spontaneamente infiammabile all'aria.","H251":"Autoriscaldante; può infiammarsi.","H252":"Autoriscaldante in grandi quantità; può infiammarsi.",
 "H260":"A contatto con l'acqua libera gas infiammabili che possono infiammarsi spontaneamente.","H261":"A contatto con l'acqua libera gas infiammabili.",
 "H270":"Può provocare o aggravare un incendio; comburente.","H271":"Può provocare un incendio o un'esplosione; molto comburente.","H272":"Può aggravare un incendio; comburente.",
 "H280":"Contiene gas sotto pressione; può esplodere se riscaldato.","H281":"Contiene gas refrigerato; può provocare ustioni o lesioni criogeniche.",
 "H290":"Può essere corrosivo per i metalli.",
 "H300":"Letale se ingerito.","H301":"Tossico se ingerito.","H302":"Nocivo se ingerito.","H304":"Può essere letale in caso di ingestione e di penetrazione nelle vie respiratorie.",
 "H310":"Letale per contatto con la pelle.","H311":"Tossico per contatto con la pelle.","H312":"Nocivo per contatto con la pelle.",
 "H314":"Provoca gravi ustioni cutanee e gravi lesioni oculari.","H315":"Provoca irritazione cutanea.","H317":"Può provocare una reazione allergica cutanea.",
 "H318":"Provoca gravi lesioni oculari.","H319":"Provoca grave irritazione oculare.",
 "H330":"Letale se inalato.","H331":"Tossico se inalato.","H332":"Nocivo se inalato.","H334":"Può provocare sintomi allergici o asmatici o difficoltà respiratorie se inalato.","H335":"Può irritare le vie respiratorie.","H336":"Può provocare sonnolenza o vertigini.",
 "H340":"Può provocare alterazioni genetiche.","H341":"Sospettato di provocare alterazioni genetiche.",
 "H350":"Può provocare il cancro.","H350i":"Può provocare il cancro se inalato.","H351":"Sospettato di provocare il cancro.",
 "H360":"Può nuocere alla fertilità o al feto.","H360D":"Può nuocere al feto.","H360F":"Può nuocere alla fertilità.","H360FD":"Può nuocere alla fertilità. Può nuocere al feto.","H361":"Sospettato di nuocere alla fertilità o al feto.","H361d":"Sospettato di nuocere al feto.","H361f":"Sospettato di nuocere alla fertilità.","H362":"Può essere nocivo per i lattanti allattati al seno.",
 "H370":"Provoca danni agli organi.","H371":"Può provocare danni agli organi.","H372":"Provoca danni agli organi in caso di esposizione prolungata o ripetuta.","H373":"Può provocare danni agli organi in caso di esposizione prolungata o ripetuta.",
 "H300+H310":"Letale se ingerito o a contatto con la pelle.","H300+H310+H330":"Letale se ingerito, a contatto con la pelle o se inalato.","H301+H311":"Tossico se ingerito o a contatto con la pelle.","H301+H311+H331":"Tossico se ingerito, a contatto con la pelle o se inalato.","H301+H331":"Tossico se ingerito o inalato.","H302+H312":"Nocivo se ingerito o a contatto con la pelle.","H302+H312+H332":"Nocivo se ingerito, a contatto con la pelle o se inalato.","H302+H332":"Nocivo se ingerito o inalato.","H311+H331":"Tossico per contatto con la pelle o se inalato.","H312+H332":"Nocivo per contatto con la pelle o se inalato.",
 "H229":"Contenitore pressurizzato: può esplodere se riscaldato.","H360Fd":"Può nuocere alla fertilità. Sospettato di nuocere al feto.","H360Df":"Può nuocere al feto. Sospettato di nuocere alla fertilità.","H361fd":"Sospettato di nuocere alla fertilità. Sospettato di nuocere al feto.",
 "H303":"Può essere nocivo se ingerito. (GHS, non CLP)","H305":"Può essere nocivo in caso di ingestione e penetrazione nelle vie respiratorie. (GHS, non CLP)","H313":"Può essere nocivo a contatto con la pelle. (GHS, non CLP)","H316":"Provoca lieve irritazione cutanea. (GHS, non CLP)","H320":"Provoca irritazione oculare. (GHS, non CLP)","H333":"Può essere nocivo se inalato. (GHS, non CLP)",
 "H400":"Molto tossico per gli organismi acquatici.","H401":"Tossico per gli organismi acquatici. (GHS, non CLP)","H402":"Nocivo per gli organismi acquatici. (GHS, non CLP)","H410":"Molto tossico per gli organismi acquatici con effetti di lunga durata.","H411":"Tossico per gli organismi acquatici con effetti di lunga durata.","H412":"Nocivo per gli organismi acquatici con effetti di lunga durata.","H413":"Può essere nocivo per gli organismi acquatici con effetti di lunga durata.","H420":"Nuoce alla salute pubblica e all'ambiente distruggendo l'ozono dello strato superiore dell'atmosfera.",
 "EUH014":"Reagisce violentemente con l'acqua.","EUH018":"Durante l'uso può formarsi una miscela vapore-aria esplosiva/infiammabile.","EUH019":"Può formare perossidi esplosivi.","EUH029":"A contatto con l'acqua libera un gas tossico.","EUH031":"A contatto con acidi libera gas tossici.","EUH032":"A contatto con acidi libera gas molto tossici.","EUH066":"L'esposizione ripetuta può provocare secchezza o screpolature della pelle.","EUH071":"Corrosivo per le vie respiratorie."
};

/* ============================================================
   FRASI P (testo italiano) — selezione delle più usate
   ============================================================ */
const FRASI_P = {
 "P101":"In caso di consultazione di un medico, tenere a disposizione il contenitore o l'etichetta del prodotto.","P102":"Tenere fuori dalla portata dei bambini.","P103":"Leggere attentamente e seguire tutte le istruzioni.",
 "P201":"Procurarsi istruzioni specifiche prima dell'uso.","P202":"Non manipolare prima di avere letto e compreso tutte le avvertenze.","P203":"Procurarsi, leggere e seguire tutte le istruzioni di sicurezza prima dell'uso.","P211":"Non vaporizzare su una fiamma libera o altra fonte di accensione.",
 "P210":"Tenere lontano da fonti di calore, superfici calde, scintille, fiamme libere o altre fonti di accensione. Non fumare.",
 "P220":"Tenere lontano da indumenti e altri materiali combustibili.","P222":"Evitare il contatto con l'aria.","P223":"Evitare qualunque contatto con l'acqua.",
 "P230":"Mantenere umido con…","P231":"Manipolare e conservare in atmosfera di gas inerte.","P231+P232":"Manipolare e conservare in atmosfera di gas inerte. Proteggere dall'umidità.","P232":"Proteggere dall'umidità.","P233":"Tenere il recipiente ben chiuso.","P234":"Conservare soltanto nell'imballaggio originale.","P235":"Conservare in luogo fresco.",
 "P240":"Mettere a terra e a massa il contenitore e il dispositivo ricevente.","P241":"Utilizzare impianti elettrici/di ventilazione/d'illuminazione a prova di esplosione.","P242":"Utilizzare utensili antiscintilla.","P243":"Fare in modo di prevenire le scariche elettrostatiche.","P244":"Mantenere le valvole e i raccordi liberi da olio e grasso.",
 "P250":"Evitare le abrasioni/gli urti/gli attriti.","P251":"Non perforare né bruciare, neppure dopo l'uso.",
 "P260":"Non respirare la polvere/i fumi/i gas/la nebbia/i vapori/gli aerosol.","P261":"Evitare di respirare la polvere/i fumi/i gas/la nebbia/i vapori/gli aerosol.",
 "P262":"Evitare il contatto con gli occhi, la pelle o gli indumenti.","P263":"Evitare il contatto durante la gravidanza e l'allattamento.","P264":"Lavare accuratamente le mani dopo l'uso.",
 "P270":"Non mangiare, né bere, né fumare durante l'uso.","P271":"Utilizzare soltanto all'aperto o in luogo ben ventilato.","P272":"Gli indumenti da lavoro contaminati non devono essere portati fuori dal luogo di lavoro.","P273":"Non disperdere nell'ambiente.",
 "P280":"Indossare guanti/indumenti protettivi/proteggere gli occhi/il viso.","P283":"Indossare indumenti resistenti al fuoco o alla fiamma.","P284":"[Quando la ventilazione del locale è insufficiente] utilizzare un apparecchio di protezione respiratoria.",
 "P301+P310":"IN CASO DI INGESTIONE: contattare immediatamente un CENTRO ANTIVELENI o un medico.",
 "P301+P312":"IN CASO DI INGESTIONE: in presenza di malessere, contattare un CENTRO ANTIVELENI o un medico.",
 "P301+P330+P331":"IN CASO DI INGESTIONE: sciacquare la bocca. NON provocare il vomito.",
 "P302+P352":"IN CASO DI CONTATTO CON LA PELLE: lavare abbondantemente con acqua e sapone.",
 "P303+P361+P353":"IN CASO DI CONTATTO CON LA PELLE (o con i capelli): togliersi di dosso immediatamente tutti gli indumenti contaminati. Sciacquare la pelle con acqua o fare una doccia.",
 "P304+P340":"IN CASO DI INALAZIONE: trasportare l'infortunato all'aria aperta e mantenerlo a riposo in posizione che favorisca la respirazione.",
 "P305+P351+P338":"IN CASO DI CONTATTO CON GLI OCCHI: sciacquare accuratamente per parecchi minuti. Togliere le eventuali lenti a contatto se è agevole farlo. Continuare a sciacquare.",
 "P308+P313":"IN CASO di esposizione o di possibile esposizione: consultare un medico.",
 "P302+P334":"IN CASO DI CONTATTO CON LA PELLE: immergere in acqua fredda o avvolgere con un bendaggio umido.",
 "P302+P361+P354":"IN CASO DI CONTATTO CON LA PELLE: togliersi di dosso immediatamente tutti gli indumenti contaminati. Risciacquare immediatamente la pelle con acqua per parecchi minuti.",
 "P305+P354+P338":"IN CASO DI CONTATTO CON GLI OCCHI: sciacquare immediatamente con acqua per parecchi minuti. Togliere le eventuali lenti a contatto se è agevole farlo. Continuare a sciacquare.",
 "P316":"Consultare urgentemente un medico.","P317":"Consultare un medico.","P318":"In caso di esposizione o di possibile esposizione, consultare un medico.","P319":"In caso di malessere, consultare un medico.",
 "P306+P360":"IN CASO DI CONTATTO CON GLI INDUMENTI: sciacquare immediatamente e abbondantemente gli indumenti contaminati e la pelle prima di togliersi gli indumenti.",
 "P308+P311":"IN CASO di esposizione o di possibile esposizione: contattare un CENTRO ANTIVELENI o un medico.",
 "P310":"Contattare immediatamente un CENTRO ANTIVELENI o un medico.","P311":"Contattare un CENTRO ANTIVELENI o un medico.","P312":"In caso di malessere, contattare un CENTRO ANTIVELENI o un medico.","P313":"Consultare un medico.","P314":"In caso di malessere, consultare un medico.","P315":"Consultare immediatamente un medico.",
 "P320":"Trattamento specifico urgente (vedere le istruzioni su questa etichetta).","P321":"Trattamento specifico (vedere le istruzioni su questa etichetta).","P330":"Sciacquare la bocca.","P331":"NON provocare il vomito.","P334":"Immergere in acqua fredda o avvolgere con un bendaggio umido.","P335":"Rimuovere le particelle depositate sulla pelle.","P336":"Sgelare le parti congelate usando acqua tiepida. Non sfregare la parte interessata.",
 "P332+P313":"In caso di irritazione della pelle: consultare un medico.","P333+P313":"In caso di irritazione o eruzione della pelle: consultare un medico.","P337+P313":"Se l'irritazione degli occhi persiste, consultare un medico.","P342+P311":"In caso di sintomi respiratori: contattare un CENTRO ANTIVELENI o un medico.",
 "P360":"Sciacquare immediatamente e abbondantemente gli indumenti contaminati e la pelle prima di togliersi gli indumenti.","P361":"Togliersi di dosso immediatamente tutti gli indumenti contaminati.","P362":"Togliersi di dosso gli indumenti contaminati.","P362+P364":"Togliere tutti gli indumenti contaminati e lavarli prima di indossarli nuovamente.","P363":"Lavare gli indumenti contaminati prima di indossarli nuovamente.","P364":"E lavarli prima di indossarli nuovamente.",
 "P370+P376":"In caso d'incendio: bloccare la perdita, se non c'è pericolo.","P370+P378":"In caso d'incendio: utilizzare CO2, polvere chimica o schiuma per estinguere.","P371+P380+P375":"In caso di incendio grave e di grandi quantità: evacuare la zona. Utilizzare i mezzi estinguenti a distanza per il rischio di esplosione.",
 "P375":"Rischio di esplosione. Utilizzare i mezzi estinguenti a grande distanza.","P376":"Bloccare la perdita, se non c'è pericolo.","P377":"In caso d'incendio dovuto a perdita di gas, non estinguere a meno che non sia possibile bloccare la perdita senza pericolo.","P378":"Utilizzare mezzi estinguenti idonei per estinguere.","P380":"Evacuare la zona.","P381":"In caso di perdita, eliminare ogni fonte di accensione.",
 "P390":"Assorbire la fuoriuscita per evitare danni materiali.","P391":"Raccogliere il materiale fuoriuscito.",
 "P282":"Utilizzare guanti termici e schermo facciale o protezione per gli occhi.",
 "P401":"Conservare secondo le istruzioni.","P402":"Conservare in luogo asciutto.","P402+P404":"Conservare in luogo asciutto e in recipiente chiuso.","P403":"Conservare in luogo ben ventilato.","P403+P233":"Conservare in luogo ben ventilato. Tenere il recipiente ben chiuso.","P403+P235":"Conservare in luogo fresco e ben ventilato.","P404":"Conservare in un recipiente chiuso.",
 "P405":"Conservare sotto chiave.","P406":"Conservare in recipiente resistente alla corrosione provvisto di rivestimento interno resistente.","P407":"Mantenere uno spazio libero tra gli scaffali o i pallet.","P410":"Proteggere dai raggi solari.","P410+P403":"Proteggere dai raggi solari. Conservare in luogo ben ventilato.","P410+P412":"Proteggere dai raggi solari. Non esporre a temperature superiori a 50 °C/122 °F.","P411":"Conservare a temperature non superiori a…","P412":"Non esporre a temperature superiori a 50 °C/122 °F.","P413":"Conservare le rinfuse di peso superiore a … a temperature non superiori a…","P420":"Conservare separatamente.",
 "P501":"Smaltire il prodotto/recipiente in conformità alla normativa vigente.","P502":"Chiedere informazioni al produttore o fornitore per il recupero o il riciclaggio."
};

/* ============================================================
   ARCHIVIO SOSTANZE COMUNI (classificazioni tipiche — verificare con SDS)
   ============================================================ */
const PRESETS = [
 {nome:"Acetone", cas:"67-64-1", conc:"≥ 99,5 %", picto:["GHS02","GHS07"], avv:"Pericolo", h:["H225","H319","H336","EUH066"], p:["P210","P233","P280","P305+P351+P338","P403+P233"]},
 {nome:"Etanolo", cas:"64-17-5", conc:"96 %", picto:["GHS02","GHS07"], avv:"Pericolo", h:["H225","H319"], p:["P210","P233","P280","P305+P351+P338"]},
 {nome:"Metanolo", cas:"67-56-1", conc:"≥ 99,8 %", picto:["GHS02","GHS06","GHS08"], avv:"Pericolo", h:["H225","H301+H311+H331","H370"], p:["P210","P233","P280","P302+P352","P304+P340","P308+P313"]},
 {nome:"2-Propanolo (isopropanolo)", cas:"67-63-0", conc:"≥ 99,5 %", picto:["GHS02","GHS07"], avv:"Pericolo", h:["H225","H319","H336"], p:["P210","P233","P305+P351+P338"]},
 {nome:"Acido cloridrico", cas:"7647-01-0", conc:"37 %", picto:["GHS05","GHS07"], avv:"Pericolo", h:["H290","H314","H335"], p:["P260","P280","P303+P361+P353","P305+P351+P338","P310"]},
 {nome:"Acido solforico", cas:"7664-93-9", conc:"96 %", picto:["GHS05"], avv:"Pericolo", h:["H290","H314"], p:["P260","P280","P303+P361+P353","P305+P351+P338","P310"]},
 {nome:"Acido nitrico", cas:"7697-37-2", conc:"65 %", picto:["GHS03","GHS05"], avv:"Pericolo", h:["H272","H290","H314","EUH071"], p:["P220","P260","P280","P303+P361+P353","P305+P351+P338","P310"]},
 {nome:"Acido acetico glaciale", cas:"64-19-7", conc:"≥ 99 %", picto:["GHS02","GHS05"], avv:"Pericolo", h:["H226","H314"], p:["P210","P280","P303+P361+P353","P305+P351+P338","P310"]},
 {nome:"Idrossido di sodio", cas:"1310-73-2", conc:"in pastiglie", picto:["GHS05"], avv:"Pericolo", h:["H290","H314"], p:["P260","P280","P303+P361+P353","P305+P351+P338","P310"]},
 {nome:"Ammoniaca soluzione", cas:"1336-21-6", conc:"25 %", picto:["GHS05","GHS07","GHS09"], avv:"Pericolo", h:["H290","H314","H335","H400"], p:["P260","P273","P280","P303+P361+P353","P305+P351+P338","P310"]},
 {nome:"Perossido di idrogeno (acqua ossigenata)", cas:"7722-84-1", conc:"30 %", picto:["GHS05","GHS07"], avv:"Pericolo", h:["H302","H318"], p:["P280","P301+P312","P305+P351+P338","P310"]},
 {nome:"Ipoclorito di sodio soluzione", cas:"7681-52-9", conc:"~ 14 % Cl attivo", picto:["GHS05","GHS09"], avv:"Pericolo", h:["H290","H314","H400","EUH031"], p:["P260","P273","P280","P303+P361+P353","P305+P351+P338","P310"]},
 {nome:"Toluene", cas:"108-88-3", conc:"≥ 99,5 %", picto:["GHS02","GHS07","GHS08"], avv:"Pericolo", h:["H225","H304","H315","H336","H361d","H373"], p:["P210","P240","P280","P301+P310","P331","P302+P352"]},
 {nome:"Diclorometano", cas:"75-09-2", conc:"≥ 99,5 %", picto:["GHS07","GHS08"], avv:"Attenzione", h:["H315","H319","H335","H336","H351","H373"], p:["P260","P280","P305+P351+P338","P308+P313"]},
 {nome:"Cloroformio", cas:"67-66-3", conc:"≥ 99 %", picto:["GHS06","GHS08"], avv:"Pericolo", h:["H302","H315","H319","H331","H351","H361d","H372"], p:["P260","P280","P301+P312","P304+P340","P308+P313"]},
 {nome:"Acetonitrile", cas:"75-05-8", conc:"≥ 99,9 %", picto:["GHS02","GHS07"], avv:"Pericolo", h:["H225","H302+H312+H332","H319"], p:["P210","P280","P302+P352","P304+P340","P305+P351+P338"]},
 {nome:"Etere dietilico", cas:"60-29-7", conc:"≥ 99,5 %", picto:["GHS02","GHS07"], avv:"Pericolo", h:["H224","H302","H336","EUH019","EUH066"], p:["P210","P233","P240","P403+P235"]},
 {nome:"n-Esano", cas:"110-54-3", conc:"≥ 95 %", picto:["GHS02","GHS07","GHS08","GHS09"], avv:"Pericolo", h:["H225","H304","H315","H336","H361f","H373","H411"], p:["P210","P273","P280","P301+P310","P331"]},
 {nome:"Formaldeide soluzione (formalina)", cas:"50-00-0", conc:"37 %", picto:["GHS05","GHS06","GHS08"], avv:"Pericolo", h:["H301+H311+H331","H314","H317","H341","H350"], p:["P201","P260","P280","P303+P361+P353","P304+P340","P308+P313"]},
 {nome:"Dimetilsolfossido (DMSO)", cas:"67-68-5", conc:"≥ 99,5 %", picto:[], avv:"", h:[], p:["P262","P264"]},
 {nome:"Acqua deionizzata", cas:"7732-18-5", conc:"deionizzata / MilliQ", picto:[], avv:"", h:[], p:[]},
 {nome:"Acqua distillata", cas:"7732-18-5", conc:"distillata", picto:[], avv:"", h:[], p:[]},
 {nome:"Azoto liquido", cas:"7727-37-9", conc:"criogenico", picto:["GHS04"], avv:"Attenzione", h:["H281"], p:["P282","P403"]}
];

/* Traduzioni IT → EN dei nomi più comuni, per interrogare PubChem in italiano */
const TRADUZIONI = {
 "etanolo":"ethanol","alcol etilico":"ethanol","alcool etilico":"ethanol","metanolo":"methanol","isopropanolo":"isopropanol","alcol isopropilico":"isopropanol","glicerolo":"glycerol","glicerina":"glycerol","glicole etilenico":"ethylene glycol",
 "acido cloridrico":"hydrochloric acid","acido solforico":"sulfuric acid","acido nitrico":"nitric acid","acido acetico":"acetic acid","acido fosforico":"phosphoric acid","acido formico":"formic acid","acido ossalico":"oxalic acid","acido citrico":"citric acid","acido borico":"boric acid","acido lattico":"lactic acid","acido tricloroacetico":"trichloroacetic acid",
 "idrossido di sodio":"sodium hydroxide","soda caustica":"sodium hydroxide","idrossido di potassio":"potassium hydroxide","idrossido di ammonio":"ammonium hydroxide","ammoniaca":"ammonium hydroxide",
 "acqua ossigenata":"hydrogen peroxide","perossido di idrogeno":"hydrogen peroxide","ipoclorito di sodio":"sodium hypochlorite","candeggina":"sodium hypochlorite",
 "xilene":"xylene","diclorometano":"dichloromethane","cloroformio":"chloroform","etere etilico":"diethyl ether","etere dietilico":"diethyl ether","etere di petrolio":"petroleum ether","esano":"hexane","cicloesano":"cyclohexane","acetato di etile":"ethyl acetate","tetraidrofurano":"tetrahydrofuran","dimetilsolfossido":"dimethyl sulfoxide","dimetilformammide":"dimethylformamide","dmf":"dimethylformamide",
 "formaldeide":"formaldehyde","formalina":"formaldehyde","fenolo":"phenol","anilina":"aniline","piridina":"pyridine","imidazolo":"imidazole","urea":"urea",
 "cloruro di sodio":"sodium chloride","bicarbonato di sodio":"sodium bicarbonate","carbonato di sodio":"sodium carbonate","solfato di rame":"copper sulfate","solfato di magnesio":"magnesium sulfate","permanganato di potassio":"potassium permanganate","nitrato d'argento":"silver nitrate","nitrato di argento":"silver nitrate","iodio":"iodine","bromo":"bromine","azoto liquido":"nitrogen","azoto":"nitrogen",
 "acrilammide":"acrylamide","bromuro di etidio":"ethidium bromide","sodio dodecil solfato":"sodium dodecyl sulfate","sds":"sodium dodecyl sulfate","mercaptoetanolo":"2-mercaptoethanol","beta-mercaptoetanolo":"2-mercaptoethanol","persolfato di ammonio":"ammonium persulfate","ditiotreitolo":"dithiothreitol","dtt":"dithiothreitol"
};
function traduci(q){ return TRADUZIONI[q.trim().toLowerCase()] || null; }
