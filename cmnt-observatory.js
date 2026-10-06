/* CMNT Observatory — additive public/administrative observatory layer. */
(function(){
  'use strict';
  var previous=window.cmntPlatformGo;
  function esc(v){return String(v==null?'':v).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  function card(x){return '<div class="card rounded-3xl p-5">'+x+'</div>'}
  function metric(v){return Number(v||0).toFixed(2)}
  async function renderObservatory(){
    var body=document.getElementById('cmnt-platform-body');if(!body)return;
    var r=await db.from('cmnt_observatory_data').select('id,indicator_id,period_start,period_end,geography_level,geography_code,value,sample_size,methodology_version,provenance,quality_status,published,cmnt_observatory_indicators(code,name,unit)').eq('published',true).order('period_end',{ascending:false}).limit(100);
    var rows=r.data||[];
    var grouped={};
    rows.forEach(function(x){var code=x.cmnt_observatory_indicators&&x.cmnt_observatory_indicators.code||'IND';if(!grouped[code])grouped[code]=x});
    var codes=Object.keys(grouped);
    var html='<div class="mt-4">'+
      '<div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">'+
      (codes.length?codes.map(function(code){var x=grouped[code],i=x.cmnt_observatory_indicators||{};return card('<div class="text-xs font-black uppercase tracking-wide text-emerald-700">'+esc(code)+'</div><div class="text-lg font-black mt-1">'+esc(i.name||code)+'</div><div class="text-3xl font-black mt-3">'+metric(x.value)+'</div><div class="text-xs text-slate-500 mt-1">'+esc(i.unit||'índice')+' · n='+esc(x.sample_size||0)+'</div><div class="text-xs text-slate-400 mt-2">'+esc(x.period_start)+' → '+esc(x.period_end)+'</div>')}).join(''):'<div class="sm:col-span-2 lg:col-span-4 p-5 rounded-2xl bg-slate-50 text-sm text-slate-600">Ainda não há indicadores publicados. O sistema só publica agregações com amostra mínima de 5 avaliações.</div>')+
      '</div>'+
      card('<h3 class="font-black">Metodologia e privacidade</h3><p class="text-sm text-slate-600 mt-2 leading-6">O Observatório CMNT trabalha somente com agregações. Não publica nome, e-mail, respostas individuais, diagnósticos ou registros brutos. A amostra mínima atual é <b>n≥5</b>. Cada indicador publicado registra período, tamanho da amostra, versão metodológica e proveniência.</p>')+
      (codes.length?'<div class="space-y-3 mt-4">'+codes.map(function(code){var x=grouped[code];return card('<div class="text-xs font-black text-emerald-700">'+esc(code)+' · '+esc(x.quality_status)+'</div><p class="text-sm text-slate-600 mt-2">'+esc(x.provenance)+'</p>')}).join('')+'</div>':'')+
      '</div>';
    body.insertAdjacentHTML('beforeend',html);
    var adm=await db.rpc('cmnt_is_admin');
    if(adm.data){
      var box=document.createElement('div');box.className='mt-4';box.innerHTML=card('<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><h3 class="font-black">Administração do Observatório</h3><p class="text-sm text-slate-500 mt-1">Gera o snapshot mensal a partir de HSI com consentimento e NEXUS 12 concluído. Sem exposição de dados individuais.</p></div><button id="cmntObsGenerate" class="bg-[#07111f] text-white px-4 py-3 rounded-xl font-black">Gerar snapshot mensal</button></div>');body.appendChild(box);
      document.getElementById('cmntObsGenerate').onclick=async function(){
        this.disabled=true;this.textContent='Processando...';
        var x=await db.rpc('cmnt_generate_observatory_snapshot');
        if(x.error){this.disabled=false;this.textContent='Gerar snapshot mensal';return toast(x.error.message,true)}
        toast('Snapshot processado: '+(x.data&&x.data.snapshots_created||0)+' indicador(es) publicado(s).');
        await previous('observatory');
      };
    }
  }
  window.cmntPlatformGo=async function(section){
    await previous(section);
    if(section==='observatory')await renderObservatory();
  };
})();