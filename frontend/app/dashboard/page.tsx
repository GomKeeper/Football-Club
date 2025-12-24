'use client'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getUpcomingMatches, Match } from '@/lib/api'
import MatchCard from '@/components/MatchCard'

export default function DashboardPage() {
  const { user, member, loading, signOut } = useAuth()
  const router = useRouter()
  const [matches, setMatches] = useState<Match[]>([]) // State for matches

  // 🛡️ Route Protection: Kick out unauthorized users
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/') // Not logged in -> Go to Login
      } else if (member && member.status !== 'ACTIVE') {
        router.push('/pending') // Not active -> Go to Waiting Room
      }
    }
  }, [user, member, loading, router])

  useEffect(() => {
    if (!loading && member) {
      //TODO: Fetch Club 1 Matches (Hardcoded for now)
      getUpcomingMatches(1)
        .then(setMatches)
        .catch(console.error)
    }
  }, [loading, member])

  if (loading || !member) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-gray-500 animate-pulse">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      {/* --- Top Navigation --- */}
      <nav className="bg-white px-6 py-4 shadow-sm flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-900">신사에이스 FC</h1>
          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
            2025 시즌
          </span>
        </div>
        <button 
          onClick={signOut}
          className="text-sm text-gray-500 hover:text-red-500 transition-colors"
        >
          로그아웃
        </button>
      </nav>

      {/* --- Main Content --- */}
      <main className="max-w-md mx-auto p-6 space-y-6">
        
        {/* 1. Welcome Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm flex items-center gap-4">
          <img 
            src={member.avatar_url || "https://placehold.co/100"} 
            alt="Profile" 
            className="w-16 h-16 rounded-full border-2 border-gray-100"
          />
          <div>
            <p className="text-gray-500 text-sm">안녕하세요 👋</p>
            <h2 className="text-xl font-bold text-gray-900">{member.name}님</h2>
            <p className="text-xs text-gray-400 mt-1">
              등급: {member.roles.includes('admin') ? '운영진' : '정회원'}
            </p>
          </div>
        </div>

        {/* 2. Upcoming Match Section */}
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-gray-800 px-1">📅 다가오는 매치</h3>
          
          {matches.length === 0 ? (
            // Empty State
            <div className="bg-white p-8 rounded-2xl shadow-sm text-center border border-dashed border-gray-300">
              <div className="text-4xl mb-3">⚽️</div>
              <p className="text-gray-600 font-medium">예정된 매치가 없습니다</p>
              <p className="text-gray-400 text-sm mt-1">
                새로운 일정이 등록되면 알림을 드릴게요!
              </p>
            </div>
          ) : (
            // Matches List
            <div className="grid gap-4">
              {matches.map(match => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          )}
        </div>

        {/* 3. Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button className="bg-white p-4 rounded-xl shadow-sm text-center active:scale-95 transition-transform">
            <span className="block text-2xl mb-1">📊</span>
            <span className="text-sm font-medium text-gray-700">나의 기록</span>
          </button>
          <button className="bg-white p-4 rounded-xl shadow-sm text-center active:scale-95 transition-transform">
            <span className="block text-2xl mb-1">⚙️</span>
            <span className="text-sm font-medium text-gray-700">설정</span>
          </button>
        </div>

        {/* Manager Section */}
        {(member.roles.includes('ADMIN') || member.roles.includes('MANAGER')) && (
        <div className="col-span-2">
          <button 
            onClick={() => router.push('/manager')}
            className="bg-black text-white p-4 rounded-xl shadow-sm text-center active:scale-95 transition-transform col-span-2"
          >
            <span className="block text-xl mb-1">🛡️</span>
            <span className="text-sm font-medium">관리자 모드 접속</span>
          </button>
        </div>
        )}
      </main>
    </div>
  )
}