import { useState } from 'react'

type Module = {
  id: string
  label: string
  eyebrow: string
  description: string
  metric: string
}

const modules: Module[] = [
  { id: 'overview', label: 'Visão Geral', eyebrow: 'CENTRO DE COMANDO', description: 'Panorama institucional do ecossistema CMNT e ENAT.', metric: 'Hub V1.0' },
  { id: 'academy', label: 'Academia ENAT', eyebrow: 'FORMAÇÃO', description: 'Cursos, trilhas, progresso e certificações.', metric: 'Academia' },
  { id: 'hsi', label: 'HSI-DOTH-P', eyebrow: 'INTELIGÊNCIA HUMANA', description: 'Avaliações, dimensões, evolução e indicadores.', metric: 'HSI' },
  { id: 'observatory', label: 'Observatório CMNT', eyebrow: 'DADOS E TERRITÓRIO', description: 'Indicadores agregados e visão territorial.', metric: 'Observatório' },
  { id: 'research', label: 'Pesquisa', eyebrow: 'CIÊNCIA', description: 'Projetos, estudos e bases autorizadas.', metric: 'Pesquisa' },
  { id: 'ecosystem', label: 'Ecossistema', eyebrow: 'CONEXÕES', description: 'Embaixadores, indicações e benefícios.', metric: 'Ecossistema' },
  { id: 'billing', label: 'Assinatura', eyebrow: 'ACESSO', description: 'Planos, permissões e recursos do Hub.', metric: 'Planos' },
]

function App() {
  const [active, setActive] = useState('overview')
  const [collapsed, setCollapsed] = useState(false)
  const current = modules.find((item) => item.id === active) ?? modules[0]

  return (
    <div className={`app-shell ${collapsed ? 'is-collapsed' : ''}`}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">CM</div>
          <div className="brand-copy"><strong>CMNT</strong><span>ENAT HUB</span></div>
        </div>
        <div className="sidebar-label">NAVEGAÇÃO</div>
        <nav>
          {modules.map((item) => (
            <button className={`nav-item ${active === item.id ? 'active' : ''}`} key={item.id} onClick={() => setActive(item.id)} title={item.label}>
              <span className="nav-icon">{item.id === 'overview' ? '⌂' : item.id === 'academy' ? '◈' : item.id === 'hsi' ? '◉' : item.id === 'observatory' ? '◫' : item.id === 'research' ? '⌁' : item.id === 'ecosystem' ? '◇' : '◌'}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="status-dot" /> Ambiente protegido
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button className="menu-button" onClick={() => setCollapsed(!collapsed)} aria-label="Alternar menu">☰</button>
          <div className="breadcrumb">CMNT / <strong>{current.label}</strong></div>
          <div className="top-actions">
            <button className="icon-button" aria-label="Notificações">◌</button>
            <div className="profile"><div className="avatar">EN</div><div><strong>ENAT</strong><span>Administrador</span></div></div>
          </div>
        </header>

        <section className="page">
          <div className="hero">
            <div>
              <p className="eyebrow">{current.eyebrow}</p>
              <h1>{current.label}</h1>
              <p className="subtitle">{current.description}</p>
            </div>
            <div className="hero-badge"><span /> SISTEMA ONLINE</div>
          </div>

          {active === 'overview' ? (
            <>
              <div className="stats-grid">
                {[
                  ['Instrutores', '—', 'Aguardando dados reais'],
                  ['Avaliações HSI', '—', 'Aguardando dados reais'],
                  ['Cursos ativos', '—', 'Aguardando dados reais'],
                  ['Projetos de pesquisa', '—', 'Aguardando dados reais'],
                ].map(([label, value, hint]) => <div className="stat-card" key={label}><span>{label}</span><strong>{value}</strong><small>{hint}</small></div>)}
              </div>
              <div className="content-grid">
                <section className="panel large"><div className="panel-head"><div><p className="eyebrow">VISÃO ESTRATÉGICA</p><h2>Centro de inteligência</h2></div><span className="tag">V1.0</span></div><div className="empty-state"><div className="empty-icon">✦</div><h3>Hub preparado para dados reais</h3><p>O ambiente está estruturado. Os indicadores permanecerão vazios até que existam dados autorizados no Supabase.</p></div></section>
                <section className="panel"><div className="panel-head"><div><p className="eyebrow">MÓDULO ATIVO</p><h2>Próximas etapas</h2></div></div><div className="timeline"><div><b>01</b><span>Autenticação e perfis</span></div><div><b>02</b><span>Academia ENAT</span></div><div><b>03</b><span>HSI-DOTH-P</span></div><div><b>04</b><span>Observatório</span></div></div></section>
              </div>
            </>
          ) : (
            <section className="panel module-panel"><div className="module-symbol">{current.metric.slice(0, 1)}</div><p className="eyebrow">MÓDULO ESTRUTURADO</p><h2>{current.label}</h2><p>{current.description}</p><div className="coming">Base preparada para implementação funcional.</div></section>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
