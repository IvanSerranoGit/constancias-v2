'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { slugify } from '@/lib/utils'

export default function NuevoCursoPage() {
  const [nombre, setNombre] = useState('')
  const [fecha, setFecha] = useState('')
  const [plantilla, setPlantilla] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPlantilla(file)
    setPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const slug = slugify(nombre)

      // Subir plantilla a Supabase Storage
      let plantilla_url: string | null = null
      if (plantilla) {
        const ext = plantilla.name.split('.').pop()
        const filePath = `${slug}-${Date.now()}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('plantillas')
          .upload(filePath, plantilla)

        if (uploadError) throw new Error('Error al subir la plantilla: ' + uploadError.message)

        const { data: urlData } = supabase.storage.from('plantillas').getPublicUrl(filePath)
        plantilla_url = urlData.publicUrl
      }

      // Crear curso
      const { error: insertError } = await supabase.from('cursos').insert({
        nombre,
        slug,
        fecha,
        plantilla_url,
      })

      if (insertError) {
        if (insertError.code === '23505') {
          throw new Error('Ya existe un curso con ese nombre')
        }
        throw new Error(insertError.message)
      }

      router.push('/admin/cursos')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Nuevo Curso</h1>
        <p className="text-gray-500 mt-1">Crea un nuevo webinario con su plantilla de constancia</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            id="nombre"
            label="Nombre del curso"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Funciones Esenciales de Salud Pública (FESP)"
            required
          />

          {nombre && (
            <p className="text-xs text-gray-400 -mt-4">
              URL: /registro/<span className="font-mono">{slugify(nombre)}</span>
            </p>
          )}

          <Input
            id="fecha"
            label="Fecha del webinario"
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            required
          />

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Plantilla de constancia
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="text-xs text-gray-400">JPG o PNG. Resolución recomendada: 3168x2448px (landscape)</p>
          </div>

          {preview && (
            <div className="border rounded-lg overflow-hidden">
              <img src={preview} alt="Preview plantilla" className="w-full" />
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>
          )}

          <div className="flex gap-3">
            <Button type="submit" loading={loading}>
              Crear Curso
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.back()}>
              Cancelar
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
