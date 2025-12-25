'use client';
import { useState, useEffect } from 'react';
import { createManualMatch } from '@/lib/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  clubId: number;
  onSuccess?: () => void
}

export default function CreateManualMatchModal({ isOpen, onClose, clubId, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [useSoftDeadline, setUseSoftDeadline] = useState(true); // Toggle for Soft Deadline

  // Helper: Get formatted date string for inputs (YYYY-MM-DD)
  const getTodayStr = () => new Date().toISOString().split('T')[0];

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    matchDate: getTodayStr(),
    matchTime: '20:00',
    duration: 120,
    min: 10,
    max: 22,
    desc: '',

    // Notification Dates (Strings for Inputs)
    pollDate: '',
    pollTime: '09:00',

    softDate: '',
    softTime: '12:00',

    hardDate: '',
    hardTime: '18:00',
  });

  // Auto-fill notification defaults when Match Date changes
  useEffect(() => {
    if (formData.matchDate) {
      const matchD = new Date(formData.matchDate);

      // Default Poll: 7 days before
      const pollD = new Date(matchD);
      pollD.setDate(matchD.getDate() - 7);

      // Default Soft: 2 days before
      const softD = new Date(matchD);
      softD.setDate(matchD.getDate() - 2);

      // Default Hard: 1 day before
      const hardD = new Date(matchD);
      hardD.setDate(matchD.getDate() - 1);

      setFormData((prev) => ({
        ...prev,
        pollDate: pollD.toISOString().split('T')[0],
        softDate: softD.toISOString().split('T')[0],
        hardDate: hardD.toISOString().split('T')[0],
      }));
    }
  }, [formData.matchDate]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Calculate Match Start (ISO UTC)
      const matchStart = new Date(`${formData.matchDate}T${formData.matchTime}`);

      // 2. Calculate Notification Times (ISO UTC)
      const pollStart = new Date(`${formData.pollDate}T${formData.pollTime}`);
      const hardDead = new Date(`${formData.hardDate}T${formData.hardTime}`);

      let softDead = undefined;
      if (useSoftDeadline) {
        softDead = new Date(`${formData.softDate}T${formData.softTime}`);
      }

      // Validation: Sanity Checks
      if (pollStart >= matchStart) throw new Error('투표 시작은 경기 시간보다 빨라야 합니다.');
      if (hardDead >= matchStart) throw new Error('마감은 경기 시간보다 빨라야 합니다.');
      if (useSoftDeadline && softDead! >= hardDead)
        throw new Error('독려 알림은 마감보다 빨라야 합니다.');

      // 3. Send Payload
      await createManualMatch({
        club_id: clubId,
        name: formData.name,
        location: formData.location,
        start_time: matchStart.toISOString(),
        duration_minutes: Number(formData.duration),
        min_participants: Number(formData.min),
        max_participants: Number(formData.max),
        description: formData.desc,

        // Send Exact ISO Strings directly (Backend handles them)
        polling_start_at: pollStart.toISOString(),
        hard_deadline_at: hardDead.toISOString(),
        soft_deadline_at: softDead ? softDead.toISOString() : undefined,
      });

      alert('스페셜 매치가 생성되었습니다! 🎉');

      if (onSuccess) {
        onSuccess() 
      }

      onClose();
    } catch (error: any) {
      console.error(error);
      alert(error.message || '생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h3 className="text-xl font-bold text-gray-900">⚡️ 스페셜 매치 생성</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-black text-2xl">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ... (Keep Name, Location, Participants Inputs same as before) ... */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1">매치 이름</label>
            <input
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full border-gray-300 rounded-xl p-3 border text-gray-900 font-medium"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-1">
              <label className="text-xs font-bold text-gray-800">날짜</label>
              <input
                type="date"
                name="matchDate"
                required
                value={formData.matchDate}
                onChange={handleChange}
                className="w-full border p-2 rounded-lg text-sm text-gray-900"
              />
            </div>
            <div className="col-span-1">
              <label className="text-xs font-bold text-gray-800">시간</label>
              <input
                type="time"
                name="matchTime"
                required
                value={formData.matchTime}
                onChange={handleChange}
                className="w-full border p-2 rounded-lg text-sm text-gray-900"
              />
            </div>
            <div className="col-span-1">
              <label className="text-xs font-bold text-gray-800">길이(분)</label>
              <input
                type="number"
                name="duration"
                required
                value={formData.duration}
                onChange={handleChange}
                className="w-full border p-2 rounded-lg text-sm text-gray-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">장소</label>
            <input
              name="location"
              required
              value={formData.location}
              onChange={handleChange}
              className="w-full border-gray-300 rounded-xl p-3 border text-gray-900 font-medium"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">설명 (선택)</label>
            <textarea
              name="desc"
              rows={3}
              value={formData.desc}
              onChange={handleChange}
              className="w-full border-gray-300 rounded-xl p-3 border focus:ring-2 focus:ring-black resize-none text-gray-900 font-medium"
              placeholder="준비물 등 기타 공지사항을 입력하세요."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-500">최소</label>
              <input
                type="number"
                name="min"
                value={formData.min}
                onChange={handleChange}
                className="w-full border p-2 rounded-lg text-gray-900"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500">최대</label>
              <input
                type="number"
                name="max"
                value={formData.max}
                onChange={handleChange}
                className="w-full border p-2 rounded-lg text-gray-900"
              />
            </div>
          </div>

          {/* 👇 NEW: Advanced Date Pickers */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm font-bold text-blue-600 flex items-center gap-1 hover:underline"
            >
              {showAdvanced ? '▼ 설정 접기' : '▶ 고급 설정 (알림 시간 상세)'}
            </button>

            {showAdvanced && (
              <div className="bg-gray-50 p-4 rounded-xl mt-2 space-y-4 border border-gray-200 text-sm">
                {/* 1. Poll Start */}
                <div>
                  <label className="block font-bold text-gray-700 mb-1">📢 투표 시작</label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      name="pollDate"
                      value={formData.pollDate}
                      onChange={handleChange}
                      className="border p-2 rounded w-full text-gray-900"
                    />
                    <input
                      type="time"
                      name="pollTime"
                      value={formData.pollTime}
                      onChange={handleChange}
                      className="border p-2 rounded w-32 text-gray-900"
                    />
                  </div>
                </div>

                {/* 2. Soft Deadline (Optional) */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <input
                      type="checkbox"
                      id="useSoft"
                      checked={useSoftDeadline}
                      onChange={(e) => setUseSoftDeadline(e.target.checked)}
                      className="w-4 h-4 accent-black text-gray-900"
                    />
                    <label htmlFor="useSoft" className="font-bold text-gray-700 cursor-pointer">
                      🔔 독려 알림 (선택)
                    </label>
                  </div>

                  {useSoftDeadline && (
                    <div className="flex gap-2 pl-6">
                      <input
                        type="date"
                        name="softDate"
                        value={formData.softDate}
                        onChange={handleChange}
                        className="border p-2 rounded w-full text-gray-900"
                      />
                      <input
                        type="time"
                        name="softTime"
                        value={formData.softTime}
                        onChange={handleChange}
                        className="border p-2 rounded w-32 text-gray-900"
                      />
                    </div>
                  )}
                </div>

                {/* 3. Hard Deadline */}
                <div>
                  <label className="block font-bold text-red-600 mb-1">🚨 최종 마감</label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      name="hardDate"
                      value={formData.hardDate}
                      onChange={handleChange}
                      className="border p-2 rounded w-full text-gray-900"
                    />
                    <input
                      type="time"
                      name="hardTime"
                      value={formData.hardTime}
                      onChange={handleChange}
                      className="border p-2 rounded w-32 text-gray-900"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-black text-white font-bold rounded-xl text-lg hover:bg-gray-800 transition-all active:scale-[0.98] disabled:bg-gray-400"
            >
              {loading ? '생성 중...' : '매치 생성 완료'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
