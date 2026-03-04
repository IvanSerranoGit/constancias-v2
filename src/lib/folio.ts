import { createServiceClient } from './supabase/server'

export async function generarFolio(cursoSlug: string, cursoId: string): Promise<string> {
  const supabase = createServiceClient()
  const year = new Date().getFullYear()

  // Contar participantes existentes en este curso
  const { count } = await supabase
    .from('participantes')
    .select('*', { count: 'exact', head: true })
    .eq('curso_id', cursoId)

  const siguiente = (count ?? 0) + 1
  const prefijo = cursoSlug
    .split('-')
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 4)

  return `${prefijo}-${year}-${String(siguiente).padStart(4, '0')}`
}
