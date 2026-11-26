
function toast(m){var t=document.getElementById('toast');t.textContent=m;t.classList.add('on');clearTimeout(t._t);t._t=setTimeout(function(){t.classList.remove('on')},2200);}
/* ───────── 메뉴 관리 ───────── */
var PAGES=['회사소개 › 인사말','회사소개 › 경영이념','회사소개 › 연혁','회사소개 › 조직도','회사소개 › 오시는 길','사업분야 › 설계','사업분야 › 감리','사업분야 › 방재연구','사업분야 › 방재제품','연구개발 › R&D Center'];
var BOARDS=['실적','새소식','보도자료','R&D 과제','인증·수상','자료실','채용공고'];
var M=[
 {ko:'회사소개',en:'Company',slug:'company',type:'none',on:true,c:[{ko:'인사말',en:'CEO Message',slug:'company/ceo',type:'page',target:'회사소개 › 인사말',on:true},{ko:'경영이념',en:'Vision',slug:'company/vision',type:'page',target:'회사소개 › 경영이념',on:true},{ko:'연혁',en:'History',slug:'company/history',type:'page',target:'회사소개 › 연혁',on:true},{ko:'조직도',en:'Organization',slug:'company/org',type:'page',target:'회사소개 › 조직도',on:false},{ko:'오시는 길',en:'Location',slug:'company/location',type:'page',target:'회사소개 › 오시는 길',on:true}]},
 {ko:'사업분야',en:'Business',slug:'business',type:'none',on:true,c:[{ko:'설계',en:'Design',slug:'business/design',type:'page',target:'사업분야 › 설계',on:true},{ko:'감리',en:'Supervision',slug:'business/supervision',type:'page',target:'사업분야 › 감리',on:true},{ko:'방재연구',en:'Research',slug:'business/research',type:'page',target:'사업분야 › 방재연구',on:true},{ko:'방재제품',en:'Products',slug:'business/products',type:'page',target:'사업분야 › 방재제품',on:true}]},
 {ko:'주요실적',en:'Projects',slug:'projects',type:'board',target:'실적',on:true,c:[]},
 {ko:'연구개발',en:'R&D',slug:'rnd',type:'none',on:true,c:[{ko:'R&D Center',en:'R&D Center',slug:'rnd/center',type:'page',target:'연구개발 › R&D Center',on:true},{ko:'수행과제',en:'Projects',slug:'rnd/projects',type:'board',target:'R&D 과제',on:true}]},
 {ko:'홍보센터',en:'PR',slug:'pr',type:'none',on:true,c:[{ko:'새소식',en:'News',slug:'pr/news',type:'board',target:'새소식',on:true},{ko:'회사소개서',en:'Brochure',slug:'pr/brochure',type:'board',target:'자료실',on:true},{ko:'홍보영상',en:'Video',slug:'https://youtube.com/',type:'url',target:'https://youtube.com/@kfubis',on:true,nw:true}]},
 {ko:'인재채용',en:'Careers',slug:'careers',type:'board',target:'채용공고',on:true,c:[]}];
