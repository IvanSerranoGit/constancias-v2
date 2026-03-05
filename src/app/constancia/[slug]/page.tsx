export const dynamic = 'force-dynamic'

import { createServiceClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ConstanciaForm } from '@/components/public/constancia-form'
import { Card } from '@/components/ui/card'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const supabase = createServiceClient()
  const { data: curso } = await supabase.from('cursos').select('nombre').eq('slug', slug).single()

  return {
    title: curso ? `Constancia - ${curso.nombre}` : 'Constancia',
  }
}

export default async function ConstanciaPage({ params }: Props) {
  const { slug } = await params
  const supabase = createServiceClient()

  const { data: curso } = await supabase
    .from('cursos')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!curso) notFound()

  if (!curso.constancia_activa) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-amber-50 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img src="/logo.png" alt="Logo" className="h-16 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-gray-900">{curso.nombre}</h1>
          </div>
          <Card className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Constancias no disponibles</h2>
            <p className="text-gray-500 mt-2">
              Las constancias para este curso aún no están habilitadas.
            </p>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-amber-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Logo" className="h-16 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-900">{curso.nombre}</h1>
          <p className="text-gray-500 mt-2">Descarga tu constancia de participación</p>
        </div>

        <ConstanciaForm cursoSlug={curso.slug} />
      </div>
    </div>
  )
}
