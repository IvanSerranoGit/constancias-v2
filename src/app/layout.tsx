import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { BRAND_COLORS, ORG_NAME } from '@/lib/config'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: ORG_NAME,
  description: 'Genera y descarga constancias de participación para webinarios',
}

// Override de los colores de marca en runtime desde variables de entorno.
// :root:root duplica la especificidad para ganar a los defaults de globals.css
// sin depender del orden en que se inserten los estilos.
const brandColorsStyle = `:root:root{--color-brand-red:${BRAND_COLORS.red};--color-brand-red-dark:${BRAND_COLORS.redDark};--color-brand-gold:${BRAND_COLORS.gold};--color-brand-gold-light:${BRAND_COLORS.goldLight};}`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <head>
        <style dangerouslySetInnerHTML={{ __html: brandColorsStyle }} />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>{children}</body>
    </html>
  )
}
