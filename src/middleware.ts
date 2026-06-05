import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAdminRoute =
    request.nextUrl.pathname.startsWith('/admin') &&
    !request.nextUrl.pathname.startsWith('/admin/login')

  // Proteger rutas /admin (excepto /admin/login)
  if (isAdminRoute) {
    // 1) Debe haber sesión
    if (!user) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    // 2) La sesión debe pertenecer a un administrador autorizado
    const { data: admin } = await supabase
      .from('admins')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    if (!admin) {
      // Sesión válida pero sin autorización: cerrar sesión y mandar al login.
      // Reasignamos `response` al redirect para que signOut() escriba las
      // cookies de cierre de sesión sobre la respuesta que devolvemos.
      response = NextResponse.redirect(new URL('/admin/login', request.url))
      await supabase.auth.signOut()
      return response
    }
  }

  // Si ya está logueado y va a /admin/login, redirigir al dashboard
  if (request.nextUrl.pathname === '/admin/login' && user) {
    const adminUrl = new URL('/admin', request.url)
    return NextResponse.redirect(adminUrl)
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*'],
}
