// Configuración institucional derivada de variables de entorno.
// Permite desplegar este mismo repo para distintas organizaciones cambiando
// solo las variables de entorno (ver .env.example). Cada valor tiene un default
// razonable para que el proyecto no truene si la variable falta.

// Nombre de la organización / sistema. Se usa en cliente y servidor, por eso
// lleva el prefijo NEXT_PUBLIC_.
export const ORG_NAME =
  process.env.NEXT_PUBLIC_ORG_NAME ?? 'Sistema de Constancias'

// Ruta o URL del logo institucional. Permite que cada despliegue use su propio
// logo. Puede ser una ruta dentro de /public (ej: /logo-v2.png) o una URL.
export const LOGO_URL = process.env.NEXT_PUBLIC_LOGO_URL ?? '/logo.png'

// Colores de marca. Se inyectan en runtime como CSS custom properties desde el
// layout, sobreescribiendo los defaults de globals.css.
export const BRAND_COLORS = {
  red: process.env.NEXT_PUBLIC_BRAND_RED ?? '#9e2349',
  redDark: process.env.NEXT_PUBLIC_BRAND_RED_DARK ?? '#691b32',
  gold: process.env.NEXT_PUBLIC_BRAND_GOLD ?? '#cf9a46',
  goldLight: process.env.NEXT_PUBLIC_BRAND_GOLD_LIGHT ?? '#f5d778',
}
