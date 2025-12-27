'use client';
import { useState, useEffect } from 'react';
import { updateMatch, type Match } from '@/lib/api';
import { parseKSTForInput, toKSTLocalString } from '@/lib/utils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  match: Match;
  onUpdate: () => void;
}

export default function EditMatchModal({ isOpen, onClose, match, onUpdate }: Props) {
  const [loading, setLoading] = useState(false);

  // Expanded Form State
  const [formData, setFormData] = useState({
    // Basics
    name: '',
    description: '',
    location: '',
    status: '',
    
    // Schedule
    matchDate: '',
    matchTime: '',
    duration_minutes: 120,

    // Participants
    min_participants: 10,
    max_participants: 22,

    // Deadlines (Datetime-local strings)
    polling_start_at: '',
    soft_deadline_at: '',
    hard_deadline_at: '',
  });

  // Initialize form with Match Data
  useEffect(() => {
    if (match && isOpen) {
      const { date, time } = parseKSTForInput(match.start_time);
      
      setFormData({
        name: match.name,
        description: match.description || '', // Ensure field exists in API type
        location: match.location,
        status: match.status,
        
        matchDate: date,
        matchTime: time,
        duration_minutes: match.duration_minutes || 120, // Fallback if missing

        min_participants: match.min_participants,
        max_participants: match.max_participants,

        // Convert UTC timestamps to KST for the inputs
        polling_start_at: toKSTLocalString(match.polling_start_at),
        soft_deadline_at: toKSTLocalString(match.soft_deadline_at),
        hard_deadline_at: toKSTLocalString(match.hard_deadline_at),
      });
    }
  }, [match, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Recombine Match Start Time (KST Input -> UTC ISO)
      // "2025-05-20" + "19:00" -> "2025-05-20T19:00:00+09:00"
      const startTimeISO = new Date(`${formData.matchDate}T${formData.matchTime}:00+09:00`).toISOString();

      // 2. Convert Deadlines (KST Input -> UTC ISO)
      // We append "+09:00" because the input value is physically KST time
      const toUTC = (localStr: string) => 
        localStr ? new Date(`${localStr}:00+09:00`).toISOString() : undefined;

      // 3. Construct Payload
      const payload = {
        name: formData.name,
        description: formData.description,
        location: formData.location,
        status: formData.status,
        
        start_time: startTimeISO,
        // Calculate end_time based on duration
        end_time: new Date(new Date(startTimeISO).getTime() + formData.duration_minutes * 60000).toISOString(),
        duration_minutes: Number(formData.duration_minutes),
        
        min_participants: Number(formData.min_participants),
        max_participants: Number(formData.max_participants),

        polling_start_at: toUTC(formData.polling_start_at),
        soft_deadline_at: toUTC(formData.soft_deadline_at),
        hard_deadline_at: toUTC(formData.hard_deadline_at),
      };

      await updateMatch(match.id, payload);

      alert('매치 정보가 성공적으로 수정되었습니다.');
      onUpdate();
      onClose();
    } catch (error) {
      console.error(error);
      alert('수정 실패: 입력값을 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl">
          <h3 className="text-xl font-bold text-gray-900">매치 상세 수정 (Edit Match)</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          <form id="edit-match-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* --- 1. Basic Info --- */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-blue-800 uppercase tracking-wide border-b pb-1">기본 정보</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-gray-900">매치 이름</label>
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
                    required
                  />
                </div>
                
                <div>
                  <label className="text-xs font-bold text-gray-900">상태 (Status)</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full border p-2 rounded-lg bg-white text-gray-800"
                  >
                    <option value="RECRUITING">🟢 모집중 (RECRUITING)</option>
                    <option value="CLOSED">🔴 마감 (CLOSED)</option>
                    <option value="CANCELLED">⚫ 취소 (CANCELLED)</option>
                    <option value="FINISHED">🏁 종료 (FINISHED)</option>
                  </select>
                </div>

                <div>
                   <label className="text-xs font-bold text-gray-800">장소 (Location)</label>
                   <input
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full border p-2 rounded-lg text-gray-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-900">설명 (Description)</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full border p-2 rounded-lg resize-none text-gray-800"
                  placeholder="매치에 대한 추가 설명을 입력하세요."
                />
              </div>
            </div>

            {/* --- 2. Schedule & Rules --- */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-blue-600 uppercase tracking-wide border-b pb-1">일정 및 규칙</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-900">경기 날짜</label>
                  <input
                    type="date"
                    name="matchDate"
                    value={formData.matchDate}
                    onChange={handleChange}
                    className="w-full border p-2 rounded-lg text-gray-800"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-900">시작 시간</label>
                  <input
                    type="time"
                    name="matchTime"
                    value={formData.matchTime}
                    onChange={handleChange}
                    className="w-full border p-2 rounded-lg text-gray-800"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-900">경기 시간 (분)</label>
                  <input
                    type="number"
                    name="duration_minutes"
                    value={formData.duration_minutes}
                    onChange={handleChange}
                    className="w-full border p-2 rounded-lg text-gray-800"
                  />
                </div>
                 {/* Empty spacer for grid alignment */}
                 <div className="hidden md:block"></div>

                <div>
                  <label className="text-xs font-bold text-gray-900">최소 인원</label>
                  <input
                    type="number"
                    name="min_participants"
                    value={formData.min_participants}
                    onChange={handleChange}
                    className="w-full border p-2 rounded-lg text-gray-800"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-900">최대 인원</label>
                  <input
                    type="number"
                    name="max_participants"
                    value={formData.max_participants}
                    onChange={handleChange}
                    className="w-full border p-2 rounded-lg text-gray-800"
                  />
                </div>
              </div>
            </div>

            {/* --- 3. Deadlines (Advanced) --- */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-red-600 uppercase tracking-wide border-b pb-1 flex justify-between">
                운영 마감일 설정 (Deadlines)
                <span className="text-[10px] text-gray-600 normal-case font-normal">한국 표준 시간대 기준</span>
              </h4>
              
              <div className="space-y-3">
                <div className="grid grid-cols-3 items-center gap-2">
                  <label className="text-xs font-bold text-gray-900 col-span-1">투표 시작 (Polling Open)</label>
                  <input
                    type="datetime-local"
                    name="polling_start_at"
                    value={formData.polling_start_at}
                    onChange={handleChange}
                    className="col-span-2 border p-2 rounded-lg text-sm text-gray-800"
                  />
                </div>
                <div className="grid grid-cols-3 items-center gap-2">
                  <label className="text-xs font-bold text-gray-900 col-span-1">1차 마감 (Soft)</label>
                  <input
                    type="datetime-local"
                    name="soft_deadline_at"
                    value={formData.soft_deadline_at}
                    onChange={handleChange}
                    className="col-span-2 border p-2 rounded-lg text-sm text-gray-800"
                  />
                </div>
                <div className="grid grid-cols-3 items-center gap-2">
                  <label className="text-xs font-bold text-gray-900 col-span-1">최종 마감 (Hard)</label>
                  <input
                    type="datetime-local"
                    name="hard_deadline_at"
                    value={formData.hard_deadline_at}
                    onChange={handleChange}
                    className="col-span-2 border p-2 rounded-lg text-sm border-red-100 bg-red-50 text-gray-800"
                  />
                </div>
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 rounded-b-2xl flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 text-gray-600 bg-white border border-gray-300 rounded-xl font-bold hover:bg-gray-100"
          >
            취소
          </button>
          <button
            type="submit"
            form="edit-match-form"
            disabled={loading}
            className="flex-1 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-colors"
          >
            {loading ? '저장 중...' : '변경사항 저장'}
          </button>
        </div>
      </div>
    </div>
  );
}