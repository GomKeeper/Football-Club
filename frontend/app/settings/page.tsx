'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { updateMyProfile } from '@/lib/api';
import { createClient } from '@/lib/supabase';
// Soccer Positions Data
const POSITIONS = [
  { id: 'FW', label: '공격수 (FW)', list: ['ST', 'RW', 'LW'] },
  { id: 'MF', label: '미드필더 (MF)', list: ['CAM', 'CM', 'CDM', 'RM', 'LM'] },
  { id: 'DF', label: '수비수 (DF)', list: ['CB', 'RB', 'LB', 'RWB', 'LWB'] },
  { id: 'GK', label: '골키퍼 (GK)', list: ['GK'] },
];

export default function SettingsPage() {
  const { member, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false); // 👈 For Image Upload
  // Form State
  const [phone, setPhone] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [backNumber, setBackNumber] = useState('');
  const [pictureUrl, setPictureUrl] = useState('');
  const [myPositions, setMyPositions] = useState<string[]>([]);

  // Load initial data
  useEffect(() => {
    if (member) {
      setPhone(member.phone || ''); // Note: This might be empty if backend doesn't send decrypted phone in 'member' object yet
      setBirthYear(member.birth_year?.toString() || '');
      setBackNumber(member.back_number?.toString() || '');
      setMyPositions(member.positions || []);
      setPictureUrl(member.picture_url || '');
    }
  }, [member]);

  if (authLoading || !member) return <div className="p-6">로딩 중...</div>;

  const togglePosition = (pos: string) => {
    if (myPositions.includes(pos)) {
      setMyPositions((prev) => prev.filter((p) => p !== pos));
    } else {
      setMyPositions((prev) => [...prev, pos]);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        return; // No file selected
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      // Create unique path: "profile/{kakao_id}_{timestamp}.png"
      const fileName = `${member?.kakao_id}_${Date.now()}.${fileExt}`;
      const filePath = `profile/${fileName}`;

      // 1. Upload to Supabase Bucket 'football-club-app-pictures'
      const { error: uploadError } = await supabase.storage.from('football-club-app-pictures').upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data } = supabase.storage.from('football-club-app-pictures').getPublicUrl(filePath);

      // 3. Update State
      setPictureUrl(data.publicUrl);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('이미지 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateMyProfile({
        phone: phone || undefined,
        birth_year: birthYear ? parseInt(birthYear) : undefined,
        back_number: backNumber ? parseInt(backNumber) : undefined,
        positions: myPositions,
        picture_url: pictureUrl || undefined
      });
      alert('저장되었습니다! ✅');
      window.location.href = '/dashboard'
    } catch (e) {
      alert('저장 실패 😭');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !member) return <div className="p-6">로딩 중...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white px-6 py-4 shadow-sm sticky top-0 z-10 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900">내 정보 설정</h1>
        <button onClick={() => router.back()} className="text-gray-500 text-sm">
          취소
        </button>
      </header>

      <main className="max-w-md mx-auto p-6 space-y-8">
        {/* 📸 Profile Picture Section */}
        <section className="flex flex-col items-center gap-4">
          <div className="relative">
            <img
              src={pictureUrl || 'https://placehold.co/100'}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover border-2 border-gray-200 shadow-sm"
            />
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              </div>
            )}
          </div>

          <div>
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
            />
            <label
              htmlFor="file-upload"
              className="bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-full text-sm font-medium cursor-pointer hover:bg-gray-50 transition-colors"
            >
              {uploading ? '업로드 중...' : '사진 변경'}
            </label>
          </div>
        </section>

        {/* 1. Phone */}
        <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <label className="block text-sm font-bold text-gray-900 mb-2">📞 연락처 (필수)</label>
          <input
            type="tel"
            placeholder="010-1234-5678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-lg focus:ring-2 focus:ring-black outline-none text-gray-900"
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
              placeholder="2000"
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-lg focus:ring-2 focus:ring-black outline-none text-gray-900"
            />
            <p className="text-xs text-gray-400 mt-1">연령대 그룹 (청년부/장년부 등) 자동 분류용</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              👕 등번호 (Back No.)
            </label>
            <input
              type="number"
              placeholder="7"
              value={backNumber}
              onChange={(e) => setBackNumber(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-lg focus:ring-2 focus:ring-black outline-none text-gray-900"
            />
          </div>
        </section>

        {/* 3. Positions */}
        <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <label className="block text-sm font-bold text-gray-900 mb-4">
            ⚽️ 선호 포지션 (중복 선택 가능)
          </label>

          <div className="space-y-4">
            {POSITIONS.map((group) => (
              <div key={group.id}>
                <div className="text-xs font-bold text-gray-400 mb-2">{group.label}</div>
                <div className="flex flex-wrap gap-2">
                  {group.list.map((pos) => (
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
  );
}
