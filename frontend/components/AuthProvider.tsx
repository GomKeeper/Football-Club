'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { syncUserWithBackend, Member } from '@/lib/api'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  user: any | null; // Supabase User
  member: Member | null; // Our Backend Member
  loading: boolean;
  signInWithKakao: () => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [member, setMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  const signInWithKakao = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
        // ⚡️ FIX: Use queryParams to strictly override the scope string
        queryParams: {
          scope: 'profile_nickname profile_image', 
          prompt: 'login', // Optional: Forces the consent screen to appear again
        },
      },
    })
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setMember(null)
    router.push('/login')
  }

  useEffect(() => {
    // 1. Check active session
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        setUser(session.user)
        // 2. Sync with Railway Backend
        const dbMember = await syncUserWithBackend(session.user)
        setMember(dbMember)
      }
      setLoading(false)
    }

    initAuth()

    // 3. Listen for changes (e.g. sign out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user)
        // Avoid double-syncing if we already have the member
        if (!member) { 
             const dbMember = await syncUserWithBackend(session.user)
             setMember(dbMember)
        }
      } else {
        setUser(null)
        setMember(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, member, loading, signInWithKakao, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}