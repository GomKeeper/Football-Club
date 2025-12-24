import { Match } from '@/lib/api'

// Helper to format specific Date (e.g. "2/11 (Tue) 20:00")
function formatMatchDate(isoString: string) {
  const date = new Date(isoString)
  const formatter = new Intl.DateTimeFormat('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
  return formatter.format(date)
}

// Helper for D-Day
function getDDay(isoString: string) {
  const today = new Date();
  today.setHours(0,0,0,0);
  const matchDay = new Date(isoString);
  matchDay.setHours(0,0,0,0);
  
  const diffTime = matchDay.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "D-Day";
  return `D-${diffDays}`;
}

export default function MatchCard({ match }: { match: Match }) {
  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden">
      
      {/* Top Row: D-Day & Status */}
      <div className="flex justify-between items-start mb-3">
        <span className="bg-red-50 text-red-600 text-xs font-bold px-2 py-1 rounded-md">
          {getDDay(match.start_time)}
        </span>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
          match.status === 'RECRUITING' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
        }`}>
          {match.status === 'RECRUITING' ? '모집중' : '마감'}
        </span>
      </div>

      {/* Main Info */}
      <h3 className="font-bold text-lg text-gray-900 mb-1">{match.name}</h3>
      
      <div className="space-y-1 text-sm text-gray-600 mb-4">
        <p className="flex items-center gap-2">
          <span>📅</span> {formatMatchDate(match.start_time)}
        </p>
        <p className="flex items-center gap-2">
          <span>📍</span> {match.location}
        </p>
      </div>

      {/* Action Button */}
      <button className="w-full bg-black text-white py-3 rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors">
        참석 투표하기
      </button>
    </div>
  )
}