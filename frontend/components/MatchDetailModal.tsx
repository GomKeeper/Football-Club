'use client';
import { formatKST, calculateTimeRemaining } from '@/lib/utils';
import { type Match, voteMatch, getMyParticipation, type Participation } from '@/lib/api';
import { useState, useEffect } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  match: Match;
}

export default function MatchDetailModal({ isOpen, onClose, match }: Props) {
  const [, setTick] = useState(0);
  const [myVote, setMyVote] = useState<Participation | null>(null);
  const [voteLoading, setVoteLoading] = useState(false);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (isOpen) {
      getMyParticipation(match.id).then((data) => {
        setMyVote(data);
        if (data?.comment) setComment(data.comment);
      });
    }
  }, [isOpen, match.id]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => setTick((t) => t + 1), 60000); // Update every minute
    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const isHardClosed = () => {
    if (match.hard_deadline_at) {
      const { isExpired } = calculateTimeRemaining(match.hard_deadline_at)!;
      if (isExpired) return true;
    }
    return false;
  };

  const isSoftClosed = () => {
    if (match.soft_deadline_at) {
      const { isExpired } = calculateTimeRemaining(match.soft_deadline_at)!;
      if (isExpired) return true;
    }
    return false;
  };

  const handleVote = async (status: 'ATTENDING' | 'ABSENT' | 'PENDING') => {
    if (isHardClosed()) {
      alert('투표가 마감되었습니다.');
      return;
    }
    // Block Pending if Soft Deadline passed
    if (status === 'PENDING' && isSoftClosed()) {
      alert("독려 알림(Soft Deadline) 이후에는 '미정'을 선택할 수 없습니다.");
      return;
    }

    setVoteLoading(true);
    try {
      // Pass comment along with status
      const result = await voteMatch(match.id, status, comment);
      setMyVote(result);
      alert('투표가 저장되었습니다.');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setVoteLoading(false);
    }
  };

  // Helper to check if voting is closed
  const isVotingClosed = () => {
    // Check hard deadline
    if (match.hard_deadline_at) {
      const { isExpired } = calculateTimeRemaining(match.hard_deadline_at)!;
      if (isExpired) return true;
    }
    // Check polling start
    if (match.polling_start_at) {
      const now = new Date();
      const start = new Date(
        match.polling_start_at.endsWith('Z')
          ? match.polling_start_at
          : match.polling_start_at + 'Z',
      );
      if (now < start) return true;
    }
    return false;
  };

  const votingClosed = isVotingClosed();

  // --- Render Helper ---
  const renderCountdown = (targetDateStr?: string | null) => {
    const time = calculateTimeRemaining(targetDateStr);

    if (!time) return <span className="text-gray-400">-</span>;

    if (time.isExpired) {
      return <span className="text-red-500 font-bold">마감됨</span>;
    }

    if (time.days > 0) {
      // Plenty of time: Blue
      return (
        <span className="text-blue-600 font-bold">
          {time.days}일 {time.hours}시간 남음
        </span>
      );
    }

    // Urgent (< 24h): Orange
    return (
      <span className="text-orange-500 font-bold">
        {time.hours}시간 {time.minutes}분 남음
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header Background */}
        <div className="absolute top-0 left-0 w-full h-28 bg-gradient-to-br from-gray-900 to-black z-0" />

        <div className="relative z-10">
          <button
            onClick={onClose}
            className="absolute top-0 right-0 text-white/80 hover:text-white text-2xl p-2"
          >
            &times;
          </button>

          {/* Badges */}
          <div className="flex gap-2 mb-3">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                match.status === 'RECRUITING'
                  ? 'bg-green-400 text-black'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {match.status}
            </span>
            {match.duration_minutes && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-md border border-white/10">
                ⏱ {match.duration_minutes}분
              </span>
            )}
          </div>

          <h2 className="text-2xl font-bold text-white mb-8 leading-tight">{match.name}</h2>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-1 space-y-1">
            <InfoRow icon="📅" label="Kickoff" value={formatKST(match.start_time)} />
            <InfoRow icon="📍" label="Location" value={match.location} />

            {/* Deadlines Section */}
            <div className="bg-gray-50 rounded-xl m-2 p-3 space-y-3 border border-gray-100">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Deadlines
              </h4>

              <div className="flex justify-between text-sm">
                <span className="text-gray-500">📢 투표 시작</span>
                <span className="text-gray-900">{formatKST(match.polling_start_at)}</span>
              </div>

              {match.soft_deadline_at && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">🔔 독려 알림</span>
                  <div className="text-right">
                    <div className="text-gray-900">{formatKST(match.soft_deadline_at)}</div>
                    <div className="text-xs">{renderCountdown(match.soft_deadline_at)}</div>
                  </div>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span className="text-gray-500">🚨 최종 마감</span>
                <div className="text-right">
                  <div className="text-gray-900">{formatKST(match.hard_deadline_at)}</div>
                  <div className="text-xs">{renderCountdown(match.hard_deadline_at)}</div>
                </div>
              </div>
            </div>

            {match.description && (
              <InfoRow icon="📝" label="Notice" value={match.description} isLongText />
            )}
          </div>

          {/* 👇 NEW: Footer Actions (Sticky Bottom) */}
          <div className="pt-4 mt-auto border-t border-gray-100">
            {votingClosed ? (
              <div className="text-center p-4 bg-gray-100 rounded-xl text-gray-500 font-bold">
                🚫 투표 기간이 아닙니다
              </div>
            ) : (
              <>
                {/* Comment Input */}
                <div>
                  <input
                    type="text"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="참석 관련 메모 (예: 11시까지 가능, 지각 예정 등)"
                    className="w-full text-sm p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none bg-gray-50"
                  />
                </div>

                {/* 3 Buttons Grid */}
                <div className="grid grid-cols-3 gap-2">
                  {/* ABSENT */}
                  <button
                    onClick={() => handleVote('ABSENT')}
                    disabled={voteLoading}
                    className={`py-3 rounded-xl font-bold text-sm transition-all border ${
                      myVote?.status === 'ABSENT'
                        ? 'bg-red-500 text-white border-red-500'
                        : 'bg-white text-gray-400 border-gray-200 hover:border-red-200'
                    }`}
                  >
                    불참
                  </button>

                  {/* PENDING (Disable if soft closed) */}
                  <button
                    onClick={() => handleVote('PENDING')}
                    disabled={voteLoading || isSoftClosed()}
                    className={`py-3 rounded-xl font-bold text-sm transition-all border ${
                      myVote?.status === 'PENDING'
                        ? 'bg-yellow-400 text-white border-yellow-400'
                        : isSoftClosed()
                        ? 'bg-gray-100 text-gray-300 border-gray-100 cursor-not-allowed'
                        : 'bg-white text-gray-400 border-gray-200 hover:border-yellow-200'
                    }`}
                  >
                    {isSoftClosed() ? '미정 불가' : '미정'}
                  </button>

                  {/* ATTENDING */}
                  <button
                    onClick={() => handleVote('ATTENDING')}
                    disabled={voteLoading}
                    className={`py-3 rounded-xl font-bold text-sm transition-all border ${
                      myVote?.status === 'ATTENDING'
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-white text-gray-400 border-gray-200 hover:border-green-200'
                    }`}
                  >
                    참석
                  </button>
                </div>
              </>
            )}

            {/* Status Text */}
            {myVote && (
              <p className="text-center text-xs text-gray-400 mt-2">
                현재 상태:{' '}
                <span className="font-bold text-black">
                  {myVote.status === 'ATTENDING' ? '참석 예정' : '불참'}
                </span>
              </p>
            )}
          </div>

          <div className="mt-6">
            <button
              onClick={onClose}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold py-4 rounded-xl transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  isLongText = false,
}: {
  icon: string;
  label: string;
  value: string;
  isLongText?: boolean;
}) {
  return (
    <div className="flex items-start gap-4 p-3 border-b last:border-0 border-gray-50">
      <div className="bg-gray-50 w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0">
        {icon}
      </div>
      <div className="w-full">
        <p className="text-xs text-gray-400 font-bold uppercase">{label}</p>
        <p
          className={`text-gray-900 font-medium text-sm ${
            isLongText ? 'whitespace-pre-wrap leading-relaxed' : ''
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
