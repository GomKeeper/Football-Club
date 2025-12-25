'use client';
import { useState, useEffect } from 'react';
import { updateMatch, type Match } from '@/lib/api';
import { parseKSTForInput } from '@/lib/utils'; // Use the helper we made in Part 1

interface Props {
  isOpen: boolean;
  onClose: () => void;
  match: Match;
  onUpdate: () => void; // Trigger refresh in parent
}

export default function EditMatchModal({ isOpen, onClose, match, onUpdate }: Props) {
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    matchDate: '',
    matchTime: '',
    status: '',
    desc: '',
  });

  // Initialize form with Match Data (Converted to KST)
  useEffect(() => {
    if (match && isOpen) {
      const { date, time } = parseKSTForInput(match.start_time);
      setFormData({
        name: match.name,
        location: match.location,
        matchDate: date,
        matchTime: time,
        status: match.status,
        desc: '', // Description might not be in the list view object, ideally fetch detail if needed
      });
    }
  }, [match, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const utcDate = new Date(`${formData.matchDate}T${formData.matchTime}:00+09:00`);

      // Validation: Check if date is valid
      if (isNaN(utcDate.getTime())) {
        throw new Error("날짜 형식이 올바르지 않습니다.");
      }

      await updateMatch(match.id, {
        name: formData.name,
        location: formData.location,
        start_time: utcDate.toISOString(),
        status: formData.status,
        // Add other fields (deadlines) logic here if needed similar to Manual Modal
      });

      alert('매치가 수정되었습니다.');
      onUpdate();
      onClose();
    } catch (error) {
      console.error(error);
      alert('수정 실패');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl">
        <h3 className="text-xl font-bold mb-4">매치 정보 수정</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500">매치 이름</label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full border p-2 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-bold text-gray-500">날짜 (KST)</label>
              <input
                type="date"
                name="matchDate"
                value={formData.matchDate}
                onChange={handleChange}
                className="w-full border p-2 rounded-lg"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500">시간 (KST)</label>
              <input
                type="time"
                name="matchTime"
                value={formData.matchTime}
                onChange={handleChange}
                className="w-full border p-2 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500">장소</label>
            <input
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full border p-2 rounded-lg"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500">상태</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full border p-2 rounded-lg bg-white"
            >
              <option value="RECRUITING">RECRUITING (모집중)</option>
              <option value="CLOSED">CLOSED (마감)</option>
              <option value="CANCELLED">CANCELLED (취소)</option>
              <option value="FINISHED">FINISHED (종료)</option>
            </select>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-gray-600 bg-gray-100 rounded-xl font-bold"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-black text-white rounded-xl font-bold"
            >
              {loading ? '저장 중...' : '저장 완료'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
