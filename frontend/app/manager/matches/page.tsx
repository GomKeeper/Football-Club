'use client';

import { useEffect, useState } from 'react';
import {
  type Match,
  type MatchTemplate,
  getUpcomingMatches,
  getMatchTemplates,
  deleteMatch, // 👈 Ensure this is exported from your API lib
} from '@/lib/api';
import ManagerMatchDetailModal from '@/components/ManagerMatchDetailModal';
import CreateMatchModal from '@/components/CreateMatchModal';
import CreateManualMatchModal from '@/components/CreateManualMatchModal';
import EditMatchModal from '@/components/EditMatchModal';
import { formatSchedule, getMatchDisplayStatus, formatKST } from '@/lib/utils';

export default function MatchesPage() {
  const [loading, setLoading] = useState(true);

  // Data State
  const [matches, setMatches] = useState<Match[]>([]);
  const [templates, setTemplates] = useState<MatchTemplate[]>([]);

  // Modal State
  const [selectedTemplate, setSelectedTemplate] = useState<MatchTemplate | null>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  // Detail/Edit State
  const [viewingMatch, setViewingMatch] = useState<Match | null>(null);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);

  const fetchData = async () => {
    try {
      const [matchesData, templatesData] = await Promise.all([
        getUpcomingMatches(1),
        getMatchTemplates(1),
      ]);
      setMatches(matchesData);
      setTemplates(templatesData);
    } catch (error) {
      console.error('Failed to load data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (e: React.MouseEvent, matchId: number) => {
    e.stopPropagation(); // Prevent opening the detail modal
    if (!confirm('정말로 이 경기를 삭제하시겠습니까? (복구 불가)')) return;

    try {
      await deleteMatch(matchId);
      alert('경기가 삭제되었습니다.');
      fetchData(); // Refresh list
    } catch (err) {
      alert('삭제 실패: ' + err);
    }
  };

  const handleEdit = (e: React.MouseEvent, match: Match) => {
    e.stopPropagation();
    setEditingMatch(match);
  };

  const getStats = (match: Match) => {
    // Safety check if participations is undefined
    const parts = match.participations || [];
    return {
      attending: parts.filter((p) => p.status === 'ATTENDING').length,
      pending: parts.filter((p) => p.status === 'PENDING').length,
      absent: parts.filter((p) => p.status === 'ABSENT').length,
    };
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20">
      {/* 🔹 HEADER */}
      <div>
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">경기 관리</h2>
        <p className="text-gray-500 mt-2">새로운 경기를 생성하거나 예정된 경기를 관리하세요.</p>
      </div>

      {/* 🔹 SECTION 1: CREATE SPECIAL MATCH */}
      <div
        onClick={() => setIsManualModalOpen(true)}
        className="w-full bg-gray-900 rounded-xl p-5 text-white shadow-md hover:shadow-lg hover:scale-[1.01] transition-all cursor-pointer flex items-center justify-between group"
      >
        <div className="flex items-center gap-4">
          <div className="bg-gray-800 w-12 h-12 rounded-full flex items-center justify-center group-hover:bg-blue-600 transition-colors">
            <span className="text-2xl font-bold">+</span>
          </div>
          <div>
            <h3 className="text-lg font-bold">스페셜 매치 생성</h3>
            <p className="text-gray-400 text-sm">템플릿 없이 직접 날짜와 시간을 설정</p>
          </div>
        </div>
      </div>

      {/* 🔹 SECTION 2: TEMPLATES (Full Width List) */}
      <div className="w-full bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wider flex items-center gap-2">
          ⚡ 템플릿 목록 (Saved Templates)
        </h3>

        {templates.length === 0 ? (
          <div className="text-center py-6 text-gray-400 border border-dashed rounded-lg bg-gray-50 text-sm">
            등록된 템플릿이 없습니다.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {templates.map((t) => (
              <div
                key={t.id}
                onClick={() => {
                  setSelectedTemplate(t);
                  setIsTemplateModalOpen(true);
                }}
                className="flex items-center justify-between p-4 border rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer group bg-gray-50/50"
              >
                <div className="flex items-start gap-4">
                  {/* Template Icon/Badge */}
                  <div className="bg-white border w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0">
                    📝
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 text-lg">{t.name}</div>
                    <div className="text-sm text-gray-500 mt-1 flex flex-wrap gap-2 items-center">
                      <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-xs font-bold">
                        {formatSchedule(t.day_of_week, t.start_time)}
                      </span>
                      <span className="text-gray-400">•</span>
                      <span>{t.location}</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-xs">
                        최소 {t.min_participants}명 / 최대 {t.max_participants}명
                      </span>
                    </div>
                    {/* Description (Mocked if not in type yet) */}
                    <div className="text-xs text-gray-400 mt-1">
                      {t.description || '기본 설정된 매치 템플릿입니다.'}
                    </div>
                  </div>
                </div>

                <button className="bg-white border border-gray-200 text-gray-900 px-4 py-2 rounded-lg text-sm font-bold group-hover:bg-blue-600 group-hover:text-white group-hover:border-transparent transition-all shadow-sm shrink-0">
                  이 템플릿으로 생성 ▶
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 my-8"></div>

      {/* 🔹 SECTION 3: MATCH LIST (Expanded Card Design) */}
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          📅 경기 목록 (Match List)
          <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {matches.length}
          </span>
        </h3>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed">
            <p className="text-gray-500">예정된 경기가 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map((match) => {
              const status = getMatchDisplayStatus(match);
              const stats = getStats(match);

              return (
                <div
                  key={match.id}
                  onClick={() => setViewingMatch(match)}
                  className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer group overflow-hidden relative"
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${status.stripeColor}`} />

                  <div className="flex">
                    <div className="flex-1 p-5 pl-7">
                      {/* Row 1: Header Info */}
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase border ${status.color}`}
                            >
                              {status.label}
                            </span>
                            <h4 className="font-bold text-xl text-gray-900">{match.name}</h4>
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-3">
                            <span>🕒 {formatKST(match.start_time)}</span>
                            <span className="w-px h-3 bg-gray-300"></span>
                            <span>📍 {match.location}</span>
                          </div>
                        </div>
                      </div>

                      {/* Row 2: Stats Grid */}
                      <div className="grid grid-cols-3 gap-2 bg-gray-50 rounded-lg p-3 border border-gray-100">
                        {/* ATTENDING */}
                        <div className="text-center border-r border-gray-200 last:border-0">
                          <div className="text-[15px] font-bold text-blue-600 uppercase tracking-wider mb-0.5">
                            참석
                          </div>
                          <div className="text-lg font-extrabold text-gray-900">
                            {stats.attending}
                          </div>
                        </div>

                        {/* PENDING */}
                        <div className="text-center border-r border-gray-200 last:border-0">
                          <div className="text-[15px] font-bold text-yellow-600 uppercase tracking-wider mb-0.5">
                            미정
                          </div>
                          <div className="text-lg font-extrabold text-gray-900">
                            {stats.pending}
                          </div>
                        </div>

                        {/* ABSENT */}
                        <div className="text-center border-r border-gray-200 last:border-0">
                          <div className="text-[15px] font-bold text-red-500 uppercase tracking-wider mb-0.5">
                            불참
                          </div>
                          <div className="text-lg font-extrabold text-gray-900">{stats.absent}</div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Actions */}
                    <div className="flex flex-col border-l border-gray-100">
                      <button
                        onClick={(e) => handleEdit(e, match)}
                        className="flex-1 px-4 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors border-b border-gray-100 flex items-center justify-center"
                      >
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, match.id)}
                        className="flex-1 px-4 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center"
                      >
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 🔹 MODALS */}
      {selectedTemplate && (
        <CreateMatchModal
          isOpen={isTemplateModalOpen}
          onClose={() => setIsTemplateModalOpen(false)}
          templateId={selectedTemplate.id}
          templateName={selectedTemplate.name}
          dayOfWeek={selectedTemplate.day_of_week}
          onSuccess={() => {
            setIsTemplateModalOpen(false);
            fetchData();
          }}
        />
      )}

      <CreateManualMatchModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        clubId={1}
        onSuccess={() => {
          setIsManualModalOpen(false);
          fetchData();
        }}
      />

      {editingMatch && (
        <EditMatchModal
          isOpen={!!editingMatch}
          onClose={() => setEditingMatch(null)}
          match={editingMatch}
          onUpdate={fetchData}
        />
      )}

      {viewingMatch && (
        <ManagerMatchDetailModal
          isOpen={!!viewingMatch}
          onClose={() => setViewingMatch(null)}
          match={viewingMatch}
          onUpdate={fetchData}
        />
      )}
    </div>
  );
}
