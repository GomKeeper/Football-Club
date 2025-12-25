'use client';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getUpcomingMatches, Match, Participation, getMyParticipations } from '@/lib/api';
import MatchCard from '@/components/MatchCard';
import MatchDetailModal from '@/components/MatchDetailModal';
import { formatKST } from '@/lib/utils';

const getMatchDisplayStatus = (match: Match) => {
  const now = new Date();
  const pollingStart = new Date(match.polling_start_at);
  const hardDeadline = new Date(match.hard_deadline_at);

  // Case A: Too Early (Voting hasn't started)
  if (now < pollingStart) {
    return {
      label: '오픈 예정',
      color: 'bg-gray-100 text-gray-500 border-gray-200',
      canVote: false,
      message: `${formatKST(match.polling_start_at)} 오픈`,
    };
  }

  // Case B: Too Late (Hard Deadline passed)
  if (now > hardDeadline) {
    return {
      label: '마감됨',
      color: 'bg-red-100 text-red-600 border-red-200',
      canVote: false,
      message: '투표가 종료되었습니다.',
    };
  }

  // Case C: Open (Recruiting)
  return {
    label: '모집중',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    canVote: true,
    message: null,
  };
};

export default function DashboardPage() {
  // 👇 1. DESTUCTURE ONLY WHAT EXISTS (Removed 'user')
  const { member, loading, logout } = useAuth();
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  const [voteMap, setVoteMap] = useState<Record<number, Participation>>({});

  // 🛡️ Effect 1: Route Protection (The Traffic Guard)
  useEffect(() => {
    // 🛑 STOP: Do nothing until AuthProvider finishes checking session
    if (loading) return;

    // 🛑 CHECK: If loading is done, but no member found -> Kick out
    if (!member) {
      router.replace('/'); // 'replace' is better than 'push' for redirects
      return;
    }

    // 🛑 CHECK: Member exists, but not active -> Waiting Room
    if (member.status !== 'ACTIVE') {
      router.push('/pending');
    }

    const fetchData = async () => {
      try {
        const [matchesData, myVotesData] = await Promise.all([
          getUpcomingMatches(1),
          getMyParticipations(), // Fetch existing votes from DB
        ]);

        setMatches(matchesData);

        // 👇 CONVERT ARRAY TO MAP (Key: match_id, Value: Participation)
        const initialMap: Record<number, Participation> = {};
        myVotesData.forEach((vote) => {
          initialMap[vote.match_id] = vote;
        });
        setVoteMap(initialMap);
      } catch (error) {
        console.error('Failed to load dashboard data', error);
      }
    };

    fetchData();
  }, [loading, member, router]);

  // ⏳ Render: Show Loading Screen while checking
  // This prevents the "Flash of Unauthenticated Content"
  if (loading || !member || member.status !== 'ACTIVE') {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          {/* Simple CSS Spinner */}
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
          <div className="text-gray-500 text-sm animate-pulse">
            {loading ? '로그인 확인 중...' : '페이지 이동 중...'}
          </div>
        </div>
      </div>
    );
  }

  const handleVoteUpdate = (newVote: Participation) => {
    setVoteMap((prev) => ({
      ...prev,
      [newVote.match_id]: newVote,
    }));
  };

  const handleMatchClick = (match: Match) => {
    const status = getMatchDisplayStatus(match);

    if (!status.canVote) {
      // Show alert if clicked when not open
      alert(status.message || '현재 투표할 수 없는 상태입니다.');
      return;
    }

    setSelectedMatch(match);
  };

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
          onClick={logout}
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
            src={member.avatar_url || 'https://placehold.co/100'}
            alt="Profile"
            className="w-16 h-16 rounded-full border-2 border-gray-100"
          />
          <div>
            <p className="text-gray-500 text-sm">안녕하세요 👋</p>
            <h2 className="text-xl font-bold text-gray-900">{member.name} 님</h2>
            <p className="text-xs text-gray-400 mt-1">
              등급: {member.roles.includes('ADMIN') ? '운영진' : '정회원'}
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
              <p className="text-gray-400 text-sm mt-1">새로운 일정이 등록되면 알림을 드릴게요!</p>
            </div>
          ) : (
            // Matches List
            <div className="grid gap-4">
              {matches.map((match) => {
                // 👇 Calculate status inside the loop
                const displayStatus = getMatchDisplayStatus(match);

                return (
                  <div
                    key={match.id}
                    onClick={() => handleMatchClick(match)}
                    // 👇 Apply Dimmed Effect if not voteable
                    className={`transition-opacity duration-200 ${
                      displayStatus.canVote
                        ? 'cursor-pointer'
                        : 'cursor-not-allowed opacity-60 grayscale-[0.5]'
                    }`}
                  >
                    <MatchCard
                      match={match}
                      myVote={voteMap[match.id]} // Pass the vote
                      status={displayStatus} // 👈 PASS THE BADGE INFO
                    />
                  </div>
                );
              })}
            </div>
          )}
          {/* Detail Modal */}
          {selectedMatch && (
            <MatchDetailModal
              isOpen={!!selectedMatch}
              onClose={() => setSelectedMatch(null)}
              match={selectedMatch}
              // ✅ PASS DATA DOWN
              initialVote={selectedMatch ? voteMap[selectedMatch.id] : null}
              // ✅ RECEIVE UPDATES UP
              onVoteUpdate={handleVoteUpdate}
            />
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
        {/* 👇 UPDATED: Manager Section (Full Width) */}
        {(member.roles.includes('ADMIN') || member.roles.includes('MANAGER')) && (
          <div className="pt-2">
            <button
              onClick={() => router.push('/manager')}
              className="w-full bg-gray-900 text-white p-4 rounded-xl shadow-md text-center active:scale-95 transition-transform flex items-center justify-center gap-2 hover:bg-gray-800"
            >
              <span className="text-xl">🛡️</span>
              <span className="text-base font-bold">관리자 모드 접속</span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
