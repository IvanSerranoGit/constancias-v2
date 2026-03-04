import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { parseExcel } from '@/lib/excel'
import { generarFolio } from '@/lib/folio'

export async function POST(request: NextRequest) {
  const supabase = createServiceClient()

  const formData = await request.formData()
  const file = formData.get('file') as File
  const cursoId = formData.get('curso_id') as string

  if (!file || !cursoId) {
    return NextResponse.json({ error: 'Archivo y curso_id son requeridos' }, { status: 400 })
  }

  // Obtener slug del curso
  const { data: curso } = await supabase
    .from('cursos')
    .select('slug')
    .eq('id', cursoId)
    .single()

  if (!curso) {
    return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })
  }

  // Parsear Excel
  const buffer = await file.arrayBuffer()
  const rows = parseExcel(buffer)

  if (rows.length === 0) {
    return NextResponse.json(
      { error: 'No se encontraron datos válidos. Asegúrate de que el archivo tenga columnas de nombre y correo.' },
      { status: 400 }
    )
  }

  let imported = 0
  let duplicates = 0

  for (const row of rows) {
    // Verificar duplicado
    const { data: existente } = await supabase
      .from('participantes')
      .select('id')
      .eq('email', row.email)
      .eq('curso_id', cursoId)
      .single()

    if (existente) {
      duplicates++
      continue
    }

    const folio = await generarFolio(curso.slug, cursoId)

    const { error } = await supabase.from('participantes').insert({
      nombre: row.nombre,
      email: row.email,
      curso_id: cursoId,
      folio,
    })

    if (!error) imported++
  }

  return NextResponse.json({ imported, duplicates, total: rows.length })
}
