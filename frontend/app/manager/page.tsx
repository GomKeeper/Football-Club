'use client';

import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ManagerDashboard() {
  const { member, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && member) {
      if (!member.roles.includes('ADMIN') && !member.roles.includes('MANAGER')) {
        alert('관리자 권한이 필요합니다.');
        router.push('/dashboard');
        return;
      }
    }
  }, [loading, member, router]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">👋 운영진 {member?.name} 님, 어서오세요!</h2>
        <p className="text-gray-500 mt-2">오늘 저희 FC에서 진행되는 일정입니다.</p>
      </div>

      {/* Quick Stats / Shortcuts */}
      <div className="grid md:grid-cols-3 gap-6">
        <Link href="/manager/matches" className="block group">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition transform hover:-translate-y-1">
            <div className="text-4xl mb-4">⚽</div>
            <h3 className="font-bold text-lg">경기 관리</h3>
            <p className="text-blue-100 text-sm mt-1">경기 생성, 수정, 관리</p>
          </div>
        </Link>

        <Link href="/manager/notifications" className="block group">
          <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition transform hover:-translate-y-1">
            <div className="text-4xl mb-4">📢</div>
            <h3 className="font-bold text-lg text-black">공지 관리</h3>
            <p className="text-yellow-900 text-sm mt-1 opacity-80">공지사항 전달</p>
          </div>
        </Link>

        <Link href="/manager/members" className="block group">
          <div className="bg-white border rounded-2xl p-6 text-gray-800 shadow-sm hover:shadow-md transition transform hover:-translate-y-1">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="font-bold text-lg">회원 관리</h3>
            <p className="text-gray-400 text-sm mt-1">회원 등록, 수정, 관리</p>
          </div>
        </Link>
      </div>

      {/* (Optional) Recent Activity Log could go here */}
    </div>
  );
}