var sel=M[0].c[0],drag=null;
function find(o,arr,par){arr=arr||M;for(var i=0;i<arr.length;i++){if(arr[i]===o)return{arr:arr,i:i,par:par};if(arr[i].c){var r=find(o,arr[i].c,arr[i]);if(r)return r}}}
function renderTree(){var ul=document.getElementById('tree');ul.innerHTML='';var n=0;
 function mk(list,box){list.forEach(function(m){n++;var li=document.createElement('li');li.draggable=true;
  li.innerHTML='<div class="node'+(m===sel?' sel':'')+(m.on?'':' off')+'"><span class="hd2" title="끌어서 순서 변경">⠿</span><span><b></b><small></small></span><span class="tag '+(m.on?'t-on">노출':'t-off">숨김')+'</span><label class="sw" title="노출"><input type="checkbox"'+(m.on?' checked':'')+'><span></span></label></div>';
  li.querySelector('b').textContent=m.ko;li.querySelector('small').textContent=m.en||'(영문 없음)';
  li.querySelector('.node').onclick=function(e){if(e.target.closest('.sw'))return;sel=m;renderTree();fillForm();};
  li.querySelector('.sw input').onchange=function(e){m.on=e.target.checked;renderTree();toast(m.ko+' 메뉴를 '+(m.on?'노출':'숨김')+'으로 바꿨습니다');};
  li.addEventListener('dragstart',function(e){e.stopPropagation();drag=m;li.classList.add('drag');e.dataTransfer.effectAllowed='move';});
  li.addEventListener('dragend',function(){li.classList.remove('drag');document.querySelectorAll('.over').forEach(function(x){x.classList.remove('over')})});
  li.addEventListener('dragover',function(e){var a=find(drag),b=find(m);if(!a||!b||a.arr!==b.arr)return;e.preventDefault();e.stopPropagation();li.classList.add('over');});
  li.addEventListener('dragleave',function(){li.classList.remove('over')});
  li.addEventListener('drop',function(e){e.preventDefault();e.stopPropagation();var a=find(drag),b=find(m);if(!a||a.arr!==b.arr||drag===m)return;a.arr.splice(a.i,1);var j=a.arr.indexOf(m);a.arr.splice(j,0,drag);renderTree();toast('순서를 바꿨습니다 — [저장]을 누르면 반영됩니다');});
  box.appendChild(li);if(m.c&&m.c.length){var u=document.createElement('ul');li.appendChild(u);mk(m.c,u);}});}
 mk(M,ul);document.getElementById('mcount').textContent='메뉴 '+n+'개';}
function fillTarget(){var t=sel.type,s=document.getElementById('m-target'),w=document.getElementById('m-target-wrap'),l=document.getElementById('m-target-l');
 w.style.display=t==='none'?'none':'';
 if(t==='url'){s.outerHTML='<input id="m-target">';s=document.getElementById('m-target');s.value=sel.target||'https://';l.textContent='외부 주소';}
 else{if(s.tagName!=='SELECT'){s.outerHTML='<select id="m-target"></select>';s=document.getElementById('m-target');}
  var src=t==='board'?BOARDS:PAGES;l.textContent=t==='board'?'연결 게시판':'연결 페이지';s.innerHTML=src.map(function(x){return '<option'+(x===sel.target?' selected':'')+'>'+x+'</option>'}).join('')+'<option value="__new">+ 새 페이지 만들기</option>';}
 s.oninput=function(){sel.target=s.value;if(s.value==='__new'){toast('빈 페이지를 만들고 페이지 편집으로 이동합니다 (시안)')}};}
function fillForm(){document.getElementById('mtitle').textContent='메뉴 설정 — '+sel.ko;
 ['ko','en','slug'].forEach(function(k){document.getElementById('m-'+k).value=sel[k]||''});document.getElementById('m-slug-v').textContent=sel.slug||'';
 document.querySelectorAll('#m-type input').forEach(function(r){r.checked=r.value===sel.type});
 document.getElementById('m-new').checked=!!sel.nw;fillTarget();}
['ko','en','slug'].forEach(function(k){document.getElementById('m-'+k).oninput=function(e){sel[k]=e.target.value;if(k==='slug')document.getElementById('m-slug-v').textContent=sel.slug;renderTree();}});
document.querySelectorAll('#m-type input').forEach(function(r){r.onchange=function(){sel.type=r.value;sel.target='';fillTarget();}});
function addTop(){var m={ko:'새 메뉴',en:'',slug:'new',type:'page',on:false,c:[]};M.push(m);sel=m;renderTree();fillForm();toast('새 메뉴를 숨김 상태로 추가했습니다');}
function addChild(){var r=find(sel);var host=r.par||sel;var m={ko:'새 하위 메뉴',en:'',slug:host.slug+'/new',type:'page',on:false};(host.c=host.c||[]).push(m);sel=m;renderTree();fillForm();}
function delMenu(){if(!confirm('"'+sel.ko+'" 메뉴를 삭제할까요? (연결된 페이지는 지워지지 않습니다)'))return;var r=find(sel);r.arr.splice(r.i,1);sel=M[0];renderTree();fillForm();}
renderTree();fillForm();

