(async function(){
"use strict";
const $=s=>document.querySelector(s),esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const SEC={VII:[601,700],VIII:[701,800],IX:[801,900],X:[901,1000],XI:[1001,1100],XII:[1101,1200],XIII:[1201,1300],XIV:[1301,1400],XV:[1401,1500],XVI:[1501,1600],XVII:[1601,1700]};
const norm=s=>String(s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");
const code=n=>"CE-"+String(n||0).padStart(4,"0");
let all=[];try{all=await (await fetch("data/catalog.json")).json()}catch(e){$("#grid").innerHTML='<div class="empty">Catalogul nu s-a putut încărca.</div>';return}
const params=new URLSearchParams(location.search);const src=params.get("src")||"";
const F={q:"",c:"",i:"",s:"",ta:"",co:"",m:"",te:"",ctx:"",ce:""};const ids={q:"#q",c:"#f_c",i:"#f_i",s:"#f_s",ta:"#f_ta",co:"#f_co",m:"#f_m",te:"#f_te",ctx:"#f_ctx",ce:"#f_ce"};
let sort="nr",shown=60;
function match(r){
  if(src&&!r.id.startsWith(src+"-"))return false;
  if(F.c&&r.c!==F.c)return false;if(F.m&&r.m!==F.m)return false;if(F.ctx&&r.ctx!==F.ctx)return false;if(F.ce&&r.ce!==F.ce)return false;if(F.ta&&r.ta!==F.ta)return false;
  if(F.co&&String(r.co).split(/[;(]/)[0].trim()!==F.co)return false;
  if(F.te&&!r.te.includes(F.te))return false;if(F.i&&!r.ia.includes(F.i)&&!r.ir.includes(F.i))return false;
  if(F.s){const s=SEC[F.s],a=+r.d1||+r.d2||0,b=+r.d2||+r.d1||0;if(!a||b<s[0]||a>s[1])return false}
  if(F.q){const hay=norm([code(r.nr),r.id,r.t,r.l,r.co,r.inv,r.ia.join(" "),r.ir.join(" "),r.q].join(" "));for(const w of norm(F.q).split(/\s+/))if(w&&!hay.includes(w))return false}
  return true}
function list(){const a=all.filter(match);a.sort((x,y)=>sort==="nr"?(x.nr||0)-(y.nr||0):sort==="d1"?((+x.d1||+x.d2||9999)-(+y.d1||+y.d2||9999)):String(x[sort]||"￿").localeCompare(String(y[sort]||"￿"),"ro"));return a}
function card(r){return`<a class="card" href="piese/${encodeURIComponent(r.id.replace(/[^A-Za-z0-9._-]/g,"_"))}/"><div class="ph">${r.th?`<img src="${r.th}" alt="${esc(r.t)}" loading="lazy">`:`<svg viewBox="0 0 60 92" aria-hidden="true"><circle cx="30" cy="8" r="5" fill="none" stroke="currentColor" stroke-width="3"/><path fill="currentColor" d="M24 38L21 15h18l-3 23 20-3v18l-20-3 3 40H21l3-40-20 3V35z"/></svg>`}</div><div class="cbody"><span class="mono code">${code(r.nr)}</span><span class="t">${esc(r.t)}</span><span class="s">${esc(r.d)}</span><span class="s">${esc(r.l)}</span>${r.co?`<span class="s col">${esc(r.co)}${r.inv?" · "+esc(r.inv):""}</span>`:""}</div></a>`}
function render(){const a=list();$("#count").textContent=`${a.length} din ${all.length} fișe${src?" · sursa "+src:""}`;
  $("#grid").innerHTML=a.length?a.slice(0,shown).map(card).join(""):'<div class="empty">Nicio piesă nu corespunde filtrelor.</div>';
  $("#more").hidden=a.length<=shown}
for(const k in ids){const el=$(ids[k]);if(!el)continue;el.addEventListener("input",()=>{F[k]=el.value;shown=60;render()})}
$("#sort").addEventListener("change",e=>{sort=e.target.value;render()});
$("#reset").addEventListener("click",()=>{for(const k in ids){F[k]="";const el=$(ids[k]);if(el)el.value=""}if(src)location.href=location.pathname;shown=60;render()});
$("#moreBtn").addEventListener("click",()=>{shown+=120;render()});
render();
})();
