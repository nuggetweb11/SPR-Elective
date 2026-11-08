import React, { useEffect, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { LandingPage } from './components/home/LandingPage';
import { LoginPage } from './components/auth/LoginPage';
import { StudentPortal } from './components/student/StudentPortal';
import { TeacherPortal } from './components/teacher/TeacherPortal';
import { AdminPortal } from './components/admin/AdminPortal';

function MainApp() {
  const { currentUser } = useApp();

  // Public views: 'home' | 'login'
  const [guestView, setGuestView] = useState<'home' | 'login'>('home');

  // Sidebar toggle state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Active tab states for each role
  const [studentTab, setStudentTab] = useState<string>('catalog');
  const [teacherTab, setTeacherTab] = useState<string>('attendance');
  const [adminTab, setAdminTab] = useState<string>('overview');

  // Keep the role's landing view as the first screen after each login.
  useEffect(() => {
    if (currentUser?.role === 'student') setStudentTab('catalog');
    if (currentUser?.role === 'teacher') setTeacherTab('attendance');
    if (currentUser?.role === 'admin') setAdminTab('overview');
  }, [currentUser?.role]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    const main = document.querySelector('main[role="main"]');
    main?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [currentUser?.role, studentTab, teacherTab, adminTab]);

  // If not logged in
  if (!currentUser) {
    if (guestView === 'login') {
      return (
        <LoginPage
          onBackToHome={() => setGuestView('home')}
          onLoginSuccess={() => {
            // When login succeeds, currentUser will become available in next render
          }}
        />
      );
    }
    return (
      <div className="min-h-screen flex flex-col bg-[#f8fafc]">
        <Header onOpenLogin={() => setGuestView('login')} />
        <main className="flex-1">
          <LandingPage onGoToLogin={() => setGuestView('login')} />
        </main>
      </div>
    );
  }

  // Determine active tab based on role
  const activeTab =
    currentUser.role === 'student'
      ? studentTab
      : currentUser.role === 'teacher'
      ? teacherTab
      : adminTab;

  const handleSelectTab = (tabId: string) => {
    if (currentUser.role === 'student') {
      setStudentTab(tabId);
    } else if (currentUser.role === 'teacher') {
      setTeacherTab(tabId);
    } else {
      setAdminTab(tabId);
    }
  };


  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-800">
      
      {/* Top Header */}
      <Header
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
        onNavigateHome={() => {
          if (currentUser.role === 'student') setStudentTab('catalog');
          else if (currentUser.role === 'teacher') setTeacherTab('attendance');
          else setAdminTab('overview');
        }}
      />

      {/* Main Container with Sidebar + Content */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Left Collapsible Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          onCloseMobile={() => setIsSidebarOpen(false)}
        />

        {/* Dynamic Main Workspace Content */}
        <main role="main" className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-x-hidden">
          {currentUser.role === 'student' && (
            <StudentPortal
              activeTab={studentTab}
              onSelectTab={setStudentTab}
            />
          )}

          {currentUser.role === 'teacher' && (
            <TeacherPortal
              activeTab={teacherTab}
              onSelectTab={setTeacherTab}
            />
          )}

          {currentUser.role === 'admin' && (
            <AdminPortal
              activeTab={adminTab}
              onSelectTab={setAdminTab}
            />
          )}
        </main>
      </div>

    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
