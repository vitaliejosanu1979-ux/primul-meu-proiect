#!/usr/bin/env node
/* Corpus Encolpiorum — generator de site static.
   Intrare: data/piese/*.json (o fișă = un fișier), img/thumb/<id>_{av,rv}.jpg, img/full/<id>_{av,rv}.jpg
   Ieșire:  site/  (index, piese/<id>/, harta/, autori/, despre/, sitemap.xml, robots.txt)
   Rulare:  node build.js [--base https://corpusencolpiorum.org]            */
"use strict";
const fs=require("fs"),path=require("path");
const ARG=process.argv.slice(2);const BASE=(ARG[ARG.indexOf("--base")+1]||"").replace(/\/$/,"")||"https://vitaliejosanu1979-ux.github.io/primul-meu-proiect";
const ROOT=__dirname,OUT=path.join(ROOT,"site");
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const SECOLE=[["VII",601,700],["VIII",701,800],["IX",801,900],["X",901,1000],["XI",1001,1100],["XII",1101,1200],["XIII",1201,1300],["XIV",1301,1400],["XV",1401,1500],["XVI",1501,1600],["XVII",1601,1700]];
const roman=y=>{const s=SECOLE.find(x=>y>=x[1]&&y<=x[2]);return s?s[0]:(y<=600?"≤VI":"≥XVIII")};
function datare(r){const a=+r.d1||null,b=+r.d2||null;if(r.datare&&String(r.datare).trim())return String(r.datare).trim()+(a&&b?" ("+a+"–"+b+")":"");if(!a&&!b)return"nedatat";if(a&&b&&a!==b){const ra=roman(a),rb=roman(b);return(ra===rb?"sec. "+ra:"sec. "+ra+"–"+rb)+" ("+a+"–"+b+")"}const y=a||b;return"sec. "+roman(y)+" ("+y+")"}
const loc=r=>[r.localitate,r.regiune,r.tara].filter(Boolean).join(", ")||"loc necunoscut";
const code=r=>"CE-"+String(r.nr||0).padStart(4,"0");
const hasGeo=r=>r.lat!==null&&r.lat!==""&&r.lon!==null&&r.lon!==""&&Number.isFinite(+r.lat)&&Number.isFinite(+r.lon);
const slug=id=>id.replace(/[^A-Za-z0-9._-]/g,"_");

/* ---------- date ---------- */
const recs=fs.readdirSync(path.join(ROOT,"data/piese")).filter(f=>f.endsWith(".json")).map(f=>{let d=JSON.parse(fs.readFileSync(path.join(ROOT,"data/piese",f),"utf8"));if(d.data&&typeof d.data==="object"&&!d.titlu)d=d.data;d.id=f.slice(0,-5);return d}).filter(r=>!r.exemplu);
recs.sort((a,b)=>(a.nr||0)-(b.nr||0));
const img=(id,s,kind)=>{const p=path.join(ROOT,"img",kind,`${id}_${s}.jpg`);return fs.existsSync(p)?`img/${kind}/${id}_${s}.jpg`:null};
for(const r of recs){for(const s of["av","rv"]){r["_t"+s]=img(r.id,s,"thumb")||img(r.id,s,"full");r["_f"+s]=img(r.id,s,"full")||img(r.id,s,"thumb")}}
const today=new Date().toISOString().slice(0,10);

/* ---------- schelet ---------- */
const CSS=fs.readFileSync(path.join(ROOT,"assets/style.css"),"utf8");
const MAP=fs.existsSync(path.join(ROOT,"assets/map.txt"))?fs.readFileSync(path.join(ROOT,"assets/map.txt"),"utf8"):"";
function page({title,desc,body,depth=0,head="",canon="",nav=""}){const rel="../".repeat(depth);
  return `<!doctype html><html lang="ro"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${BASE}/${canon}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:type" content="website"><meta property="og:url" content="${BASE}/${canon}">
<link rel="icon" href="${rel}assets/icon.svg" type="image/svg+xml">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&family=Old+Standard+TT:ital,wght@0,400;0,700;1,400&display=swap">
<link rel="stylesheet" href="${rel}assets/style.css">${head}
<script data-goatcounter="https://corpusencolpiorum.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script></head><body><div class="wrap">
<header class="top"><a class="brand" href="${rel}"><svg viewBox="0 0 60 92" aria-hidden="true"><circle cx="30" cy="8" r="5" fill="none" stroke="currentColor" stroke-width="3"/><path fill="currentColor" d="M24 38L21 15h18l-3 23 20-3v18l-20-3 3 40H21l3-40-20 3V35z"/></svg><span><b>Corpus Encolpiorum</b><small>Baza de date a crucilor-encolpion, secolele VII–XVII</small></span></a>
<nav class="tabs">${[["","Catalog"],["harta/","Hartă"],["autori/","Surse"],["despre/","Despre"]].map(([h,l])=>`<a href="${rel}${h}"${nav===l?' aria-current="page"':""}>${l}</a>`).join("")}</nav></header>
<main>${body}</main>
<footer><p>Corpus Encolpiorum · ${recs.length} piese · actualizat ${today} · <a href="${rel}despre/">cum se citează</a> · datele descriptive sub licență CC BY 4.0; imaginile rămân sub drepturile surselor indicate.</p></footer>
</div></body></html>`}

