'use client'
import { useState } from 'react'
import { generateMatch } from '@/lib/api'

interface Props {
  isOpen: boolean
  onClose: () => void
  templateName: string
  templateId: number
  dayOfWeek: number // 0=Mon, 1=Tue... to help guide the user
}

export default function CreateMatchModal({ isOpen, onClose, templateName, templateId, dayOfWeek }: Props) {
  const [date, setDate] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!date) return

    try {
      setLoading(true)
      await generateMatch(templateId, date)
      alert('경기가 성공적으로 생성되었습니다! 🚀')
      onClose()
      // Optional: Refresh the page or redirect to the new match
    } catch (error) {
      console.error(error)
      alert('경기 생성에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // Helper to suggest the "Next X-day" (e.g., next Tuesday)
  const getNextDayOfWeek = (dayIndex: number) => {
    const today = new Date();
    // Adjust logic to find the next occurrence of dayIndex
    // (Simple placeholder for now, user can pick manually)
    return today.toISOString().split('T')[0];
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl animate-in fade-in zoom-in duration-200">
        
        <div className="text-center mb-6">
          <h3 className="text-lg font-bold text-gray-900">매치 생성하기</h3>
          <p className="text-sm text-gray-500 mt-1">{templateName}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              경기 날짜 선택
            </label>
            <input 
              type="date" 
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-black focus:border-black p-3 border"
            />
            <p className="text-xs text-gray-400 mt-2">
              * 템플릿에 설정된 시간으로 자동 예약됩니다.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-colors disabled:bg-gray-400"
            >
              {loading ? '생성 중...' : '생성 완료'}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}