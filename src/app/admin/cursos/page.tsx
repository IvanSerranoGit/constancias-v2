import { createServerSupabase } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import type { CursoConConteo } from '@/types'

export default async function CursosPage() {
  const supabase = await createServerSupabase()

  const { data: cursos } = await supabase
    .from('cursos')
    .select('*, participantes(count)')
    .order('fecha', { ascending: false }) as { data: CursoConConteo[] | null }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cursos</h1>
          <p className="text-gray-500 mt-1">Administra los webinarios y sus constancias</p>
        </div>
        <Link
          href="/admin/cursos/nuevo"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Nuevo Curso
        </Link>
      </div>

      {cursos && cursos.length > 0 ? (
        <div className="grid gap-4">
          {cursos.map((curso) => (
            <Link key={curso.id} href={`/admin/cursos/${curso.id}`}>
              <Card className="hover:border-blue-200 hover:shadow transition-all cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-gray-900">{curso.nombre}</h3>
                    <p className="text-sm text-gray-500">{formatDate(curso.fecha)}</p>
                    <p className="text-xs text-gray-400">/{curso.slug}</p>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {curso.participantes[0]?.count ?? 0}
                      </p>
                      <p className="text-xs text-gray-500">participantes</p>
                    </div>
                    <div className="space-y-1">
                      <Badge variant={curso.registro_activo ? 'success' : 'neutral'}>
                        {curso.registro_activo ? 'Registro abierto' : 'Registro cerrado'}
                      </Badge>
                      <br />
                      <Badge variant={curso.constancia_activa ? 'success' : 'warning'}>
                        {curso.constancia_activa ? 'Constancia activa' : 'Constancia inactiva'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="text-center py-16">
          <p className="text-gray-500 text-lg">No hay cursos creados</p>
          <p className="text-gray-400 mt-1">Crea tu primer curso para comenzar</p>
          <Link
            href="/admin/cursos/nuevo"
            className="inline-flex items-center mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Crear curso
          </Link>
        </Card>
      )}
    </div>
  )
}
