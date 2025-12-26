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
import { UserGroupIcon, MapPinIcon, CalendarIcon } from '@heroicons/react/24/outline'; // Added Icons

import CreateMatchModal from '@/components/CreateMatchModal';
import CreateManualMatchModal from '@/components/CreateManualMatchModal';
import EditMatchModal from '@/components/EditMatchModal';
import MatchDetailModal from '@/components/MatchDetailModal';
import ManagerMatchDetailModal from '@/components/ManagerMatchDetailModal';

export default function ManagerPage() {
  const { member, loading } = useAuth();
  const router = useRouter();

  // State
  const [templates, setTemplates] = useState<MatchTemplate[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);

  // Modals
  const [selectedTemplate, setSelectedTemplate] = useState<MatchTemplate | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false); // Template Match Modal
  const [isManualModalOpen, setIsManualModalOpen] = useState(false); // Manual Match Modal
  const [editingMatch, setEditingMatch] = useState<Match | null>(null); // Edit Modal
  const [viewingMatch, setViewingMatch] = useState<Match | null>(null); // Detail Modal

  // 1. Fetch Data
  useEffect(() => {
    if (!loading && member) {
      if (!member.roles.includes('ADMIN') && !member.roles.includes('MANAGER')) {
        alert('관리자 권한이 필요합니다.');
        router.push('/dashboard');
        return;
      }

      getMatchTemplates(1).then(setTemplates).catch(console.error);
      getUpcomingMatches(1).then(setMatches).catch(console.error);
    }
  }, [loading, member, router]);

  if (loading)
    return (
      <div className="p-6 flex justify-center">
        <div className="animate-spin h-6 w-6 border-2 border-gray-900 rounded-full border-t-transparent"></div>
      </div>
    );

  // Actions
  const handleDeleteMatch = async (id: number) => {
    if (!confirm('정말로 이 매치를 삭제하시겠습니까? 복구할 수 없습니다.')) return;
    try {
      await deleteMatch(id);
      setMatches((prev) => prev.filter((m) => m.id !== id));
      alert('삭제되었습니다.');
    } catch (e) {
      alert('삭제 실패');
    }
  };

  const handleOpenTemplateModal = (template: MatchTemplate) => {
    setSelectedTemplate(template);
    setIsModalOpen(true);
  };

  const refreshMatches = async () => {
    try {
      const freshMatches = await getUpcomingMatches(1);
      setMatches(freshMatches);

      // 🔄 SYNC LOGIC: 
      // If a modal is open (viewingMatch exists), find its updated version 
      // in the fresh list and update the modal's data too.
      if (viewingMatch) {
        const updatedMatch = freshMatches.find((m) => m.id === viewingMatch.id);
        if (updatedMatch) {
          setViewingMatch(updatedMatch);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white px-6 py-4 shadow-sm mb-6 sticky top-0 z-20">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">운영진 대시보드</h1>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-sm text-gray-500 hover:text-blue-600 font-medium"
          >
            ← 나가기
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-6 space-y-8">
        {/* 1. MATCH CREATION SECTION */}
        <section className="space-y-4">
          <div className="flex justify-between items-end border-b border-gray-200 pb-2">
            <h2 className="text-lg font-bold text-gray-800">새 매치 생성</h2>
          </div>

          {/* Quick Manual Create Button */}
          <div
            className="bg-gray-900 p-5 rounded-2xl shadow-lg text-white flex justify-between items-center group cursor-pointer hover:bg-gray-800 transition-colors"
            onClick={() => setIsManualModalOpen(true)}
          >
            <div>
              <h3 className="font-bold text-lg">스페셜 매치 생성</h3>
              <p className="text-gray-400 text-xs">템플릿 없이 직접 날짜/시간 설정</p>
            </div>
            <div className="bg-white text-black w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform">
              +
            </div>
          </div>

          {/* Template List (Horizontal Scroll if many, or Stacked) */}
          <div className="space-y-3">
            <p className="text-xs text-gray-500 font-bold ml-1">템플릿으로 생성하기</p>
            {templates.length === 0 ? (
              <div className="text-center py-6 text-gray-400 bg-white rounded-xl border border-dashed text-sm">
                등록된 템플릿이 없습니다.
              </div>
            ) : (
              templates.map((t) => (
                <div
                  key={t.id}
                  className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center"
                >
                  <div>
                    <div className="font-bold text-gray-900">{t.name}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                      <span>{formatSchedule(t.day_of_week, t.start_time)}</span>
                      <span>•</span>
                      <span>{t.location}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenTemplateModal(t)}
                    className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"
                  >
                    생성
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        {/* 2. SCHEDULED MATCHES MANAGEMENT */}
        <section className="space-y-4">
          <div className="flex justify-between items-end border-b border-gray-200 pb-2">
            <h2 className="text-lg font-bold text-gray-800">매치 관리 및 현황</h2>
            <span className="text-xs text-gray-500">{matches.length}개 예정</span>
          </div>

          <div className="space-y-4">
            {matches.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-10 bg-white rounded-xl">
                예정된 경기가 없습니다.
              </p>
            ) : (
              matches.map((match) => {
                // 📊 Calculate Roster Counts inside the loop
                const attending =
                  match.participations?.filter((p) => p.status === 'ATTENDING').length || 0;
                const absent =
                  match.participations?.filter((p) => p.status === 'ABSENT').length || 0;
                const pending =
                  match.participations?.filter((p) => p.status === 'PENDING').length || 0;

                return (
                  <div
                    key={match.id}
                    className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {/* A. Info Body (Click -> Opens Detail) */}
                    <div
                      onClick={() => setViewingMatch(match)}
                      className="p-5 cursor-pointer active:bg-gray-50"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-bold text-gray-900 text-lg">{match.name}</h4>
                        <span
                          className={`text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wide ${
                            match.status === 'RECRUITING'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {match.status}
                        </span>
                      </div>

                      <div className="text-sm text-gray-600 space-y-1 mb-4">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4 text-gray-400" />
                          <span>{formatKST(match.start_time)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPinIcon className="w-4 h-4 text-gray-400" />
                          <span>{match.location}</span>
                        </div>
                      </div>

                      {/* 📊 NEW: Roster Summary Bar */}
                      <div className="flex rounded-lg overflow-hidden text-center text-xs font-bold border border-gray-100">
                        <div className="flex-1 py-2 bg-green-50 text-green-700">
                          <span className="block text-sm">{attending}</span>
                          참석
                        </div>
                        <div className="flex-1 py-2 bg-red-50 text-red-700 border-l border-gray-100">
                          <span className="block text-sm">{absent}</span>
                          불참
                        </div>
                        <div className="flex-1 py-2 bg-yellow-50 text-yellow-700 border-l border-gray-100">
                          <span className="block text-sm">{pending}</span>
                          미정
                        </div>
                      </div>
                    </div>

                    {/* B. Action Footer */}
                    <div className="grid grid-cols-2 border-t border-gray-100 divide-x divide-gray-100 bg-gray-50">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingMatch(match);
                        }}
                        className="py-3 text-gray-600 font-bold text-sm hover:bg-white hover:text-blue-600 transition-colors"
                      >
                        ✏️ 수정
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteMatch(match.id);
                        }}
                        className="py-3 text-gray-600 font-bold text-sm hover:bg-white hover:text-red-500 transition-colors"
                      >
                        🗑️ 삭제
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>

      {/* --- MODALS --- */}

      {/* 1. Template Match Creator */}
      {selectedTemplate && (
        <CreateMatchModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          templateId={selectedTemplate.id}
          templateName={selectedTemplate.name}
          dayOfWeek={selectedTemplate.day_of_week}
          // Note: Add an onSuccess prop to CreateMatchModal to trigger refreshMatches()
          onSuccess={() => {
            setIsModalOpen(false);
            refreshMatches();
          }}
        />
      )}

      {/* 2. Manual Match Creator */}
      <CreateManualMatchModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        clubId={1}
        onSuccess={() => {
          setIsManualModalOpen(false);
          refreshMatches();
        }}
      />

      {/* 3. Editor */}
      {editingMatch && (
        <EditMatchModal
          isOpen={!!editingMatch}
          onClose={() => setEditingMatch(null)}
          match={editingMatch}
          onUpdate={refreshMatches}
        />
      )}

      {/* 4. Viewer (Detail) - SWITCHED TO MANAGER VERSION */}
      {viewingMatch && (
        <ManagerMatchDetailModal
          isOpen={!!viewingMatch}
          onClose={() => setViewingMatch(null)}
          match={viewingMatch}
          onUpdate={() => {
            refreshMatches(); 
          }}
        />
      )}
    </div>
  );
}
