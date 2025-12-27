'use client';

import { Fragment, useState, useMemo } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, ClipboardDocumentIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import { Match, Participation, adminOverrideVote } from '@/lib/api';
import NotificationManager from '@/components/NotificationManager';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  match: Match;
  onUpdate: () => void; // Trigger refresh after edit
}

export default function ManagerMatchDetail({ isOpen, onClose, match, onUpdate }: Props) {
  const [activeTab, setActiveTab] = useState<'ATTENDING' | 'ABSENT' | 'PENDING'>('ATTENDING');
  const [editingId, setEditingId] = useState<number | null>(null); // Which member is being edited
  const [loading, setLoading] = useState(false);

  // 📊 1. Process Data: Group participations by status
  const roster = useMemo(() => {
    const grouped = {
      ATTENDING: [] as Participation[],
      ABSENT: [] as Participation[],
      PENDING: [] as Participation[],
    };

    // Sort votes into buckets
    match.participations?.forEach((p) => {
      // @ts-ignore (Backend returns uppercase string, frontend type might be strict enum)
      if (grouped[p.status]) grouped[p.status].push(p);
    });

    return grouped;
  }, [match]);

  // 📝 2. Handle Admin Override
  const handleOverride = async (memberId: number, newStatus: string) => {
    if (!confirm(`${newStatus} 상태로 변경하시겠습니까?`)) return;

    setLoading(true);
    try {
      await adminOverrideVote({
        match_id: match.id,
        member_id: memberId,
        status: newStatus as any,
      });
      alert('변경되었습니다.');
      setEditingId(null);
      onUpdate(); // Refresh parent data
    } catch (e) {
      alert('변경 실패');
    } finally {
      setLoading(false);
    }
  };

  // 📋 3. Copy to Clipboard (Kakao Style)
  const copyToClipboard = () => {
    const title = `[${match.name}] 참석 현황`;
    const attendingList = roster.ATTENDING.map((p, i) => `${i + 1}. ${p.member?.name}`).join('\n');
    const text = `${title}\n\n✅ 참석 (${roster.ATTENDING.length}명)\n${attendingList}\n\n📍 장소: ${match.location}`;

    navigator.clipboard.writeText(text);
    alert('참석 명단이 복사되었습니다!');
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-lg rounded-2xl bg-white shadow-xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-5 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl">
              <div>
                <h3 className="font-bold text-lg text-gray-900">{match.name} 관리</h3>
                <p className="text-xs text-gray-500">
                  참석 {roster.ATTENDING.length} · 불참 {roster.ABSENT.length} · 미정{' '}
                  {roster.PENDING.length}
                </p>
              </div>
              <button onClick={onClose}>
                <XMarkIcon className="w-6 h-6 text-gray-400 hover:text-black" />
              </button>
            </div>

            {/* Toolbar */}
            <div className="p-3 flex gap-2 border-b">
              <button
                onClick={copyToClipboard}
                className="flex-1 flex items-center justify-center gap-2 bg-yellow-400 text-black py-2 rounded-lg text-sm font-bold hover:bg-yellow-500"
              >
                <ClipboardDocumentIcon className="w-4 h-4" />
                명단 복사 (참석자만)
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b text-sm font-medium text-gray-500">
              {['ATTENDING', 'ABSENT', 'PENDING'].map((status) => (
                <button
                  key={status}
                  onClick={() => setActiveTab(status as any)}
                  className={`flex-1 py-3 border-b-2 transition-colors ${
                    activeTab === status
                      ? 'border-black text-black font-bold'
                      : 'border-transparent hover:text-gray-700'
                  }`}
                >
                  {status === 'ATTENDING' ? '참석' : status === 'ABSENT' ? '불참' : '미정'} (
                  {roster[status as keyof typeof roster].length})
                </button>
              ))}
            </div>

            {/* List */}
            <div className="overflow-y-auto p-4 space-y-2 flex-1">
              {roster[activeTab].length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">해당 인원이 없습니다.</div>
              ) : (
                roster[activeTab].map((p) => (
                  <div
                    key={p.id}
                    className="flex justify-between items-center p-3 bg-white border rounded-xl hover:border-gray-300 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                        {p.member?.name[0]}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 text-sm">{p.member?.name}</div>
                        {p.comment && <div className="text-xs text-gray-500">💬 {p.comment}</div>}
                      </div>
                    </div>

                    {/* Edit Actions */}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {activeTab !== 'ATTENDING' && (
                        <button
                          onClick={() => handleOverride(p.member_id, 'ATTENDING')}
                          className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-bold hover:bg-green-200"
                        >
                          참석으로
                        </button>
                      )}
                      {activeTab !== 'ABSENT' && (
                        <button
                          onClick={() => handleOverride(p.member_id, 'ABSENT')}
                          className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-bold hover:bg-red-200"
                        >
                          불참으로
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-2">
              <details className="group border border-gray-200 rounded-lg bg-gray-50 open:bg-white transition-colors">
                <summary className="flex items-center justify-between p-3 font-semibold text-gray-700 cursor-pointer list-none hover:bg-gray-100 rounded-lg">
                  <span>🔔 알림 센터 (Notification)</span>
                  <span className="transform group-open:rotate-180 transition-transform">▼</span>
                </summary>

                <div className="p-3 pt-0">
                  <div className="text-xs text-gray-500 mb-3">
                    카카오톡으로 투표 독려 메시지를 전송합니다.
                  </div>
                  {/* The Component We Just Built */}
                  <NotificationManager matchId={match.id} />
                </div>
              </details>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </Transition>
  );
}
