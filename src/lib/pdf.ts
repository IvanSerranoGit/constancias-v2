import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import type { Curso, Participante } from '@/types'

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  return rgb(r, g, b)
}

export async function generarConstanciaPDF(
  participante: Participante,
  curso: Curso
): Promise<Uint8Array> {
  if (!curso.plantilla_url) {
    throw new Error('El curso no tiene plantilla configurada')
  }

  // Descargar imagen de plantilla
  const plantillaResponse = await fetch(curso.plantilla_url)
  const plantillaBytes = await plantillaResponse.arrayBuffer()

  // Crear PDF
  const pdfDoc = await PDFDocument.create()

  // Embedir imagen (detectar formato)
  const isJpg =
    curso.plantilla_url.toLowerCase().endsWith('.jpg') ||
    curso.plantilla_url.toLowerCase().endsWith('.jpeg')
  const imagen = isJpg
    ? await pdfDoc.embedJpg(plantillaBytes)
    : await pdfDoc.embedPng(plantillaBytes)

  // Crear página con dimensiones de la imagen (landscape)
  const { width, height } = imagen.scale(1)
  const pageWidth = 792 // Letter landscape
  const pageHeight = pageWidth * (height / width)
  const page = pdfDoc.addPage([pageWidth, pageHeight])

  // Dibujar imagen de fondo
  page.drawImage(imagen, {
    x: 0,
    y: 0,
    width: pageWidth,
    height: pageHeight,
  })

  // Configurar fuente para el nombre
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const nombre = participante.nombre.toUpperCase()
  const fontSize = curso.nombre_font_size || 48
  const color = hexToRgb(curso.nombre_color || '#1a1a2e')

  // Calcular posición centrada
  const textWidth = font.widthOfTextAtSize(nombre, fontSize)
  const xPos = (pageWidth - textWidth) / 2
  const yPos = pageHeight * (1 - (curso.nombre_posicion_y || 55) / 100)

  // Dibujar nombre
  page.drawText(nombre, {
    x: xPos,
    y: yPos,
    size: fontSize,
    font,
    color,
  })

  // Dibujar folio (esquina inferior derecha, discreto)
  const folioFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const folioText = `Folio: ${participante.folio}`
  const folioSize = 8
  const folioWidth = folioFont.widthOfTextAtSize(folioText, folioSize)
  page.drawText(folioText, {
    x: pageWidth - folioWidth - 20,
    y: 15,
    size: folioSize,
    font: folioFont,
    color: rgb(0.5, 0.5, 0.5),
  })

  return await pdfDoc.save()
}
