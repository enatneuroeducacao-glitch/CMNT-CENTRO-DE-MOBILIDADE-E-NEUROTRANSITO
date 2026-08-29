import { useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from './lib/supabase'
import './auth.css'

export default function AuthScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault(); setMessage('')
    if (!supabase) { setMessage('Configuração do Supabase ainda não foi inserida no ambiente.'); return }
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) setMessage('Não foi possível entrar. Verifique e-mail e senha.')
  }

  return <main className="auth-shell"><section className="auth-card"><div className="brand-mark auth-mark">CM</div><p className="eyebrow">CENTRO DE MOBILIDADE E NEUROTRÂNSITO</p><h1>CMNT ENAT Hub</h1><p className="subtitle">Ambiente institucional de formação, inteligência e pesquisa.</p><form onSubmit={handleSubmit} className="auth-form"><label>E-mail<input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label><label>Senha<input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>{message && <div className="auth-message">{message}</div>}<button className="auth-submit" disabled={loading}>{loading ? 'Entrando…' : 'Entrar no Hub'}</button></form></section></main>
}
