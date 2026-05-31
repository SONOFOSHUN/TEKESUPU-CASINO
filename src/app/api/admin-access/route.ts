import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password, adminCode } = await request.json()

    // 1. Verificar código admin primero
    if (adminCode !== process.env.ADMIN_CODE) {
      return NextResponse.json(
        { error: 'Código de administrador incorrecto' },
        { status: 401 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    )

    // 2. Buscar usuario por email usando paginación suficiente
    const { data: users } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
    const user = users?.users.find(u => u.email === email)

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // 3. Verificar credenciales antes de promover
    const { createClient: createBrowserClient } = await import('@supabase/supabase-js')
    const anonClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { error: signInError } = await anonClient.auth.signInWithPassword({ email, password })

    if (signInError) {
      return NextResponse.json(
        { error: 'Credenciales incorrectas' },
        { status: 401 }
      )
    }

    // 4. Solo después de verificar todo, promover a admin
    await supabase.from('profiles').update({ rol: 'admin' }).eq('id', user.id)

    return NextResponse.json({ success: true })

  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