/* ───────── 페이지 편집 ───────── */
var LIB=['img/p_lotte.jpg','img/hero_airport.jpg','img/hero_coast.jpg','img/hero_complex.jpg','img/p_tower1.jpg','img/p_tower3.jpg','img/p_night.jpg','img/p_data.jpg'];
var NAMES={hero:'제목 배너',text:'글·사진',text2:'사진·글',nums:'숫자 띠',cta:'문의 버튼',sign:'서명'};
var B=[
 {t:'hero',img:'img/p_lotte.jpg',sub:{ko:'회사소개',en:'Company'},h:{ko:'인사말',en:'CEO Message'}},
 {t:'text',img:'img/hero_airport.jpg',h:{ko:'79년, 소방 한 길',en:'79 years in fire protection'},p:{ko:'1947년 조선소방기자재(주)로 출발한 한방유비스는 국내 처음으로 가스소화설비와 스프링클러 설비를 소개했습니다.\n앞으로도 사람의 생명을 지키는 기술로 보답하겠습니다.',en:'Founded in 1947, Hanbang UBIS introduced Korea\'s first gas suppression and sprinkler systems.\nWe will keep protecting lives through engineering.'}},
 {t:'nums',items:[{v:'1947',l:{ko:'설립',en:'Founded'}},{v:'76',l:{ko:'특허',en:'Patents'}},{v:'20',l:{ko:'포상·인증',en:'Awards'}}]},
 {t:'sign',p:{ko:'한방유비스(주) 대표이사',en:'CEO, Hanbang UBIS'},h:{ko:'최두찬 · 김상일',en:'Choi Doo-chan · Kim Sang-il'}},
 {t:'cta',h:{ko:'프로젝트를 검토 중이신가요?',en:'Planning a project?'},p:{ko:'사업 문의',en:'Contact us'}}];
var bs=1,pl='ko',bdrag=null;
function L(o){return o?(o[pl]||(pl==='en'?'(영문 미입력)':'')):''}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function blockHTML(b){switch(b.t){
 case 'hero':return '<div class="b-hero" style="background-image:url('+b.img+')"><small>'+esc(L(b.sub))+'</small><h2>'+esc(L(b.h))+'</h2></div>';
 case 'text':case 'text2':return '<div class="b-text'+(b.t==='text2'?' rev':'')+'"><div><h3>'+esc(L(b.h))+'</h3><p>'+esc(L(b.p))+'</p></div><img src="'+b.img+'" alt=""></div>';
 case 'nums':return '<div class="b-nums">'+b.items.map(function(i){return '<div><b>'+esc(i.v)+'</b><span>'+esc(L(i.l))+'</span></div>'}).join('')+'</div>';
 case 'sign':return '<div class="b-sign">'+esc(L(b.p))+'<b>'+esc(L(b.h))+'</b></div>';
 case 'cta':return '<div class="b-cta"><strong>'+esc(L(b.h))+'</strong><a>'+esc(L(b.p))+'</a></div>';}}
function renderBlocks(){var box=document.getElementById('blocks');box.innerHTML='';
 B.forEach(function(b,i){var d=document.createElement('div');d.className='blk'+(i===bs?' sel':'');d.dataset.name=NAMES[b.t];d.innerHTML=blockHTML(b);d.onclick=function(){bs=i;renderAll();};box.appendChild(d);});
 var l=document.getElementById('blist');l.innerHTML='';
 B.forEach(function(b,i){var d=document.createElement('div');d.className='bitem'+(i===bs?' sel':'');d.draggable=true;
  d.innerHTML='<span class="hd2">⠿</span><div><b>'+NAMES[b.t]+'</b><small>'+esc((L(b.h)||L(b.sub)||(b.items?b.items.map(function(x){return x.v}).join(' · '):'')).slice(0,18))+'</small></div>';
  d.onclick=function(){bs=i;renderAll();};
  d.addEventListener('dragstart',function(){bdrag=i;d.classList.add('drag')});d.addEventListener('dragend',function(){d.classList.remove('drag')});
  d.addEventListener('dragover',function(e){e.preventDefault();d.classList.add('over')});d.addEventListener('dragleave',function(){d.classList.remove('over')});
  d.addEventListener('drop',function(e){e.preventDefault();var x=B.splice(bdrag,1)[0];B.splice(i,0,x);bs=i;renderAll();dirty();});
  l.appendChild(d);});}
