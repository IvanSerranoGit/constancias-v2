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

  const { data: curso } = await supabase
    .from('cursos')
    .select('slug')
    .eq('id', cursoId)
    .single()

  if (!curso) {
    return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })
  }

  const buffer = await file.arrayBuffer()
  const rows = parseExcel(buffer)

  if (rows.length === 0) {
    return NextResponse.json(
      { error: 'No se encontraron datos válidos. Asegúrate de que el archivo tenga al menos una columna de nombre.' },
      { status: 400 }
    )
  }

  let imported = 0
  let duplicates = 0
  const errorSamples: string[] = []

  for (const row of rows) {
    // Detectar duplicado: por email si está; si no, por folio_oficial; si tampoco, por nombre
    let dupQuery = supabase.from('participantes').select('id').eq('curso_id', cursoId)
    if (row.email) {
      dupQuery = dupQuery.eq('email', row.email)
    } else if (row.folio_oficial) {
      dupQuery = dupQuery.eq('folio_oficial', row.folio_oficial)
    } else {
      dupQuery = dupQuery.eq('nombre', row.nombre)
    }
    const { data: existente } = await dupQuery.maybeSingle()

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
      hoja: row.hoja,
      libro: row.libro,
      folio_oficial: row.folio_oficial,
    })

    if (error) {
      if (errorSamples.length < 3) errorSamples.push(`${row.nombre}: ${error.message}`)
    } else {
      imported++
    }
  }

  if (imported === 0 && errorSamples.length > 0) {
    return NextResponse.json(
      { error: `No se importó ninguna fila. Ejemplo: ${errorSamples[0]}` },
      { status: 500 }
    )
  }

  return NextResponse.json({
    imported,
    duplicates,
    total: rows.length,
    errors: errorSamples,
  })
}
