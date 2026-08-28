export type Course = { id: string; title: string; description: string | null; workload_hours: number | null; status: string | null; cover_url: string | null }

export type CourseModule = { id: string; course_id: string; title: string; description: string | null; order_index: number }

export type Lesson = { id: string; module_id: string; title: string; description: string | null; order_index: number; duration_minutes: number | null }

export type Enrollment = { id: string; course_id: string; user_id: string; status: string; progress_percent: number }
