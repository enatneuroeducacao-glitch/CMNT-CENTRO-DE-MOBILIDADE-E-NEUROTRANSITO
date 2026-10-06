/* CMNT Neurocientífico — camada aditiva. Não substitui a rede social existente. */
(function(){
'use strict';
var oldNav=window.nav, oldGo=window.go, oldCommunities=window.communities, oldNewCommunity=window.newCommunity, oldSaveCommunity=window.saveCommunity, oldCommunity=window.community;
var domains=[];
var escx=window.esc||function(v){return String(v||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]})};

async function loadDomains(){
  var r=await db.from('cmnt_scientific_domains').select('id,slug,name,description').eq('active',true).order('name');
  if(!r.error)domains=r.data||[];
}
function domainById(id){return domains.find(function(d){return d.id===id})}
function domainOptions(selected){return domains.map(function(d){return '<option value="'+d.id+'" '+(selected===d.id?'selected':'')+'>'+escx(d.name)+'</option>'}).join('')}

window.nav=function(){
  var base=oldNav();
  var item='<button onclick="go(\'cmnt\')" class="w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-sm font-bold '+(S.tab==='cmnt'?'active':'text-slate-600 hover:bg-slate-50')+'"><span class="text-base">🧠</span><span>CMNT Científico</span></button>';
  return base+item;
};

function cmntShell(){
  var main=document.getElementById('main');
  if(!main)return;
  main.innerHTML='<section><div class="card rounded-3xl overflow-hidden">'+
    '<div class="brand p-7 text-white"><div class="text-xs uppercase tracking-[.2em] font-black text-emerald-300">Centro de Mobilidade e Neurotrânsito</div><h1 class="text-3xl sm:text-4xl font-black mt-2">CMNT Neurocientífico</h1><p class="mt-3 max-w-3xl text-slate-200 leading-7">Ciência, educação, pesquisa, comportamento humano e segurança viária em uma mesma plataforma.</p></div>'+
    '<div class="p-4 grid grid-cols-2 sm:grid-cols-4 gap-2">'+
      '<button onclick="cmntTab(\'overview\')" class="p-3 rounded-2xl bg-slate-100 font-bold">Visão geral</button>'+
      '<button onclick="cmntTab(\'research\')" class="p-3 rounded-2xl bg-slate-100 font-bold">🔬 Pesquisas</button>'+
      '<button onclick="cmntTab(\'library\')" class="p-3 rounded-2xl bg-slate-100 font-bold">📚 Biblioteca</button>'+
      '<button onclick="cmntTab(\'nexus\')" class="p-3 rounded-2xl bg-slate-100 font-bold">🧩 NEXUS 12</button>'+
    '</div></div><div id="cmnt-panel" class="mt-5"></div></section>';
  cmntTab('overview');
}
window.cmntTab=async function(tab){
  var p=document.getElementById('cmnt-panel'); if(!p)return;
  if(tab==='overview')return cmntOverview(p);
  if(tab==='research')return cmntResearch(p);
  if(tab==='library')return cmntLibrary(p);
  if(tab==='nexus')return cmntNexus(p);
};

