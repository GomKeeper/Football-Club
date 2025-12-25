'use client'
import { useAuth } from '@/components/AuthProvider'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const { login, loading } = useAuth();
  const router = useRouter()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-white">
      <div className="text-center space-y-4 mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">신사에이스 FC 매치 관리 시스템</h1>
        <p className="text-gray-500">Football Club Management System</p>
      </div>

      <button
        onClick={login} // 👈 Connect the new function
        disabled={loading}
        className="bg-[#FEE500] text-[#000000] px-8 py-4 rounded-xl font-bold text-lg hover:bg-[#FDD835] transition-colors flex items-center gap-2 shadow-sm"
      >
        {/* Kakao Icon SVG */}
        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
          <path d="M12 3C6.48 3 2 6.48 2 10.76c0 2.79 1.86 5.28 4.74 6.75-.24.87-.87 3.17-1 3.65-.16.56.2.56.42.4 2.8-1.92 5.6-3.86 6.04-4.16.6.09 1.21.14 1.83.14 5.52 0 10-3.48 10-7.76S17.52 3 12 3z" />
        </svg>
        {loading ? '로딩 중...' : '카카오로 시작하기'}
      </button>
    </main>
  );
}