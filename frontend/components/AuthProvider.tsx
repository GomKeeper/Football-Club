'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { loginWithBackend, getMe, type Member } from '@/lib/api'
import Script from 'next/script'

declare global {
  interface Window {
    Kakao: any;
  }
}

interface AuthContextType {
  member: Member | null;
  loading: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [member, setMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // 1. Session Check (Runs once on mount)
  useEffect(() => {
    async function loadUser() {
      try {
        const existingMember = await getMe();
        if (existingMember) setMember(existingMember);
        else localStorage.removeItem('token');
      } catch (e) {
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  // 2. 🚦 THE TRAFFIC CONTROLLER (New Auto-Redirect Logic)
  useEffect(() => {
    // If user IS logged in AND they are on the Login Page ('/')
    if (member && pathname === '/') {
        console.log("🚀 Redirecting to Dashboard...");
        router.push('/dashboard');
    }
  }, [member, pathname, router]);

  // 3. The Initialization Logic
  const initKakao = () => {
    // Debug Log (Optional, remove in production)
    console.log("🔑 Env Key Check:", process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID ? "Exists" : "MISSING");

    if (window.Kakao && !window.Kakao.isInitialized()) {
      // 👇 Safety check using your Vercel/Local variable name
      if (!process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID) {
        console.error("❌ NEXT_PUBLIC_KAKAO_CLIENT_ID is missing in .env.local");
        return;
      }
      
      // 👇 Initialize with the correct key
      window.Kakao.init(process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID);
      console.log("✅ Kakao SDK Loaded & Initialized");
    }
  };

// 3. Login Function
const login = () => {
  // Retry init if needed
  if (!window.Kakao || !window.Kakao.isInitialized()) {
    initKakao();
  }

  if (!window.Kakao || !window.Kakao.isInitialized()) {
    alert("Kakao SDK not ready. Please refresh.");
    return;
  }

  // 👇 This function (popup) is guaranteed to exist in the V1 SDK
  window.Kakao.Auth.login({
    success: () => {
      window.Kakao.API.request({
        url: '/v2/user/me',
        success: async (res: any) => {
          try {
            setLoading(true);
            const kakaoAccount = res.kakao_account;
            
            const payload = {
              kakao_id: res.id.toString(),
              name: kakaoAccount.profile?.nickname || 'Unknown',
              email: kakaoAccount.email || `no-email-${res.id}@example.com`,
            };

            await loginWithBackend(payload);
            const realMember = await getMe();
            setMember(realMember);
            router.push('/dashboard'); 
            
          } catch (error) {
            console.error("Login Failed:", error);
            alert("로그인 처리 실패");
          } finally {
            setLoading(false);
          }
        },
        fail: (err: any) => {
          console.error("API Error:", err);
          setLoading(false);
        },
      });
    },
    fail: (err: any) => {
      console.error("Login Error:", err);
    },
  });
};

const logout = () => {
  localStorage.removeItem('token');
  setMember(null);
  router.push('/');
};

return (
  <AuthContext.Provider value={{ member, loading, login, logout }}>
    {/* 👇 FIXED: Using the V1 Legacy SDK URL */}
    <Script
      src="https://developers.kakao.com/sdk/js/kakao.min.js"
      strategy="afterInteractive"
      onLoad={initKakao} 
    />
    {children}
  </AuthContext.Provider>
)
}

export const useAuth = () => {
const context = useContext(AuthContext)
if (!context) throw new Error('useAuth must be used within an AuthProvider')
return context
}