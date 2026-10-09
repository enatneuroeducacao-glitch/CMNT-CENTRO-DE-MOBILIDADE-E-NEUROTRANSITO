/* CMNT Platform — additive layer for the 26-point roadmap.
   Does not replace the existing social network. It adds scientific, research,
   education, evidence, governance, observatory and integration surfaces. */
(function(){
  'use strict';
  var baseGo=window.go;
  var state={section:'overview',admin:false,domains:[],projects:[],sources:[],templates:[],events:[],articles:[],submissions:[],knowledge:[],institutions:[],indicators:[]};
  function q(t){return String(t||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]})}
  function card(x){return '<div class="card rounded-3xl p-5">'+x+'</div>'}
  function badge(t){return '<span class="inline-flex px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-black">'+q(t)+'</span>'}
  async function refresh(){
    var [d,p,s,t,e,a,sub,k,i,ind]=await Promise.all([
      db.from('cmnt_scientific_domains').select('*').eq('active',true).order('name'),
      db.from('cmnt_research_projects').select('id,title,abstract,objective,status,study_type,ethics_status,scientific_domain_id,created_at').order('created_at',{ascending:false}),
      db.from('cmnt_scientific_sources').select('id,title,source_type,authors,journal,publication_year,doi,pmid,url,evidence_level,review_status').in('review_status',['reviewed','approved']).order('publication_year',{ascending:false,nullsLast:true}).limit(100),
      db.from('cmnt_community_templates').select('id,slug,name,purpose,scope,active,scientific_domain_id').eq('active',true).order('name'),
      db.from('cmnt_events').select('id,title,description,event_type,starts_at,ends_at,location,online_url,status,published').or('published.eq.true,organizer_id.eq.'+(S.user?S.user.id:'00000000-0000-0000-0000-000000000000')).order('starts_at').limit(50),
      db.from('cmnt_editorial_articles').select('id,title,slug,summary,article_type,status,published_at').or('status.eq.published,author_id.eq.'+(S.user?S.user.id:'00000000-0000-0000-0000-000000000000')).order('created_at',{ascending:false}).limit(50),
      db.from('cmnt_research_submissions').select('id,title,submission_type,status,submitted_at').eq('submitted_by',S.user?S.user.id:'00000000-0000-0000-0000-000000000000').order('submitted_at',{ascending:false}),
      db.from('cmnt_knowledge_items').select('id,title,summary,item_type,status,scientific_domain_id').or('status.eq.published,created_by.eq.'+(S.user?S.user.id:'00000000-0000-0000-0000-000000000000')).order('created_at',{ascending:false}),
      db.from('cmnt_institutions').select('id,name,acronym,institution_type,city,state,website,verified').order('name'),
      db.from('cmnt_observatory_indicators').select('*').eq('active',true).order('name')
    ]);
    state.domains=d.data||[];state.projects=p.data||[];state.sources=s.data||[];state.templates=t.data||[];state.events=e.data||[];state.articles=a.data||[];state.submissions=sub.data||[];state.knowledge=k.data||[];state.institutions=i.data||[];state.indicators=ind.data||[];
    if(S.user){var ar=await db.rpc('cmnt_is_admin');state.admin=!!ar.data}
  }
  function nav(){
    var items=[
      ['overview','Visão geral'],['research','Laboratório de pesquisa'],['researcher','Pesquisador'],['evidence','Evidências'],['nexus','NEXUS 12'],
      ['hsi','HSI'],['education','Academia ENAT'],['observatory','Observatório'],['events','Eventos'],['editorial','Editorial'],
      ['communities','Comunidades científicas'],['institutions','Instituições'],['governance','Governança'],['knowledge','Base de conhecimento'],
      ['integrations','Integrações'],['ai','IA científica'],['admin','Painel administrativo']
    ];
    return items.map(function(x){return '<button onclick="cmntPlatformGo(\''+x[0]+'\')" class="text-left px-3 py-2.5 rounded-xl text-sm font-bold '+(state.section===x[0]?'bg-emerald-100 text-emerald-900':'hover:bg-slate-50 text-slate-600')+'">'+x[1]+'</button>'}).join('')
  }
  function shell(){document.getElementById('main').innerHTML='<section><div class="brand text-white rounded-3xl p-6 sm:p-8"><div class="uppercase tracking-[.2em] text-emerald-300 text-xs font-black">CMNT • Centro de Mobilidade e Neurotrânsito</div><h1 class="text-3xl font-black mt-2">Ecossistema científico, educacional e social</h1><p class="text-white/75 mt-2 max-w-3xl">A rede social permanece. Esta camada organiza ciência, pesquisa, formação, HSI, NEXUS 12, evidências e observatório sem apagar o que já foi construído.</p></div><div class="mt-5 flex flex-wrap gap-2">'+nav()+'</div><div id="cmnt-platform-body" class="mt-5"></div></section>';renderSection()}
  async function renderSection(){
    var el=document.getElementById('cmnt-platform-body');if(!el)return;
    if(state.section==='overview')return el.innerHTML=overview();
    if(state.section==='research')return el.innerHTML=research();
    if(state.section==='researcher')return el.innerHTML=researcher();
    if(state.section==='evidence')return el.innerHTML=evidence();
    if(state.section==='nexus')return el.innerHTML=nexus();
    if(state.section.indexOf('nexus-')===0)return el.innerHTML=nexusDetail(state.section.slice(6));
    if(state.section==='hsi')return el.innerHTML=hsi();
    if(state.section==='education')return el.innerHTML=education();
    if(state.section==='observatory')return el.innerHTML=observatory();
    if(state.section==='events')return el.innerHTML=events();
    if(state.section==='editorial')return el.innerHTML=editorial();
    if(state.section==='communities')return el.innerHTML=communities();
    if(state.section==='institutions')return el.innerHTML=institutions();
    if(state.section==='governance')return el.innerHTML=governance();
    if(state.section==='knowledge')return el.innerHTML=knowledge();
    if(state.section==='integrations')return el.innerHTML=integrations();
    if(state.section==='ai')return el.innerHTML=ai();
    if(state.section.indexOf('admin')===0){if(!state.admin){await cmntAdminRefresh()}if(state.admin)return cmntAdminRender();return el.innerHTML=card('<h2 class="text-xl font-black">Acesso administrativo</h2><p class="text-sm text-slate-500 mt-2">Entre como administrador para acessar esta área.</p><button onclick="cmntAdminLogin()" class="mt-4 bg-[#07111f] text-white px-4 py-3 rounded-xl font-black">Entrar</button>');}
  }
  function overview(){
    var nums=[['Comunidades científicas',S.communities.length],['Domínios científicos',state.domains.length],['Projetos de pesquisa',state.projects.length],['Fontes aprovadas',state.sources.length],['Instituições',state.institutions.length],['Indicadores',state.indicators.length]];
    return '<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">'+nums.map(function(n){return card('<div class="text-3xl font-black">'+n[1]+'</div><div class="text-sm text-slate-500 mt-1">'+n[0]+'</div>')}).join('')+'</div>'+
      card('<h2 class="text-xl font-black">Arquitetura CMNT</h2><p class="text-sm text-slate-600 mt-2 leading-6">1) Rede social → 2) comunidades neurocientíficas → 3) evidências → 4) pesquisa → 5) educação → 6) HSI/NEXUS → 7) observatório → 8) governança → 9) integração institucional → 10) IA científica.</p>')+
      card('<h2 class="text-xl font-black">Cultura científica</h2><div class="grid sm:grid-cols-4 gap-2 mt-4">'+[['Experiência','verde'],['Opinião','azul'],['Informação técnica','amarelo'],['Evidência científica','roxo']].map(function(x){return '<div class="p-4 rounded-2xl bg-slate-50"><b>'+x[0]+'</b><div class="text-xs text-slate-500 mt-1">Identificação obrigatória quando aplicável.</div></div>'}).join('')+'</div>');
  }
  function research(){return '<div class="flex items-center justify-between mb-4"><div><h2 class="text-2xl font-black">Laboratório de Pesquisa</h2><p class="text-sm text-slate-500">Projetos, protocolos, ética, dados e submissões.</p></div><button onclick="cmntNewProject()" class="bg-[#07111f] text-white px-4 py-2.5 rounded-xl font-black">+ Novo projeto</button></div>'+
    '<div class="space-y-3">'+(state.projects.length?state.projects.map(function(p){return card('<div class="flex justify-between gap-3"><div><h3 class="font-black">'+q(p.title)+'</h3><p class="text-sm text-slate-600 mt-1">'+q(p.abstract||p.objective)+'</p><div class="flex gap-2 mt-3">'+badge(p.study_type)+' '+badge(p.status)+' '+badge(p.ethics_status)+'</div></div><button onclick="cmntProtocol(\''+p.id+'\')" class="px-3 py-2 rounded-xl bg-slate-100 text-sm font-black h-fit">Protocolo</button></div>')}).join(''):'<div class="text-center text-slate-400 py-12">Nenhum projeto ainda.</div>')+'</div>'+
    card('<h3 class="font-black">Fluxo científico</h3><p class="text-sm text-slate-600 mt-2">Ideia → projeto → protocolo → análise ética → coleta → análise → revisão → publicação → observatório.</p>')+
    card('<h3 class="font-black">Submissões do usuário</h3><div class="mt-3 space-y-2">'+(state.submissions.length?state.submissions.map(function(s){return '<div class="p-3 rounded-xl bg-slate-50 flex justify-between"><span>'+q(s.title)+'</span>'+badge(s.status)+'</div>'}).join(''):'<span class="text-sm text-slate-400">Nenhuma submissão.</span>')+'</div>');}
  function researcher(){return card('<h2 class="text-2xl font-black">Perfil científico</h2><p class="text-sm text-slate-500 mt-1">Complemente o perfil social sem substituir sua identidade existente.</p>')+
    '<div class="grid md:grid-cols-2 gap-4 mt-4">'+card('<label class="text-xs font-black uppercase">Resumo profissional</label><textarea id="rp_summary" class="w-full bg-slate-100 rounded-xl p-3 mt-2" rows="4"></textarea>')+
    card('<label class="text-xs font-black uppercase">Bio científica</label><textarea id="rp_bio" class="w-full bg-slate-100 rounded-xl p-3 mt-2" rows="4"></textarea>')+'</div>'+
    card('<label class="text-xs font-black uppercase">ORCID</label><input id="rp_orcid" class="w-full bg-slate-100 rounded-xl p-3 mt-2" placeholder="0000-0000-0000-0000"><label class="text-xs font-black uppercase block mt-4">Lattes</label><input id="rp_lattes" class="w-full bg-slate-100 rounded-xl p-3 mt-2"><button onclick="cmntSaveResearcher()" class="mt-4 bg-[#0b8b55] text-white px-5 py-3 rounded-xl font-black">Salvar perfil científico</button></div>');}
  function evidence(){return '<div class="flex items-center justify-between mb-4"><div><h2 class="text-2xl font-black">Biblioteca de Evidências</h2><p class="text-sm text-slate-500">Fontes revisadas antes de serem tratadas como evidência no CMNT.</p></div><button onclick="cmntNewSource()" class="bg-[#07111f] text-white px-4 py-2.5 rounded-xl font-black">+ Fonte</button></div><div class="space-y-3">'+(state.sources.length?state.sources.map(function(s){return card('<h3 class="font-black">'+q(s.title)+'</h3><p class="text-sm text-slate-500 mt-1">'+q((s.authors||[]).join(', '))+' '+q(s.journal||'')+' '+q(s.publication_year||'')+'</p><div class="flex gap-2 mt-3">'+badge(s.evidence_level)+' '+badge(s.review_status)+'</div><p class="text-xs mt-3 text-slate-500">'+q(s.doi||s.pmid||s.url||'')+'</p>')}).join(''):'<div class="text-center text-slate-400 py-12">A biblioteca ainda não possui fontes aprovadas.</div>')+'</div>'; }
  window.cmntNexusData=function(){return nexusData();};
  function nexusData(){return [
    {code:'SA',n:1,title:'Consciência Situacional',desc:'Perceber o ambiente, o contexto e mudanças relevantes.',subject:'Atenção ao ambiente, leitura do contexto, antecipação de mudanças e percepção do que está acontecendo ao redor.',practice:'Identificar riscos e mudanças de contexto antes que se tornem eventos críticos.',questions:['O que mudou no ambiente?','Quais sinais indicam risco?','O que pode acontecer nos próximos segundos?'],related:'HSI Cognitivo • IPR • NeuroDrive'},
    {code:'PR',n:2,title:'Percepção de Risco',desc:'Identificar, interpretar e antecipar riscos.',subject:'Reconhecimento de perigos, avaliação de probabilidade e gravidade, margem de segurança e antecipação.',practice:'Transformar percepção em prevenção: reconhecer o risco cedo e escolher uma resposta segura.',questions:['Qual é o perigo?','Qual a probabilidade de ocorrência?','Qual margem de segurança existe?'],related:'HSI Cognitivo/Comportamental • IPR'},
    {code:'TD',n:3,title:'Tomada de Decisão',desc:'Escolher respostas seguras sob pressão e incerteza.',subject:'Decisão sob pressão, priorização, alternativas, consequências e escolha de respostas seguras.',practice:'Comparar alternativas antes de agir e evitar decisões impulsivas ou baseadas em pressão social.',questions:['Quais são as alternativas?','Qual delas reduz o risco?','O que pode acontecer depois da decisão?'],related:'HSI Cognitivo/Emocional • II'},
    {code:'CV',n:4,title:'Controle Veicular',desc:'Integrar controle do veículo, tarefa e contexto.',subject:'Domínio operacional do veículo, coordenação, velocidade, distância e adequação do controle às condições.',practice:'Manter o veículo sob controle sem perder atenção do ambiente e das condições da via.',questions:['O controle está adequado à situação?','A velocidade é compatível com o contexto?','Há margem para corrigir um erro?'],related:'NEXUS integrado • HSI Comportamental'},
    {code:'EC',n:5,title:'Comunicação Eficaz',desc:'Comunicar intenções e reduzir conflitos.',subject:'Comunicação verbal e não verbal, leitura de sinais, clareza de intenção e prevenção de conflitos.',practice:'Tornar intenções previsíveis e reduzir ambiguidades entre condutores, pedestres e demais usuários.',questions:['Minha intenção está clara?','Como o outro usuário pode interpretar minha ação?','A comunicação reduz ou aumenta o conflito?'],related:'HSI Social • IIS'},
    {code:'RL',n:6,title:'Regulação e Legislação',desc:'Conhecer e aplicar normas e princípios de segurança.',subject:'CTB, normas de circulação, responsabilidade, direitos, deveres e princípios de segurança viária.',practice:'Aplicar a legislação como instrumento de proteção da vida, não apenas como regra punitiva.',questions:['Qual norma se aplica?','Qual é a responsabilidade de cada agente?','A conduta adotada protege a vida?'],related:'ENAT • HSI Social/Contextual'},
    {code:'AD',n:7,title:'Adaptação',desc:'Ajustar comportamento às condições e mudanças.',subject:'Flexibilidade comportamental diante de clima, via, tráfego, tecnologia, imprevistos e mudanças sociais.',practice:'Recalibrar a conduta quando as condições mudam, sem insistir em estratégias que deixaram de ser seguras.',questions:['O contexto mudou?','Minha estratégia ainda é adequada?','O que precisa ser ajustado agora?'],related:'HSI Contextual • ISC'},
    {code:'IE',n:8,title:'Inteligência Emocional',desc:'Reconhecer e regular estados emocionais.',subject:'Autopercepção, autorregulação, impulsividade, estresse, frustração e influência das emoções sobre decisões.',practice:'Reconhecer sinais emocionais e recuperar condições para uma decisão segura antes de agir.',questions:['Como estou emocionalmente?','Minha emoção está alterando minha percepção?','Preciso reduzir a ativação antes de continuar?'],related:'HSI Emocional • II'},
    {code:'RS',n:9,title:'Responsabilidade Social',desc:'Considerar o impacto das decisões sobre os demais.',subject:'Cidadania, empatia, convivência, proteção de usuários vulneráveis e responsabilidade coletiva.',practice:'Considerar consequências para outras pessoas e priorizar a proteção da vida no espaço compartilhado.',questions:['Quem pode ser afetado pela minha decisão?','Há usuários vulneráveis envolvidos?','Minha conduta contribui para a segurança coletiva?'],related:'HSI Social • IRC'},
    {code:'AC',n:10,title:'Aprendizagem Contínua',desc:'Atualizar conhecimentos e competências.',subject:'Aprendizagem ao longo da vida, feedback, atualização normativa, reflexão sobre erros e desenvolvimento de competências.',practice:'Usar experiências e dados para corrigir padrões e melhorar continuamente o comportamento seguro.',questions:['O que aprendi com esta situação?','Que competência precisa evoluir?','Qual evidência ou feedback pode orientar a mudança?'],related:'ENAT Academy • NeuroDrive • NEXUS longitudinal'},
    {code:'ER',n:11,title:'Ergonomia',desc:'Adequar pessoa, tarefa, ambiente e tecnologia.',subject:'Postura, fadiga, carga mental, atenção, interface homem-máquina e adequação das condições de trabalho.',practice:'Reduzir sobrecarga física e cognitiva para preservar desempenho e segurança.',questions:['A tarefa está exigindo mais do que a pessoa consegue sustentar?','Há fadiga ou sobrecarga?','O ambiente e a tecnologia favorecem uma ação segura?'],related:'HSI Contextual • Neuroergonomia'},
    {code:'PS',n:12,title:'Primeiros Socorros',desc:'Responder adequadamente a emergências.',subject:'Reconhecimento da emergência, proteção da cena, acionamento de ajuda e cuidados iniciais até a chegada do atendimento especializado.',practice:'Agir com segurança em uma emergência sem criar novos riscos para a vítima, para si ou para terceiros.',questions:['A cena é segura?','Qual ajuda especializada deve ser acionada?','Quais cuidados iniciais são apropriados?'],related:'ENAT • Segurança viária • resposta a emergências'}
  ];}
  function nexus(){
    var modules=nexusData();
    return card('<div class="flex items-start justify-between gap-4"><div><div class="text-xs font-black uppercase tracking-[.16em] text-emerald-700">Matriz de competências</div><h2 class="text-2xl font-black mt-1">NEXUS 12</h2><p class="text-sm text-slate-500 mt-1">Cada competência é um módulo de aprendizagem e acompanhamento. Clique em qualquer módulo para abrir seu conteúdo.</p></div><span class="hidden sm:inline-flex px-3 py-2 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-black">12 módulos</span></div><div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-5">'+modules.map(function(m){return '<button type="button" data-cmnt-nexus="'+m.code+'" class="group text-left p-4 rounded-2xl bg-slate-50 hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"><div class="flex items-center justify-between gap-2"><span class="text-xs font-black text-emerald-700">NEXUS '+m.n+'</span><span class="text-xs font-black text-slate-400 group-hover:text-emerald-700">'+m.code+' →</span></div><h3 class="font-black mt-1">'+m.title+'</h3><p class="text-xs text-slate-500 mt-1">'+m.desc+'</p><span class="inline-block mt-3 text-xs font-black text-emerald-700">Abrir módulo →</span></button>'}).join('')+'</div><button onclick="cmntNexusStart()" class="mt-5 bg-[#0b8b55] text-white px-5 py-3 rounded-xl font-black">Iniciar avaliação NEXUS 12</button>');}
  function nexusDetail(code){
    var m=nexusData().find(function(x){return x.code===code});
    if(!m)return nexus();
    var questions=(m.questions||[]).map(function(qt){return '<div class="p-4 rounded-2xl bg-slate-50 text-sm font-semibold text-slate-700">'+qt+'</div>'}).join('');
    return `<div class="mb-4"><button type="button" onclick="cmntNexusBack()" class="text-sm font-black text-emerald-700 hover:text-emerald-900">← Voltar para NEXUS 12</button></div>
      <div class="card rounded-3xl p-6">
        <div class="flex items-start justify-between gap-4">
          <div><span class="text-xs font-black uppercase tracking-[.16em] text-emerald-700">NEXUS ${m.n} • ${m.code}</span><h2 class="text-3xl font-black mt-2">${m.title}</h2><p class="text-base text-slate-600 mt-2">${m.desc}</p></div>
          <div class="hidden sm:grid place-items-center w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 font-black text-lg">${m.n}</div>
        </div>
        <div class="grid md:grid-cols-2 gap-4 mt-6">
          <div class="p-5 rounded-2xl bg-slate-50"><h3 class="font-black">O que este módulo desenvolve?</h3><p class="text-sm text-slate-600 mt-2 leading-6">${m.subject}</p></div>
          <div class="p-5 rounded-2xl bg-slate-50"><h3 class="font-black">Aplicação no trânsito</h3><p class="text-sm text-slate-600 mt-2 leading-6">${m.practice}</p></div>
        </div>
        <div class="p-5 rounded-2xl bg-emerald-50 mt-4"><h3 class="font-black text-emerald-900">Perguntas orientadoras</h3><div class="grid md:grid-cols-3 gap-3 mt-4">${questions}</div></div>
        <div class="p-5 rounded-2xl border border-slate-200 mt-4"><h3 class="font-black">Conexões no ecossistema CMNT</h3><p class="text-sm text-slate-600 mt-2 leading-6">${m.related}</p></div>
        <div class="flex flex-wrap gap-3 mt-5"><button type="button" onclick="cmntNexusAssessModule()" class="bg-[#0b8b55] text-white px-5 py-3 rounded-xl font-black">Avaliar ${m.title}</button><button type="button" onclick="cmntNexusBack()" class="px-5 py-3 rounded-xl bg-slate-100 font-black">Ver os 12 módulos</button></div>
      </div>`;
  }
  if(!window.__cmntNexusClickBound){
    document.addEventListener('click',function(ev){
      var target=ev.target.closest ? ev.target.closest('[data-cmnt-nexus]') : null;
      var assess=ev.target.closest ? ev.target.closest('[data-cmnt-nexus-assess]') : null;
      if(assess){
        ev.preventDefault();
        var assessCode=assess.getAttribute('data-cmnt-nexus-assess');
        if(assessCode)window.cmntNexusAssessModule(assessCode);
        return;
      }
      if(!target)return;
      ev.preventDefault();
      var code=target.getAttribute('data-cmnt-nexus');
      if(code)window.cmntNexusOpen(code);
    });
    window.__cmntNexusClickBound=true;
  }
  window.cmntNexusOpen=function(code){state.section='nexus-'+code;renderSection();};
  window.cmntNexusBack=function(){state.section='nexus';renderSection();};
  window.cmntNexusAssessModule=function(code){window.cmntNexusStart();};
  function hsi(){return card('<h2 class="text-2xl font-black">HSI — Human Safety Index</h2><p class="text-sm text-slate-600 mt-2">Integração preparada com o modelo HSI existente. Nenhuma avaliação individual será publicada no observatório; somente dados agregados e autorizados.</p><div class="grid sm:grid-cols-5 gap-3 mt-5">'+[['Cognitivo','30%'],['Emocional','25%'],['Comportamental','25%'],['Social','10%'],['Contextual','10%']].map(function(x){return '<div class="p-4 rounded-2xl bg-slate-50"><b>'+x[0]+'</b><div class="text-2xl font-black mt-1">'+x[1]+'</div></div>'}).join('')+'</div><div class="mt-5 p-4 rounded-2xl border border-emerald-100 bg-emerald-50 text-sm text-emerald-900">HSI é instrumento de segurança humana, não diagnóstico clínico. Dados individuais permanecem protegidos.</div>');}
  function education(){return card('<h2 class="text-2xl font-black">Academia ENAT</h2><p class="text-sm text-slate-500 mt-1">Base para trilhas, cursos, recursos e formação contínua.</p><div class="grid md:grid-cols-3 gap-3 mt-5">'+[['Fundamentos','Neurociência aplicada ao trânsito'],['Competências','NEXUS 12 e comportamento seguro'],['Formação','ENAT e educação para mobilidade']].map(function(x){return '<div class="p-4 rounded-2xl bg-slate-50"><b>'+x[0]+'</b><p class="text-sm text-slate-600 mt-2">'+x[1]+'</p></div>'}).join('')+'</div><button onclick="cmntNewKnowledge()" class="mt-5 bg-[#07111f] text-white px-4 py-3 rounded-xl font-black">+ Recurso de conhecimento</button>');}
  function observatory(){return card('<h2 class="text-2xl font-black">Observatório CMNT</h2><p class="text-sm text-slate-500 mt-1">Indicadores agregados, com metodologia e proveniência registradas.</p><div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-5">'+state.indicators.map(function(i){return '<div class="p-4 rounded-2xl bg-slate-50"><div class="font-black">'+q(i.name)+'</div><div class="text-xs text-slate-500 mt-1">'+q(i.description)+'</div><div class="mt-3">'+badge(i.code)+'</div></div>'}).join('')+'</div><div class="mt-5 p-4 rounded-2xl border border-slate-200 text-sm">O observatório não publica respostas individuais, identidade, diagnósticos ou dados brutos sensíveis.</div>');}
  function events(){return '<div class="flex justify-between mb-4"><div><h2 class="text-2xl font-black">Eventos científicos</h2><p class="text-sm text-slate-500">Congressos, seminários, lives e encontros.</p></div><button onclick="cmntNewEvent()" class="bg-[#07111f] text-white px-4 py-2.5 rounded-xl font-black">+ Evento</button></div><div class="space-y-3">'+(state.events.length?state.events.map(function(e){return card('<h3 class="font-black">'+q(e.title)+'</h3><p class="text-sm text-slate-500 mt-1">'+new Date(e.starts_at).toLocaleString('pt-BR')+' · '+q(e.location||'Online')+'</p><p class="text-sm mt-2">'+q(e.description)+'</p>')}).join(''):'<div class="text-center text-slate-400 py-12">Nenhum evento publicado.</div>')+'</div>'; }
  function editorial(){return '<div class="flex justify-between mb-4"><div><h2 class="text-2xl font-black">Editorial científico</h2><p class="text-sm text-slate-500">Artigos, análises, notas técnicas e revisão.</p></div><button onclick="cmntNewArticle()" class="bg-[#07111f] text-white px-4 py-2.5 rounded-xl font-black">+ Artigo</button></div><div class="space-y-3">'+(state.articles.length?state.articles.map(function(a){return card('<h3 class="font-black">'+q(a.title)+'</h3><p class="text-sm text-slate-500 mt-1">'+q(a.summary)+'</p><div class="mt-3">'+badge(a.status)+'</div>')}).join(''):'<div class="text-center text-slate-400 py-12">Nenhum artigo.</div>')+'</div>'; }
  function communities(){return card('<h2 class="text-2xl font-black">Comunidades Neurocientíficas</h2><p class="text-sm text-slate-500 mt-1">Nenhum grupo genérico: cada comunidade nasce de um domínio, propósito, escopo e regras CMNT.</p><div class="grid md:grid-cols-2 gap-3 mt-5">'+state.templates.map(function(t){return '<div class="p-4 rounded-2xl bg-slate-50"><b>'+q(t.name)+'</b><p class="text-sm text-slate-600 mt-1">'+q(t.purpose)+'</p><span class="text-xs text-slate-400 block mt-2">'+q(t.scope)+'</span></div>'}).join('')+'</div>');}
  function institutions(){return '<div class="flex justify-between mb-4"><div><h2 class="text-2xl font-black">Instituições e rede de pesquisa</h2><p class="text-sm text-slate-500">Universidades, centros, laboratórios e parceiros.</p></div><button onclick="cmntNewInstitution()" class="bg-[#07111f] text-white px-4 py-2.5 rounded-xl font-black">+ Instituição</button></div><div class="space-y-3">'+(state.institutions.length?state.institutions.map(function(i){return card('<div class="flex justify-between"><div><b>'+q(i.name)+'</b><p class="text-sm text-slate-500 mt-1">'+q(i.acronym||'')+' · '+q(i.city||'')+' '+q(i.state||'')+'</p></div>'+badge(i.verified?'Verificada':'Em análise')+'</div>')}).join(''):'<div class="text-center text-slate-400 py-12">Nenhuma instituição cadastrada.</div>')+'</div>'; }
  function governance(){return card('<h2 class="text-2xl font-black">Governança científica</h2><p class="text-sm text-slate-500 mt-1">Moderação científica, verificação, ética, editorial e políticas.</p><div class="grid md:grid-cols-2 gap-3 mt-5">'+[['Verificação','Pesquisadores e instituições'],['Evidências','Revisão de fontes e classificação'],['Ética','Protocolos e decisões registradas'],['Comunidades','Domínio, propósito, escopo e cultura'],['Editorial','Submissão, revisão e publicação'],['Dados','Privacidade, consentimento e agregação']].map(function(x){return '<div class="p-4 rounded-2xl bg-slate-50"><b>'+x[0]+'</b><p class="text-sm text-slate-600 mt-1">'+x[1]+'</p></div>'}).join('')+'</div><div class="mt-5 p-4 rounded-2xl '+(state.admin?'bg-emerald-50 text-emerald-900':'bg-amber-50 text-amber-900')+'">'+(state.admin?'Modo administrativo habilitado.':'Modo administrativo não habilitado para esta sessão; as funções administrativas permanecem protegidas no banco.')+'</div>');}
  function knowledge(){return '<div class="flex justify-between mb-4"><div><h2 class="text-2xl font-black">Base de conhecimento CMNT</h2><p class="text-sm text-slate-500">Conceitos, protocolos, referências e conexões NEXUS.</p></div><button onclick="cmntNewKnowledge()" class="bg-[#07111f] text-white px-4 py-2.5 rounded-xl font-black">+ Item</button></div><div class="space-y-3">'+(state.knowledge.length?state.knowledge.map(function(k){return card('<b>'+q(k.title)+'</b><p class="text-sm text-slate-600 mt-1">'+q(k.summary)+'</p><div class="mt-3">'+badge(k.item_type)+' '+badge(k.status)+'</div>')}).join(''):'<div class="text-center text-slate-400 py-12">Nenhum item publicado.</div>')+'</div>'; }
  function integrations(){return card('<h2 class="text-2xl font-black">Integrações CMNT</h2><div class="grid md:grid-cols-2 gap-3 mt-5">'+[['HSI','Avaliações e resultados existentes'],['NEXUS 12','Competências e evolução longitudinal'],['NeuroDrive','Aulas e indicadores de aprendizagem'],['ENAT','Formação e recursos educacionais'],['Observatório','Somente dados agregados'],['Universidades','Pesquisa e laboratórios'],['Dados públicos','Fontes institucionais e datasets'],['NeuroTV','Lives, entrevistas e eventos científicos']].map(function(x){return '<div class="p-4 rounded-2xl bg-slate-50"><b>'+x[0]+'</b><p class="text-sm text-slate-600 mt-1">'+x[1]+'</p></div>'}).join('')+'</div>');}
  function ai(){return card('<h2 class="text-2xl font-black">IA científica CMNT</h2><p class="text-sm text-slate-600 mt-2">Camada para síntese, busca, classificação e apoio à pesquisa, sempre com fontes e revisão humana quando necessário.</p><div class="grid md:grid-cols-3 gap-3 mt-5">'+[['Busca','Localizar literatura e fontes'],['Síntese','Resumir evidências sem substituir revisão'],['Conhecimento','Conectar fontes, conceitos, HSI e NEXUS']].map(function(x){return '<div class="p-4 rounded-2xl bg-slate-50"><b>'+x[0]+'</b><p class="text-sm text-slate-600 mt-1">'+x[1]+'</p></div>'}).join('')+'</div><div class="mt-5 p-4 rounded-2xl border border-amber-200 bg-amber-50 text-sm text-amber-900">A IA do CMNT deverá mostrar fontes, grau de evidência e limitações; não deve inventar referências.</div>');}
  async function saveRow(table,row){if(!S.user)return auth();var r=await db.from(table).insert(row);if(r.error)return toast(r.error.message,true);toast('Registro criado.');await refresh();await renderSection();}
  window.cmntNewProject=function(){if(!S.user)return auth();document.getElementById('modal').innerHTML='<div class="fixed inset-0 modal z-[90] grid place-items-center p-4"><div class="bg-white rounded-3xl p-6 w-full max-w-xl"><h2 class="text-xl font-black">Novo projeto científico</h2><input id="cp_title" class="w-full bg-slate-100 rounded-xl p-3 mt-4" placeholder="Título"><textarea id="cp_abs" class="w-full bg-slate-100 rounded-xl p-3 mt-3" rows="4" placeholder="Resumo"></textarea><select id="cp_domain" class="w-full bg-slate-100 rounded-xl p-3 mt-3">'+state.domains.map(function(d){return '<option value="'+d.id+'">'+q(d.name)+'</option>'}).join('')+'</select><button onclick="cmntSaveProject()" class="mt-4 bg-[#0b8b55] text-white px-5 py-3 rounded-xl font-black">Criar</button><button onclick="closeModal()" class="mt-4 ml-2 px-5 py-3 rounded-xl font-bold">Cancelar</button></div></div>'};
  window.cmntSaveProject=function(){var title=document.getElementById('cp_title').value.trim();if(!title)return toast('Informe o título.',true);saveRow('cmnt_research_projects',{owner_id:S.user.id,title:title,slug:title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')+'-'+Date.now(),abstract:document.getElementById('cp_abs').value.trim(),scientific_domain_id:document.getElementById('cp_domain').value,status:'draft'}).then(closeModal)};
  window.cmntNewSource=function(){if(!S.user)return auth();document.getElementById('modal').innerHTML='<div class="fixed inset-0 modal z-[90] grid place-items-center p-4"><div class="bg-white rounded-3xl p-6 w-full max-w-xl"><h2 class="text-xl font-black">Cadastrar fonte científica</h2><input id="cs_title" class="w-full bg-slate-100 rounded-xl p-3 mt-4" placeholder="Título"><input id="cs_doi" class="w-full bg-slate-100 rounded-xl p-3 mt-3" placeholder="DOI (opcional)"><input id="cs_pmid" class="w-full bg-slate-100 rounded-xl p-3 mt-3" placeholder="PMID (opcional)"><input id="cs_url" class="w-full bg-slate-100 rounded-xl p-3 mt-3" placeholder="URL"><button onclick="cmntSaveSource()" class="mt-4 bg-[#0b8b55] text-white px-5 py-3 rounded-xl font-black">Enviar para revisão</button><button onclick="closeModal()" class="mt-4 ml-2 px-5 py-3 rounded-xl font-bold">Cancelar</button></div></div>'};
  window.cmntSaveSource=function(){var title=document.getElementById('cs_title').value.trim();if(!title)return toast('Informe o título.',true);saveRow('cmnt_scientific_sources',{title:title,doi:document.getElementById('cs_doi').value.trim()||null,pmid:document.getElementById('cs_pmid').value.trim()||null,url:document.getElementById('cs_url').value.trim()||null,created_by:S.user.id,review_status:'unreviewed'}).then(closeModal)};
  window.cmntSaveResearcher=async function(){if(!S.user)return auth();var r=await db.from('cmnt_researcher_profiles').upsert({user_id:S.user.id,professional_summary:document.getElementById('rp_summary').value,scientific_bio:document.getElementById('rp_bio').value,orcid:document.getElementById('rp_orcid').value.trim()||null,lattes_url:document.getElementById('rp_lattes').value.trim()||null},{onConflict:'user_id'});if(r.error)return toast(r.error.message,true);toast('Perfil científico salvo.');};
  window.cmntProtocol=function(id){if(!S.user)return auth();document.getElementById('modal').innerHTML='<div class="fixed inset-0 modal z-[90] grid place-items-center p-4"><div class="bg-white rounded-3xl p-6 w-full max-w-xl"><h2 class="text-xl font-black">Protocolo de pesquisa</h2><input id="pr_question" class="w-full bg-slate-100 rounded-xl p-3 mt-4" placeholder="Pergunta de pesquisa"><textarea id="pr_design" class="w-full bg-slate-100 rounded-xl p-3 mt-3" rows="4" placeholder="Desenho / metodologia"></textarea><textarea id="pr_stats" class="w-full bg-slate-100 rounded-xl p-3 mt-3" rows="3" placeholder="Plano estatístico"></textarea><button onclick="cmntSaveProtocol(\''+id+'\')" class="mt-4 bg-[#0b8b55] text-white px-5 py-3 rounded-xl font-black">Salvar protocolo</button></div></div>'};
  window.cmntSaveProtocol=function(id){saveRow('cmnt_research_protocols',{project_id:id,research_question:document.getElementById('pr_question').value,design:document.getElementById('pr_design').value,statistical_plan:document.getElementById('pr_stats').value,created_by:S.user.id}).then(closeModal)};
  window.cmntNewKnowledge=function(){if(!S.user)return auth();document.getElementById('modal').innerHTML='<div class="fixed inset-0 modal z-[90] grid place-items-center p-4"><div class="bg-white rounded-3xl p-6 w-full max-w-xl"><h2 class="text-xl font-black">Novo item de conhecimento</h2><input id="ck_title" class="w-full bg-slate-100 rounded-xl p-3 mt-4" placeholder="Título"><textarea id="ck_sum" class="w-full bg-slate-100 rounded-xl p-3 mt-3" rows="4" placeholder="Resumo"></textarea><button onclick="cmntSaveKnowledge()" class="mt-4 bg-[#0b8b55] text-white px-5 py-3 rounded-xl font-black">Salvar</button></div></div>'};
  window.cmntSaveKnowledge=function(){saveRow('cmnt_knowledge_items',{title:document.getElementById('ck_title').value.trim(),summary:document.getElementById('ck_sum').value.trim(),created_by:S.user.id,status:'draft'}).then(closeModal)};
  window.cmntNewInstitution=function(){if(!S.user)return auth();document.getElementById('modal').innerHTML='<div class="fixed inset-0 modal z-[90] grid place-items-center p-4"><div class="bg-white rounded-3xl p-6 w-full max-w-xl"><h2 class="text-xl font-black">Instituição</h2><input id="ci_name" class="w-full bg-slate-100 rounded-xl p-3 mt-4" placeholder="Nome"><input id="ci_acr" class="w-full bg-slate-100 rounded-xl p-3 mt-3" placeholder="Sigla"><input id="ci_city" class="w-full bg-slate-100 rounded-xl p-3 mt-3" placeholder="Cidade"><input id="ci_state" class="w-full bg-slate-100 rounded-xl p-3 mt-3" placeholder="Estado"><button onclick="cmntSaveInstitution()" class="mt-4 bg-[#0b8b55] text-white px-5 py-3 rounded-xl font-black">Cadastrar</button></div></div>'};
  window.cmntSaveInstitution=function(){saveRow('cmnt_institutions',{name:document.getElementById('ci_name').value.trim(),acronym:document.getElementById('ci_acr').value.trim()||null,city:document.getElementById('ci_city').value.trim()||null,state:document.getElementById('ci_state').value.trim()||null,created_by:S.user.id}).then(closeModal)};
  window.cmntNewEvent=function(){if(!S.user)return auth();document.getElementById('modal').innerHTML='<div class="fixed inset-0 modal z-[90] grid place-items-center p-4"><div class="bg-white rounded-3xl p-6 w-full max-w-xl"><h2 class="text-xl font-black">Evento científico</h2><input id="ce_title" class="w-full bg-slate-100 rounded-xl p-3 mt-4" placeholder="Título"><input id="ce_start" type="datetime-local" class="w-full bg-slate-100 rounded-xl p-3 mt-3"><textarea id="ce_desc" class="w-full bg-slate-100 rounded-xl p-3 mt-3" rows="3" placeholder="Descrição"></textarea><button onclick="cmntSaveEvent()" class="mt-4 bg-[#0b8b55] text-white px-5 py-3 rounded-xl font-black">Salvar</button></div></div>'};
  window.cmntSaveEvent=function(){saveRow('cmnt_events',{title:document.getElementById('ce_title').value.trim(),starts_at:new Date(document.getElementById('ce_start').value).toISOString(),description:document.getElementById('ce_desc').value.trim(),organizer_id:S.user.id}).then(closeModal)};
  window.cmntNewArticle=function(){if(!S.user)return auth();document.getElementById('modal').innerHTML='<div class="fixed inset-0 modal z-[90] grid place-items-center p-4"><div class="bg-white rounded-3xl p-6 w-full max-w-xl"><h2 class="text-xl font-black">Artigo / nota técnica</h2><input id="ca_title" class="w-full bg-slate-100 rounded-xl p-3 mt-4" placeholder="Título"><textarea id="ca_sum" class="w-full bg-slate-100 rounded-xl p-3 mt-3" rows="3" placeholder="Resumo"></textarea><button onclick="cmntSaveArticle()" class="mt-4 bg-[#0b8b55] text-white px-5 py-3 rounded-xl font-black">Salvar rascunho</button></div></div>'};
  window.cmntSaveArticle=function(){var title=document.getElementById('ca_title').value.trim();saveRow('cmnt_editorial_articles',{title:title,slug:title.toLowerCase().replace(/[^a-z0-9]+/g,'-')+'-'+Date.now(),summary:document.getElementById('ca_sum').value.trim(),author_id:S.user.id,status:'draft'}).then(closeModal)};
  window.cmntNexusStart=function(){if(!S.user)return auth();toast('A avaliação NEXUS será conectada ao instrumento longitudinal na próxima camada.');};
  window.cmntPlatformGo=async function(s){state.section=s;if(s.indexOf('admin')===0){await cmntAdminRefresh();if(!state.admin)return cmntAdminLogin();cmntAdminRender();return}await refresh();shell()};
  window.go=function(t){if(t==='cmnt'||t==='cmnt-platform'){S.tab='cmnt';state.section='overview';refresh().then(shell);return}return baseGo(t)};
  refresh().then(function(){if(S.tab==='cmnt')shell()});

  window.cmntClassifyPost=function(postId){
    if(!S.user)return auth();
    var opts=[['experiencia','Experiência'],['opiniao','Opinião'],['informacao_tecnica','Informação técnica'],['evidencia_cientifica','Evidência científica']];
    document.getElementById('modal').innerHTML='<div class="fixed inset-0 modal z-[90] grid place-items-center p-4"><div class="bg-white rounded-3xl p-6 w-full max-w-md"><h2 class="text-xl font-black">Classificar conteúdo CMNT</h2><p class="text-sm text-slate-500 mt-2">A classificação não apaga nem altera a publicação original.</p><div class="grid gap-2 mt-4">'+opts.map(function(o){return '<button onclick="cmntSaveClassification(\''+postId+'\',\''+o[0]+'\')" class="text-left p-3 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold">'+o[1]+'</button>'}).join('')+'</div><button onclick="closeModal()" class="mt-3 px-4 py-2 font-bold">Cancelar</button></div></div>';
  };
  window.cmntSaveClassification=async function(postId,type){
    var status=type==='evidencia_cientifica'?'pending_review':(type==='informacao_tecnica'?'technical':'not_scientific');
    var r=await db.from('cmnt_content_classifications').upsert({post_id:postId,content_type:type,scientific_status:status,classified_by:S.user.id},{onConflict:'post_id'});
    if(r.error)return toast(r.error.message,true);
    var u=await db.from('social_posts').update({cmnt_content_type:type,cmnt_scientific_status:status}).eq('id',postId);
    if(u.error)return toast(u.error.message,true);
    closeModal();toast('Classificação CMNT registrada.');await loadPosts();if(S.tab==='home')render();
  };

  state.adminInfo=null;state.admins=[];state.audit=[];
  async function adminInvoke(action,payload){
    var body=Object.assign({action:action},payload||{});
    var r=await db.functions.invoke('cmnt-admin',{body:body});
    if(r.error)throw new Error(r.error.message||'Falha no serviço administrativo');
    if(r.data&&r.data.error)throw new Error(r.data.error);
    return r.data;
  }
  async function cmntAdminRefresh(){
    if(!S.user){state.admin=false;state.adminInfo=null;return}
    try{
      var ar=await db.rpc('cmnt_is_admin');state.admin=!!ar.data;
      if(!state.admin)return;
      var [me,a,l]=await Promise.all([
        db.from('cmnt_admin_users').select('*').eq('user_id',S.user.id).maybeSingle(),
        db.from('cmnt_admin_users').select('*').order('created_at'),
        db.from('cmnt_admin_audit_log').select('*').order('created_at',{ascending:false}).limit(200)
      ]);
      if(me.error)throw me.error;state.adminInfo=me.data;state.admins=a.data||[];state.audit=l.data||[];
    }catch(e){state.admin=false;state.adminInfo=null}
  }
  window.cmntAdminLogin=function(){
    document.getElementById('modal').innerHTML='<div class="fixed inset-0 modal z-[95] grid place-items-center p-4"><div class="bg-white rounded-3xl p-6 w-full max-w-md"><div class="text-xs uppercase tracking-widest text-emerald-700 font-black">CMNT • Administração</div><h2 class="text-2xl font-black mt-1">Acesso administrativo</h2><p class="text-sm text-slate-500 mt-2">Entre com as credenciais administrativas previamente configuradas. Não existe senha padrão pública.</p><input id="adm_login" class="w-full bg-slate-100 rounded-xl p-3 mt-5" placeholder="Usuário ou e-mail"><input id="adm_pass" type="password" class="w-full bg-slate-100 rounded-xl p-3 mt-3" placeholder="Senha"><button onclick="cmntDoAdminLogin()" class="w-full bg-[#07111f] text-white rounded-xl p-3 mt-4 font-black">Entrar no painel</button><button onclick="auth()" class="w-full p-2 mt-2 text-sm text-slate-500">Voltar</button></div></div>';
  };
  window.cmntDoAdminLogin=async function(){
    var login=document.getElementById('adm_login').value.trim(),pass=document.getElementById('adm_pass').value;
    if(!login||!pass)return toast('Informe usuário e senha.',true);
    if(login.toLowerCase()==='admin'){
      login='admin@cmnt.local';
    }
    var r=await db.auth.signInWithPassword({email:login,password:pass});
    if(r.error)return toast('Acesso administrativo recusado: '+r.error.message,true);
    closeModal();await init();setTimeout(cmntCheckAdminAccess,400);
  };
  window.cmntCheckAdminAccess=async function(){
    if(!S.user)return;
    await cmntAdminRefresh();
    if(state.adminInfo&&state.adminInfo.must_change_password)cmntForcePasswordChange();
  };
  window.cmntForcePasswordChange=function(){
    document.getElementById('modal').innerHTML='<div class="fixed inset-0 modal z-[100] grid place-items-center p-4"><div class="bg-white rounded-3xl p-6 w-full max-w-md"><div class="text-xs uppercase tracking-widest text-red-600 font-black">Segurança obrigatória</div><h2 class="text-2xl font-black mt-1">Troque sua senha</h2><p class="text-sm text-slate-500 mt-2">Esta é uma senha temporária. O acesso ao painel permanece bloqueado até a definição de uma nova senha.</p><input id="adm_newpass" type="password" class="w-full bg-slate-100 rounded-xl p-3 mt-5" placeholder="Nova senha (mínimo 8 caracteres)"><input id="adm_newpass2" type="password" class="w-full bg-slate-100 rounded-xl p-3 mt-3" placeholder="Repita a nova senha"><button onclick="cmntChangeOwnPassword()" class="w-full bg-[#0b8b55] text-white rounded-xl p-3 mt-4 font-black">Definir nova senha</button></div></div>';
  };
  window.cmntChangeOwnPassword=async function(){
    var a=document.getElementById('adm_newpass').value,b=document.getElementById('adm_newpass2').value;
    if(a.length<8)return toast('A nova senha deve ter pelo menos 8 caracteres.',true);
    if(a!==b)return toast('As senhas não coincidem.',true);
    var r=await db.auth.updateUser({password:a});
    if(r.error)return toast(r.error.message,true);
    try{await adminInvoke('mark_password_changed')}catch(e){return toast(e.message,true)}
    closeModal();toast('Senha alterada. O acesso administrativo foi liberado.');await cmntAdminRefresh();cmntAdminRender();
  };
  function adminBtn(section,label){return '<button onclick="cmntPlatformGo(\''+section+'\')" class="text-left px-3 py-2 rounded-xl text-sm font-bold '+(state.section===section?'bg-emerald-100 text-emerald-900':'hover:bg-slate-50')+'">'+label+'</button>'}
  function adminCard(title,body){return '<div class="card rounded-3xl p-5"><h3 class="font-black text-lg">'+title+'</h3>'+body+'</div>'}
  function adminActionButton(label,fn,cls){return '<button onclick="'+fn+'" class="px-3 py-2 rounded-xl text-xs font-black '+(cls||'bg-slate-100')+'">'+label+'</button>'}
  function adminHome(){
    var cards=[['Administradores',state.admins.length],['Comunidades',S.communities.length],['Pesquisas',state.projects.length],['Fontes',state.sources.length],['Instituições',state.institutions.length],['Eventos',state.events.length],['Artigos',state.articles.length],['Indicadores',state.indicators.length]];
    return '<div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">'+cards.map(function(x){return adminCard(x[0],'<div class="text-3xl font-black mt-2">'+x[1]+'</div>')}).join('')+'</div>'+
      adminCard('Centro de comando','<p class="text-sm text-slate-600 mt-2">O painel controla governança, pessoas, comunidades, pesquisa, evidências, ética, editorial, observatório, eventos, instituições, integrações e auditoria.</p><div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-2 mt-4">'+adminBtn('admin-users','Administradores')+adminBtn('admin-communities','Comunidades')+adminBtn('admin-research','Pesquisa')+adminBtn('admin-evidence','Evidências')+adminBtn('admin-ethics','Ética')+adminBtn('admin-editorial','Editorial')+adminBtn('admin-observatory','Observatório')+adminBtn('admin-audit','Auditoria')+'</div>');
  }
  function adminUsers(){
    return '<div class="flex justify-between items-center mb-4"><div><h2 class="text-2xl font-black">Administradores</h2><p class="text-sm text-slate-500">Criação, ativação, bloqueio e redefinição de senha.</p></div><button onclick="cmntNewAdmin()" class="bg-[#07111f] text-white px-4 py-2.5 rounded-xl font-black">+ Novo administrador</button></div><div class="space-y-3">'+state.admins.map(function(a){return adminCard(q(a.display_name||a.username),'<div class="text-sm text-slate-500 mt-1">@'+q(a.username)+' · '+q(a.email||'')+'</div><div class="flex flex-wrap gap-2 mt-3">'+badge(a.active?'Ativo':'Bloqueado')+' '+badge(a.must_change_password?'Troca obrigatória':'Senha definida')+'</div><div class="flex flex-wrap gap-2 mt-3">'+(a.user_id===S.user.id?'':adminActionButton(a.active?'Bloquear':'Ativar','cmntToggleAdmin(\''+a.user_id+'\','+(a.active?'false':'true')+')',a.active?'bg-red-50 text-red-700':'bg-emerald-50 text-emerald-700'))+adminActionButton('Redefinir senha','cmntResetAdmin(\''+a.user_id+'\')','bg-amber-50 text-amber-800')+'</div>')}).join('')+'</div>';
  }
  window.cmntNewAdmin=function(){
    document.getElementById('modal').innerHTML='<div class="fixed inset-0 modal z-[95] grid place-items-center p-4"><div class="bg-white rounded-3xl p-6 w-full max-w-lg"><h2 class="text-xl font-black">Novo administrador</h2><input id="na_user" class="w-full bg-slate-100 rounded-xl p-3 mt-4" placeholder="Usuário"><input id="na_name" class="w-full bg-slate-100 rounded-xl p-3 mt-3" placeholder="Nome"><input id="na_email" type="email" class="w-full bg-slate-100 rounded-xl p-3 mt-3" placeholder="E-mail"><input id="na_pass" type="password" class="w-full bg-slate-100 rounded-xl p-3 mt-3" placeholder="Senha temporária (mínimo 8)"><p class="text-xs text-slate-500 mt-2">O novo administrador será obrigado a trocar a senha no primeiro acesso.</p><button onclick="cmntSaveAdmin()" class="w-full bg-[#0b8b55] text-white rounded-xl p-3 mt-4 font-black">Criar administrador</button></div></div>';
  };
  window.cmntSaveAdmin=async function(){
    var username=document.getElementById('na_user').value.trim(),name=document.getElementById('na_name').value.trim(),email=document.getElementById('na_email').value.trim(),pass=document.getElementById('na_pass').value;
    if(!username||!email||pass.length<8)return toast('Preencha usuário, e-mail e senha com pelo menos 8 caracteres.',true);
    try{await adminInvoke('create',{username:username,display_name:name||username,email:email,password:pass});closeModal();toast('Administrador criado. A senha temporária deverá ser trocada no primeiro acesso.');await cmntAdminRefresh();cmntAdminRender()}catch(e){toast(e.message,true)}
  };
  window.cmntToggleAdmin=async function(id,active){try{await adminInvoke('toggle',{user_id:id,active:active});toast(active?'Administrador ativado.':'Administrador bloqueado.');await cmntAdminRefresh();cmntAdminRender()}catch(e){toast(e.message,true)}};
  window.cmntResetAdmin=async function(id){var p=prompt('Informe a nova senha temporária (mínimo 8 caracteres):');if(!p)return;if(p.length<8)return toast('A senha precisa ter pelo menos 8 caracteres.',true);try{await adminInvoke('reset_password',{user_id:id,password:p});toast('Senha redefinida e troca obrigatória reativada.');await cmntAdminRefresh();cmntAdminRender()}catch(e){toast(e.message,true)}};
  async function adminRows(table,select,order,col,action){
    var r=await db.from(table).select(select).order(order||'created_at',{ascending:false});if(r.error)return '<div class="text-red-600 text-sm">'+q(r.error.message)+'</div>';
    return (r.data||[]).map(function(x){return action(x)}).join('')||'<div class="text-slate-400 text-sm py-8 text-center">Nenhum registro.</div>';
  }
  async function adminModeration(){
    var b=document.getElementById('cmnt-admin-body');if(!b)return;
    if(state.section==='admin-communities'){
      var r=await db.from('social_communities').select('id,name,category,community_type,governance_status,requires_scientific_moderation,scientific_purpose,scientific_scope').order('name');
      b.innerHTML='<div class="space-y-3">'+(r.data||[]).map(function(x){return adminCard(q(x.name),'<div class="text-sm text-slate-500">'+q(x.category||'')+' · '+q(x.community_type||'')+' · '+q(x.governance_status||'')+'</div><p class="text-sm mt-2">'+q(x.scientific_purpose||'Sem propósito científico definido.')+'</p><div class="mt-3">'+badge(x.requires_scientific_moderation?'Moderação científica':'Padrão')+'</div>')}).join('')+'</div>';
    } else if(state.section==='admin-research'){
      var r=await db.from('cmnt_research_projects').select('id,title,status,ethics_status,study_type,created_at').order('created_at',{ascending:false});
      b.innerHTML='<div class="space-y-3">'+(r.data||[]).map(function(x){return adminCard(q(x.title),'<div class="flex gap-2 mt-2">'+badge(x.status)+' '+badge(x.ethics_status)+'</div><div class="flex gap-2 mt-3">'+adminActionButton('Aprovar','cmntModerateResearch(\''+x.id+'\',\'approved\')','bg-emerald-50 text-emerald-800')+adminActionButton('Em revisão','cmntModerateResearch(\''+x.id+'\',\'review\')')+'</div>')}).join('')||'<div class="text-slate-400 text-center py-8">Nenhum projeto.</div></div>';
    } else if(state.section==='admin-evidence'){
      var r=await db.from('cmnt_scientific_sources').select('id,title,review_status,evidence_level,doi,pmid,publication_year').order('created_at',{ascending:false});
      b.innerHTML='<div class="space-y-3">'+(r.data||[]).map(function(x){return adminCard(q(x.title),'<div class="text-sm text-slate-500">'+q(x.doi||x.pmid||'')+' · '+q(x.publication_year||'')+'</div><div class="flex gap-2 mt-2">'+badge(x.review_status||'unreviewed')+' '+badge(x.evidence_level||'não classificada')+'</div><div class="flex gap-2 mt-3">'+adminActionButton('Aprovar','cmntModerateSource(\''+x.id+'\',\'approved\')','bg-emerald-50 text-emerald-800')+adminActionButton('Rejeitar','cmntModerateSource(\''+x.id+'\',\'rejected\')','bg-red-50 text-red-700')+'</div>')}).join('')||'<div class="text-slate-400 text-center py-8">Nenhuma fonte.</div></div>';
    } else if(state.section==='admin-ethics'){
      var r=await db.from('cmnt_ethics_reviews').select('id,project_id,status,review_type,reference_code,decision_notes,created_at').order('created_at',{ascending:false});
      b.innerHTML='<div class="space-y-3">'+(r.data||[]).map(function(x){return adminCard('Revisão ética', '<div class="text-sm text-slate-500">Projeto: '+q(x.project_id)+' · '+q(x.review_type)+'</div><div class="mt-2">'+badge(x.status)+'</div><div class="flex gap-2 mt-3">'+adminActionButton('Aprovar','cmntModerateEthics(\''+x.id+'\',\'approved\')','bg-emerald-50 text-emerald-800')+adminActionButton('Pendenciar','cmntModerateEthics(\''+x.id+'\',\'pending\')')+'</div>')}).join('')||'<div class="text-slate-400 text-center py-8">Nenhuma revisão ética.</div></div>';
    } else if(state.section==='admin-editorial'){
      var r=await db.from('cmnt_editorial_articles').select('id,title,status,article_type,created_at').order('created_at',{ascending:false});
      b.innerHTML='<div class="space-y-3">'+(r.data||[]).map(function(x){return adminCard(q(x.title),'<div class="mt-2">'+badge(x.status)+'</div><div class="flex gap-2 mt-3">'+adminActionButton('Publicar','cmntModerateArticle(\''+x.id+'\',\'published\')','bg-emerald-50 text-emerald-800')+adminActionButton('Rascunho','cmntModerateArticle(\''+x.id+'\',\'draft\')')+'</div>')}).join('')||'<div class="text-slate-400 text-center py-8">Nenhum artigo.</div></div>';
    } else if(state.section==='admin-observatory'){
      var r=await db.from('cmnt_observatory_data').select('id,indicator_id,period_start,period_end,geography_level,geography_code,value,quality_status,published').order('period_start',{ascending:false});
      b.innerHTML='<div class="space-y-3">'+(r.data||[]).map(function(x){return adminCard(q(x.geography_level)+' · '+q(x.period_start),'<div class="text-2xl font-black mt-2">'+q(x.value)+'</div><div class="mt-2">'+badge(x.quality_status)+' '+badge(x.published?'Publicado':'Rascunho')+'</div><div class="mt-3">'+adminActionButton(x.published?'Retirar publicação':'Publicar','cmntToggleObs(\''+x.id+'\','+(!x.published)+')',x.published?'bg-red-50 text-red-700':'bg-emerald-50 text-emerald-800')+'</div>')}).join('')||'<div class="text-slate-400 text-center py-8">Nenhum dado no observatório.</div></div>';
    } else if(state.section==='admin-audit'){
      b.innerHTML='<div class="space-y-2">'+state.audit.map(function(x){return '<div class="p-4 rounded-2xl bg-slate-50"><div class="font-bold">'+q(x.action)+'</div><div class="text-xs text-slate-500 mt-1">'+q(x.created_at)+' · '+q(x.target_user_id||'sistema')+'</div></div>'}).join('')||'<div class="text-slate-400 text-center py-8">Sem eventos.</div></div>';
    }
  }
  window.cmntModerateResearch=async function(id,status){var r=await db.from('cmnt_research_projects').update({status}).eq('id',id);if(r.error)return toast(r.error.message,true);toast('Projeto atualizado.');adminModeration()};
  window.cmntModerateSource=async function(id,status){var r=await db.from('cmnt_scientific_sources').update({review_status:status}).eq('id',id);if(r.error)return toast(r.error.message,true);toast('Fonte atualizada.');adminModeration()};
  window.cmntModerateEthics=async function(id,status){var r=await db.from('cmnt_ethics_reviews').update({status,reviewed_by:S.user.id,reviewed_at:new Date().toISOString()}).eq('id',id);if(r.error)return toast(r.error.message,true);toast('Revisão ética atualizada.');adminModeration()};
  window.cmntModerateArticle=async function(id,status){var data={status};if(status==='published')data.published_at=new Date().toISOString();var r=await db.from('cmnt_editorial_articles').update(data).eq('id',id);if(r.error)return toast(r.error.message,true);toast('Editorial atualizado.');adminModeration()};
  window.cmntToggleObs=async function(id,published){var r=await db.from('cmnt_observatory_data').update({published}).eq('id',id);if(r.error)return toast(r.error.message,true);toast(published?'Indicador publicado.':'Indicador retirado.');adminModeration()};
  window.cmntAdminRender=async function(){
    if(!state.admin){return toast('Acesso administrativo não autorizado.',true)}
    if(!document.getElementById('main'))return;
    var labels=[['admin','Painel'],['admin-users','Administradores'],['admin-communities','Comunidades'],['admin-research','Pesquisa'],['admin-evidence','Evidências'],['admin-ethics','Ética'],['admin-editorial','Editorial'],['admin-observatory','Observatório'],['admin-audit','Auditoria']];
    document.getElementById('main').innerHTML='<section><div class="brand text-white rounded-3xl p-6"><div class="uppercase tracking-[.2em] text-emerald-300 text-xs font-black">CMNT • PAINEL ADMINISTRATIVO</div><h1 class="text-3xl font-black mt-1">Centro de Comando Científico</h1><p class="text-white/75 mt-2">Governança, segurança, ciência e operação da plataforma.</p></div><div class="mt-4 flex gap-2 overflow-auto scroll">'+labels.map(function(x){return '<button onclick="cmntPlatformGo(\''+x[0]+'\')" class="px-3 py-2 rounded-xl text-sm font-bold '+(state.section===x[0]?'bg-emerald-100 text-emerald-900':'bg-white')+'">'+x[1]+'</button>'}).join('')+'</div><div id="cmnt-admin-body" class="mt-5"></div></section>';
    var b=document.getElementById('cmnt-admin-body');
    if(state.section==='admin')b.innerHTML=adminHome();
    else if(state.section==='admin-users')b.innerHTML=adminUsers();
    else await adminModeration();
  };

  setTimeout(function(){if(S.user)cmntCheckAdminAccess()},1200);
})();
/* CMNT pending workflows — additive completion layer */
(function(){
  'use strict';
  function cmntModal(html){var m=document.getElementById('modal');if(m)m.innerHTML='<div class="fixed inset-0 modal z-[100] grid place-items-center p-4 overflow-auto" onclick="if(event.target===this)closeModal()"><div class="bg-white rounded-3xl p-6 w-full max-w-2xl my-6">'+html+'</div></div>'}
  function escp(v){return String(v||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]})}
  function needUser(){if(!S.user){auth();return false}return true}
  window.cmntNexusStart=function(){
    if(!needUser())return;
    var n=['Consciência Situacional','Percepção de Risco','Tomada de Decisão','Controle Veicular','Comunicação Eficaz','Regulação e Legislação','Adaptação','Inteligência Emocional','Responsabilidade Social','Aprendizagem Contínua','Ergonomia','Primeiros Socorros'];
    cmntModal('<h2 class="text-2xl font-black">Avaliação NEXUS 12</h2><p class="text-sm text-slate-500 mt-2">Autorrelato inicial. Não é diagnóstico clínico. O resultado poderá ser acompanhado longitudinalmente.</p><div class="space-y-3 mt-5 max-h-[55vh] overflow-auto">'+n.map(function(x,i){return '<label class="block p-3 rounded-2xl bg-slate-50"><b class="text-sm">NEXUS '+(i+1)+' — '+x+'</b><select id="nx_'+i+'" class="w-full bg-white rounded-xl p-2.5 mt-2"><option value="1">1 — Muito baixo</option><option value="2">2 — Baixo</option><option value="3" selected>3 — Moderado</option><option value="4">4 — Bom</option><option value="5">5 — Muito bom</option></select></label>'}).join('')+'</div><button onclick="cmntSaveNexusAssessment()" class="w-full mt-5 bg-[#0b8b55] text-white rounded-2xl p-3 font-black">Salvar avaliação</button>');
  };
  window.cmntSaveNexusAssessment=async function(){
    var codes=['SA','PR','TD','CV','EC','RL','AD','IE','RS','AC','ER','PS'],scores=codes.map(function(_,i){return Number(document.getElementById('nx_'+i).value)}),overall=scores.reduce(function(a,b){return a+b},0)/12;
    var a=await db.from('cmnt_nexus_assessments').insert({user_id:S.user.id,instrument_version:'nexus-12-v1',status:'completed',overall_score:overall}).select('id').single();
    if(a.error)return toast(a.error.message,true);
    var rows=codes.map(function(c,i){return {assessment_id:a.data.id,competency_code:c,score:scores[i],interpretation:scores[i]>=4?'desempenho favorável':scores[i]===3?'nível intermediário':'ponto de desenvolvimento'}});
    var r=await db.from('cmnt_nexus_results').insert(rows);if(r.error)return toast(r.error.message,true);closeModal();toast('Avaliação NEXUS registrada. Média: '+overall.toFixed(2));
  };
  window.cmntRequestResearcherVerification=async function(){
    if(!needUser())return;var r=await db.from('cmnt_researcher_profiles').upsert({user_id:S.user.id,researcher_status:'researcher',verification_status:'pending'},{onConflict:'user_id'});if(r.error)return toast(r.error.message,true);toast('Solicitação de verificação enviada.');
  };
  window.cmntSubmitProject=async function(){
    if(!needUser())return;var s=document.getElementById('cmnt_submit_project');if(!s||!s.value)return toast('Crie um projeto antes de submeter.',true);var p=await db.from('cmnt_research_projects').select('id,title,abstract').eq('id',s.value).eq('owner_id',S.user.id).maybeSingle();if(p.error||!p.data)return toast('Projeto não encontrado.',true);var r=await db.from('cmnt_research_submissions').insert({project_id:p.data.id,title:p.data.title,abstract:p.data.abstract||'',submission_type:'research',submitted_by:S.user.id,status:'submitted'});if(r.error)return toast(r.error.message,true);toast('Projeto enviado para revisão científica.');
  };
  window.cmntFilterEvidence=function(term){term=(term||'').toLowerCase();document.querySelectorAll('#cmnt-platform-body .card').forEach(function(c){if(c.id==='cmnt-evidence-tools')return;c.style.display=!term||c.textContent.toLowerCase().indexOf(term)>=0?'':'none'})};
  window.cmntLinkEvidence=async function(){
    if(!needUser())return;var [posts,sources]=await Promise.all([db.from('social_posts').select('id,content,created_at').eq('author_id',S.user.id).order('created_at',{ascending:false}).limit(50),db.from('cmnt_scientific_sources').select('id,title,doi,pmid').in('review_status',['reviewed','approved']).order('publication_year',{ascending:false,nullsLast:true}).limit(100)]);
    cmntModal('<h2 class="text-xl font-black">Vincular evidência</h2><p class="text-sm text-slate-500 mt-2">Associe uma fonte revisada a uma publicação sua.</p><select id="ce_post" class="w-full bg-slate-100 rounded-xl p-3 mt-4">'+(posts.data||[]).map(function(p){return '<option value="'+p.id+'">'+escp((p.content||'').slice(0,100))+'</option>'}).join('')+'</select><select id="ce_source" class="w-full bg-slate-100 rounded-xl p-3 mt-3">'+(sources.data||[]).map(function(s){return '<option value="'+s.id+'">'+escp(s.title)+' '+escp(s.doi||s.pmid||'')+'</option>'}).join('')+'</select><select id="ce_rel" class="w-full bg-slate-100 rounded-xl p-3 mt-3"><option value="supports">Apoia</option><option value="contradicts">Contrasta</option><option value="contextualizes">Contextualiza</option></select><textarea id="ce_note" class="w-full bg-slate-100 rounded-xl p-3 mt-3" rows="3" placeholder="Nota"></textarea><button onclick="cmntSaveEvidenceLink()" class="w-full mt-4 bg-[#0b8b55] text-white rounded-xl p-3 font-black">Vincular</button>');
  };
  window.cmntSaveEvidenceLink=async function(){var r=await db.from('cmnt_content_evidence').insert({post_id:document.getElementById('ce_post').value,source_id:document.getElementById('ce_source').value,relationship:document.getElementById('ce_rel').value,note:document.getElementById('ce_note').value.trim(),created_by:S.user.id});if(r.error)return toast(r.error.message,true);closeModal();toast('Evidência vinculada.');};
  window.cmntToggleEventRegistration=async function(id){
    if(!needUser())return;var q=await db.from('cmnt_event_registrations').select('event_id').eq('event_id',id).eq('user_id',S.user.id).maybeSingle();if(q.data){var d=await db.from('cmnt_event_registrations').delete().eq('event_id',id).eq('user_id',S.user.id);if(d.error)return toast(d.error.message,true);toast('Inscrição cancelada.')}else{var d=await db.from('cmnt_event_registrations').insert({event_id:id,user_id:S.user.id,status:'registered'});if(d.error)return toast(d.error.message,true);toast('Inscrição confirmada.')};
  };
  window.cmntNewArticle=function(){if(!needUser())return;cmntModal('<h2 class="text-xl font-black">Novo artigo / nota técnica</h2><input id="ca_title" class="w-full bg-slate-100 rounded-xl p-3 mt-4" placeholder="Título"><textarea id="ca_sum" class="w-full bg-slate-100 rounded-xl p-3 mt-3" rows="3" placeholder="Resumo"></textarea><textarea id="ca_body" class="w-full bg-slate-100 rounded-xl p-3 mt-3" rows="10" placeholder="Texto completo"></textarea><select id="ca_type" class="w-full bg-slate-100 rounded-xl p-3 mt-3"><option value="analysis">Análise</option><option value="technical_note">Nota técnica</option><option value="review">Revisão</option><option value="opinion">Opinião identificada</option></select><div class="flex gap-2 mt-4"><button onclick="cmntSaveArticlePending(this.dataset.status)" data-status="draft" class="flex-1 bg-slate-100 rounded-xl p-3 font-black">Salvar rascunho</button><button onclick="cmntSaveArticlePending(this.dataset.status)" data-status="review" class="flex-1 bg-[#0b8b55] text-white rounded-xl p-3 font-black">Enviar para revisão</button></div>');};
  window.cmntSaveArticlePending=async function(status){var title=document.getElementById('ca_title').value.trim();if(!title)return toast('Informe o título.',true);var slug=title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/^-|-$/g,'')+'-'+Date.now();var r=await db.from('cmnt_editorial_articles').insert({title:title,slug:slug,summary:document.getElementById('ca_sum').value.trim(),body:document.getElementById('ca_body').value.trim(),article_type:document.getElementById('ca_type').value,author_id:S.user.id,status:status});if(r.error)return toast(r.error.message,true);closeModal();toast(status==='review'?'Artigo enviado para revisão.':'Rascunho salvo.');};
  var baseGo=window.cmntPlatformGo;
  if(baseGo){window.cmntPlatformGo=async function(section){
    await baseGo(section);await new Promise(function(r){setTimeout(r,100)});
    if(section==='researcher'&&S.user){var p=await db.from('cmnt_researcher_profiles').select('*').eq('user_id',S.user.id).maybeSingle(),x=p.data||{},a=document.getElementById('rp_summary'),b=document.getElementById('rp_bio'),o=document.getElementById('rp_orcid'),l=document.getElementById('rp_lattes');if(a)a.value=x.professional_summary||'';if(b)b.value=x.scientific_bio||'';if(o)o.value=x.orcid||'';if(l)l.value=x.lattes_url||'';var body=document.getElementById('cmnt-platform-body');if(body&&!document.getElementById('cmnt-verification-box'))body.insertAdjacentHTML('beforeend','<div id="cmnt-verification-box" class="card rounded-3xl p-5 mt-4"><h3 class="font-black text-lg">Verificação científica</h3><p class="text-sm text-slate-500 mt-1">Status atual: <b>'+escp(x.verification_status||'unverified')+'</b></p><button onclick="cmntRequestResearcherVerification()" class="mt-3 bg-[#0b8b55] text-white px-4 py-2 rounded-xl font-black">Solicitar verificação</button></div>')}
    if(section==='research'&&S.user){var pr=await db.from('cmnt_research_projects').select('id,title,status').eq('owner_id',S.user.id).order('created_at',{ascending:false}),body2=document.getElementById('cmnt-platform-body');if(body2&&!document.getElementById('cmnt-submit-box'))body2.insertAdjacentHTML('beforeend','<div id="cmnt-submit-box" class="card rounded-3xl p-5 mt-4"><h3 class="font-black">Submissão para revisão</h3><div class="flex flex-col sm:flex-row gap-2 mt-3"><select id="cmnt_submit_project" class="flex-1 bg-slate-100 rounded-xl p-3">'+(pr.data||[]).map(function(x){return '<option value="'+x.id+'">'+escp(x.title)+' · '+escp(x.status)+'</option>'}).join('')+'</select><button onclick="cmntSubmitProject()" class="bg-[#07111f] text-white px-4 py-3 rounded-xl font-black">Enviar para revisão</button></div></div>')}
    if(section==='evidence'){var body3=document.getElementById('cmnt-platform-body');if(body3&&!document.getElementById('cmnt-evidence-tools'))body3.insertAdjacentHTML('afterbegin','<div id="cmnt-evidence-tools" class="card rounded-3xl p-5 mb-4"><input oninput="cmntFilterEvidence(this.value)" class="w-full bg-slate-100 rounded-xl p-3" placeholder="Pesquisar evidência por título, DOI ou PMID"><button onclick="cmntLinkEvidence()" class="mt-3 bg-[#07111f] text-white px-4 py-3 rounded-xl font-black">Vincular a publicação</button></div>')}
    if(section==='events'){var body4=document.getElementById('cmnt-platform-body');if(body4&&!document.getElementById('cmnt-event-actions')){var ev=await db.from('cmnt_events').select('id,title,starts_at,location,published').eq('published',true).order('starts_at'),box=document.createElement('div');box.id='cmnt-event-actions';box.className='card rounded-3xl p-5 mt-4';box.innerHTML='<h3 class="font-black">Participação</h3><div class="space-y-2 mt-3">'+(ev.data||[]).map(function(e){return '<div class="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50"><span class="text-sm font-bold">'+escp(e.title)+' · '+new Date(e.starts_at).toLocaleString('pt-BR')+'</span><button onclick="cmntToggleEventRegistration(\''+e.id+'\')" class="px-3 py-2 rounded-xl bg-[#07111f] text-white text-xs font-black">Participar</button></div>'}).join('')+'</div>';body4.appendChild(box)}}
  }};
})();

