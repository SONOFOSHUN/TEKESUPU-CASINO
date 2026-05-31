'use client'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/lib/types'

const AUTH_TIMEOUT_MS = 7000

function withTimeout<T>(promise: PromiseLike<T>, message: string) {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(message)), AUTH_TIMEOUT_MS)

    promise.then(
      value => {
        clearTimeout(timeout)
        resolve(value)
      },
      error => {
        clearTimeout(timeout)
        reject(error)
      }
    )
  })
}

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
    const supabase = createClient()

    try {
      const { data: { user }, error: userError } = await withTimeout(
        supabase.auth.getUser(),
        'La verificacion de sesion demoro demasiado'
      )

      if (userError || !user) {
        await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined)
        setProfile(null)
        setIsAuthenticated(false)
        return
      }

      setIsAuthenticated(true)

      const { data } = await withTimeout(
        supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single(),
        'La carga del perfil demoro demasiado'
      )

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
      await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined)
      setProfile(null)
      setIsAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const supabase = createClient()

    // Run outside the auth callback tick to avoid stale-session deadlocks.
    const initialLoad = setTimeout(() => {
      void fetchProfile()
    }, 0)

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          setProfile(null)
          setIsAuthenticated(false)
          setLoading(false)
        } else if (session && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED')) {
          setTimeout(() => {
            void fetchProfile()
          }, 0)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
      clearTimeout(initialLoad)
    }
  }, [fetchProfile])

  return (
    <AuthContext.Provider value={{ profile, loading, isAuthenticated, refresh: fetchProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
