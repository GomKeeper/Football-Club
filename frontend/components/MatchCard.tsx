import { Match, Participation } from '@/lib/api';
import { formatKST } from '@/lib/utils';

interface MatchCardProps {
  match: Match;
  myVote?: Participation;
  status?: {
    label: string;
    color: string;
    canVote: boolean;
  };
}

// Helper for D-Day
function getDDay(isoString: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const matchDay = new Date(isoString);
  matchDay.setHours(0, 0, 0, 0);

  const diffTime = matchDay.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'D-Day';
  return `D-${diffDays}`;
}

export default function MatchCard({ match, myVote, status }: MatchCardProps) {
  const badgeColor = status?.color || 'bg-gray-100 text-gray-500';
  const badgeLabel = status?.label || '상태 확인중';

  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden">
      {/* Top Row: D-Day & Status */}
      <div className="flex justify-between items-start mb-3">
        <span className="bg-red-50 text-red-600 text-xs font-bold px-2 py-1 rounded-md">
          {getDDay(match.start_time)}
        </span>
        <span className={`text-[10px] px-2 py-0.5 rounded border font-bold ${badgeColor}`}>
          {badgeLabel}
        </span>
      </div>

      {/* Main Info */}
      <div className="font-bold text-lg leading-tight text-gray-900 group-hover:text-blue-600 transition-colors">
        {match.name}
      </div>

      <div className="space-y-1 text-sm text-gray-600 mb-4">
        <p className="flex items-center gap-2">
          <span>📅</span> {formatKST(match.start_time)}
        </p>
        <p className="flex items-center gap-2">
          <span>📍</span> {match.location}
        </p>
      </div>

      {myVote ? (
        <div
          className={`mt-3 w-full py-2 rounded-lg text-center text-sm font-bold border ${
            myVote.status === 'ATTENDING'
              ? 'bg-green-100 text-green-700 border-green-200'
              : myVote.status === 'ABSENT'
              ? 'bg-red-100 text-red-700 border-red-200'
              : 'bg-yellow-100 text-yellow-700 border-yellow-200'
          }`}
        >
          {myVote.status === 'ATTENDING' && '✅ 참석합니다'}
          {myVote.status === 'ABSENT' && '🙅 불참합니다'}
          {myVote.status === 'PENDING' && '🤔 미정입니다'}
        </div>
      ) : (
        // Optional: "Vote Now" placeholder if user hasn't voted yet and it's open
        status?.canVote && (
          <div className="mt-3 w-full py-2 rounded-lg text-center text-sm font-bold bg-gray-50 text-gray-400 border border-gray-100 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-100 transition-colors">
            터치하여 투표하기 👉
          </div>
        )
      )}
    </div>
  );
}