/* CMNT live HSI/NeuroDrive integration — additive, per-user and RLS-respecting. */
(function(){
  'use strict';
  var previous=window.cmntPlatformGo;
  function cmntFmt(v){return Number(v||0).toFixed(2)}
  async function hsiLive(){
    if(!S.user)return {participant:false,results:[]};
    var p=await db.from('hsi_participants').select('id').eq('user_id',S.user.id).limit(20);
    var ids=(p.data||[]).map(function(x){return x.id}); if(!ids.length)return {participant:false,results:[]};
    var ss=await db.from('hsi_assessment_sessions').select('id,participant_id,started_at,submitted_at,status').in('participant_id',ids).order('started_at',{ascending:false}).limit(20);
    var sid=(ss.data||[]).map(function(x){return x.id}); if(!sid.length)return {participant:true,results:[]};
    var rr=await db.from('hsi_assessment_results').select('id,session_id,total_score,risk_class,calculation_version,calculated_at').in('session_id',sid).order('calculated_at',{ascending:false}).limit(20);
    return {participant:true,results:rr.data||[]};
  }
  async function neuroLive(){
    if(!S.user)return {lessons:[],hsi:[]};
    var [l,h]=await Promise.all([
      db.from('ai_lessons').select('id,started_at,ended_at,status,phase,duration_minutes,seguranca,comunicacao,didatica,adaptacao,evolucao,hsi_evaluation').eq('user_id',S.user.id).order('started_at',{ascending:false}).limit(50),
      db.from('ai_hsi').select('id,lesson_id,cognitive,emotional,behavioral,social,contextual,final_score,created_at').eq('user_id',S.user.id).order('created_at',{ascending:false}).limit(50)
    ]);
    return {lessons:l.data||[],hsi:h.data||[]};
  }
  function metric(label,value,sub){return '<div class="p-4 rounded-2xl bg-slate-50"><div class="text-xs font-black uppercase tracking-wide text-slate-500">'+label+'</div><div class="text-2xl font-black mt-1">'+value+'</div><div class="text-xs text-slate-500 mt-1">'+sub+'</div></div>'}
  window.cmntPlatformGo=async function(section){
    await previous(section);
    var body=document.getElementById('cmnt-platform-body'); if(!body)return;
    if(section==='hsi'){
      var x=await hsiLive(), latest=x.results[0];
      var html='<div class="mt-4 card rounded-3xl p-5"><div class="flex items-center justify-between gap-3"><div><h3 class="font-black text-lg">Integração HSI em tempo real</h3><p class="text-sm text-slate-500 mt-1">Somente resultados pertencentes à sua conta são exibidos nesta área.</p></div>'+ (x.participant?'<span class="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-black">Participante HSI</span>':'<span class="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-black">Sem avaliação vinculada</span>')+'</div>';
      if(latest) html+='<div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">'+metric('Último HSI',cmntFmt(latest.total_score),latest.risk_class||'classe não informada')+metric('Avaliações',x.results.length,'resultados disponíveis')+metric('Versão',latest.calculation_version||'—','cálculo registrado')+metric('Data',latest.calculated_at?new Date(latest.calculated_at).toLocaleDateString('pt-BR'):'—','último processamento')+'</div>';
      else html+='<div class="mt-4 p-4 rounded-2xl bg-slate-50 text-sm text-slate-600">A estrutura HSI está conectada ao CMNT, mas esta conta ainda não possui resultado HSI disponível.</div>';
      html+='</div>'; body.insertAdjacentHTML('beforeend',html);
    }
    if(section==='integrations'){
      var n=await neuroLive(), latest=n.hsi[0], avg=n.hsi.length?n.hsi.reduce(function(a,b){return a+Number(b.final_score||0)},0)/n.hsi.length:null;
      var html='<div class="mt-4 card rounded-3xl p-5"><h3 class="font-black text-lg">NeuroDrive → CMNT</h3><p class="text-sm text-slate-500 mt-1">Conexão com aulas e avaliações HSI do NeuroDrive, respeitando o usuário autenticado.</p><div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">'+metric('Aulas',n.lessons.length,'registros vinculados à conta')+metric('Avaliações NeuroDrive',n.hsi.length,'resultados HSI disponíveis')+metric('Média HSI',avg===null?'—':cmntFmt(avg),'sobre avaliações NeuroDrive')+metric('Última aula',n.lessons[0]&&n.lessons[0].started_at?new Date(n.lessons[0].started_at).toLocaleDateString('pt-BR'):'—','atividade mais recente')+'</div>';
      if(latest)html+='<div class="mt-4 p-4 rounded-2xl bg-emerald-50 text-emerald-900 text-sm"><b>Última avaliação NeuroDrive:</b> Cognitivo '+cmntFmt(latest.cognitive)+' · Emocional '+cmntFmt(latest.emotional)+' · Comportamental '+cmntFmt(latest.behavioral)+' · Social '+cmntFmt(latest.social)+' · Contextual '+cmntFmt(latest.contextual)+'.</div>';
      body.insertAdjacentHTML('beforeend',html+'</div>');
    }
  };
})();

