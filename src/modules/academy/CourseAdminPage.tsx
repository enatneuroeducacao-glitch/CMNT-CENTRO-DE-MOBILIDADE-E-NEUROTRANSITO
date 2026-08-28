import { FormEvent, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { Course } from './academy'

const empty = { title: '', description: '', workload_hours: '', status: 'draft', cover_url: '' }

export default function CourseAdminPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [form, setForm] = useState(empty)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  async function load() {
    if (!supabase) return
    const { data } = await supabase.from('courses').select('id,title,description,workload_hours,status,cover_url').order('title')
    setCourses((data ?? []) as Course[])
  }
  useEffect(() => { void load() }, [])

  function edit(course: Course) {
    setEditingId(course.id)
    setForm({ title: course.title, description: course.description ?? '', workload_hours: course.workload_hours?.toString() ?? '', status: course.status ?? 'draft', cover_url: course.cover_url ?? '' })
    setMessage('')
  }
  function reset() { setEditingId(null); setForm(empty); setMessage('') }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!supabase || !form.title.trim()) return
    setSaving(true); setMessage('')
    const payload = { title: form.title.trim(), description: form.description.trim() || null, workload_hours: form.workload_hours ? Number(form.workload_hours) : null, status: form.status, cover_url: form.cover_url.trim() || null }
    const result = editingId ? await supabase.from('courses').update(payload).eq('id', editingId) : await supabase.from('courses').insert(payload)
    if (result.error) setMessage('Não foi possível salvar. Verifique as permissões da sua conta.')
    else { setMessage(editingId ? 'Curso atualizado.' : 'Curso criado.'); reset(); await load() }
    setSaving(false)
  }

  async function remove(id: string) {
    if (!supabase || !window.confirm('Excluir este curso? Esta ação deve ser usada somente para registros que ainda não tenham dependências.')) return
    const { error } = await supabase.from('courses').delete().eq('id', id)
    if (error) setMessage('Não foi possível excluir. Verifique dependências e permissões.')
    else { setMessage('Curso excluído.'); await load() }
  }

  return <section className="module-page admin-course-page">
    <div className="module-toolbar"><div><p className="eyebrow">ADMINISTRAÇÃO · ACADEMIA</p><h2>{editingId ? 'Editar curso' : 'Criar curso'}</h2><p className="module-lead">Cadastre e mantenha o catálogo oficial de formações do ENAT.</p></div><span className="tag">{courses.length} cursos</span></div>
    <div className="admin-grid">
      <form className="panel course-form" onSubmit={submit}><div className="panel-head"><div><p className="eyebrow">DADOS DO CURSO</p><h3>{editingId ? 'Atualização' : 'Novo curso'}</h3></div></div>
        <label>Título<input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></label>
        <label>Descrição<textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={5} /></label>
        <div className="form-row"><label>Carga horária (h)<input type="number" min="0" step="1" value={form.workload_hours} onChange={e => setForm({ ...form, workload_hours: e.target.value })} /></label><label>Status<select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option value="draft">Rascunho</option><option value="published">Publicado</option><option value="archived">Arquivado</option></select></label></div>
        <label>URL da capa<input value={form.cover_url} onChange={e => setForm({ ...form, cover_url: e.target.value })} placeholder="https://..." /></label>
        {message && <div className="system-notice">{message}</div>}
        <div className="form-actions"><button className="primary-button" disabled={saving}>{saving ? 'Salvando…' : editingId ? 'Salvar alterações' : 'Criar curso'}</button>{editingId && <button type="button" className="secondary-button" onClick={reset}>Cancelar</button>}</div>
      </form>
      <section className="panel"><div className="panel-head"><div><p className="eyebrow">CATÁLOGO</p><h3>Cursos cadastrados</h3></div></div>{courses.length === 0 ? <div className="state-card">Nenhum curso cadastrado.</div> : <div className="admin-list">{courses.map(course => <div className="admin-list-item" key={course.id}><div><strong>{course.title}</strong><span>{course.status || 'Sem status'}{course.workload_hours ? ` · ${course.workload_hours}h` : ''}</span></div><div className="row-actions"><button onClick={() => edit(course)}>Editar</button><button onClick={() => void remove(course.id)}>Excluir</button></div></div>)}</div>}</section>
    </div>
  </section>
}
