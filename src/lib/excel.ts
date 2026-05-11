import * as XLSX from 'xlsx'

interface ExcelRow {
  nombre: string
  email: string | null
  hoja: string | null
  libro: string | null
  folio_oficial: string | null
}

export function parseExcel(buffer: ArrayBuffer): ExcelRow[] {
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const rawData = XLSX.utils.sheet_to_json<Record<string, string>>(sheet)

  return rawData
    .map((row) => {
      const nombre = findValue(row, ['nombre completo', 'nombre', 'name', 'participante'])
      if (!nombre) return null

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

      const hoja = findValue(row, ['hoja'])
      const libro = findValue(row, ['libro'])
      const folioOficial = findValue(row, ['folio oficial', 'folio'])

      return {
        nombre: nombre.trim(),
        email: email?.trim().toLowerCase() || null,
        hoja: hoja?.toString().trim() || null,
        libro: libro?.toString().trim() || null,
        folio_oficial: folioOficial?.toString().trim() || null,
      }
    })
    .filter((row): row is ExcelRow => row !== null)
}

function findValue(row: Record<string, string>, keys: string[]): string | undefined {
  for (const key of keys) {
    const found = Object.entries(row).find(
      ([k]) => k.toLowerCase().trim() === key || k.toLowerCase().trim().includes(key)
    )
    if (found && found[1] != null && found[1] !== '') return String(found[1])
  }
  return undefined
}
