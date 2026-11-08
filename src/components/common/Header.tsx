import React, { useEffect, useState } from 'react';
import { SchoolLogo } from './Logo';
import { useApp } from '../../context/AppContext';

interface HeaderProps {
  onOpenLogin?: () => void;
  onNavigateHome?: () => void;
  toggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenLogin,
  onNavigateHome,
  toggleSidebar,
  isSidebarOpen
}) => {
  const { currentUser, logout, systemConfig } = useApp();
  const [currentDateTime, setCurrentDateTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Format Thai date and time
      const thaiMonths = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
      ];
      const thaiDays = [
        'วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'
      ];
      const dayName = thaiDays[now.getDay()];
      const day = now.getDate();
      const month = thaiMonths[now.getMonth()];
      const year = now.getFullYear() + 543;
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');

      setCurrentDateTime(`${dayName}ที่ ${day} ${month} พ.ศ. ${year} • ${hours}:${minutes}:${seconds} น.`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-blue-100 shadow-[0_2px_12px_rgba(0,35,111,0.06)] no-print">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-18 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Left: Sidebar Toggle (when logged in or available) & School Crest */}
        <div className="flex items-center gap-2 sm:gap-3">
          {currentUser && toggleSidebar && (
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-xl text-slate-600 hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
              title={isSidebarOpen ? 'ซ่อนเมนู' : 'เปิดเมนูนำทาง'}
            >
              <span className="material-symbols-outlined text-2xl">
                {isSidebarOpen ? 'menu_open' : 'menu'}
              </span>
            </button>
          )}

          <div
            onClick={onNavigateHome}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group"
          >
            <SchoolLogo size="md" />
            <div className="flex flex-col">
              <span className="font-bold text-sm sm:text-base text-slate-900 leading-tight group-hover:text-blue-800 transition-colors">
                โรงเรียนสายปัญญารังสิต
              </span>
              <span className="text-[11px] sm:text-xs text-blue-600 font-semibold tracking-tight">
                ระบบลงทะเบียนรายวิชาเพิ่มเติม (SPR Electives)
              </span>
            </div>
          </div>
        </div>

        {/* Center: Live Thai Date, Month, Year & Time */}
        <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50/80 border border-blue-200/60 text-xs font-semibold text-slate-700 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="material-symbols-outlined text-blue-700 text-sm">schedule</span>
          <span>{currentDateTime}</span>
          <span className="text-blue-300">|</span>
          <span className="text-blue-800 font-bold">
            ภาคเรียนที่ {systemConfig.semester}/{systemConfig.academicYear}
          </span>
        </div>

        {/* Right: User status or Login Button */}
        <div className="flex items-center gap-2 sm:gap-3">
          {currentUser ? (
            <div className="flex items-center gap-2 sm:gap-3">
              {/* User badge */}
              <div className="hidden sm:flex min-w-0 max-w-[34vw] sm:max-w-[220px] flex-col text-right">
                <span title={currentUser.fullName} className="text-xs sm:text-sm font-bold text-slate-900 leading-tight truncate">
                  {currentUser.fullName}
                </span>
                <span className="text-[11px] text-blue-600 font-medium">
                  {currentUser.role === 'student' && currentUser.studentData
                    ? `ชั้น ม.${currentUser.studentData.room} เลขที่ ${currentUser.studentData.numberInRoom} (รหัส ${currentUser.studentData.studentId})`
                    : currentUser.role === 'teacher'
                    ? 'ครูผู้สอนประจำรายวิชา'
                    : 'ผู้ดูแลระบบ (Admin)'}
                </span>
              </div>

              {/* Logout button */}
              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 rounded-xl transition-all shadow-2xs cursor-pointer active:scale-95"
                title="ออกจากระบบ"
              >
                <span className="material-symbols-outlined text-base">logout</span>
                <span className="hidden md:inline">ออกจากระบบ</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenLogin}
                className="flex items-center gap-1.5 bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-600 hover:from-blue-600 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl shadow-md shadow-blue-600/25 transition-all transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base sm:text-lg">login</span>
                <span>เข้าสู่ระบบ</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
