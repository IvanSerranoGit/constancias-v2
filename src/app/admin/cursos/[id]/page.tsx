'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Toggle } from '@/components/ui/toggle'
import { formatDate } from '@/lib/utils'
import type { Curso, Participante } from '@/types'

export default function CursoDetallePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [curso, setCurso] = useState<Curso | null>(null)
  const [participantes, setParticipantes] = useState<Participante[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<string | null>(null)
  const [copiedLink, setCopiedLink] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editNombre, setEditNombre] = useState('')
  const [editFecha, setEditFecha] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(async () => {
    const [cursoRes, partRes] = await Promise.all([
      supabase.from('cursos').select('*').eq('id', id).single(),
      supabase.from('participantes').select('*').eq('curso_id', id).order('created_at', { ascending: false }),
    ])
    if (cursoRes.data) setCurso(cursoRes.data)
    if (partRes.data) setParticipantes(partRes.data)
    setLoading(false)
  }, [id, supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function handleToggleRegistro(checked: boolean) {
    setToggling(true)
    await supabase.from('cursos').update({ registro_activo: checked }).eq('id', id)
    setCurso((prev) => prev ? { ...prev, registro_activo: checked } : prev)
    setToggling(false)
  }

  async function handleToggleConstancia(checked: boolean) {
    await supabase.from('cursos').update({ constancia_activa: checked }).eq('id', id)
    setCurso((prev) => prev ? { ...prev, constancia_activa: checked } : prev)
  }

  async function handleImportExcel(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    setImportResult(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('curso_id', id)

    try {
      const res = await fetch('/api/admin/importar', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error)
      setImportResult(`Se importaron ${data.imported} participantes${data.duplicates > 0 ? ` (${data.duplicates} duplicados omitidos)` : ''}`)
      fetchData()
    } catch (err) {
      setImportResult(err instanceof Error ? err.message : 'Error al importar')
    } finally {
      setImporting(false)
      e.target.value = ''
    }
  }

  async function handleDeleteParticipante(participanteId: string) {
    if (!confirm('¿Eliminar este participante?')) return
    await supabase.from('participantes').delete().eq('id', participanteId)
    setParticipantes((prev) => prev.filter((p) => p.id !== participanteId))
  }

  async function handleUploadPlantilla(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !curso) return

    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const filePath = `${curso.slug}-${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('plantillas')
        .upload(filePath, file)

      if (uploadError) throw new Error(uploadError.message)

      const { data: urlData } = supabase.storage.from('plantillas').getPublicUrl(filePath)

      await supabase.from('cursos').update({ plantilla_url: urlData.publicUrl }).eq('id', id)
      setCurso((prev) => prev ? { ...prev, plantilla_url: urlData.publicUrl } : prev)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al subir plantilla')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  function startEditing() {
    if (!curso) return
    setEditNombre(curso.nombre)
    setEditFecha(curso.fecha)
    setEditing(true)
  }

  async function handleSaveEdit() {
    if (!editNombre.trim() || !editFecha) return
    setSaving(true)
    await supabase.from('cursos').update({
      nombre: editNombre.trim(),
      fecha: editFecha,
    }).eq('id', id)
    setCurso((prev) => prev ? { ...prev, nombre: editNombre.trim(), fecha: editFecha } : prev)
    setEditing(false)
    setSaving(false)
  }

  function copyLink(path: string, label: string) {
    const url = `${window.location.origin}${path}`
    navigator.clipboard.writeText(url)
    setCopiedLink(label)
    setTimeout(() => setCopiedLink(null), 2000)
  }

  if (loading) {
    return <div className="text-gray-500">Cargando...</div>
  }

  if (!curso) {
    return <div className="text-red-500">Curso no encontrado</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700 mb-2 block">
            ← Volver a cursos
          </button>
          {editing ? (
            <div className="space-y-3">
              <input
                type="text"
                value={editNombre}
                onChange={(e) => setEditNombre(e.target.value)}
                className="block w-full text-2xl font-bold text-gray-900 border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-brand-red"
              />
              <input
                type="date"
                value={editFecha}
                onChange={(e) => setEditFecha(e.target.value)}
                className="block border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveEdit} loading={saving}>Guardar</Button>
                <Button size="sm" variant="secondary" onClick={() => setEditing(false)}>Cancelar</Button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-gray-900">{curso.nombre}</h1>
              <p className="text-gray-500 mt-1">{formatDate(curso.fecha)}</p>
              <button onClick={startEditing} className="text-sm text-brand-red hover:text-brand-red-dark mt-1">
                Editar datos del curso
              </button>
            </>
          )}
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-gray-900">{participantes.length}</p>
          <p className="text-sm text-gray-500">participantes</p>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Registro de asistentes</h3>
              <p className="text-sm text-gray-500 mt-0.5">Controla quién puede registrarse</p>
            </div>
            <Toggle
              checked={curso.registro_activo}
              onChange={handleToggleRegistro}
              disabled={toggling}
            />
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-2">Link de registro:</p>
            <div className="flex gap-2">
              <code className="flex-1 text-xs bg-gray-50 rounded px-2 py-1.5 text-gray-600 truncate">
                /registro/{curso.slug}
              </code>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => copyLink(`/registro/${curso.slug}`, 'registro')}
              >
                {copiedLink === 'registro' ? 'Copiado!' : 'Copiar'}
              </Button>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Descarga de constancias</h3>
              <p className="text-sm text-gray-500 mt-0.5">Permite descargar constancias</p>
            </div>
            <Toggle
              checked={curso.constancia_activa}
              onChange={handleToggleConstancia}
            />
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-2">Link de constancia:</p>
            <div className="flex gap-2">
              <code className="flex-1 text-xs bg-gray-50 rounded px-2 py-1.5 text-gray-600 truncate">
                /constancia/{curso.slug}
              </code>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => copyLink(`/constancia/${curso.slug}`, 'constancia')}
              >
                {copiedLink === 'constancia' ? 'Copiado!' : 'Copiar'}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Plantilla */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-gray-900">Plantilla de constancia</h3>
          <label className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg cursor-pointer transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : 'bg-brand-gold/10 text-brand-gold hover:bg-brand-gold/20'}`}>
            {uploading ? 'Subiendo...' : curso.plantilla_url ? 'Cambiar imagen' : 'Subir imagen'}
            <input
              type="file"
              accept="image/jpeg,image/png"
              onChange={handleUploadPlantilla}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
        {curso.plantilla_url ? (
          <div className="border rounded-lg overflow-hidden">
            <img src={curso.plantilla_url} alt="Plantilla" className="w-full" />
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-12 text-center">
            <p className="text-gray-400">No hay plantilla configurada</p>
            <p className="text-xs text-gray-300 mt-1">Sube una imagen JPG o PNG para las constancias</p>
          </div>
        )}
      </Card>

      {/* Import Excel */}
      <Card>
        <h3 className="font-medium text-gray-900 mb-1">Importar participantes desde Excel</h3>
        <p className="text-sm text-gray-500 mb-4">
          El archivo debe tener columnas de nombre y correo electrónico
        </p>
        <div className="flex items-center gap-4">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleImportExcel}
            disabled={importing}
            className="block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-gold/10 file:text-brand-gold hover:file:bg-brand-gold/20 disabled:opacity-50"
          />
          {importing && <span className="text-sm text-gray-500">Importando...</span>}
        </div>
        {importResult && (
          <p className={`text-sm mt-3 p-3 rounded-lg ${importResult.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
            {importResult}
          </p>
        )}
      </Card>

      {/* Participantes table */}
      <Card padding={false}>
        <div className="p-6 pb-0">
          <h3 className="font-medium text-gray-900">Participantes</h3>
        </div>
        {participantes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Nombre</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Folio</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {participantes.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium text-gray-900">{p.nombre}</td>
                    <td className="px-6 py-3 text-gray-500">{p.email}</td>
                    <td className="px-6 py-3">
                      <Badge>{p.folio}</Badge>
                    </td>
                    <td className="px-6 py-3 text-gray-500">{formatDate(p.created_at)}</td>
                    <td className="px-6 py-3 text-right">
                      <button
                        onClick={() => handleDeleteParticipante(p.id)}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-gray-500">
            No hay participantes registrados aún
          </div>
        )}
      </Card>
    </div>
  )
}
