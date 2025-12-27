'use client'

import { useState } from 'react'
import { previewNotification, sendNotificationToMe } from '@/lib/api'

// 1. Define Types & Constants Outside Component
type NotificationType = 'POLLING_START' | 'SOFT_DEADLINE' | 'HARD_DEADLINE'

const NOTIFICATION_OPTIONS: { value: NotificationType; label: string }[] = [
  { value: 'POLLING_START', label: '투표 시작 (Start)' },
  { value: 'SOFT_DEADLINE', label: '마감 임박 (Soft)' },
  { value: 'HARD_DEADLINE', label: '최종 마감 (Hard)' },
]

interface Props {
  matchId: number
}

// (Optional) Remove `declare global` if it exists in AuthProvider.tsx
// If not using a global type file, keep it here.
declare global {
  interface Window {
    Kakao: any;
  }
}

export default function NotificationManager({ matchId }: Props) {
  const [selectedType, setSelectedType] = useState<NotificationType>('POLLING_START')
  const [previewText, setPreviewText] = useState<string>('')
  const [loading, setLoading] = useState(false)

  // Helper: Check SDK Status
  const isKakaoReady = () => {
    if (typeof window === 'undefined' || !window.Kakao || !window.Kakao.isInitialized()) {
      alert('카카오 SDK가 아직 로드되지 않았습니다. 잠시 후 다시 시도해주세요.')
      return false
    }
    return true
  }

  // 1. Generate Preview
  const handlePreview = async () => {
    setLoading(true)
    try {
      const data = await previewNotification(matchId, selectedType)
      setPreviewText(data.message)
    } catch (e) {
      alert('미리보기 생성 실패 😭')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // 2. Send to Me (Test)
  const handleSendToMe = async () => {
    if (!isKakaoReady()) return

    const token = window.Kakao.Auth.getAccessToken()
    if (!token) {
      alert('카카오 로그인 세션이 만료되었습니다. 다시 로그인해주세요.')
      return
    }

    if (!confirm('나에게 테스트 메시지를 보내시겠습니까?')) return

    setLoading(true)
    try {
      await sendNotificationToMe(matchId, selectedType, token)
      alert('메시지 전송 성공! 📱')
    } catch (e) {
      alert(`전송 실패: ${e instanceof Error ? e.message : '알 수 없는 오류'}`)
    } finally {
      setLoading(false)
    }
  }

  // 3. Share to Group Chat
  const handleKakaoShare = () => {
    if (!isKakaoReady()) return

    window.Kakao.Link.sendDefault({
      objectType: 'text',
      text: previewText,
      link: {
        mobileWebUrl: window.location.href,
        webUrl: window.location.href,
      },
      buttons: [
        {
          title: '투표 하러 가기 ⚽',
          link: {
            mobileWebUrl: `${window.location.origin}/matches/${matchId}`,
            webUrl: `${window.location.origin}/matches/${matchId}`,
          },
        },
      ],
    })
  }

  return (
    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4 shadow-sm">
      <h3 className="font-bold text-gray-800 flex items-center gap-2">
        📢 알림 센터 <span className="text-xs font-normal text-gray-500">(Manager Only)</span>
      </h3>
      
      {/* Type Selector (Refactored loop) */}
      <div className="flex flex-wrap gap-2">
        {NOTIFICATION_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => setSelectedType(option.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors border ${
              selectedType === option.value 
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Action: Generate */}
      <button 
        onClick={handlePreview}
        disabled={loading}
        className="w-full py-2.5 bg-gray-800 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 text-sm font-semibold transition"
      >
        {loading ? '데이터 불러오는 중...' : '📝 메시지 미리보기 생성'}
      </button>

      {/* Preview Area */}
      {previewText && (
        <div className="space-y-3 animate-fade-in-up">
          <textarea 
            className="w-full h-40 p-3 text-sm border border-gray-300 rounded-md bg-white text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
            value={previewText}
            readOnly
          />
          
          <div className="flex gap-2">
            <button
              onClick={handleSendToMe}
              className="flex-1 py-2.5 bg-gray-200 text-gray-700 font-bold rounded-md hover:bg-gray-300 text-sm transition flex justify-center items-center gap-2"
            >
              📩 나에게 테스트
            </button>
            
            <button
              onClick={handleKakaoShare}
              // 👇 Official Kakao Color (#FEE500) & Icon
              className="flex-1 py-2.5 bg-[#FEE500] text-[#191919] font-bold rounded-md hover:bg-[#E6CF00] text-sm transition flex justify-center items-center gap-2"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3C6.48 3 2 6.48 2 10.77C2 13.63 3.96 16.12 6.89 17.53C6.73 18.06 6.07 20.37 6.02 20.54C6.02 20.54 5.96 20.73 6.09 20.84C6.22 20.95 6.39 20.89 6.44 20.86C6.72 20.69 10.04 18.42 11.23 17.58C11.49 17.6 11.74 17.62 12 17.62C17.52 17.62 22 14.14 22 9.85C22 5.56 17.52 3 12 3Z" />
              </svg>
              카톡 단톡방 공유
            </button>
          </div>
        </div>
      )}
    </div>
  )
}