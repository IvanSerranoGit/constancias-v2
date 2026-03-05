import { createServiceClient } from './supabase/server'

export async function generarFolio(cursoSlug: string, cursoId: string): Promise<string> {
  const supabase = createServiceClient()
  const year = new Date().getFullYear()

  const prefijo = cursoSlug
    .split('-')
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 4)

  const patron = `${prefijo}-${year}-%`

  // Buscar el último folio usado para este curso (por orden descendente)
  const { data } = await supabase
    .from('participantes')
    .select('folio')
    .eq('curso_id', cursoId)
    .like('folio', patron)
    .order('folio', { ascending: false })
    .limit(1)

  let siguiente = 1

  if (data && data.length > 0) {
    // Extraer el número del último folio, ej: "FESP-2026-0003" → 3
    const ultimoFolio = data[0].folio
    const partes = ultimoFolio.split('-')
    const ultimoNumero = parseInt(partes[partes.length - 1], 10)
    if (!isNaN(ultimoNumero)) {
      siguiente = ultimoNumero + 1
    }
  }

  return `${prefijo}-${year}-${String(siguiente).padStart(4, '0')}`
}
