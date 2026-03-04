import { createServerSupabase } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import type { CursoConConteo } from '@/types'

export default async function AdminDashboardPage() {
  const supabase = await createServerSupabase()

  const { data: cursos } = await supabase
    .from('cursos')
    .select('*, participantes(count)')
    .order('created_at', { ascending: false }) as { data: CursoConConteo[] | null }

  const totalCursos = cursos?.length ?? 0
  const totalParticipantes = cursos?.reduce((sum, c) => sum + (c.participantes[0]?.count ?? 0), 0) ?? 0
  const registroAbierto = cursos?.filter((c) => c.registro_activo).length ?? 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Resumen general del sistema</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <p className="text-sm text-gray-500">Total de Cursos</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{totalCursos}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Total de Participantes</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{totalParticipantes}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Registros Abiertos</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{registroAbierto}</p>
        </Card>
      </div>

      {/* Recent courses */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Cursos Recientes</h2>
          <Link
            href="/admin/cursos/nuevo"
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            + Crear nuevo curso
          </Link>
        </div>

        {cursos && cursos.length > 0 ? (
          <div className="space-y-3">
            {cursos.slice(0, 5).map((curso) => (
              <Link key={curso.id} href={`/admin/cursos/${curso.id}`}>
                <Card className="hover:border-blue-200 hover:shadow transition-all cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{curso.nombre}</h3>
                      <p className="text-sm text-gray-500 mt-0.5">{formatDate(curso.fecha)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500">
                        {curso.participantes[0]?.count ?? 0} participantes
                      </span>
                      <Badge variant={curso.registro_activo ? 'success' : 'neutral'}>
                        {curso.registro_activo ? 'Registro abierto' : 'Registro cerrado'}
                      </Badge>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <p className="text-gray-500">No hay cursos creados aún</p>
            <Link
              href="/admin/cursos/nuevo"
              className="text-sm font-medium text-blue-600 hover:text-blue-700 mt-2 inline-block"
            >
              Crear tu primer curso
            </Link>
          </Card>
        )}
      </div>
    </div>
  )
}
