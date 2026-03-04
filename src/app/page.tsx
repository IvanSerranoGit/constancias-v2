import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import type { Curso } from '@/types'

export default async function HomePage() {
  const supabase = createServiceClient()

  const { data: cursos } = (await supabase
    .from('cursos')
    .select('*')
    .eq('constancia_activa', true)
    .order('fecha', { ascending: false })) as { data: Curso[] | null }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-3xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <img src="/logo.png" alt="Logo" className="h-20 mx-auto mb-8" />
          <h1 className="text-3xl font-bold text-gray-900">Constancias de Participación</h1>
          <p className="text-gray-500 mt-3 text-lg">
            Descarga tus constancias de los webinarios en los que participaste
          </p>
        </div>

        {/* Course list */}
        {cursos && cursos.length > 0 ? (
          <div className="space-y-4">
            {cursos.map((curso) => (
              <Link key={curso.id} href={`/constancia/${curso.slug}`}>
                <Card className="hover:border-blue-200 hover:shadow-md transition-all cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-semibold text-gray-900 text-lg">{curso.nombre}</h2>
                      <p className="text-sm text-gray-500 mt-1">{formatDate(curso.fecha)}</p>
                    </div>
                    <Badge variant="success">Disponible</Badge>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <p className="text-gray-500">No hay constancias disponibles por el momento</p>
          </Card>
        )}
      </div>
    </div>
  )
}