function field(label,obj,key,multi){var id='f'+Math.random().toString(36).slice(2,7);var v=obj[key]&&typeof obj[key]==='object'?(obj[key][pl]||''):(obj[key]||'');
 setTimeout(function(){var e=document.getElementById(id);e.oninput=function(){if(typeof obj[key]==='object')obj[key][pl]=e.value;else obj[key]=e.value;renderBlocks();dirty();}},0);
 return '<div class="f"><label>'+label+(typeof obj[key]==='object'?' <span class="help">('+(pl==='ko'?'국문':'영문')+')</span>':'')+'</label>'+(multi?'<textarea id="'+id+'">'+esc(v)+'</textarea>':'<input id="'+id+'" value="'+esc(v)+'">')+'</div>';}
function imgField(b){setTimeout(function(){document.querySelectorAll('#props .lib img').forEach(function(im){im.onclick=function(){b.img=im.dataset.src;renderAll();dirty();}})},0);
 return '<div class="f"><label>사진</label><div class="imgpick"><img src="'+b.img+'" alt=""><button class="btn sm">내 PC에서 올리기</button></div><div class="lib">'+LIB.map(function(s){return '<img data-src="'+s+'" src="'+s+'" class="'+(s===b.img?'on':'')+'" alt="">'}).join('')+'</div><span class="help">사진 보관함에서 고르거나 새로 올림 · 자동으로 PC·모바일 크기 생성</span></div>';}
function renderProps(){var b=B[bs],h='';document.getElementById('pr-title').textContent=b?NAMES[b.t]+' 설정':'블록 설정';if(!b){document.getElementById('props').innerHTML='<p class="help">블록을 고르세요</p>';return;}
 if(b.t==='hero')h=field('작은 제목',b,'sub')+field('큰 제목',b,'h')+imgField(b);
 else if(b.t==='text'||b.t==='text2')h=field('제목',b,'h')+field('본문',b,'p',1)+imgField(b)+'<div class="f"><label>사진 위치</label><div class="seg" id="side-seg"><button class="'+(b.t==='text2'?'on':'')+'" data-t="text2">왼쪽</button><button class="'+(b.t==='text'?'on':'')+'" data-t="text">오른쪽</button></div></div>';
 else if(b.t==='nums')h=b.items.map(function(it,i){return '<div class="grid2">'+field('숫자 '+(i+1),it,'v')+field('설명',it,'l')+'</div>'}).join('')+'<span class="help">숫자는 홈페이지에서 0부터 올라가며 표시됩니다</span>';
 else if(b.t==='sign')h=field('직함',b,'p')+field('이름',b,'h');
 else if(b.t==='cta')h=field('안내 문구',b,'h')+field('버튼 글자',b,'p')+'<div class="f"><label>버튼 연결</label><select><option>사업 문의 양식</option><option>전화 걸기</option><option>회사소개서 내려받기</option></select></div>';
 h+='<div class="f"><label>배경색</label><div class="color"><button class="on" style="background:#fff"></button><button style="background:#f5f6f8"></button><button style="background:#1d395e"></button><button style="background:#111827"></button></div><span class="help">홈페이지 색 안에서만 고를 수 있어 디자인이 깨지지 않습니다</span></div>';
 document.getElementById('props').innerHTML=h;
 var sg=document.getElementById('side-seg');if(sg)sg.querySelectorAll('button').forEach(function(x){x.onclick=function(){b.t=x.dataset.t;renderAll();dirty();}});}
function renderAll(){renderBlocks();renderProps();}
function dirty(){var s=document.getElementById('pg-st');s.textContent='수정 중 · 게시 전';s.className='tag t-wait';}
function pub(){var s=document.getElementById('pg-st');s.textContent='게시됨 '+new Date().toTimeString().slice(0,5);s.className='tag t-on';toast('홈페이지에 게시했습니다 — 이전 버전은 변경 이력에 남습니다');}
function delBlock(){if(!B.length)return;B.splice(bs,1);bs=Math.max(0,bs-1);renderAll();dirty();}
document.querySelectorAll('.palette button').forEach(function(x){x.onclick=function(){var t=x.dataset.add,n;
 if(t==='hero')n={t:t,img:LIB[2],sub:{ko:'작은 제목',en:''},h:{ko:'큰 제목을 입력하세요',en:''}};
 else if(t==='text'||t==='text2')n={t:t,img:LIB[4],h:{ko:'제목',en:''},p:{ko:'본문을 입력하세요',en:''}};
 else if(t==='nums')n={t:t,items:[{v:'0',l:{ko:'설명',en:''}},{v:'0',l:{ko:'설명',en:''}},{v:'0',l:{ko:'설명',en:''}}]};
 else if(t==='cta')n={t:t,h:{ko:'안내 문구',en:''},p:{ko:'사업 문의',en:'Contact'}};
 else n={t:t,p:{ko:'직함',en:''},h:{ko:'이름',en:''}};
 B.splice(bs+1,0,n);bs=bs+1;renderAll();dirty();toast(NAMES[t]+' 블록을 추가했습니다');}});