const w=(rel,s)=>{const p=path.join(OUT,rel);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,s)};
fs.rmSync(OUT,{recursive:true,force:true});fs.mkdirSync(OUT,{recursive:true});
fs.cpSync(path.join(ROOT,"assets"),path.join(OUT,"assets"),{recursive:true});
if(fs.existsSync(path.join(ROOT,"img")))fs.cpSync(path.join(ROOT,"img"),path.join(OUT,"img"),{recursive:true});

/* ---------- catalog (index) ---------- */
const slim=recs.map(r=>({id:r.id,nr:r.nr,t:r.titlu,c:r.categorie,m:r.material,te:r.tehnici||[],ia:r.icon_av||[],ir:r.icon_rv||[],d:datare(r),d1:r.d1,d2:r.d2,l:loc(r),ta:r.tara||"",co:r.colectie||"",inv:r.inventar||"",ctx:r.context||"",ce:r.centru||"",lat:hasGeo(r)?+r.lat:null,lon:hasGeo(r)?+r.lon:null,lt:r.loc_tip||"",th:r._tav||r._trv||"",q:[r.descr_av,r.descr_rv,r.inscriptie,r.tipologie,r.bibliografie,r.regiune,r.observatii].filter(Boolean).join(" ").slice(0,600)}));
w("data/catalog.json",JSON.stringify(slim));
const uniq=k=>[...new Set(recs.flatMap(r=>[].concat(r[k]||[])).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"ro"));
const sel=(id,l,opts)=>`<label class="field"><span class="lab">${l}</span><select id="${id}"><option value="">Toate</option>${opts.map(o=>`<option>${esc(o)}</option>`).join("")}</select></label>`;
const icons=[...new Set(recs.flatMap(r=>[...(r.icon_av||[]),...(r.icon_rv||[])]))].sort((a,b)=>a.localeCompare(b,"ro"));
w("index.html",page({title:"Corpus Encolpiorum",desc:`Catalog deschis al crucilor-encolpion și al crucilor pectorale medievale: ${recs.length} piese cu descriere, datare, loc de descoperire, colecție și bibliografie.`,canon:"",nav:"Catalog",
 body:`<p class="lede">Repertoriu al crucilor-relicvar pectorale (encolpioane) din spațiul bizantin, balcanic, carpato-danubian și vechi rusesc, secolele VII–XVII. Fiecare piesă are o fișă cu descriere, datare, loc de descoperire, colecție și bibliografie; descoperirile sunt cartate.</p>
<div class="work"><aside class="filters">
<label class="field"><span class="lab">Căutare liberă</span><input id="q" type="search" placeholder="sit, inscripție, inventar, autor…"></label>
${sel("f_c","Categorie",uniq("categorie"))}${sel("f_i","Iconografie",icons)}${sel("f_s","Secol",SECOLE.map(s=>s[0]))}${sel("f_ta","Țara descoperirii",uniq("tara"))}${sel("f_co","Colecție / muzeu",[...new Set(recs.map(r=>String(r.colectie||"").split(/[;(]/)[0].trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"ro")))}
<details><summary>Mai multe criterii</summary><div class="fgrid">${sel("f_m","Material",uniq("material"))}${sel("f_te","Tehnică",uniq("tehnici"))}${sel("f_ctx","Context",uniq("context"))}${sel("f_ce","Centru de producție",uniq("centru"))}</div></details>
<button class="btn sm" id="reset" type="button">Șterge filtrele</button></aside>
<div style="min-width:0"><div class="bar"><span id="count" class="mono"></span><select id="sort" class="btn sm" aria-label="Ordonare"><option value="nr">Număr de catalog</option><option value="d1">Datare</option><option value="t">Denumire</option><option value="l">Loc de descoperire</option><option value="co">Colecție</option></select></div>
<div id="grid" class="grid"><noscript>${recs.slice(0,60).map(card).join("")}</noscript></div><p id="more" class="more" hidden><button class="btn" id="moreBtn" type="button">Arată mai multe</button></p></div></div>
<script src="assets/catalog.js" defer></script>`}));
function card(r){return`<a class="card" href="piese/${slug(r.id)}/"><div class="ph">${r._tav?`<img src="${r._tav}" alt="${esc(r.titlu)}" loading="lazy">`:`<svg viewBox="0 0 60 92" aria-hidden="true"><use href="#cruce"/></svg>`}</div><div class="cbody"><span class="mono code">${code(r)}</span><span class="t">${esc(r.titlu)}</span><span class="s">${esc(datare(r))}</span><span class="s">${esc(loc(r))}</span>${r.colectie?`<span class="s col">${esc(r.colectie)}</span>`:""}</div></a>`}

