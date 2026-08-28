import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { Course } from './academy'

export default function AcademyPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    async function load() {
      if (!supabase) { setLoading(false); return }
      const { data, error } = await supabase
        .from('courses')
        .select('id,title,description,workload_hours,status,cover_url')
        .order('title')
      if (!active) return
      if (error) setError('Não foi possível carregar os cursos.')
      else setCourses((data ?? []) as Course[])
      setLoading(false)
    }
    void load()
    return () => { active = false }
  }, [])

  return <section className="module-page">
    <div className="module-toolbar"><div><p className="eyebrow">ACADEMIA ENAT</p><h2>Formação e certificação</h2><p className="module-lead">Cursos, trilhas, progresso e certificações em um único ambiente.</p></div><span className="tag">{courses.length} cursos</span></div>
    {loading && <div className="state-card">Carregando catálogo…</div>}
    {!loading && error && <div className="state-card error-state">{error}</div>}
    {!loading && !error && courses.length === 0 && <div className="state-card"><div className="empty-icon">◇</div><h3>Catálogo ainda não cadastrado</h3><p>Os cursos aparecerão aqui assim que forem cadastrados na base institucional do CMNT ENAT Hub.</p></div>}
    {!loading && !error && courses.length > 0 && <div className="course-grid">{courses.map(course => <article className="course-card" key={course.id}><div className="course-cover">{course.cover_url ? <img src={course.cover_url} alt="" /> : <span>ENAT</span>}</div><div className="course-body"><span className="course-status">{course.status || 'Disponível'}</span><h3>{course.title}</h3><p>{course.description || 'Formação ENAT.'}</p><div className="course-meta">{course.workload_hours ? `${course.workload_hours} horas` : 'Carga horária a definir'}</div></div></article>)}</div>}
  </section>
}