document.querySelectorAll('#pg-lang button').forEach(function(x){x.onclick=function(){pl=x.dataset.l;document.querySelectorAll('#pg-lang button').forEach(function(y){y.classList.toggle('on',y===x)});renderAll();}});
document.querySelectorAll('#pg-dev button').forEach(function(x){x.onclick=function(){document.getElementById('canvas').classList.toggle('mo',x.dataset.d==='mo');document.querySelectorAll('#pg-dev button').forEach(function(y){y.classList.toggle('on',y===x)});}});
renderAll();

/* ───────── 팝업 ───────── */
var P=[
 {title:'연말연시 휴무 안내',from:'2026-12-24T00:00',to:'2027-01-02T23:59',kind:'text',img:'img/promo.png',h:'연말연시 휴무 안내',b:'12월 31일(목)~1월 1일(금)은 휴무입니다.\n문의는 1월 4일부터 순서대로 답변드립니다.',link:'',pos:4,w:340,pc:true,mo:true,on:true},
 {title:'2026 국제소방안전박람회 참가',from:'2026-11-20T09:00',to:'2026-12-05T18:00',kind:'img',img:'img/promo.png',h:'',b:'',link:'/pr/news/128',pos:0,w:300,pc:true,mo:false,on:true},
 {title:'AI 인증 획득 안내',from:'2026-10-01T00:00',to:'2026-10-31T23:59',kind:'both',img:'img/cert_ai.jpg',h:'인공지능기술 인증 획득',b:'한국인공지능협회 인공지능기술 인증을 받았습니다.',link:'/pr/news/120',pos:2,w:320,pc:true,mo:true,on:false}];
var ps=0,pdev='pc';
var POSN=['왼쪽 위','위 가운데','오른쪽 위','왼쪽 가운데','가운데','오른쪽 가운데','왼쪽 아래','아래 가운데','오른쪽 아래'];
function status(p){var now=new Date('2026-11-26T10:00');if(!p.on)return['<span class="tag t-off">꺼짐</span>'];var f=new Date(p.from),t=new Date(p.to);if(now<f)return['<span class="tag t-wait">예약</span>'];if(now>t)return['<span class="tag t-off">기간 끝</span>'];return['<span class="tag t-on">노출 중</span>'];}
function renderPList(){var tb=document.getElementById('plist');tb.innerHTML='';P.forEach(function(p,i){var tr=document.createElement('tr');if(i===ps)tr.className='sel';
 tr.innerHTML='<td><b></b></td><td>'+p.from.slice(5,10).replace('-','.')+' ~ '+p.to.slice(5,10).replace('-','.')+'</td><td class="hide-m">'+POSN[p.pos]+'</td><td class="hide-m">'+[p.pc?'PC':'',p.mo?'모바일':''].filter(Boolean).join('·')+'</td><td style="display:flex;gap:8px;align-items:center">'+status(p)[0]+'<label class="sw"><input type="checkbox"'+(p.on?' checked':'')+'><span></span></label></td>';
 tr.querySelector('b').textContent=p.title;tr.onclick=function(e){if(e.target.closest('.sw'))return;ps=i;renderPList();fillP();};
 tr.querySelector('.sw input').onchange=function(e){p.on=e.target.checked;renderPList();drawPop();};tb.appendChild(tr);});}