/* ---------- fișe ---------- */
const row=(k,v)=>v===undefined||v===null||v===""||(Array.isArray(v)&&!v.length)?"":`<div><dt>${k}</dt><dd>${esc(Array.isArray(v)?v.join("; "):v)}</dd></div>`;
const sect=(t,rows)=>{const h=rows.join("");return h?`<section><h2>${t}</h2><dl>${h}</dl></section>`:""};
const EN={"Encolpion bivalv (relicvar)":"double-sided reliquary cross (enkolpion)","Valvă izolată":"single valve of a reliquary cross","Cruce pectorală simplă":"pectoral cross","Cruce dublă (patriarhală)":"double (patriarchal) cross","Tipar / matriță":"casting mould"};
for(const r of recs){
  const dims=[r.h&&"Î "+r.h,r.l&&"L "+r.l,r.gros&&"Gr "+r.gros].filter(Boolean).join(" × ");
  const fig=(s,l)=>r["_f"+s]?`<figure><a href="../../${r["_f"+s]}"><img src="../../${r["_f"+s]}" alt="${l}: ${esc(r.titlu)}"></a><figcaption><span class="lab">${l}</span>${(r["sursa_"+s]||r.planse)?`<span class="src">Sursa: ${esc(r["sursa_"+s]||r.planse)}</span>`:""}</figcaption></figure>`:"";
  const ld={"@context":"https://schema.org","@type":"VisualArtwork","name":r.titlu,"identifier":code(r),"url":`${BASE}/piese/${slug(r.id)}/`,"description":[r.descr_av,r.descr_rv].filter(Boolean).join(" ")||r.titlu,"artform":EN[r.categorie]||r.categorie,"artMedium":r.material||undefined,"dateCreated":r.d1&&r.d2?`${r.d1}/${r.d2}`:undefined,"temporalCoverage":datare(r),"locationCreated":r.centru&&r.centru!=="Necunoscut"?{"@type":"Place","name":r.centru}:undefined,"contentLocation":r.localitate?{"@type":"Place","name":loc(r),"geo":hasGeo(r)?{"@type":"GeoCoordinates","latitude":+r.lat,"longitude":+r.lon}:undefined}:undefined,"image":r._fav?`${BASE}/${r._fav}`:undefined,"isPartOf":{"@type":"Dataset","name":"Corpus Encolpiorum","url":BASE},"citation":r.bibliografie||undefined,"inLanguage":"ro"};
  const en=`${EN[r.categorie]||"medieval cross"}${r.material?", "+r.material.toLowerCase():""}; ${datare(r).replace("sec.","c.")}; ${r.localitate?"found at "+loc(r):"find spot unknown"}${r.colectie?"; kept at "+r.colectie:""}.`;
  w(`piese/${slug(r.id)}/index.html`,page({title:`${r.titlu} · ${code(r)}`,desc:`${r.categorie||""}, ${r.material||""}, ${datare(r)}, ${loc(r)}. ${r.colectie||""}`.replace(/\s+/g," "),depth:2,canon:`piese/${slug(r.id)}/`,nav:"Catalog",head:`<script type="application/ld+json">${JSON.stringify(ld)}</script>`,
   body:`<article class="rec"><p class="crumbs"><a href="../../">Catalog</a> › <span class="mono">${code(r)}</span> · <span class="mono muted">${esc(r.id)}</span></p>
<h1>${esc(r.titlu)}</h1><p class="sub">${esc(datare(r))} · ${esc(loc(r))}${r.colectie?` · ${esc(r.colectie)}${r.inventar?", inv. "+esc(r.inventar):""}`:""}</p><p class="en" lang="en">${esc(en)}</p>
<div class="photos">${fig("av","Avers")}${fig("rv","Revers")}</div>
<div class="dl">${sect("Identificare",[row("Categorie",r.categorie),row("Material",r.material),row("Tehnică",r.tehnici),row("Stare",r.stare),row("Dimensiuni",dims&&dims+" mm"),row("Greutate",r.greutate&&r.greutate+" g")])}
${sect("Iconografie",[row("Avers",r.icon_av),row("Descriere avers",r.descr_av),row("Revers",r.icon_rv),row("Descriere revers",r.descr_rv),row("Inscripții",r.inscriptie),row("Limba",r.limba)])}
${sect("Datare și atribuire",[row("Datare",datare(r)),row("Centru",r.centru),row("Tipologie",r.tipologie)])}
${sect("Descoperire",[row("Localitate",r.localitate),row("Regiune",r.regiune),row("Țară",r.tara),row("Context",r.context),row("Anul",r.an_desc),row("Coordonate",hasGeo(r)?(+r.lat).toFixed(4)+"° N, "+(+r.lon).toFixed(4)+"° E":""),row("Precizia locului",r.loc_tip)])}
${sect("Păstrare și referințe",[row("Colecție",r.colectie),row("Nr. inventar",r.inventar),row("Bibliografie",r.bibliografie),row("Figura",r.figura),row("Planșe",r.planse),row("Analogii",r.analogii),row("Observații",r.observatii)])}</div>
${hasGeo(r)?`<p class="muted"><a href="../../harta/#${esc(slug(r.id))}">Vezi pe hartă</a></p>`:""}
<p class="cite">Citare: <i>Corpus Encolpiorum</i>, ${code(r)}, ${esc(r.titlu)}, ${BASE}/piese/${esc(slug(r.id))}/ (accesat ${today}).</p></article>`}));
}

