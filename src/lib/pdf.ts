import { PDFDocument, PDFFont, PDFImage, rgb, StandardFonts } from 'pdf-lib'
import type { Curso, Participante } from '@/types'

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  return rgb(r, g, b)
}

// Las fuentes estándar de pdf-lib usan WinAnsi (Latin-1), que no puede codificar
// caracteres como Ė (0x0116). Para cualquier carácter fuera de Latin-1 lo
// descomponemos y eliminamos las marcas combinantes, conservando los acentos
// del español (que sí están en Latin-1).
function sanitizarTextoPdf(text: string): string {
  return text
    .normalize('NFC')
    .split('')
    .map((c) => {
      if (c.charCodeAt(0) < 0x100) return c
      return c.normalize('NFD').replace(/[̀-ͯ]/g, '')
    })
    .join('')
}

async function descargarPlantilla(pdfDoc: PDFDocument, plantillaUrl: string): Promise<PDFImage> {
  const response = await fetch(plantillaUrl)
  const bytes = await response.arrayBuffer()
  const isJpg =
    plantillaUrl.toLowerCase().endsWith('.jpg') ||
    plantillaUrl.toLowerCase().endsWith('.jpeg')
  return isJpg ? pdfDoc.embedJpg(bytes) : pdfDoc.embedPng(bytes)
}

function dibujarPagina(
  pdfDoc: PDFDocument,
  imagen: PDFImage,
  nombreFont: PDFFont,
  folioFont: PDFFont,
  participante: Participante,
  curso: Curso
) {
  const { width, height } = imagen.scale(1)
  const pageWidth = 792 // Letter landscape
  const pageHeight = pageWidth * (height / width)
  const page = pdfDoc.addPage([pageWidth, pageHeight])

  page.drawImage(imagen, { x: 0, y: 0, width: pageWidth, height: pageHeight })

  const nombre = sanitizarTextoPdf(participante.nombre.toUpperCase())
  const baseFontSize = curso.nombre_font_size || 48
  const color = hexToRgb(curso.nombre_color || '#1a1a2e')

  // Ajustar tamaño si el nombre es muy largo (máximo 85% del ancho de página)
  const maxWidth = pageWidth * 0.85
  let fontSize = baseFontSize
  while (nombreFont.widthOfTextAtSize(nombre, fontSize) > maxWidth && fontSize > 16) {
    fontSize -= 2
  }

  const textWidth = nombreFont.widthOfTextAtSize(nombre, fontSize)
  const xPos = (pageWidth - textWidth) / 2
  const yPos = pageHeight * (1 - (curso.nombre_posicion_y || 61) / 100)

  page.drawText(nombre, { x: xPos, y: yPos, size: fontSize, font: nombreFont, color })

  const tieneRegistroOficial =
    participante.hoja || participante.libro || participante.folio_oficial

  if (tieneRegistroOficial) {
    // Solo dibujamos los 3 valores; la etiqueta "Registro oficial:" ya viene en la plantilla
    const rightMargin = pageWidth * 0.07
    const baseY = pageHeight * 0.17
    const lineHeight = 12
    const textSize = 9
    const labelColor = rgb(0.1, 0.1, 0.1)

    const lineas = [
      `Hoja: ${participante.hoja ?? '—'}`,
      `Libro: ${participante.libro ?? '—'}`,
      `Folio: ${participante.folio_oficial ?? '—'}`,
    ]

    lineas.forEach((linea, i) => {
      const text = sanitizarTextoPdf(linea)
      const w = folioFont.widthOfTextAtSize(text, textSize)
      page.drawText(text, {
        x: pageWidth - rightMargin - w,
        y: baseY - i * lineHeight,
        size: textSize,
        font: folioFont,
        color: labelColor,
      })
    })
  } else {
    // Folio interno discreto en esquina inferior derecha (comportamiento previo)
    const folioText = sanitizarTextoPdf(`Folio: ${participante.folio}`)
    const folioSize = 8
    const folioWidth = folioFont.widthOfTextAtSize(folioText, folioSize)
    page.drawText(folioText, {
      x: pageWidth - folioWidth - 20,
      y: 15,
      size: folioSize,
      font: folioFont,
      color: rgb(0.5, 0.5, 0.5),
    })
  }
}

export async function generarConstanciaPDF(
  participante: Participante,
  curso: Curso
): Promise<Uint8Array> {
  if (!curso.plantilla_url) {
    throw new Error('El curso no tiene plantilla configurada')
  }

  const pdfDoc = await PDFDocument.create()
  const imagen = await descargarPlantilla(pdfDoc, curso.plantilla_url)
  const nombreFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const folioFont = await pdfDoc.embedFont(StandardFonts.Helvetica)

  dibujarPagina(pdfDoc, imagen, nombreFont, folioFont, participante, curso)

  return await pdfDoc.save()
}

export async function generarConstanciasMasivasPDF(
  participantes: Participante[],
  curso: Curso
): Promise<Uint8Array> {
  if (!curso.plantilla_url) {
    throw new Error('El curso no tiene plantilla configurada')
  }
  if (participantes.length === 0) {
    throw new Error('No hay participantes para generar constancias')
  }

  const pdfDoc = await PDFDocument.create()
  // Plantilla y fuentes se cargan una sola vez y se reutilizan en cada página
  const imagen = await descargarPlantilla(pdfDoc, curso.plantilla_url)
  const nombreFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const folioFont = await pdfDoc.embedFont(StandardFonts.Helvetica)

  for (const participante of participantes) {
    dibujarPagina(pdfDoc, imagen, nombreFont, folioFont, participante, curso)
  }

  return await pdfDoc.save()
}