async function cmntOverview(p){
  var a=await Promise.all([
    db.from('cmnt_scientific_domains').select('*',{count:'exact',head:true}).eq('active',true),
    db.from('social_communities').select('*',{count:'exact',head:true}),
    db.from('cmnt_research_projects').select('*',{count:'exact',head:true}),
    db.from('cmnt_scientific_sources').select('*',{count:'exact',head:true}),
    db.from('cmnt_learning_resources').select('*',{count:'exact',head:true}).eq('published',true)
  ]);
  var nums=a.map(function(x){return x.count||0});
  p.innerHTML='<div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">'+
    stat('Comunidades neurocientíficas',nums[1],'social_communities')+
    stat('Projetos de pesquisa',nums[2],'cmnt_research_projects')+
    stat('Fontes científicas',nums[3],'cmnt_scientific_sources')+
    stat('Domínios científicos',nums[0],'cmnt_scientific_domains')+
    '</div>'+
    '<div class="grid lg:grid-cols-2 gap-5 mt-5">'+
      '<div class="card rounded-3xl p-5"><h2 class="text-xl font-black">Cultura CMNT</h2><p class="text-slate-600 mt-2 leading-7">Toda comunidade criada daqui em diante nasce com domínio científico, propósito, escopo e regras de convivência. A plataforma diferencia opinião, experiência, hipótese e evidência.</p><div class="grid grid-cols-2 gap-2 mt-4">'+['Evidência','Respeito','Segurança','Fontes','Sem pseudociência','Privacidade','Responsabilidade'].map(function(x){return '<span class="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-800 text-sm font-bold">✓ '+x+'</span>'}).join('')+'</div></div>'+
      '<div class="card rounded-3xl p-5"><h2 class="text-xl font-black">Arquitetura científica</h2><div class="space-y-3 mt-4">'+
        ['🧠 Neurociência do Trânsito','🔬 Pesquisa e metodologia','📚 Biblioteca de evidências','🎓 Educação e Neuroeducação','🧩 HSI + NEXUS 12','📊 Observatório NeuroTrânsito'].map(function(x){return '<div class="p-3 rounded-2xl bg-slate-50 font-bold">'+x+'</div>'}).join('')+
      '</div></div></div>'+
    '<div class="card rounded-3xl p-5 mt-5"><h2 class="text-xl font-black">Próxima evolução</h2><p class="text-slate-600 mt-2">O CMNT passa a ser a camada científica da rede sem substituir o feed social. O conteúdo social continua existindo; agora ele pode ser contextualizado por domínio, evidência, pesquisa e formação.</p></div>';
}
function stat(label,n,kind){return '<div class="card rounded-3xl p-5"><div class="text-3xl font-black">'+n+'</div><div class="text-sm text-slate-500 mt-1">'+label+'</div></div>'}

