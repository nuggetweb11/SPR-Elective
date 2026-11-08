import React from 'react';
import { useApp } from '../../context/AppContext';

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  badge?: string | number;
}

interface SidebarProps {
  isOpen: boolean;
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  activeTab,
  onSelectTab,
  onCloseMobile
}) => {
  const { currentUser } = useApp();

  if (!currentUser) return null;

  // Determine items by role
  let navItems: NavItem[] = [];

  if (currentUser.role === 'admin') {
    navItems = [
      { id: 'overview', label: 'แดชบอร์ดภาพรวม', icon: 'dashboard' },
      { id: 'reports', label: 'พิมพ์รายงานราชการ', icon: 'print' },
      { id: 'classrooms', label: 'จัดการห้องเรียนและนักเรียน', icon: 'school' },
      { id: 'teachers', label: 'จัดการรายชื่อคุณครู', icon: 'badge' },
      { id: 'electives', label: 'จัดการวิชาเพิ่มเติม (ม.1 - ม.6)', icon: 'auto_stories' },
      { id: 'enrollment_management', label: 'จัดการลงทะเบียนให้นักเรียน', icon: 'how_to_reg' },
      { id: 'announcements', label: 'ข่าวสารประชาสัมพันธ์', icon: 'campaign' },
      { id: 'settings', label: 'ตั้งค่าระบบและล้างข้อมูล', icon: 'settings' },
      { id: 'admins', label: 'จัดการผู้ดูแลระบบ', icon: 'admin_panel_settings' }
    ];
  } else if (currentUser.role === 'teacher') {
    navItems = [
      { id: 'attendance', label: 'ตารางเช็คชื่อและจัดการวิชา', icon: 'fact_check' },
      { id: 'teacher_reports', label: 'พิมพ์เอกสารและส่งออก', icon: 'print' }
    ];
  } else if (currentUser.role === 'student') {
    navItems = [
      { id: 'catalog', label: 'เลือกลงทะเบียนรายวิชา', icon: 'how_to_reg' },
      { id: 'my_courses', label: 'รายวิชาที่ลงทะเบียน & เวลาเรียน', icon: 'menu_book' }
    ];
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 lg:hidden no-print"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed lg:sticky top-18 sm:top-20 bottom-0 left-0 z-30 bg-white border-r border-blue-100 flex flex-col transition-all duration-300 ease-in-out shadow-sm no-print ${
          isOpen
            ? 'w-64 sm:w-72 translate-x-0'
            : '-translate-x-full lg:translate-x-0 lg:w-20'
        }`}
      >
        {/* User Info Header */}
        <div className="p-4 border-b border-blue-50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-bold shrink-0">
            <span className="material-symbols-outlined text-xl">
              {currentUser.role === 'admin'
                ? 'shield_person'
                : currentUser.role === 'teacher'
                ? 'person'
                : 'school'}
            </span>
          </div>
          {isOpen && (
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                {currentUser.role === 'admin'
                  ? 'ระบบผู้ดูแล'
                  : currentUser.role === 'teacher'
                  ? 'ระบบคุณครู'
                  : 'ระบบนักเรียน'}
              </span>
              <span className="text-sm font-bold text-slate-800 truncate" title={currentUser.fullName}>
                {currentUser.fullName}
              </span>
            </div>
          )}
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  if (onCloseMobile && window.innerWidth < 1024) {
                    onCloseMobile();
                  }
                }}
                className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-700 to-indigo-600 text-white shadow-md shadow-blue-600/25'
                    : 'text-slate-600 hover:text-blue-800 hover:bg-blue-50/70'
                } ${!isOpen ? 'justify-center px-0' : ''}`}
                title={!isOpen ? item.label : undefined}
              >
                <span
                  className={`material-symbols-outlined text-xl shrink-0 ${
                    isActive ? 'text-amber-300' : 'text-slate-500'
                  }`}
                >
                  {item.icon}
                </span>

                {isOpen && (
                  <span className="truncate text-left flex-1">{item.label}</span>
                )}

                {isOpen && item.badge && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom indicator */}
        {isOpen && (
          <div className="p-4 border-t border-blue-50 text-[11px] text-slate-600 text-center font-medium">
            โรงเรียนสายปัญญารังสิต • ม.1 - ม.6
          </div>
        )}
      </aside>
    </>
  );
};
