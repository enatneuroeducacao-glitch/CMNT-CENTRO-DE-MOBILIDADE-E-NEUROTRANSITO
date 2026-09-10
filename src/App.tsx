import { useState } from 'react';
import { BookOpen, CalendarDays, CheckCircle2, ChevronRight, Clock3, GraduationCap, LayoutDashboard, Library, Menu, PlayCircle, Radio, Search, Settings, Users, X } from 'lucide-react';

const courses = [
  { title: 'ENAT — Ensino Neuroeducacional Aplicado ao Trânsito', tag: 'Formação', progress: 68, lessons: '24 aulas', color: 'cyan' },
  { title: 'Neuroeducação e Comportamento Humano', tag: 'Neurociência', progress: 34, lessons: '18 aulas', color: 'violet' },
  { title: 'Segurança Viária e Percepção de Risco', tag: 'Trânsito', progress: 12, lessons: '15 aulas', color: 'amber' }
];

function App() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('Visão geral');
  const nav = [
    ['Visão geral', LayoutDashboard], ['Meus cursos', BookOpen], ['Biblioteca', Library], ['Aulas ao vivo', Radio], ['Calendário', CalendarDays], ['Certificados', GraduationCap]
  ] as const;
  return <div className="app-shell">
    <aside className={open ? 'sidebar open' : 'sidebar'}>
      <div className="brand"><div className="brand-mark">ENAT</div><div><strong>AVA ENAT-HSI</strong><span>CMNT • Educação</span></div><button className="mobile-close" onClick={()=>setOpen(false)}><X size={18}/></button></div>
      <nav>{nav.map(([label, Icon]) => <button className={active===label?'nav-item active':'nav-item'} key={label} onClick={()=>{setActive(label);setOpen(false)}}><Icon size={19}/><span>{label}</span>{label==='Aulas ao vivo' && <i/>}</button>)}</nav>
      <div className="sidebar-bottom"><button className="nav-item"><Users size={19}/><span>Comunidade</span></button><button className="nav-item"><Settings size={19}/><span>Configurações</span></button></div>
    </aside>
    {open && <div className="backdrop" onClick={()=>setOpen(false)}/>} 
    <main>
      <header><button className="mobile-menu" onClick={()=>setOpen(true)}><Menu size={22}/></button><div className="search"><Search size={18}/><input placeholder="Buscar cursos, aulas e materiais..."/></div><div className="profile"><div className="avatar">VB</div><div><strong>Área do aluno</strong><span>Minha aprendizagem</span></div></div></header>
      <section className="hero"><div><span className="eyebrow">AMBIENTE VIRTUAL DE APRENDIZAGEM</span><h1>Aprenda no seu ritmo.<br/><em>Evolua com propósito.</em></h1><p>Um espaço acolhedor para transformar conhecimento em prática, com conteúdo multimídia, acompanhamento e aulas ao vivo.</p><button className="primary">Continuar aprendizagem <ChevronRight size={17}/></button></div><div className="hero-orbit"><div className="orbit orbit-a"/><div className="orbit orbit-b"/><div className="brain">✦</div></div></section>
      <section className="stats"><div><span>Em andamento</span><strong>03</strong><small>cursos</small></div><div><span>Progresso médio</span><strong>38%</strong><small>da sua jornada</small></div><div><span>Horas estudadas</span><strong>42h</strong><small>este período</small></div><div><span>Próxima aula</span><strong>Hoje</strong><small>19:30 • ao vivo</small></div></section>
      <section className="section-head"><div><span className="eyebrow">SUA JORNADA</span><h2>Continue de onde parou</h2></div><button className="ghost">Ver todos <ChevronRight size={16}/></button></section>
      <section className="course-grid">{courses.map(c=><article className="course-card" key={c.title}><div className={'course-art '+c.color}><BookOpen size={23}/><span>{c.tag}</span></div><div className="course-body"><h3>{c.title}</h3><div className="meta"><span><PlayCircle size={14}/> {c.lessons}</span><span><Clock3 size={14}/> 120h</span></div><div className="progress-row"><span>Progresso</span><strong>{c.progress}%</strong></div><div className="progress"><i style={{width:`${c.progress}%`}}/></div><button className="continue">Continuar <ChevronRight size={16}/></button></div></article>)}</section>
      <section className="live"><div className="live-icon"><Radio size={25}/></div><div className="live-copy"><span className="live-label">PRÓXIMA AULA AO VIVO</span><h2>Neurociência aplicada à percepção de risco</h2><p>Hoje • 19:30 • Prof. ENAT • Sala virtual</p></div><div className="live-status"><CheckCircle2 size={17}/> Sala preparada</div><button className="primary small">Entrar na sala <ChevronRight size={16}/></button></section>
    </main>
  </div>
}
export default App;