/* ---------- hartă ---------- */
const pts=recs.filter(hasGeo).map(r=>({id:slug(r.id),c:code(r),t:r.titlu,la:+r.lat,lo:+r.lon,n:r.localitate||"",lt:r.loc_tip||"",d:datare(r)}));
w("harta/index.html",page({title:"Hartă · Corpus Encolpiorum",desc:"Locurile de descoperire și de păstrare ale crucilor-encolpion din catalog.",depth:1,canon:"harta/",nav:"Hartă",
 body:`<h1>Harta descoperirilor</h1><p class="lede">${pts.length} piese cartate. Verde: coordonate exacte; bronz: doar localitatea; mov: locul de păstrare, descoperirea fiind incertă. Frontierele sunt cele actuale, doar pentru orientare. Trageți pentru a deplasa, dublu-clic sau rotița cu Ctrl pentru a mări.</p>
<div class="maplay"><div class="mapbox" id="map"><svg viewBox="0 0 1000 681" role="img" aria-label="Harta"><path class="land" d="${MAP}"/><g id="mks"></g></svg><div class="zoom"><button data-z="in">+</button><button data-z="out">−</button><button data-z="0">⌂</button></div></div>
<div><p class="lab" id="siteHead">Locuri</p><div class="sitelist" id="sites"></div></div></div>
<script>window.PTS=${JSON.stringify(pts)}</script><script src="../assets/map.js" defer></script>`}));

/* ---------- surse / autori ---------- */
const bySrc=new Map();for(const r of recs){const k=r.id.replace(/-.*$/,"");if(!bySrc.has(k))bySrc.set(k,{n:0,bib:new Map()});const g=bySrc.get(k);g.n++;for(const b of String(r.bibliografie||"").split(/\s*;\s*|\n/)){const t=b.replace(/,?\s*(p|pp|nr|cat|fig|Abb|Tabl|pl)\.?\s.*$/i,"").trim();if(t.length>8)g.bib.set(t,(g.bib.get(t)||0)+1)}}
w("autori/index.html",page({title:"Surse · Corpus Encolpiorum",desc:"Publicațiile și colecțiile din care provin fișele catalogului.",depth:1,canon:"autori/",nav:"Surse",
 body:`<h1>Surse</h1><p class="lede">Fiecare fișă trimite la publicația din care a fost extrasă, cu pagină, număr de catalog și planșă. Siglele de mai jos sunt prefixele identificatorilor pieselor.</p><div class="srcs">${[...bySrc.entries()].sort((a,b)=>b[1].n-a[1].n).map(([k,g])=>`<section><h2><span class="mono">${esc(k)}</span> · ${g.n} ${g.n===1?"piesă":"piese"}</h2><ul>${[...g.bib.entries()].sort((a,b)=>b[1]-a[1]).slice(0,6).map(([b,n])=>`<li>${esc(b)} <span class="muted mono">(${n})</span></li>`).join("")}</ul><p><a href="../?src=${esc(k)}">piesele din această sursă →</a></p></section>`).join("")}</div>`}));

