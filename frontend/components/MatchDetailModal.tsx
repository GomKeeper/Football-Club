'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, MapPinIcon, ClockIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { voteMatch, type Match, type Participation } from '@/lib/api';
import { formatKSTHHMM, formatKST } from '@/lib/utils';
import { useAuth } from './AuthProvider';

const VOTE_CONFIG = {
  ATTENDING: {
    label: '⚽️ 참석',
    message: '멋진 경기 기대할게요! 💪',
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
    ring: 'ring-green-500',
  },
  ABSENT: {
    label: '🙅 불참',
    message: '아쉽네요. 다음엔 꼭 함께해요! 🥲',
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    ring: 'ring-red-500',
  },
  PENDING: {
    label: '🤔 미정',
    message: '일정 확인 후 꼭 알려주세요! 🙏',
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    ring: 'ring-yellow-400',
  },
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  match: Match | null;
  initialVote?: Participation | null; // 👈 This comes from the Dashboard's voteMap
  onVoteUpdate?: (vote: Participation) => void; // 👈 This updates the Dashboard's voteMap
}

export default function MatchDetailModal({
  isOpen,
  onClose,
  match,
  initialVote,
  onVoteUpdate,
}: Props) {
  const [loading, setLoading] = useState(false);
  const { member } = useAuth(); // Removed 'loading' from auth to prevent spinner flicker inside modal
  
  // 🛡️ Internal State: Syncs with initialVote when modal opens
  const [myVote, setMyVote] = useState<Participation | null>(initialVote || null);

  // 🔄 Step 2 State: Which button did they click?
  const [pendingStatus, setPendingStatus] = useState<'ATTENDING' | 'ABSENT' | 'PENDING' | null>(null);
  const [comment, setComment] = useState('');

  // ❌ REMOVED: voteMap state (It belongs in the Dashboard, not here!)

  // Reset state when modal opens or match changes
  useEffect(() => {
    if (isOpen) {
      setPendingStatus(null);
      // 👇 IMPORTANT: This ensures the modal "remembers" the vote passed from the Dashboard
      setMyVote(initialVote || null); 
      setComment(initialVote?.comment || '');
    }
  }, [isOpen, match, initialVote]);

  const initiateVote = (status: 'ATTENDING' | 'ABSENT' | 'PENDING') => {
    if (!match) return;

    const now = new Date();
    // Ensure we handle both string formats or Date objects from API
    const hardDeadline = new Date(match.hard_deadline_at || match.hard_deadline);
    const softDeadline = new Date(match.soft_deadline_at || match.soft_deadline);

    if (now > hardDeadline) {
      alert('투표가 마감되었습니다.');
      return;
    }

    if (status === 'PENDING' && now > softDeadline) {
      alert("독려 알림(Soft Deadline) 이후에는 '미정'을 선택할 수 없습니다.");
      return;
    }

    setPendingStatus(status);
  };

  const confirmVote = async () => {
    if (!match || !pendingStatus) return;

    setLoading(true);
    try {
      const result = await voteMatch(match.id, pendingStatus, comment);

      // ✅ 1. Update Local State (Immediate UI feedback)
      setMyVote(result);

      // ✅ 2. Notify Parent Dashboard (To persist data when modal closes)
      if (onVoteUpdate) {
        onVoteUpdate(result);
      }

      setPendingStatus(null); // Close Step 2
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Time Calculation Logic
  const rawStart = match?.start_time || new Date().toISOString();
  const utcStartString = rawStart.endsWith('Z') ? rawStart : `${rawStart}Z`;
  const startTimeObj = new Date(utcStartString);
  const endTimeObj = new Date(startTimeObj.getTime() + (match?.duration_minutes || 120) * 60000);
  const utcEndString = endTimeObj.toISOString();

  if (!match) return null;

  // Simple Protection (Optional inside modal, usually handled by Page)
  if (!member || member.status !== 'ACTIVE') return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-sm transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                {/* Header / Close */}
                <div className="flex justify-between items-start mb-2">
                  <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-gray-900">
                    {pendingStatus ? '투표 확인' : '경기 정보'}
                  </Dialog.Title>
                  <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* 🔄 STEP 2: CONFIRMATION VIEW */}
                {pendingStatus ? (
                  <div className="space-y-6 animate-fadeIn mt-4">
                    <div className="text-center space-y-3">
                      <div className={`text-3xl font-bold ${VOTE_CONFIG[pendingStatus].color}`}>
                        {VOTE_CONFIG[pendingStatus].label}
                      </div>
                      <p className="text-sm text-gray-800 bg-gray-50 py-3 px-4 rounded-xl">
                        {VOTE_CONFIG[pendingStatus].message}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">
                        한마디 남기기 (선택)
                      </label>
                      <input
                        type="text"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="예: 10분 늦습니다 / 카풀 구해요"
                        className="w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-3 px-4 text-sm bg-gray-50 text-gray-900 placeholder:text-gray-500 font-medium"
                        autoFocus
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => setPendingStatus(null)}
                        className="flex-1 py-3 text-gray-600 bg-gray-100 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                      >
                        취소
                      </button>
                      <button
                        onClick={confirmVote}
                        disabled={loading}
                        className="flex-1 py-3 text-white bg-blue-600 rounded-xl font-bold hover:bg-blue-700 disabled:bg-blue-300 shadow-md transition-all"
                      >
                        {loading ? '저장 중...' : '확인'}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* 1️⃣ STEP 1: RICH DETAILS VIEW */
                  <div className="space-y-6 mt-2">
                    {/* 📅 Date & Title */}
                    <div>
                      <h4 className="text-2xl font-bold text-gray-900 mb-1">{match.name}</h4>
                      <div className="flex items-center text-gray-500 text-sm gap-1">
                        <CalendarIcon className="w-4 h-4" />
                        <span>
                          {new Date(match.start_time).toLocaleDateString('ko-KR', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>

                    {/* 📍 Info Card */}
                    <div className="bg-blue-50 p-5 rounded-2xl space-y-4 border border-blue-100">
                      <div className="flex items-start gap-3">
                        <ClockIcon className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                        <div>
                          <span className="block font-bold text-gray-900">경기 시간</span>
                          <span className="text-blue-700 font-medium">
                            {formatKSTHHMM(utcStartString)}
                            {' ~ '}
                            {formatKSTHHMM(utcEndString)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <MapPinIcon className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                        <div>
                          <span className="block font-bold text-gray-900">장소</span>
                          <span className="text-gray-700">{match.location}</span>
                        </div>
                      </div>
                    </div>

                    {/* 🚨 Deadlines */}
                    <div className="flex flex-col gap-2 text-xs text-gray-500 px-1">
                      <div className="flex justify-between">
                        <span>독려 마감 (Soft)</span>
                        <span className="font-mono">{formatKST(match.soft_deadline_at || match.soft_deadline)}</span>
                      </div>
                      <div className="flex justify-between text-yellow-600">
                        <span>투표 마감 (Hard)</span>
                        <span className="font-mono">{formatKST(match.hard_deadline_at || match.hard_deadline)}</span>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 my-4"></div>

                    {/* 🗳 Voting Grid */}
                    <div className="grid grid-cols-3 gap-3">
                      {(['ABSENT', 'PENDING', 'ATTENDING'] as const).map((status) => {
                        const isSelected = myVote?.status === status;
                        const config = VOTE_CONFIG[status];

                        return (
                          <button
                            key={status}
                            onClick={() => initiateVote(status)}
                            className={`
                                p-4 rounded-2xl flex flex-col items-center gap-2 border-2 transition-all duration-200
                                ${
                                  isSelected
                                    ? `${config.border} ${config.bg} ${config.color} shadow-sm ring-1 ${config.ring}`
                                    : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50 text-gray-400 grayscale hover:grayscale-0'
                                }
                            `}
                          >
                            <span className="text-2xl filter-none">
                              {status === 'ATTENDING' ? '⚽️' : status === 'ABSENT' ? '🙅' : '🤔'}
                            </span>
                            <span
                              className={`text-sm font-bold ${isSelected ? '' : 'text-gray-500'}`}
                            >
                              {status === 'ATTENDING'
                                ? '참석'
                                : status === 'ABSENT'
                                ? '불참'
                                : '미정'}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Current Status Footer */}
                    {myVote && (
                      <div className="text-center bg-gray-50 p-3 rounded-xl mt-2">
                        <span className="text-gray-500 text-sm">내 상태: </span>
                        <span className={`font-bold ml-1 ${VOTE_CONFIG[myVote.status].color}`}>
                          {VOTE_CONFIG[myVote.status].label}
                        </span>
                        {myVote.comment && (
                          <div className="text-gray-500 text-xs mt-1">"{myVote.comment}"</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}