'use client'
import { useAuth } from '@/components/AuthProvider'
import { getMatchTemplates, type MatchTemplate } from '@/lib/api'
import { formatSchedule } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import CreateMatchModal from '@/components/CreateMatchModal'

export default function ManagerPage() {
  const { member, loading } = useAuth()
  const router = useRouter()
  const [templates, setTemplates] = useState<MatchTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<MatchTemplate | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)  

  // 1. Fetch Data
  useEffect(() => {
    if (!loading && member) {
      // Security Check: Kick out non-admins
      if (!member.roles.includes('ADMIN') && !member.roles.includes('MANAGER')) {
        alert("관리자 권한이 필요합니다.")
        router.push('/dashboard')
        return
      }

      // Hardcoded Club ID 1 for now (We can make this dynamic later)
      getMatchTemplates(1)
        .then(setTemplates)
        .catch((err) => console.error(err))
    }
  }, [loading, member, router])

  if (loading) return <div className="p-6">로딩 중...</div>

  const handleOpenModal = (template: MatchTemplate) => {
    setSelectedTemplate(template)
    setIsModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white px-6 py-4 shadow-sm mb-6 sticky top-0">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">운영진 대시보드</h1>
          <button 
            onClick={() => router.push('/dashboard')}
            className="text-sm text-gray-500 hover:text-blue-600"
          >
            ← 나가기
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-6 space-y-6">
        
        {/* Section Title */}
        <div className="flex justify-between items-end border-b pb-2">
          <h2 className="text-lg font-bold text-gray-800">매치 템플릿</h2>
          <span className="text-xs text-gray-500">정기 모임 설정</span>
        </div>

        {/* Templates List */}
        <div className="grid gap-4">
          {templates.length === 0 ? (
            <div className="text-center py-10 text-gray-400 bg-white rounded-xl border border-dashed">
              등록된 템플릿이 없습니다.
            </div>
          ) : (
            templates.map((t) => (
              <div key={t.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg text-gray-900">{t.name}</h3>
                  <span className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-md font-medium">
                    {t.duration_minutes}분
                  </span>
                </div>
                
                <div className="space-y-1 text-sm text-gray-600 mb-4">
                  <p className="flex items-center gap-2">
                    <span className="text-gray-400">📅</span> 
                    {formatSchedule(t.day_of_week, t.start_time)}
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-gray-400">📍</span> 
                    {t.location}
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-50 flex gap-2">
                  <button className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-200">
                    수정
                  </button>
                  <button onClick={() => handleOpenModal(t)}
                          className="flex-1 bg-black text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-800">
                    ⚡️ 경기 생성
                  </button>
                </div>
              </div>
            ))
          )}

          {selectedTemplate && (
            <CreateMatchModal 
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              templateId={selectedTemplate.id}
              templateName={selectedTemplate.name}
              dayOfWeek={selectedTemplate.day_of_week}
            />
          )}
        </div>

        {/* Floating Add Button */}
        <button className="fixed bottom-6 right-6 bg-blue-600 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-3xl hover:bg-blue-700 hover:scale-105 transition-all">
          +
        </button>
      </main>
    </div>
  )
}