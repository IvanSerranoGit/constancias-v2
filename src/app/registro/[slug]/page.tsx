import { createServiceClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { RegistroForm } from '@/components/public/registro-form'
import { RegistroCerrado } from '@/components/public/registro-cerrado'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const supabase = createServiceClient()
  const { data: curso } = await supabase.from('cursos').select('nombre').eq('slug', slug).single()

  return {
    title: curso ? `Registro - ${curso.nombre}` : 'Registro',
  }
}

export default async function RegistroPage({ params }: Props) {
  const { slug } = await params
  const supabase = createServiceClient()

  const { data: curso } = await supabase
    .from('cursos')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!curso) notFound()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Logo" className="h-16 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-900">{curso.nombre}</h1>
          <p className="text-gray-500 mt-2">Registro de asistencia</p>
        </div>

        {curso.registro_activo ? (
          <RegistroForm cursoSlug={curso.slug} constanciaActiva={curso.constancia_activa} />
        ) : (
          <RegistroCerrado />
        )}
      </div>
    </div>
  )
}