/* CMNT live Academia ENAT catalog integration. */
(function(){
  'use strict';
  var prev=window.cmntPlatformGo;
  window.cmntPlatformGo=async function(section){
    await prev(section);
    if(section!=='education')return;
    var body=document.getElementById('cmnt-platform-body');if(!body)return;
    var r=await db.from('enat_courses').select('id,name,code,summary,category,hours,modality,version,slug,thumbnail_url').eq('published',true).eq('active',true).order('name');
    var courses=r.data||[];
    var box='<div class="mt-4 card rounded-3xl p-5"><div class="flex items-center justify-between gap-3"><div><h3 class="font-black text-lg">Catálogo ENAT conectado</h3><p class="text-sm text-slate-500 mt-1">Cursos publicados pela Academia ENAT, apresentados dentro do ecossistema CMNT.</p></div><span class="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-black">'+courses.length+' curso(s)</span></div>';
    if(courses.length)box+='<div class="grid md:grid-cols-2 gap-3 mt-4">'+courses.map(function(c){return '<article class="p-4 rounded-2xl bg-slate-50"><div class="text-xs font-black text-emerald-700">'+(c.code||'ENAT')+' · '+(c.hours||0)+' h</div><h4 class="font-black mt-1">'+String(c.name||'').replace(/[&<>]/g,function(x){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[x]})+'</h4><p class="text-sm text-slate-600 mt-2">'+String(c.summary||'').slice(0,180)+'</p><div class="text-xs text-slate-500 mt-3">'+(c.modality||'')+' · v'+(c.version||1)+'</div></article>'}).join('')+'</div>';
    else box+='<div class="mt-4 p-4 rounded-2xl bg-slate-50 text-sm text-slate-600">Nenhum curso publicado no momento. A integração está ativa e aguardando o catálogo.</div>';
    body.insertAdjacentHTML('beforeend',box+'</div>');
  };
})();

