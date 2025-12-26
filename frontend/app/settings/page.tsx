'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { updateMyProfile } from '@/lib/api'

// Soccer Positions Data
const POSITIONS = [
  { id: 'FW', label: '공격수 (FW)', list: ['ST', 'RW', 'LW'] },
  { id: 'MF', label: '미드필더 (MF)', list: ['CAM', 'CM', 'CDM', 'RM', 'LM'] },
  { id: 'DF', label: '수비수 (DF)', list: ['CB', 'RB', 'LB', 'RWB', 'LWB'] },
  { id: 'GK', label: '골키퍼 (GK)', list: ['GK'] },
]

export default function SettingsPage() {
  const { member, loading: authLoading } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // Form State
  const [phone, setPhone] = useState('')
  const [birthYear, setBirthYear] = useState('')
  const [backNumber, setBackNumber] = useState('')
  const [myPositions, setMyPositions] = useState<string[]>([])

  // Load initial data
  useEffect(() => {
    if (member) {
      setPhone(member.phone || '') // Note: This might be empty if backend doesn't send decrypted phone in 'member' object yet
      setBirthYear(member.birth_year?.toString() || '')
      setBackNumber(member.back_number?.toString() || '')
      setMyPositions(member.positions || [])
    }
  }, [member])

  if (authLoading || !member) return <div className="p-6">로딩 중...</div>

  const togglePosition = (pos: string) => {
    if (myPositions.includes(pos)) {
      setMyPositions(prev => prev.filter(p => p !== pos))
    } else {
      setMyPositions(prev => [...prev, pos])
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      await updateMyProfile({
        phone: phone || undefined,
        birth_year: birthYear ? parseInt(birthYear) : undefined,
        back_number: backNumber ? parseInt(backNumber) : undefined,
        positions: myPositions
      })
      alert('저장되었습니다! ✅')
      router.push('/dashboard') // Go back to home
    } catch (e) {
      alert('저장 실패 😭')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white px-6 py-4 shadow-sm sticky top-0 z-10 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900">내 정보 설정</h1>
        <button onClick={() => router.back()} className="text-gray-500 text-sm">취소</button>
      </header>

      <main className="max-w-md mx-auto p-6 space-y-8">
        
        {/* 1. Phone */}
        <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <label className="block text-sm font-bold text-gray-900 mb-2">📞 연락처 (필수)</label>
          <input 
            type="tel" 
            placeholder="010-1234-5678"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-lg focus:ring-2 focus:ring-black outline-none"
          />
          <p className="text-xs text-gray-400 mt-2">
            * 운영진에게만 공개되며 안전하게 암호화되어 저장됩니다.
          </p>
        </section>

        {/* 2. Basic Info */}
        <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">🎂 출생년도</label>
            <input 
              type="number" 
              placeholder="1990"
              value={birthYear}
              onChange={e => setBirthYear(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-lg focus:ring-2 focus:ring-black outline-none"
            />
            <p className="text-xs text-gray-400 mt-1">연령대 그룹 (청년부/장년부 등) 자동 분류용</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">👕 등번호 (Back No.)</label>
            <input 
              type="number" 
              placeholder="7"
              value={backNumber}
              onChange={e => setBackNumber(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-lg focus:ring-2 focus:ring-black outline-none"
            />
          </div>
        </section>

        {/* 3. Positions */}
        <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <label className="block text-sm font-bold text-gray-900 mb-4">⚽️ 선호 포지션 (중복 선택 가능)</label>
          
          <div className="space-y-4">
            {POSITIONS.map(group => (
              <div key={group.id}>
                <div className="text-xs font-bold text-gray-400 mb-2">{group.label}</div>
                <div className="flex flex-wrap gap-2">
                  {group.list.map(pos => (
                    <button
                      key={pos}
                      onClick={() => togglePosition(pos)}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                        myPositions.includes(pos)
                          ? 'bg-black text-white border-black shadow-md transform scale-105'
                          : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold text-lg shadow-lg hover:bg-blue-700 active:scale-95 transition-all disabled:bg-gray-300"
        >
          {loading ? '저장 중...' : '저장하기'}
        </button>

      </main>
    </div>
  )
}