async function cmntResearch(p){
  var r=await db.from('cmnt_research_projects').select('id,title,abstract,status,study_type,scientific_domain_id,created_at').order('created_at',{ascending:false}).limit(30);
  var rows=(r.data||[]).map(function(x){var d=domainById(x.scientific_domain_id);return '<div class="card rounded-3xl p-5"><div class="flex justify-between gap-3"><div><div class="text-xs uppercase tracking-widest text-emerald-700 font-black">'+escx(d&&d.name||'Domínio científico')+'</div><h3 class="text-xl font-black mt-1">'+escx(x.title)+'</h3></div><span class="text-xs px-2 py-1 rounded-full bg-slate-100 font-bold">'+escx(x.status)+'</span></div><p class="text-slate-600 mt-3">'+escx(x.abstract||'Sem resumo.')+'</p><div class="text-xs text-slate-400 mt-3">'+escx(x.study_type)+'</div></div>'}).join('');
  p.innerHTML='<div class="flex items-center justify-between gap-3"><div><h2 class="text-2xl font-black">Laboratório de Pesquisa</h2><p class="text-slate-500">Projetos, métodos, hipóteses e evidências.</p></div><button onclick="cmntNewResearch()" class="bg-[#07111f] text-white px-4 py-3 rounded-2xl font-bold">+ Novo estudo</button></div><div class="grid gap-4 mt-5">'+(rows||'<div class="card rounded-3xl p-8 text-center text-slate-500">Nenhum projeto publicado ainda.</div>')+'</div>';
}
window.cmntNewResearch=function(){
 if(!S.user)return auth();
 document.getElementById('modal').innerHTML='<div class="fixed inset-0 modal z-[80] grid place-items-center p-4 overflow-auto"><div class="bg-white rounded-3xl p-6 w-full max-w-xl my-5"><h2 class="text-2xl font-black">Novo projeto de pesquisa</h2><p class="text-sm text-slate-500 mt-1">O estudo começa como rascunho e só poderá ser publicado após revisão.</p><input id="rpTitle" class="w-full bg-slate-100 rounded-xl p-3 mt-5" placeholder="Título do estudo"><select id="rpDomain" class="w-full bg-slate-100 rounded-xl p-3 mt-3"><option value="">Domínio científico</option>'+domainOptions()+'</select><select id="rpType" class="w-full bg-slate-100 rounded-xl p-3 mt-3"><option value="observational">Observacional</option><option value="experimental">Experimental</option><option value="survey">Survey</option><option value="longitudinal">Longitudinal</option><option value="mixed_methods">Métodos mistos</option></select><textarea id="rpAbstract" class="w-full bg-slate-100 rounded-xl p-3 mt-3" rows="4" placeholder="Resumo"></textarea><textarea id="rpObjective" class="w-full bg-slate-100 rounded-xl p-3 mt-3" rows="3" placeholder="Objetivo"></textarea><textarea id="rpHypothesis" class="w-full bg-slate-100 rounded-xl p-3 mt-3" rows="3" placeholder="Hipótese"></textarea><textarea id="rpMethod" class="w-full bg-slate-100 rounded-xl p-3 mt-3" rows="4" placeholder="Metodologia"></textarea><button onclick="cmntSaveResearch()" class="w-full bg-[#0b8b55] text-white rounded-xl p-3 mt-4 font-black">Salvar projeto</button></div></div>';
};
window.cmntSaveResearch=async function(){
 var title=document.getElementById('rpTitle').value.trim(), domain=document.getElementById('rpDomain').value, slug=title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')+'-'+Math.random().toString(36).slice(2,7);
 if(!title||!domain)return toast('Informe título e domínio científico.',true);
 var r=await db.from('cmnt_research_projects').insert({owner_id:S.user.id,title:title,slug:slug,scientific_domain_id:domain,study_type:document.getElementById('rpType').value,abstract:document.getElementById('rpAbstract').value.trim(),objective:document.getElementById('rpObjective').value.trim(),hypothesis:document.getElementById('rpHypothesis').value.trim(),methodology:document.getElementById('rpMethod').value.trim(),status:'draft'});
 if(r.error)return toast(r.error.message,true);closeModal();toast('Projeto criado como rascunho.');cmntTab('research');
};