/* CMNT trajectory integration — ENAT catalog + NeuroDrive learning + NEXUS bridge. */
(function(){
  'use strict';
  var previousTrajectory=window.cmntPlatformGo;

  function trEsc(v){
    return String(v==null?'':v).replace(/[&<>"']/g,function(ch){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch];
    });
  }
  function trBadge(v){
    return '<span class="inline-flex px-2 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-black">'+trEsc(v)+'</span>';
  }
  function trCard(x){return '<div class="card rounded-3xl p-5">'+x+'</div>'}
  function trMetric(label,value,sub){return '<div class="p-4 rounded-2xl bg-slate-50"><div class="text-xs font-black uppercase tracking-wide text-slate-500">'+trEsc(label)+'</div><div class="text-2xl font-black mt-1">'+trEsc(value)+'</div><div class="text-xs text-slate-500 mt-1">'+trEsc(sub)+'</div></div>'}
  function nexusName(code){
    var m={SA:'Consciência Situacional',PR:'Percepção de Risco',TD:'Tomada de Decisão',CV:'Controle Veicular',EC:'Comunicação Eficaz',RL:'Regulação e Legislação',AD:'Adaptação',IE:'Inteligência Emocional',RS:'Responsabilidade Social',AC:'Aprendizagem Contínua',ER:'Ergonomia',PS:'Primeiros Socorros'};
    return m[code]||code;
  }
  function progressBar(value){
    var n=Math.max(0,Math.min(100,Number(value)||0));
    return '<div class="w-full h-2 rounded-full bg-slate-200 overflow-hidden"><div class="h-full rounded-full bg-emerald-600" style="width:'+n+'%"></div></div>';
  }

  async function trajectoryData(){
    if(!S.user)return {courses:[],links:[],enrollments:[],lessons:[]};

    var [coursesR,linksR,enrollR,lessonsR]=await Promise.all([
      db.from('enat_courses').select('id,name,code,summary,category,hours,modality,version,slug,thumbnail_url,modules').eq('published',true).eq('active',true).order('name'),
      db.from('cmnt_course_nexus_links').select('course_id,competency_code,relevance,mapping_note').eq('active',true),
      db.from('ava_enrollments').select('id,course_id,status,enrolled_at,completed_at').eq('user_id',S.user.id).order('enrolled_at',{ascending:false}),
      db.from('ai_lessons').select('id,started_at,ended_at,status,phase,duration_minutes,seguranca,comunicacao,adaptacao,evolucao,objective,lesson_number').eq('user_id',S.user.id).order('started_at',{ascending:false}).limit(100)
    ]);

    var courses=coursesR.data||[];
    var links=linksR.data||[];
    var enrollments=enrollR.data||[];
    var lessons=lessonsR.data||[];
    return {courses:courses,links:links,enrollments:enrollments,lessons:lessons};
  }

  window.cmntPlatformGo=async function(section){
    await previousTrajectory(section);
    if(section!=='education')return;

    var body=document.getElementById('cmnt-platform-body');
    if(!body)return;

    var old=document.getElementById('cmnt-learning-trajectory');
    if(old)old.remove();

    if(!S.user){
      body.insertAdjacentHTML('beforeend',
        '<div id="cmnt-learning-trajectory" class="mt-4">'+
        trCard('<h3 class="text-xl font-black">Minha trajetória ENAT · NeuroDrive</h3><p class="text-sm text-slate-500 mt-2">Entre na sua conta para visualizar cursos, atividades do NeuroDrive e a ponte com o NEXUS 12.</p><button onclick="auth()" class="mt-4 bg-[#07111f] text-white px-4 py-3 rounded-xl font-black">Entrar</button>')+
        '</div>'
      );
      return;
    }

    var d=await trajectoryData();
    var byCourse={};
    d.links.forEach(function(x){
      if(!byCourse[x.course_id])byCourse[x.course_id]=[];
      byCourse[x.course_id].push(x);
    });
    var enrolledByCourse={};
    d.enrollments.forEach(function(x){enrolledByCourse[x.course_id]=x});

    var completed=d.lessons.filter(function(x){
      return ['completed','concluida','concluído','finalized','finished'].indexOf(String(x.status||'').toLowerCase())>=0 || !!x.ended_at;
    }).length;
    var total=d.lessons.length;
    var last=d.lessons[0];
    var avgSecurity=d.lessons.length?d.lessons.reduce(function(a,x){return a+Number(x.seguranca||0)},0)/d.lessons.length:0;
    var avgCommunication=d.lessons.length?d.lessons.reduce(function(a,x){return a+Number(x.comunicacao||0)},0)/d.lessons.length:0;
    var avgAdaptation=d.lessons.length?d.lessons.reduce(function(a,x){return a+Number(x.adaptacao||0)},0)/d.lessons.length:0;
    var avgEvolution=d.lessons.length?d.lessons.reduce(function(a,x){return a+Number(x.evolucao||0)},0)/d.lessons.length:0;

    var html='<div id="cmnt-learning-trajectory" class="mt-4 space-y-4">';
    html+=trCard(
      '<div class="flex items-center justify-between gap-3"><div><div class="text-xs uppercase tracking-widest text-emerald-700 font-black">CMNT · trajetória formativa</div>'+
      '<h3 class="text-xl font-black mt-1">ENAT + NeuroDrive + NEXUS 12</h3>'+
      '<p class="text-sm text-slate-500 mt-1">A rede social passa a acompanhar sua formação sem substituir o ambiente de aprendizagem.</p></div>'+
      '<span class="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-black">Dados da sua conta</span></div>'+
      '<div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-5">'+
      trMetric('Aulas NeuroDrive',total,'registros vinculados')+
      trMetric('Aulas concluídas',completed,total?'de '+total:'sem registros')+
      trMetric('Cursos matriculados',d.enrollments.length,'AVA')+
      trMetric('Última atividade',last&&last.started_at?new Date(last.started_at).toLocaleDateString('pt-BR'):'—','NeuroDrive')+
      '</div>'
    );

    if(d.enrollments.length){
      html+=trCard('<h3 class="font-black text-lg">Meus cursos</h3><p class="text-sm text-slate-500 mt-1">Matrículas existentes no ambiente de formação.</p><div class="space-y-3 mt-4">'+
        d.enrollments.map(function(e){
          var c=d.courses.find(function(x){return x.id===e.course_id});
          var title=c?c.name:'Curso do ambiente de formação';
          var pct=e.status==='completed'||e.completed_at?100:(e.status==='in_progress'?50:0);
          return '<div class="p-4 rounded-2xl bg-slate-50"><div class="flex justify-between gap-3"><div><b>'+trEsc(title)+'</b><div class="text-xs text-slate-500 mt-1">'+trEsc(e.status||'matriculado')+(e.enrolled_at?' · matrícula '+new Date(e.enrolled_at).toLocaleDateString('pt-BR'):'')+'</div></div>'+trBadge(e.completed_at?'Concluído':(e.status||'Matriculado'))+'</div><div class="mt-3">'+progressBar(pct)+'</div></div>';
        }).join('')+'</div>');
    }

    html+=trCard('<div class="flex items-center justify-between gap-3"><div><h3 class="font-black text-lg">Cursos ENAT conectados ao CMNT</h3><p class="text-sm text-slate-500 mt-1">O catálogo continua sendo administrado na Academia ENAT; o CMNT apenas apresenta a trilha e suas competências.</p></div>'+trBadge(d.courses.length+' curso(s)')+'</div>'+
      (d.courses.length?'<div class="grid md:grid-cols-2 gap-3 mt-4">'+d.courses.map(function(c){
        var links=byCourse[c.id]||[];
        var enrolled=enrolledByCourse[c.id];
        return '<article class="p-4 rounded-2xl bg-slate-50 border border-slate-100"><div class="text-xs font-black text-emerald-700">'+trEsc(c.code||'ENAT')+' · '+trEsc(c.hours||0)+' h</div><h4 class="font-black mt-1">'+trEsc(c.name)+'</h4><p class="text-sm text-slate-600 mt-2">'+trEsc(String(c.summary||'').slice(0,220))+'</p>'+
          (enrolled?'<div class="mt-3">'+trBadge('Você está matriculado')+'</div>':'')+
          '<div class="flex flex-wrap gap-2 mt-3">'+(links.length?links.map(function(l){return trBadge('NEXUS '+trEsc(l.competency_code)+' · '+trEsc(nexusName(l.competency_code)))}).join(''):'<span class="text-xs text-slate-400">Mapeamento NEXUS ainda não definido.</span>')+'</div></article>';
      }).join('')+'</div>':'<div class="mt-4 p-4 rounded-2xl bg-slate-50 text-sm text-slate-600">Nenhum curso publicado neste momento.</div>'));

    html+=trCard('<h3 class="font-black text-lg">Competências observadas no NeuroDrive</h3><p class="text-sm text-slate-500 mt-1">Esta é uma ponte inicial entre os indicadores pedagógicos já existentes e o NEXUS 12. Ela não altera os cálculos originais do NeuroDrive.</p>'+
      '<div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">'+
      trMetric('Segurança',''+(avgSecurity?avgSecurity.toFixed(1):'—'),'ponte → Consciência/Percepção de risco')+
      trMetric('Comunicação',''+(avgCommunication?avgCommunication.toFixed(1):'—'),'ponte → Comunicação eficaz')+
      trMetric('Adaptação',''+(avgAdaptation?avgAdaptation.toFixed(1):'—'),'ponte → Adaptação')+
      trMetric('Evolução',''+(avgEvolution?avgEvolution.toFixed(1):'—'),'ponte → Aprendizagem contínua')+
      '</div>'+
      '<div class="mt-4 p-4 rounded-2xl border border-emerald-100 bg-emerald-50 text-sm text-emerald-900"><b>Próxima camada:</b> transformar essa ponte em trilhas NEXUS por curso/módulo, com progresso e competências, sem duplicar os dados do NeuroDrive.</div>'
    );

    body.insertAdjacentHTML('beforeend',html+'</div>');
  };
})();
