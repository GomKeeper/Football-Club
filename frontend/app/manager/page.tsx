'use client';
import { useAuth } from '@/components/AuthProvider';
import {
  getMatchTemplates,
  getUpcomingMatches,
  deleteMatch,
  type MatchTemplate,
  type Match,
} from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { formatSchedule, formatKST } from '@/lib/utils';
import CreateMatchModal from '@/components/CreateMatchModal';
import CreateManualMatchModal from '@/components/CreateManualMatchModal';
import EditMatchModal from '@/components/EditMatchModal';
import MatchDetailModal from '@/components/MatchDetailModal';

export default function ManagerPage() {
  const { member, loading } = useAuth();
  const router = useRouter();
  const [templates, setTemplates] = useState<MatchTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<MatchTemplate | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [viewingMatch, setViewingMatch] = useState<Match | null>(null);

  // 1. Fetch Data
  useEffect(() => {
    if (!loading && member) {
      // Security Check: Kick out non-admins
      if (!member.roles.includes('ADMIN') && !member.roles.includes('MANAGER')) {
        alert('관리자 권한이 필요합니다.');
        router.push('/dashboard');
        return;
      }

      // Hardcoded Club ID 1 for now (We can make this dynamic later)
      getMatchTemplates(1)
        .then(setTemplates)
        .catch((err) => console.error(err));

      getUpcomingMatches(1)
        .then(setMatches)
        .catch((err) => console.error(err));
    }
  }, [loading, member, router]);

  if (loading) return <div className="p-6">로딩 중...</div>;

  const handleDeleteMatch = async (id: number) => {
    if (!confirm('정말로 이 매치를 삭제하시겠습니까? 복구할 수 없습니다.')) return;

    try {
      await deleteMatch(id);
      setMatches((prev) => prev.filter((m) => m.id !== id)); // Update UI immediately
      alert('삭제되었습니다.');
    } catch (e) {
      alert('삭제 실패');
    }
  };

  const handleOpenModal = (template: MatchTemplate) => {
    setSelectedTemplate(template);
    setIsModalOpen(true);
  };

  const refreshMatches = () => {
    getUpcomingMatches(1).then(setMatches).catch(console.error);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white px-6 py-4 shadow-sm mb-6 sticky top-0">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">운영진 대시보드</h1>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-sm text-gray-500 hover:text-blue-600"
          >
            ← 나가기
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-6 space-y-6">
        {/* Section Title */}
        <div className="flex justify-between items-end border-b pb-2">
          <h2 className="text-lg font-bold text-gray-800">매치 템플릿</h2>
          <span className="text-xs text-gray-500">정기 모임 설정</span>
        </div>

        {/* NEW: Action Section for Manual Match */}
        <div className="bg-gradient-to-r from-gray-900 to-black p-5 rounded-2xl shadow-lg text-white flex justify-between items-center">
          <div>
            <h3 className="font-bold text-lg">스페셜 매치</h3>
            <p className="text-gray-400 text-xs">템플릿 없이 직접 생성</p>
          </div>
          <button
            onClick={() => setIsManualModalOpen(true)}
            className="bg-white text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-200 transition-colors"
          >
            + 직접 생성
          </button>
        </div>

        {/* Templates List */}
        <div className="grid gap-4">
          {templates.length === 0 ? (
            <div className="text-center py-10 text-gray-400 bg-white rounded-xl border border-dashed">
              등록된 템플릿이 없습니다.
            </div>
          ) : (
            templates.map((t) => (
              <div
                key={t.id}
                className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg text-gray-900">{t.name}</h3>
                  <span className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-md font-medium">
                    {t.duration_minutes}분
                  </span>
                </div>

                <div className="space-y-1 text-sm text-gray-600 mb-4">
                  <p className="flex items-center gap-2">
                    <span className="text-gray-400">📅</span>
                    {formatSchedule(t.day_of_week, t.start_time)}
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-gray-400">📍</span>
                    {t.location}
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-50 flex gap-2">
                  <button className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-200">
                    수정
                  </button>
                  <button
                    onClick={() => handleOpenModal(t)}
                    className="flex-1 bg-black text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-800"
                  >
                    ⚡️ 경기 생성
                  </button>
                </div>
              </div>
            ))
          )}

          {selectedTemplate && (
            <CreateMatchModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              templateId={selectedTemplate.id}
              templateName={selectedTemplate.name}
              dayOfWeek={selectedTemplate.day_of_week}
            />
          )}
        </div>

        {/* Scheduled Matches Management */}
        <div className="border-t pt-8">
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-lg font-bold text-gray-800">예정된 매치 관리</h2>
            <span className="text-xs text-gray-500">{matches.length}개 예정</span>
          </div>

          <div className="space-y-4">
            {matches.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">예정된 경기가 없습니다.</p>
            ) : (
              matches.map((match) => (
                <div
                  key={match.id}
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
                >
                  {/* 1. Card Body (Click to View Details) */}
                  <div
                    onClick={() => setViewingMatch(match)} // Open Detail Modal
                    className="p-5 active:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span
                        className={`text-[10px] px-2 py-1 rounded font-bold ${
                          match.status === 'RECRUITING'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {match.status}
                      </span>
                      <span className="text-xs text-gray-400">상세보기 &gt;</span>
                    </div>
                    <h4 className="font-bold text-gray-900 text-lg mb-1">{match.name}</h4>
                    <p className="text-sm text-gray-500">
                      {formatKST(match.start_time)} <span className="text-gray-300">|</span>{' '}
                      {match.location}
                    </p>
                  </div>

                  {/* 2. BIG Action Buttons (Separate Row) */}
                  <div className="grid grid-cols-2 border-t border-gray-100 divide-x divide-gray-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent opening detail modal
                        setEditingMatch(match);
                      }}
                      className="py-4 text-blue-600 font-bold text-sm hover:bg-blue-50 active:bg-blue-100 transition-colors flex items-center justify-center gap-1"
                    >
                      ✏️ 수정
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent opening detail modal
                        handleDeleteMatch(match.id);
                      }}
                      className="py-4 text-red-500 font-bold text-sm hover:bg-red-50 active:bg-red-100 transition-colors flex items-center justify-center gap-1"
                    >
                      🗑️ 삭제
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Match Detail Modal */}
        {viewingMatch && (
          <MatchDetailModal
            isOpen={!!viewingMatch}
            onClose={() => setViewingMatch(null)}
            match={viewingMatch}
          />
        )}

        {/* Manual Match Modal */}
        <CreateManualMatchModal
          isOpen={isManualModalOpen}
          onClose={() => setIsManualModalOpen(false)}
          clubId={1} // Hardcoded for now
        />

        {/* Edit Match Modal */}
        {editingMatch && (
          <EditMatchModal
            isOpen={!!editingMatch}
            onClose={() => setEditingMatch(null)}
            match={editingMatch}
            onUpdate={refreshMatches}
          />
        )}

        {/* Floating Add Button */}
        <button className="fixed bottom-6 right-6 bg-blue-600 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-3xl hover:bg-blue-700 hover:scale-105 transition-all">
          +
        </button>
      </main>
    </div>
  );
}