async function cmntLibrary(p){
 var r=await db.from('cmnt_scientific_sources').select('id,title,authors,journal,publication_year,doi,evidence_level,review_status,source_type').order('created_at',{ascending:false}).limit(50);
 var rows=(r.data||[]).map(function(x){return '<article class="card rounded-3xl p-5"><div class="flex gap-2 flex-wrap"><span class="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold">'+escx(x.evidence_level)+'</span><span class="text-xs px-2 py-1 rounded-full bg-slate-100 font-bold">'+escx(x.source_type)+'</span></div><h3 class="font-black text-lg mt-3">'+escx(x.title)+'</h3><p class="text-sm text-slate-500 mt-1">'+escx((x.authors||[]).join(', '))+'</p><div class="text-xs text-slate-400 mt-2">'+escx(x.journal||'')+' '+escx(x.publication_year||'')+(x.doi?' · DOI: '+escx(x.doi):'')+'</div></article>'}).join('');
 p.innerHTML='<div class="flex items-center justify-between"><div><h2 class="text-2xl font-black">Biblioteca de Evidências</h2><p class="text-slate-500">Fontes científicas que podem sustentar conteúdos da rede.</p></div><button onclick="cmntNewSource()" class="bg-[#07111f] text-white px-4 py-3 rounded-2xl font-bold">+ Fonte</button></div><div class="grid gap-4 mt-5">'+(rows||'<div class="card rounded-3xl p-8 text-center text-slate-500">A biblioteca ainda está vazia.</div>')+'</div>';
}
window.cmntNewSource=function(){
 if(!S.user)return auth();
 document.getElementById('modal').innerHTML='<div class="fixed inset-0 modal z-[80] grid place-items-center p-4 overflow-auto"><div class="bg-white rounded-3xl p-6 w-full max-w-xl my-5"><h2 class="text-2xl font-black">Adicionar fonte científica</h2><input id="srcTitle" class="w-full bg-slate-100 rounded-xl p-3 mt-5" placeholder="Título"><input id="srcAuthors" class="w-full bg-slate-100 rounded-xl p-3 mt-3" placeholder="Autores separados por vírgula"><input id="srcJournal" class="w-full bg-slate-100 rounded-xl p-3 mt-3" placeholder="Revista/periódico"><input id="srcYear" type="number" class="w-full bg-slate-100 rounded-xl p-3 mt-3" placeholder="Ano"><input id="srcDoi" class="w-full bg-slate-100 rounded-xl p-3 mt-3" placeholder="DOI"><select id="srcType" class="w-full bg-slate-100 rounded-xl p-3 mt-3"><option value="article">Artigo</option><option value="review">Revisão</option><option value="meta_analysis">Meta-análise</option><option value="book">Livro</option><option value="report">Relatório</option></select><textarea id="srcAbstract" class="w-full bg-slate-100 rounded-xl p-3 mt-3" rows="4" placeholder="Resumo"></textarea><button onclick="cmntSaveSource()" class="w-full bg-[#0b8b55] text-white rounded-xl p-3 mt-4 font-black">Enviar para revisão</button></div></div>';
};
window.cmntSaveSource=async function(){
 var title=document.getElementById('srcTitle').value.trim();if(!title)return toast('Informe o título.',true);
 var r=await db.from('cmnt_scientific_sources').insert({title:title,authors:document.getElementById('srcAuthors').value.split(',').map(function(x){return x.trim()}).filter(Boolean),journal:document.getElementById('srcJournal').value.trim(),publication_year:Number(document.getElementById('srcYear').value)||null,doi:document.getElementById('srcDoi').value.trim()||null,source_type:document.getElementById('srcType').value,abstract:document.getElementById('srcAbstract').value.trim(),created_by:S.user.id,review_status:'unreviewed'});
 if(r.error)return toast(r.error.message,true);closeModal();toast('Fonte enviada para revisão científica.');cmntTab('library');
};

async function cmntNexus(p){
 var r=await db.from('cmnt_nexus_competencies').select('*').order('position');
 var cards=(r.data||[]).map(function(x){return '<div class="card rounded-3xl p-4"><div class="flex justify-between"><b>'+x.position+'. '+escx(x.name)+'</b><span class="text-emerald-700 font-black">'+escx(x.code)+'</span></div><p class="text-sm text-slate-500 mt-2">'+escx(x.description)+'</p></div>'}).join('');
 p.innerHTML='<div class="card rounded-3xl p-6"><div class="text-xs uppercase tracking-widest text-emerald-700 font-black">NEXUS 12</div><h2 class="text-2xl font-black mt-1">Competências humanas para mobilidade segura</h2><p class="text-slate-600 mt-2">A matriz NEXUS passa a ser uma camada mensurável da plataforma, preparada para avaliações e evolução longitudinal.</p><div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-5">'+cards+'</div><div class="mt-5 p-4 rounded-2xl bg-amber-50 text-amber-900 text-sm">A aplicação de instrumentos psicométricos, coleta de dados de pesquisa e interpretação científica deve seguir protocolo, consentimento e governança ética adequados ao estudo.</div></div>';
}

