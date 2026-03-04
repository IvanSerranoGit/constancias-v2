import * as XLSX from 'xlsx'

interface ExcelRow {
  nombre: string
  email: string
}

export function parseExcel(buffer: ArrayBuffer): ExcelRow[] {
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const rawData = XLSX.utils.sheet_to_json<Record<string, string>>(sheet)

  return rawData
    .map((row) => {
      // Buscar columnas de nombre y email (flexible con nombres de columna)
      const nombre = findValue(row, ['nombre', 'name', 'nombre completo', 'participante'])
      const email = findValue(row, [
        'email',
        'correo',
        'correo electrónico',
        'correo electronico',
        'mail',
        'e-mail',
        'dirección de correo electrónico',
        'direccion de correo electronico',
      ])

      if (!nombre || !email) return null
      return { nombre: nombre.trim(), email: email.trim().toLowerCase() }
    })
    .filter((row): row is ExcelRow => row !== null)
}

function findValue(row: Record<string, string>, keys: string[]): string | undefined {
  for (const key of keys) {
    // Buscar coincidencia exacta o parcial (case-insensitive)
    const found = Object.entries(row).find(
      ([k]) => k.toLowerCase().trim() === key || k.toLowerCase().trim().includes(key)
    )
    if (found) return String(found[1])
  }
  return undefined
}
