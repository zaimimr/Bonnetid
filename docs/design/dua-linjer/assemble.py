import re,sys,os
H=os.path.dirname(os.path.abspath(__file__))
src=open(os.path.join(H, 'base.html')).read().split('\n')
head='\n'.join(src[:132]).replace('<title>Dua-kunst</title>','<title>Dua-linjer</title>').replace('<h1>Dua-kunst</h1>','<h1>Dua-linjer</h1>')
head=head.replace('<button class="toggle" id="toggle"','<button class="toggle" id="redraw" type="button">Tegn på nytt</button>\n    <button class="toggle" id="toggle"')
css='''
.art .pen{fill:none;stroke:#fff;stroke-width:7;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:1 1;stroke-dashoffset:1;animation:draw var(--dur,3s) cubic-bezier(.42,0,.38,1) var(--delay,0s) forwards}
.art .acc{opacity:0;animation:accin .9s ease-out calc(var(--dur,3s) + var(--delay,0s) - .5s) forwards}
.art .a-soar{animation:soar 9s ease-in-out infinite alternate}
.art .a-beat{transform-box:fill-box;transform-origin:50% 100%;animation:beat 2.8s ease-in-out infinite}
.art .a-call{transform-box:fill-box;transform-origin:center;animation:call 3.6s ease-out infinite;opacity:0}
.art .a-peek{animation:peek 7s ease-in-out infinite alternate}
.art .a-orbit{offset-path:path("M184 180A108 20 0 1 0 400 180A108 20 0 1 0 184 180");animation:orbit 9s linear infinite}
@keyframes soar{from{transform:translate(-14px,4px)}to{transform:translate(14px,-6px)}}
@keyframes beat{0%,100%{transform:scaleY(1)}50%{transform:scaleY(.5)}}
@keyframes call{0%{transform:scale(.6);opacity:0}25%{opacity:.85}100%{transform:scale(1.7);opacity:0}}
@keyframes draw{to{stroke-dashoffset:0}}
@keyframes accin{to{opacity:1}}
@keyframes peek{from{transform:translate(-12px,10px)}to{transform:translate(6px,-4px)}}
@keyframes orbit{from{offset-distance:0%}to{offset-distance:100%}}
@media (prefers-reduced-motion:reduce){.art .a-soar,.art .a-beat,.art .a-call{animation:none}.art .a-call{opacity:.5}.art .pen{stroke-dashoffset:0}.art .acc{opacity:1}}
</style>'''
head=head.replace('</style>',css,1)
line=open(os.path.join(H, 'line.js')).read()
js=r'''<script>
'''+line+r'''
const ART={morgen:['Morgen','Sola med stråler stiger over en bølge'],kveld:['Kveld','Sola synker bak bølgen, fugler hjem'],sovn:['Før søvn','Månesigd'],etterBonnen:['Etter bønnen','Bønneteppe på gulvet, sett på skrå'],adhan:['Etter adhan','Minaret, kallet brer seg ut'],wudu:['Wudu og moské','Kran med en dråpe'],reise:['Reise','Papirfly med en sløyfe i lufta'],bekymring:['Bekymring og lettelse','En floke som løser seg opp til et hjerte'],tilgivelse:['Tilgivelse','En spire med nye blader'],lovprisning:['Lovprisning','En tulipan, fugler i rolig glid'],koranen:['Fra Koranen','Oppslått Koran med bokmerke, lyset puster'],salawat:['Salawat','Den grønne kuppelen og minareten'],sunnah:['Sunnah','Fotspor langs en sti mot en åpen port'],beskyttelse:['Beskyttelse','Skjold'],ramadan:['Ramadan','Én lykt og månesigden'],eid:['Eid','En gave med sløyfe, gnister'],hajj:['Hajj','Kaba med tawaf-bue']};
let uid=0;
const sceneSVG=(k,delay=0)=>{const s=LINE[k],id='m'+(uid++),dur=Math.max(2.2,Math.min(4.2,s.len/260)).toFixed(2);
return `<svg class="art" viewBox="0 0 400 240" preserveAspectRatio="xMaxYMid slice" aria-hidden="true" style="--dur:${dur}s;--delay:${delay}s"><mask id="${id}" maskUnits="userSpaceOnUse" x="-20" y="-20" width="440" height="280"><path class="pen" pathLength="1" d="${s.c}"/></mask><g class="acc">${s.under}</g><path d="${s.d}" fill="${s.ink}" mask="url(#${id})"/><g class="acc">${s.over}</g></svg>`;};
let n=0;
const tile=(k,opt={})=>{const s=LINE[k];return `<div class="tile${opt.cls?' '+opt.cls:''}${s.night?' night':''}" style="background:${s.bg}" role="button" tabindex="0" data-k="${k}"><div class="lbl">${opt.kicker?`<small>${opt.kicker}</small>`:''}<b>${opt.name||ART[k][0]}</b>${opt.count?`<small>${opt.count}</small>`:''}</div>${sceneSVG(k,(n++%12)*.12)}</div>`;};
const counts={morgen:'14',kveld:'14',sovn:'7',etterBonnen:'15',adhan:'3',wudu:'3',reise:'9',bekymring:'17',tilgivelse:'14',lovprisning:'20',koranen:'34',salawat:'4',sunnah:'48',beskyttelse:'6',ramadan:'4',eid:'2',hajj:'5'};
const c=k=>counts[k]+' duaer';
const render=()=>{n=0;
document.getElementById('feed').innerHTML=
  tile('etterBonnen',{cls:'hero',kicker:'Nå, etter Dhuhr',count:c('etterBonnen')})+
  `<div class="sec">Dagen</div>`+tile('morgen',{cls:'wide',count:c('morgen')})+tile('kveld',{cls:'wide',count:c('kveld')})+tile('sovn',{cls:'wide',count:c('sovn')})+
  `<div class="sec">Rundt bønnen</div><div class="grid2">${tile('adhan',{count:c('adhan')})}${tile('wudu',{count:c('wudu')})}</div>`+
  `<div class="sec">Hverdag</div><div class="grid2">${['reise','bekymring','tilgivelse','beskyttelse'].map(k=>tile(k,{count:c(k)})).join('')}</div>`+
  `<div class="sec">Lovprisning og Koranen</div><div class="grid2">${['lovprisning','koranen','salawat','sunnah'].map(k=>tile(k,{count:c(k)})).join('')}</div>`+
  `<div class="sec">Høytider</div><div class="grid2">${tile('ramadan',{count:c('ramadan')})}${tile('eid',{count:c('eid')})}</div>`+tile('hajj',{cls:'wide',count:c('hajj')});
n=0;document.getElementById('lib').innerHTML=Object.keys(ART).map(k=>`<div class="item">${tile(k)}<div class="meta"><b>${ART[k][0]}</b><span>${ART[k][1]}</span><code>${k}</code></div></div>`).join('');};
render();
document.addEventListener('click',e=>{const t=e.target.closest('.tile');if(!t)return;const svg=t.querySelector('svg.art');svg.outerHTML=sceneSVG(t.dataset.k);});
document.getElementById('redraw').addEventListener('click',render);
const btn=document.getElementById('toggle'),root=document.getElementById('root');
btn.addEventListener('click',()=>{const p=root.classList.toggle('paused');btn.setAttribute('aria-pressed',String(p));btn.textContent=p?'Spill animasjon':'Pause animasjon';});
</script>'''
open(os.path.join(H, 'dua-linjer.html'),'w').write(head+'\n'+js+'\n')
