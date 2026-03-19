'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { auth, onAuthStateChanged, signOut, type User } from '@/lib/firebase'
import { syncUser, getMe } from '@/lib/api'
import type { UserProfile } from '@/lib/types'

interface AuthContextValue {
  firebaseUser: User | null
  profile: UserProfile | null
  loading: boolean
  busy: boolean
  refreshProfile: () => Promise<void>
  logout: () => Promise<void>
}

const defaultValue: AuthContextValue = {
  firebaseUser:   null,
  profile:        null,
  loading:        true,  // true hasta que Firebase resuelva
  busy:           false,
  refreshProfile: async () => {},
  logout:         async () => {},
}

const AuthContext = createContext<AuthContextValue>(defaultValue)

export function useAuth(): AuthContextValue {
  return useContext(AuthContext)
}

interface AuthProviderProps {
  children: ReactNode
  refCode?: string
}

export function AuthProvider({ children, refCode }: AuthProviderProps) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null)
  const [profile, setProfile]           = useState<UserProfile | null>(null)
  const [loading, setLoading]           = useState(true)
  const [busy, setBusy]                 = useState(false)

  const refreshProfile = useCallback(async () => {
    try {
      const res = await getMe()
      setProfile(res.data)
    } catch {
      setProfile(null)
    }
  }, [])

  const logout = useCallback(async () => {
    await signOut()
    setProfile(null)
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user)

      if (user) {
        setBusy(true)
        try {
          const res = await syncUser(refCode)
          setProfile(res.data)
        } catch {
          // Si el backend falla, intentar getMe como fallback
          try {
            await refreshProfile()
          } catch {
            // Si también falla getMe, dejamos profile en null
            // pero igual liberamos el loading para que la UI no quede trabada
            setProfile(null)
          }
        } finally {
          setBusy(false)
        }
      } else {
        // Usuario no autenticado — limpiar perfil
        setProfile(null)
      }

      // SIEMPRE liberar loading, sin importar si el backend falló o no
      setLoading(false)
    })

    return unsubscribe
  }, [refCode, refreshProfile])

  return (
    <AuthContext.Provider
      value={{ firebaseUser, profile, loading, busy, refreshProfile, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}
