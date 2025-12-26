'use client'

import { useState } from 'react'
import { previewNotification, sendNotificationToMe } from '@/lib/api'

interface Props {
  matchId: number
}

type NotificationType = 'POLLING_START' | 'SOFT_DEADLINE' | 'HARD_DEADLINE'

export default function NotificationManager({ matchId }: Props) {
  const [selectedType, setSelectedType] = useState<NotificationType>('POLLING_START')
  const [previewText, setPreviewText] = useState<string>('')
  const [loading, setLoading] = useState(false)

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
    if (!window.Kakao) {
      alert('Kakao SDK가 로드되지 않았습니다.')
      return
    }

    const token = window.Kakao.Auth.getAccessToken()
    if (!token) {
      alert('카카오 로그인 정보가 만료되었습니다. 다시 로그인해주세요.')
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

  // 3. Share to Group Chat (The Magic Button)
  const handleShareToChat = () => {
    if (!window.Kakao) return;
    
    // Uses Kakao Link (Share) API - No Backend Token needed!
    // It opens the Kakao App and lets you pick a chatroom.
    window.Kakao.Share.sendDefault({
      objectType: 'text',
      text: previewText,
      link: {
        mobileWebUrl: 'https://football-club-beta.vercel.app/dashboard',
        webUrl: 'https://football-club-beta.vercel.app/dashboard',
      },
      buttonTitle: '투표하러 가기',
    });
  }

  return (
    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
      <h3 className="font-bold text-gray-700">📢 알림 센터 (Notification)</h3>
      
      {/* Type Selector */}
      <div className="flex gap-2">
        {(['POLLING_START', 'SOFT_DEADLINE', 'HARD_DEADLINE'] as NotificationType[]).map((t) => (
          <button
            key={t}
            onClick={() => setSelectedType(t)}
            className={`px-3 py-1 text-xs rounded-full border ${
              selectedType === t 
                ? 'bg-blue-600 text-white border-blue-600' 
                : 'bg-white text-gray-600 border-gray-300'
            }`}
          >
            {t === 'POLLING_START' ? '투표 시작' : t === 'SOFT_DEADLINE' ? '마감 임박' : '최종 마감'}
          </button>
        ))}
      </div>

      {/* Action: Generate */}
      <button 
        onClick={handlePreview}
        disabled={loading}
        className="w-full py-2 bg-gray-800 text-white rounded hover:bg-gray-700 text-sm"
      >
        {loading ? '생성 중...' : '메시지 미리보기 생성'}
      </button>

      {/* Preview Area */}
      {previewText && (
        <div className="space-y-3 animation-fade-in">
          <textarea 
            className="w-full h-32 p-2 text-sm border rounded bg-white text-gray-800"
            value={previewText}
            readOnly
          />
          
          <div className="flex gap-2">
            <button
              onClick={handleSendToMe}
              className="flex-1 py-2 bg-yellow-400 text-black font-medium rounded hover:bg-yellow-500 text-sm"
            >
              📩 나에게 테스트
            </button>
            <button
              onClick={handleShareToChat}
              className="flex-1 py-2 bg-yellow-400 text-black font-medium rounded hover:bg-yellow-500 text-sm"
            >
              🚀 단톡방 공유
            </button>
          </div>
        </div>
      )}
    </div>
  )
}