window.communities=function(){
 return '<section><div class="flex justify-between items-center mb-5"><div><small class="uppercase tracking-widest text-[#0b8b55] font-black">CMNT · Comunidades Neurocientíficas</small><h1 class="text-3xl font-black">Comunidades por domínio científico</h1><p class="text-slate-500 mt-1">Toda nova comunidade deve nascer com propósito científico, escopo e regras CMNT.</p></div><button onclick="newCommunity()" class="bg-[#07111f] text-white px-4 py-3 rounded-2xl font-bold">+ Criar</button></div><div class="grid sm:grid-cols-2 gap-4">'+S.communities.map(function(c){var d=domainById(c.scientific_domain_id);return '<button onclick="community(\''+c.id+'\')" class="card text-left rounded-3xl p-5 hover:shadow-xl"><div class="flex justify-between gap-2"><div class="w-14 h-14 brand text-white rounded-2xl grid place-items-center font-black text-xl">'+escx(c.name).slice(0,2).toUpperCase()+'</div><span class="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-emerald-50 text-emerald-800 font-black h-fit">NEUROCIÊNCIA</span></div><h3 class="font-black text-lg mt-4">'+escx(c.name)+'</h3><p class="text-sm text-slate-500 mt-1">'+escx(c.description)+'</p><div class="mt-3 text-xs text-[#0b8b55] font-black">'+escx(d&&d.name||c.category)+'</div><div class="text-xs text-slate-400 mt-2">'+escx(c.scientific_purpose||'Comunidade orientada por evidências e segurança humana.')+'</div></button>'}).join('')+'</div></section>';
};

window.newCommunity=function(){
 if(!S.user)return auth();
 document.getElementById('modal').innerHTML='<div class="fixed inset-0 modal z-[80] grid place-items-center p-4 overflow-auto"><div class="bg-white rounded-3xl p-6 w-full max-w-xl my-5"><div class="text-xs uppercase tracking-widest text-emerald-700 font-black">Governança CMNT</div><h2 class="text-2xl font-black mt-1">Criar comunidade neurocientífica</h2><p class="text-sm text-slate-500 mt-2">Comunidades não são apenas grupos sociais: devem ter um tema científico ou técnico coerente com a missão do CMNT.</p><input id="cn" class="w-full bg-slate-100 rounded-xl p-3 mt-5" placeholder="Nome da comunidade"><select id="cdomain" class="w-full bg-slate-100 rounded-xl p-3 mt-3"><option value="">Selecione o domínio científico obrigatório</option>'+domainOptions()+'</select><textarea id="cpurpose" class="w-full bg-slate-100 rounded-xl p-3 mt-3" rows="3" placeholder="Qual é o propósito científico da comunidade?"></textarea><textarea id="cscope" class="w-full bg-slate-100 rounded-xl p-3 mt-3" rows="3" placeholder="Qual é o escopo? O que pertence e o que não pertence ao grupo?"></textarea><textarea id="cd" class="w-full bg-slate-100 rounded-xl p-3 mt-3" placeholder="Descrição pública"></textarea><label class="flex gap-3 items-start mt-4 text-sm"><input id="cagree" type="checkbox" class="mt-1"><span>Concordo com a cultura CMNT: evidência antes de afirmação, respeito, segurança, fontes, privacidade e responsabilidade social.</span></label><button onclick="saveCommunity()" class="w-full bg-[#0b8b55] text-white rounded-xl p-3 mt-4 font-black">Criar comunidade neurocientífica</button></div></div>';
};
window.saveCommunity=async function(){
 var n=document.getElementById('cn').value.trim(),domain=document.getElementById('cdomain').value,purpose=document.getElementById('cpurpose').value.trim(),scope=document.getElementById('cscope').value.trim(),d=document.getElementById('cd').value.trim(),agree=document.getElementById('cagree').checked;
 if(!n||!domain||!purpose||!scope||!agree)return toast('Preencha nome, domínio, propósito, escopo e aceite da cultura CMNT.',true);
 var slug=n.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')+'-'+Math.random().toString(36).slice(2,6);
 var r=await db.from('social_communities').insert({name:n,slug:slug,description:d,category:'Neurociência',created_by:S.user.id,scientific_domain_id:domain,scientific_purpose:purpose,scientific_scope:scope,community_type:'neurocientifica',requires_scientific_moderation:true,created_from_template:'CMNT-v1'});
 if(r.error)return toast(r.error.message,true);
 var created=await db.from('social_communities').select('id').eq('slug',slug).maybeSingle();
 if(created.data){
  var rules=[['EVIDENCE','Evidência antes de afirmação','Distinguir opinião, experiência, hipótese e evidência científica.'],['RESPECT','Respeito e humanização','Debater ideias sem atacar pessoas.'],['SAFETY','Segurança','Não incentivar condutas de risco.'],['SOURCES','Fontes','Sempre que possível, indicar fonte técnica ou científica.'],['NO_PSEUDOSCIENCE','Sem pseudociência','Não apresentar alegações sem base como fatos científicos.'],['PRIVACY','Privacidade','Não publicar dados pessoais sem autorização.'],['CIVIC','Responsabilidade social','Priorizar redução de danos e segurança coletiva.']];
  await db.from('cmnt_community_rules').insert(rules.map(function(x){return {community_id:created.data.id,rule_code:x[0],title:x[1],description:x[2]}}));
 }
 closeModal();await load();shell();toast('Comunidade neurocientífica criada.');
};

