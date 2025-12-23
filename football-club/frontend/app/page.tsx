'use client'
import { useAuth } from '@/components/AuthProvider'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const { signInWithKakao, user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard') 
    }
  }, [user, loading, router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-sm w-full">
        {/* Changed to Korean */}
        <h1 className="text-2xl font-bold mb-6 text-gray-900">신사에이스 FC ⚽</h1>
        <p className="mb-8 text-gray-500">
          매치 일정 관리 및 참석 투표 시스템
        </p>
        
        <button
          onClick={signInWithKakao}
          disabled={loading}
          className="w-full bg-[#FEE500] hover:bg-[#FDD835] text-black font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all"
        >
          {loading ? '로딩 중...' : '카카오로 3초 만에 시작하기'}
        </button>
      </div>
    </div>
  )
}