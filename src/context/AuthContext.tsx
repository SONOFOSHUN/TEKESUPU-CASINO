'use client'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/lib/types'

interface AuthContextType {
  profile: Profile | null
  loading: boolean
  isAuthenticated: boolean
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  profile: null,
  loading: true,
  isAuthenticated: false,
  refresh: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const fetchProfile = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        setProfile(null)
        setIsAuthenticated(false)
        return
      }

      setIsAuthenticated(true)

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!data) {
        // Perfil no existe — intenta crearlo desde user_metadata (fallback de registro fallido)
        const meta = user.user_metadata || {}
        const { data: created, error: createError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            nombre: meta.nombre || user.email?.split('@')[0] || 'Usuario',
            dni: meta.dni || '00000000',
            rol: 'usuario',
            tiene_ludopatia: false,
            saldo_virtual: 1000,
          }, { onConflict: 'id' })
          .select()
          .single()
        if (createError) {
          console.error('Profile auto-create failed:', createError.message)
        }
        setProfile(created ?? null)
      } else {
        setProfile(data)
      }
    } catch (err) {
      console.error('AuthContext error:', err)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const supabase = createClient()

    // Safety timeout — si fetchProfile cuelga, liberar el loading igualmente
    const timeout = setTimeout(() => setLoading(false), 8000)

    void fetchProfile().finally(() => clearTimeout(timeout)) // eslint-disable-line react-hooks/set-state-in-effect

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await fetchProfile()
        } else if (event === 'SIGNED_OUT') {
          setProfile(null)
          setIsAuthenticated(false)
          setLoading(false)
        } else if (event === 'TOKEN_REFRESHED') {
          await fetchProfile()
        }
      }
    )

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [fetchProfile])

  return (
    <AuthContext.Provider value={{ profile, loading, isAuthenticated, refresh: fetchProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
