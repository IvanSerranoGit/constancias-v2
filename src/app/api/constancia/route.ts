import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { generarConstanciaPDF } from '@/lib/pdf'

export async function POST(request: NextRequest) {
  const supabase = createServiceClient()

  const { email, curso_slug } = await request.json()

  if (!email?.trim() || !curso_slug) {
    return NextResponse.json({ error: 'Email y curso son requeridos' }, { status: 400 })
  }

  // Buscar curso
  const { data: curso } = await supabase
    .from('cursos')
    .select('*')
    .eq('slug', curso_slug)
    .single()

  if (!curso) {
    return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })
  }

  if (!curso.constancia_activa) {
    return NextResponse.json({ error: 'Las constancias para este curso no están disponibles' }, { status: 403 })
  }

  if (!curso.plantilla_url) {
    return NextResponse.json({ error: 'Este curso no tiene plantilla configurada' }, { status: 400 })
  }

  // Buscar participante
  const { data: participante } = await supabase
    .from('participantes')
    .select('*')
    .eq('email', email.trim().toLowerCase())
    .eq('curso_id', curso.id)
    .single()

  if (!participante) {
    return NextResponse.json({ error: 'No se encontró un registro con este correo para este curso' }, { status: 404 })
  }

  // Generar PDF
  try {
    const pdfBytes = await generarConstanciaPDF(participante, curso)

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="CONSTANCIA_${participante.nombre.toUpperCase().replace(/\s+/g, '_')}.pdf"`,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al generar PDF'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