/* ---------- despre ---------- */
w("despre/index.html",page({title:"Despre · Corpus Encolpiorum",desc:"Ce este Corpus Encolpiorum, cum sunt construite fișele și cum se citează.",depth:1,canon:"despre/",nav:"Despre",
 body:`<div class="about"><h1>Despre</h1>
<p><b>Corpus Encolpiorum</b> este un repertoriu deschis al crucilor-relicvar pectorale (encolpioane) și al crucilor pectorale medievale din spațiul bizantin, balcanic, carpato-danubian și vechi rusesc, secolele VII–XVII. Este construit după modelul bazei de date <a href="https://kunera.nl/en" rel="noopener">Kunera</a> (Universitatea Radboud, Nijmegen) pentru insignele de pelerinaj.</p>
<h2>Fișa</h2><p>Fiecare piesă are identificare (categorie, material, tehnică, stare), iconografie pe avers și revers, inscripții, datare preluată de la autorul publicației, dimensiuni, loc și context de descoperire cu coordonate, loc de păstrare și număr de inventar, bibliografie cu pagină, număr de catalog și planșă, analogii și observații. Câmpurile necompletate înseamnă că sursa nu dă informația; nimic nu este dedus.</p>
<h2>Surse și drepturi</h2><p>Datele descriptive sunt redactate de echipa proiectului și pot fi reutilizate sub licență <a href="https://creativecommons.org/licenses/by/4.0/deed.ro" rel="noopener">CC BY 4.0</a>, cu citarea corpusului. Imaginile provin din publicațiile și colecțiile indicate sub fiecare fotografie și rămân sub drepturile acestora; sunt reproduse la rezoluție redusă, în scop de identificare și cercetare. Deținătorii de drepturi care doresc retragerea sau înlocuirea unei imagini sunt rugați să scrie la adresa de mai jos.</p>
<h2>Citare</h2><p>Pentru corpus: <i>Corpus Encolpiorum. Baza de date a crucilor-encolpion medievale</i>, ed. Vitalie Josanu, ${BASE} (accesat ZZ.LL.AAAA).<br>Pentru o piesă: <i>Corpus Encolpiorum</i>, CE-0001, adresa fișei.</p>
<h2>Autor</h2><p>Dr. Vitalie Josanu, medievist (civilizația Moldovei medievale, iconografie și artă bizantino-slavă, stavrografie). Contact: <span class="mono">contact@corpusencolpiorum.org</span></p>
<h2>Repertorii de referință</h2><ul><li>Zs. Lovag, <i>Mittelalterliche Bronzegegenstände des Ungarischen Nationalmuseums</i>, Budapesta, 1999.</li><li>B. I., V. N. Hanenko, <i>Drevnosti russkie. Kresty i obrazki</i>, II, Kiev, 1900.</li><li>G. F. Korzuhina, A. A. Peskova, <i>Drevnerusskie enkolpiony. Kresty-relikvarii XI–XIII vv.</i>, Sankt-Petersburg, 2003.</li><li>B. Pitarakis, <i>Les croix-reliquaires pectorales byzantines en bronze</i>, Paris, 2006.</li></ul></div>`}));

/* ---------- sitemap, robots ---------- */
const urls=["","harta/","autori/","despre/",...recs.map(r=>`piese/${slug(r.id)}/`)];
w("sitemap.xml",`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(u=>`<url><loc>${BASE}/${u}</loc><lastmod>${today}</lastmod></url>`).join("")}</urlset>`);
w("robots.txt",`User-agent: *\nAllow: /\nSitemap: ${BASE}/sitemap.xml\n`);
w(".nojekyll","");
console.log(`site: ${recs.length} fișe, ${pts.length} pe hartă, ${urls.length} pagini → ${OUT}`);