function fillP(){var p=P[ps];['title','from','to','h','b','link'].forEach(function(k){document.getElementById('p-'+k).value=p[k]||''});
 document.getElementById('p-w').value=p.w;document.getElementById('p-wv').textContent=p.w+'px';document.getElementById('p-pc').checked=p.pc;document.getElementById('p-mo').checked=p.mo;
 document.querySelectorAll('#p-kind button').forEach(function(x){x.classList.toggle('on',x.dataset.k===p.kind)});
 document.getElementById('p-pos').innerHTML=POSN.map(function(n,i){return '<button title="'+n+'" class="'+(i===p.pos?'on':'')+'" data-i="'+i+'"></button>'}).join('');
 document.querySelectorAll('#p-pos button').forEach(function(x){x.onclick=function(){p.pos=+x.dataset.i;fillP();renderPList();}});
 document.getElementById('p-lib').innerHTML=['img/promo.png','img/cert_ai.jpg','img/hero_airport.jpg','img/p_lotte.jpg'].map(function(s){return '<img src="'+s+'" data-src="'+s+'" class="'+(s===p.img?'on':'')+'" alt="">'}).join('');
 document.querySelectorAll('#p-lib img').forEach(function(im){im.onclick=function(){p.img=im.dataset.src;fillP();}});
 document.getElementById('p-img-f').style.display=p.kind==='text'?'none':'';document.getElementById('p-text-f').style.display=p.kind==='img'?'none':'';drawPop();}
['title','from','to','h','b','link'].forEach(function(k){document.getElementById('p-'+k).oninput=function(e){P[ps][k]=e.target.value;drawPop();if(k!=='h'&&k!=='b'&&k!=='link')renderPList();}});
document.getElementById('p-w').oninput=function(e){P[ps].w=+e.target.value;document.getElementById('p-wv').textContent=e.target.value+'px';drawPop();};
['pc','mo'].forEach(function(k){document.getElementById('p-'+k).onchange=function(e){P[ps][k]=e.target.checked;renderPList();drawPop();}});
document.getElementById('p-close').onchange=drawPop;
document.querySelectorAll('#p-kind button').forEach(function(x){x.onclick=function(){P[ps].kind=x.dataset.k;fillP();}});
document.querySelectorAll('#p-dev button').forEach(function(x){x.onclick=function(){pdev=x.dataset.d;document.querySelectorAll('#p-dev button').forEach(function(y){y.classList.toggle('on',y===x)});document.getElementById('site').classList.toggle('mo',pdev==='mo');drawPop();}});
window.drawPop=drawPop;function drawPop(){var p=P[ps],el=document.getElementById('pop'),site=document.getElementById('site');var show=p.on&&(pdev==='pc'?p.pc:p.mo);el.style.display=show?'flex':'none';if(!show)return;
 var cl=document.getElementById('p-close').value;
 el.innerHTML=(p.kind!=='text'?'<img src="'+p.img+'" alt="">':'')+(p.kind!=='img'?'<div class="tx"><b>'+esc(p.h)+'</b><span style="white-space:pre-line">'+esc(p.b)+'</span></div>':'')+'<div class="ft"><span>'+cl+'</span><span>닫기 ✕</span></div>';
 if(pdev==='mo'){el.style.left='0';el.style.right='0';el.style.top='auto';el.style.bottom='0';el.style.width='100%';el.style.maxWidth='100%';el.style.height=(p.kind==='text'?'34%':'58%');el.style.transform='none';return;}
 var sw=site.clientWidth,scale=sw/1440,w=Math.max(p.w*scale*1.6,110),hgt=w*(p.kind==='text'?.62:1.2);el.style.width=w+'px';el.style.height=hgt+'px';el.style.maxWidth='92%';el.style.right='auto';el.style.bottom='auto';
 var col=p.pos%3,row=Math.floor(p.pos/3),pad=14,top0=34;
 el.style.left=col===0?pad+'px':col===1?'50%':'auto';if(col===2){el.style.right=pad+'px';el.style.left='auto';}
 el.style.top=row===0?top0+'px':row===1?'50%':'auto';if(row===2){el.style.bottom=pad+'px';el.style.top='auto';}
 el.style.transform=(col===1?'translateX(-50%) ':'')+(row===1?'translateY(-50%)':'');}
function newPop(){P.unshift({title:'새 팝업',from:'2026-11-27T00:00',to:'2026-12-31T23:59',kind:'img',img:'img/promo.png',h:'',b:'',link:'',pos:0,w:320,pc:true,mo:true,on:false});ps=0;renderPList();fillP();toast('새 팝업을 꺼진 상태로 만들었습니다');}
addEventListener('resize',drawPop);
renderPList();fillP();
