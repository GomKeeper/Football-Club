'use client'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function PendingPage() {
  const { member, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // If they are suddenly approved, auto-redirect to dashboard
    if (member?.status === 'ACTIVE') {
      router.push('/dashboard')
    }
  }, [member, router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md text-center">
        <div className="text-6xl mb-4">⏳</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">가입 승인 대기 중</h1>
        <p className="text-gray-600 mb-6">
          {member?.name}님, 가입 신청이 접수되었습니다.<br/>
          운영진이 확인 후 승인하면 서비스를 이용하실 수 있습니다.
        </p>
        
        <div className="bg-yellow-50 p-4 rounded-lg mb-6 text-sm text-yellow-800">
          Tip: 빠른 승인을 위해 운영진에게 카톡을 남겨주세요!
        </div>

        <button 
          onClick={signOut}
          className="text-gray-400 hover:text-gray-600 underline text-sm"
        >
          로그아웃
        </button>
      </div>
    </div>
  )
}