window.community=function(id){
 var c=S.communities.find(function(x){return x.id===id});if(!c)return;
 var d=domainById(c.scientific_domain_id);
 document.getElementById('modal').innerHTML='<div class="fixed inset-0 modal z-[80] grid place-items-center p-4 overflow-auto"><div class="bg-white rounded-3xl p-6 w-full max-w-xl my-5"><div class="flex justify-between"><div><span class="text-xs uppercase tracking-widest text-emerald-700 font-black">Comunidade Neurocientífica</span><h2 class="text-2xl font-black mt-1">'+escx(c.name)+'</h2></div><button onclick="closeModal()" class="text-2xl">×</button></div><div class="p-4 rounded-2xl bg-slate-50 mt-5"><div class="text-xs text-slate-400 uppercase font-black">Domínio</div><div class="font-black mt-1">'+escx(d&&d.name||c.category)+'</div><div class="text-xs text-slate-400 uppercase font-black mt-4">Propósito</div><div class="text-sm text-slate-600 mt-1">'+escx(c.scientific_purpose||c.description)+'</div><div class="text-xs text-slate-400 uppercase font-black mt-4">Escopo</div><div class="text-sm text-slate-600 mt-1">'+escx(c.scientific_scope||'Conteúdo técnico e científico relacionado ao domínio.')+'</div></div><div class="mt-5 p-4 rounded-2xl border border-emerald-100 bg-emerald-50"><b class="text-emerald-900">Cultura CMNT</b><p class="text-sm text-emerald-900 mt-2">Opinião é permitida, mas deve ser identificada como opinião. Afirmações técnicas devem buscar fontes. Conteúdo perigoso, pseudocientífico ou desumanizante não é compatível com a comunidade.</p></div>'+(S.user?'<button onclick="join(\''+id+'\')" class="w-full bg-[#0b8b55] text-white rounded-2xl p-3 mt-5 font-black">Participar da comunidade</button>':'<button onclick="auth()" class="w-full bg-[#07111f] text-white rounded-2xl p-3 mt-5 font-black">Entrar para participar</button>')+'</div></div>';
};

window.go=function(t){
 if(t==='cmnt'){S.tab='cmnt';loadDomains().then(cmntShell);return;}
 return oldGo(t);
};
loadDomains().then(function(){ if(window.S&&S.communities&&S.communities.length){ /* dados serão recarregados pelo shell existente */ }});
})();
/* Load the additive observatory layer after the platform layer is available. */
(function(){var s=document.createElement('script');s.src='cmnt-observatory.js';s.async=false;document.body.appendChild(s)})();
