import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password, adminCode } = await request.json()

    // Verificar código admin
    if (adminCode !== process.env.ADMIN_CODE) {
      return NextResponse.json(
        { error: 'Código de administrador incorrecto' },
        { status: 401 }
      )
    }

    // Usar service role para verificar y actualizar rol
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    )

    // Buscar usuario por email
    const { data: users } = await supabase.auth.admin.listUsers()
    const user = users?.users.find(u => u.email === email)

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Asignar rol admin si no lo tiene
    await supabase
      .from('profiles')
      .update({ rol: 'admin' })
      .eq('id', user.id)

    return NextResponse.json({ success: true })

  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
