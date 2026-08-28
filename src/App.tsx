import { useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import AuthScreen from './AuthScreen'
import { supabase } from './lib/supabase'

type Module = { id: string; label: string; eyebrow: string; description: string; metric: string }
type Profile = { full_name: string | null; email: string | null; role: string | null; state_uf: string | null }
type Counts = { profiles: number; assessments: number; courses: number; research: number }

const modules: Module[] = [
  { id: 'overview', label: 'Visão Geral', eyebrow: 'CENTRO DE COMANDO', description: 'Panorama institucional do ecossistema CMNT e ENAT.', metric: 'Hub' },
  { id: 'academy', label: 'Academia ENAT', eyebrow: 'FORMAÇÃO', description: 'Cursos, trilhas, progresso e certificações.', metric: 'Academia' },
  { id: 'hsi', label: 'HSI-DOTH-P', eyebrow: 'INTELIGÊNCIA HUMANA', description: 'Avaliações, dimensões, evolução e indicadores.', metric: 'HSI' },
  { id: 'observatory', label: 'Observatório CMNT', eyebrow: 'DADOS E TERRITÓRIO', description: 'Indicadores agregados e visão territorial.', metric: 'Dados' },
  { id: 'research', label: 'Pesquisa', eyebrow: 'CIÊNCIA', description: 'Projetos, estudos e bases autorizadas.', metric: 'Pesquisa' },
  { id: 'ecosystem', label: 'Ecossistema', eyebrow: 'CONEXÕES', description: 'Embaixadores, indicações e benefícios.', metric: 'Rede' },
  { id: 'billing', label: 'Assinatura', eyebrow: 'ACESSO', description: 'Planos, permissões e recursos do Hub.', metric: 'Planos' },
]
const roleLabels: Record<string, string> = { admin: 'Administrador', gestor_enat: 'Gestor ENAT', instrutor: 'Instrutor', pesquisador: 'Pesquisador', empresa: 'Empresa', instituicao: 'Instituição', embaixador: 'Embaixador' }

async function countTable(table: string) {
  if (!supabase) return 0
  const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true })
  return error ? 0 : count ?? 0
}

function Hub({ session }: { session: Session }) {
  const [active, setActive] = useState('overview')
  const [collapsed, setCollapsed] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [counts, setCounts] = useState<Counts>({ profiles: 0, assessments: 0, courses: 0, research: 0 })
  const [refreshing, setRefreshing] = useState(false)
  const current = useMemo(() => modules.find((item) => item.id === active) ?? modules[0], [active])

  async function loadData() {
    if (!supabase) return
    const [profileResult, profiles, assessments, courses, research] = await Promise.all([
      supabase.from('profiles').select('full_name,email,role,state_uf').eq('id', session.user.id).maybeSingle(),
      countTable('profiles'), countTable('hsi_assessments'), countTable('courses'), countTable('research_projects'),
    ])
    if (!profileResult.error) setProfile(profileResult.data)
    setCounts({ profiles, assessments, courses, research })
  }
  useEffect(() => { void loadData() }, [session.user.id])
  async function refresh() { setRefreshing(true); await loadData(); setRefreshing(false) }
  async function logout() { await supabase?.auth.signOut() }

  const displayName = profile?.full_name || session.user.email?.split('@')[0] || 'Usuário'
  const role = roleLabels[profile?.role || ''] || profile?.role || 'Usuário'
  return <div className={`app-shell ${collapsed ? 'is-collapsed' : ''}`}>
    <aside className="sidebar"><div className="brand"><div className="brand-mark">CM</div><div className="brand-copy"><strong>CMNT</strong><span>ENAT HUB</span></div></div><div className="sidebar-label">NAVEGAÇÃO</div><nav>{modules.map((item) => <button className={`nav-item ${active === item.id ? 'active' : ''}`} key={item.id} onClick={() => setActive(item.id)} title={item.label}><span className="nav-icon">{item.id === 'overview' ? '⌂' : item.id === 'academy' ? '◈' : item.id === 'hsi' ? '◉' : item.id === 'observatory' ? '◫' : item.id === 'research' ? '⌁' : item.id === 'ecosystem' ? '◇' : '◌'}</span><span>{item.label}</span></button>)}</nav><div className="sidebar-footer"><div className="status-dot" /> Ambiente protegido</div></aside>
    <main className="main-content"><header className="topbar"><button className="menu-button" onClick={() => setCollapsed(!collapsed)} aria-label="Alternar menu">☰</button><div className="breadcrumb">CMNT / <strong>{current.label}</strong></div><div className="top-actions"><button className="icon-button" onClick={() => void refresh()} title="Atualizar dados">{refreshing ? '…' : '↻'}</button><div className="profile"><div className="avatar">{displayName.slice(0,2).toUpperCase()}</div><div><strong>{displayName}</strong><span>{role}{profile?.state_uf ? ` · ${profile.state_uf}` : ''}</span></div></div><button className="logout-button" onClick={logout}>Sair</button></div></header>
      <section className="page"><div className="hero"><div><p className="eyebrow">{current.eyebrow}</p><h1>{current.label}</h1><p className="subtitle">{current.description}</p></div><div className="hero-badge"><span /> SISTEMA ONLINE</div></div>
        {active === 'overview' ? <><div className="stats-grid">{[['Usuários',counts.profiles,'Perfis no Hub'],['Avaliações HSI',counts.assessments,'Registros autorizados'],['Cursos',counts.courses,'Cursos cadastrados'],['Pesquisas',counts.research,'Projetos registrados']].map(([label,value,hint]) => <div className="stat-card" key={label}><span>{label}</span><strong>{value}</strong><small>{hint}</small></div>)}</div><div className="content-grid"><section className="panel large"><div className="panel-head"><div><p className="eyebrow">VISÃO ESTRATÉGICA</p><h2>Centro de inteligência</h2></div><span className="tag">V1.1</span></div><div className="empty-state"><div className="empty-icon">✦</div><h3>Hub conectado à base institucional</h3><p>Os indicadores são consultados diretamente do Supabase do CMNT. Nenhum dado do Assistente do Instrutor é utilizado aqui.</p></div></section><section className="panel"><div className="panel-head"><div><p className="eyebrow">ARQUITETURA</p><h2>Próximas camadas</h2></div></div><div className="timeline"><div><b>01</b><span>Perfis e permissões</span></div><div><b>02</b><span>Academia ENAT</span></div><div><b>03</b><span>HSI-DOTH-P</span></div><div><b>04</b><span>Observatório</span></div></div></section></div></> : <section className="panel module-panel"><div className="module-symbol">{current.metric.slice(0,1)}</div><p className="eyebrow">MÓDULO ESTRUTURADO</p><h2>{current.label}</h2><p>{current.description}</p><div className="coming">Base preparada para implementação funcional nesta etapa.</div></section>}
      </section></main></div>
}

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  useEffect(() => { if (!supabase) { setSession(null); return }; supabase.auth.getSession().then(({ data }) => setSession(data.session)); const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => setSession(next)); return () => listener.subscription.unsubscribe() }, [])
  if (session === undefined) return <main className="auth-shell"><div className="loading-card">Carregando CMNT ENAT Hub…</div></main>
  if (!session) return <AuthScreen />
  return <Hub session={session} />
}
