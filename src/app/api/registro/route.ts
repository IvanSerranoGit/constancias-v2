import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { generarFolio } from '@/lib/folio'

export async function POST(request: NextRequest) {
  const supabase = createServiceClient()

  const { nombre, email, curso_slug } = await request.json()

  if (!nombre?.trim() || !email?.trim() || !curso_slug) {
    return NextResponse.json({ error: 'Nombre, email y curso son requeridos' }, { status: 400 })
  }

  const emailNorm = email.trim().toLowerCase()

  // Verificar que el curso existe y el registro está activo
  const { data: curso, error: cursoError } = await supabase
    .from('cursos')
    .select('*')
    .eq('slug', curso_slug)
    .single()

  if (cursoError || !curso) {
    return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })
  }

  if (!curso.registro_activo) {
    return NextResponse.json({ error: 'El registro para este curso está cerrado' }, { status: 403 })
  }

  // Verificar duplicado
  const { data: existente } = await supabase
    .from('participantes')
    .select('id')
    .eq('email', emailNorm)
    .eq('curso_id', curso.id)
    .single()

  if (existente) {
    return NextResponse.json({ error: 'Este correo ya está registrado en este curso' }, { status: 409 })
  }

  // Generar folio y registrar
  const folio = await generarFolio(curso.slug, curso.id)

  const { error: insertError } = await supabase.from('participantes').insert({
    nombre: nombre.trim(),
    email: emailNorm,
    curso_id: curso.id,
    folio,
  })

  if (insertError) {
    console.error('Error al insertar participante:', insertError)
    return NextResponse.json({ error: `Error al registrar: ${insertError.message}` }, { status: 500 })
  }

  return NextResponse.json({ success: true, folio })
}
