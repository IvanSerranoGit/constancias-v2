export interface Curso {
  id: string
  nombre: string
  slug: string
  fecha: string
  plantilla_url: string | null
  nombre_posicion_y: number
  nombre_color: string
  nombre_font_size: number
  registro_activo: boolean
  constancia_activa: boolean
  created_at: string
}

export interface Participante {
  id: string
  nombre: string
  email: string | null
  curso_id: string
  folio: string
  hoja: string | null
  libro: string | null
  folio_oficial: string | null
  created_at: string
}

export interface ParticipanteConCurso extends Participante {
  cursos: Curso
}

export interface CursoConConteo extends Curso {
  participantes: { count: number }[]
}
