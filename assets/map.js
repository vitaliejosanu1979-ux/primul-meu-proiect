(function(){
"use strict";
const $=s=>document.querySelector(s),esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const L0=-12,L1=62,B1=62,MW=1000,MH=681,K=MW/(L1-L0);
const merc=l=>180/Math.PI*Math.log(Math.tan(Math.PI/4+l*Math.PI/360));
const proj=(lat,lon)=>[(lon-L0)*K,(merc(B1)-merc(lat))*K];
const tip=lt=>/exact/i.test(lt)?0:/p[ăa]strare/i.test(lt)?2:1;
const svg=$("#map svg"),g=$("#mks");let vb={x:0,y:0,w:MW,h:MH},sel=null;
const groups=new Map();for(const p of window.PTS){const k=p.la.toFixed(2)+","+p.lo.toFixed(2);let o=groups.get(k);if(!o){const[x,y]=proj(p.la,p.lo);o={k,x,y,n:0,b:0,recs:[],name:p.n||k,t:tip(p.lt)};groups.set(k,o)}o.n++;if(p.b)o.b++;o.recs.push(p)}
const G=[...groups.values()].sort((a,b)=>b.n-a.n);
function apply(){vb.w=Math.max(40,Math.min(MW,vb.w));vb.h=vb.w*MH/MW;vb.x=Math.max(0,Math.min(MW-vb.w,vb.x));vb.y=Math.max(0,Math.min(MH-vb.h,vb.y));svg.setAttribute("viewBox",`${vb.x} ${vb.y} ${vb.w} ${vb.h}`);svg.style.touchAction=vb.w<MW?"none":"pan-y";draw()}
function cross(x,y,r){const a=r*1.05,w=r*0.36;return`M${(x-w).toFixed(1)} ${(y-a).toFixed(1)}h${(2*w).toFixed(1)}v${(a-w).toFixed(1)}h${(a-w).toFixed(1)}v${(2*w).toFixed(1)}h${(-(a-w)).toFixed(1)}v${(a-w).toFixed(1)}h${(-2*w).toFixed(1)}v${(-(a-w)).toFixed(1)}h${(-(a-w)).toFixed(1)}v${(-2*w).toFixed(1)}h${(a-w).toFixed(1)}z`}
function draw(){const sc=vb.w/MW;g.innerHTML=G.map((m,i)=>{const r=Math.min(16,4.5+2.2*Math.sqrt(m.n))*sc,ttl=`<title>${esc(m.name)} — ${m.n}${m.b?" (cu ambele valve: "+m.b+")":""}</title>`;
  const sh=m.b?`<path class="mk biv p${m.t}${sel===m.k?" sel":""}" data-i="${i}" d="${cross(m.x,m.y,r)}">${ttl}</path>`:`<circle class="mk t${m.t}${sel===m.k?" sel":""}" data-i="${i}" cx="${m.x.toFixed(1)}" cy="${m.y.toFixed(1)}" r="${r.toFixed(2)}">${ttl}</circle>`;
  return sh+(m.n>1?`<text class="mkn" x="${m.x.toFixed(1)}" y="${m.y.toFixed(1)}" font-size="${(r*0.95).toFixed(2)}">${m.n}</text>`:"")}).join("")}
function zoom(f,cx,cy){cx=cx??vb.x+vb.w/2;cy=cy??vb.y+vb.h/2;const nw=Math.max(40,Math.min(MW,vb.w*f)),k=nw/vb.w;vb.x=cx-(cx-vb.x)*k;vb.y=cy-(cy-vb.y)*k;vb.w=nw;apply()}
const pt=e=>{const r=svg.getBoundingClientRect();return[vb.x+(e.clientX-r.left)/r.width*vb.w,vb.y+(e.clientY-r.top)/r.height*vb.h]};
$("#map .zoom").addEventListener("click",e=>{const z=e.target.dataset.z;if(!z)return;if(z==="in")zoom(.6);else if(z==="out")zoom(1/.6);else{vb={x:0,y:0,w:MW,h:MH};apply()}});
svg.addEventListener("wheel",e=>{if(!(e.ctrlKey||e.metaKey))return;e.preventDefault();const[p,q]=pt(e);zoom(e.deltaY<0?.75:1/.75,p,q)},{passive:false});
svg.addEventListener("dblclick",e=>{const[p,q]=pt(e);zoom(.55,p,q)});
let drag=null;svg.addEventListener("pointerdown",e=>{drag={x:e.clientX,y:e.clientY,vx:vb.x,vy:vb.y,moved:false,t:e.target}});
svg.addEventListener("pointermove",e=>{if(!drag)return;const r=svg.getBoundingClientRect(),dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>4){drag.moved=true;try{svg.setPointerCapture(e.pointerId)}catch(_){}}if(drag.moved&&vb.w<MW){vb.x=drag.vx-dx/r.width*vb.w;vb.y=drag.vy-dy/r.height*vb.h;apply()}});
svg.addEventListener("pointerup",e=>{if(!drag)return;const d=drag;drag=null;if(d.moved)return;const i=d.t&&d.t.dataset?d.t.dataset.i:undefined;if(i!==undefined){const m=G[+i];sel=sel===m.k?null:m.k;draw();sites()}});
function sites(){const s=G.find(x=>x.k===sel);$("#siteHead").textContent=s?s.name+" · "+s.n:"Locuri · "+G.length;
  $("#sites").innerHTML=s?`<button type="button" id="back">← Toate locurile</button>`+s.recs.map(p=>`<a href="../piese/${p.id}/"><span class="mono" style="color:var(--bronze)">${p.c}</span><br>${esc(p.t)}<br><span class="muted" style="font-size:12.5px">${esc(p.d)}</span></a>`).join("")
  :G.map(m=>`<button type="button" data-k="${m.k}">${m.b?`<span class="dot" style="background:var(--biv)"></span>`:`<span class="dot t${m.t}"></span>`}<b>${esc(m.name)}</b> <span class="mono" style="float:right">${m.n}</span></button>`).join("")}
$("#sites").addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;if(b.id==="back")sel=null;else{sel=b.dataset.k;const m=G.find(x=>x.k===sel);vb.w=260;vb.h=vb.w*MH/MW;vb.x=m.x-vb.w/2;vb.y=m.y-vb.h/2}apply();sites()});
const h=(location.hash||"").slice(1);if(h){const m=G.find(x=>x.recs.some(p=>p.id===h));if(m){sel=m.k;vb.w=260;vb.h=vb.w*MH/MW;vb.x=m.x-vb.w/2;vb.y=m.y-vb.h/2}}
apply();sites();
})();
