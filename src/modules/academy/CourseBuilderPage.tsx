import { FormEvent, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { Course, CourseModule, Lesson } from './academy'

export default function CourseBuilderPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [courseId, setCourseId] = useState('')
  const [modules, setModules] = useState<CourseModule[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [moduleTitle, setModuleTitle] = useState('')
  const [lessonTitle, setLessonTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  async function loadCourses() {
    if (!supabase) return
    const { data } = await supabase.from('courses').select('id,title,description,workload_hours,status,cover_url').order('title')
    setCourses((data ?? []) as Course[])
  }
  async function loadStructure(id: string) {
    if (!supabase || !id) return
    const [m, l] = await Promise.all([
      supabase.from('course_modules').select('id,course_id,title,description,position').eq('course_id', id).order('position'),
      supabase.from('course_lessons').select('id,module_id,title,description,duration_minutes,position').order('position'),
    ])
    setModules((m.data ?? []).map(x => ({ ...x, order_index: x.position })) as CourseModule[])
    setLessons((l.data ?? []).map(x => ({ ...x, order_index: x.position })) as Lesson[])
  }
  useEffect(() => { void loadCourses() }, [])
  useEffect(() => { if (courseId) void loadStructure(courseId) }, [courseId])

  async function createCourse(e: FormEvent) {
    e.preventDefault(); if (!supabase || !title.trim()) return
    setSaving(true); setMessage('')
    const { data, error } = await supabase.from('courses').insert({ title: title.trim(), description: description.trim() || null, status: 'draft' }).select('id,title,description,workload_hours,status,cover_url').single()
    if (error) setMessage('Não foi possível criar o curso. Verifique sua permissão administrativa.')
    else { setTitle(''); setDescription(''); await loadCourses(); setCourseId(data.id); setMessage('Curso criado. Agora adicione os módulos.') }
    setSaving(false)
  }
  async function createModule(e: FormEvent) {
    e.preventDefault(); if (!supabase || !courseId || !moduleTitle.trim()) return
    setSaving(true); setMessage('')
    const { error } = await supabase.from('course_modules').insert({ course_id: courseId, title: moduleTitle.trim(), position: modules.length + 1 })
    if (error) setMessage('Não foi possível criar o módulo.')
    else { setModuleTitle(''); await loadStructure(courseId) }
    setSaving(false)
  }
  async function createLesson(e: FormEvent, moduleId: string) {
    e.preventDefault(); if (!supabase || !lessonTitle.trim()) return
    setSaving(true); setMessage('')
    const count = lessons.filter(x => x.module_id === moduleId).length
    const { error } = await supabase.from('course_lessons').insert({ module_id: moduleId, title: lessonTitle.trim(), position: count + 1, is_published: false })
    if (error) setMessage('Não foi possível criar a aula.')
    else { setLessonTitle(''); await loadStructure(courseId) }
    setSaving(false)
  }

  return <section className="module-page course-builder">
    <div className="module-toolbar"><div><p className="eyebrow">ACADEMIA · AUTORIA</p><h2>Construtor de cursos</h2><p className="module-lead">Crie a estrutura pedagógica do curso sem alterar o código da plataforma.</p></div><span className="tag">ADMIN</span></div>
    <div className="builder-grid">
      <section className="panel"><div className="panel-head"><div><p className="eyebrow">01 · CURSO</p><h3>Novo curso</h3></div></div><form className="course-form" onSubmit={createCourse}><label>Título<input value={title} onChange={e => setTitle(e.target.value)} required /></label><label>Descrição<textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} /></label><button className="primary-button" disabled={saving}>{saving ? 'Salvando…' : 'Criar curso'}</button></form><div className="course-picker"><label>Curso em edição<select value={courseId} onChange={e => setCourseId(e.target.value)}><option value="">Selecione</option>{courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}</select></label></div></section>
      <section className="panel"><div className="panel-head"><div><p className="eyebrow">02 · ESTRUTURA</p><h3>Módulos e aulas</h3></div></div>{!courseId ? <div className="state-card">Selecione ou crie um curso para começar.</div> : <><form className="inline-form" onSubmit={createModule}><input placeholder="Nome do novo módulo" value={moduleTitle} onChange={e => setModuleTitle(e.target.value)} required /><button className="secondary-button" disabled={saving}>+ Módulo</button></form><div className="builder-list">{modules.map((mod, i) => <div className="builder-module" key={mod.id}><div className="builder-module-head"><span>{String(i + 1).padStart(2,'0')}</span><strong>{mod.title}</strong></div><div className="lesson-list">{lessons.filter(l => l.module_id === mod.id).map((lesson, j) => <div className="lesson-row" key={lesson.id}><span>{j + 1}</span>{lesson.title}</div>)}<form className="inline-form lesson-form" onSubmit={e => void createLesson(e, mod.id)}><input placeholder="Nome da nova aula" value={lessonTitle} onChange={e => setLessonTitle(e.target.value)} required /><button className="secondary-button" disabled={saving}>+ Aula</button></form></div></div>)}</div></>}{message && <div className="system-notice">{message}</div>}</section>
    </div>
  </section>
}
