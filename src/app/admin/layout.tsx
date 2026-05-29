import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminSidebar from '@/components/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('rol').eq('id', user.id).single()

  if (!profile || (profile.rol !== 'admin' && profile.rol !== 'inversor')) {
    redirect('/dashboard')
  }

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'var(--casino-dark)' }}>
      <AdminSidebar />
      <div style={{ flex:1, padding:'clamp(70px,10vw,84px) 16px 48px', overflowY:'auto', minWidth:0 }}>
        {children}
      </div>
    </div>
  )
}
