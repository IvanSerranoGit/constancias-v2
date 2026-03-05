'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

interface Props {
  cursoSlug: string
  constanciaActiva: boolean
}

export function RegistroForm({ cursoSlug, constanciaActiva }: Props) {
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, email, curso_slug: cursoSlug }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error)
      }

      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrarse')
    } finally {
      setLoading(false)
    }
  }

  async function handleDownload() {
    setDownloading(true)
    setError('')

    try {
      const res = await fetch('/api/constancia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, curso_slug: cursoSlug }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `constancia.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al descargar constancia')
    } finally {
      setDownloading(false)
    }
  }

  if (success) {
    return (
      <Card className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900">Registro exitoso</h2>
        <p className="text-gray-500 mt-2">Tu asistencia ha sido registrada.</p>

        {constanciaActiva ? (
          <div className="mt-6">
            <Button onClick={handleDownload} loading={downloading} className="w-full">
              Descargar Constancia
            </Button>
            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3 mt-3">{error}</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-400 mt-4">
            Tu constancia estará disponible próximamente.
          </p>
        )}
      </Card>
    )
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="nombre"
          label="Nombre completo"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Como deseas que aparezca en tu constancia"
          required
        />

        <Input
          id="email"
          label="Correo electrónico"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@correo.com"
          required
        />

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>
        )}

        <Button type="submit" loading={loading} className="w-full">
          Registrar asistencia
        </Button>
      </form>
    </Card>
  )
}
