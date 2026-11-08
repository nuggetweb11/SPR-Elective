import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

interface LandingPageProps {
  onGoToLogin: () => void;
  onSelectCourseToRegister?: (courseCode: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGoToLogin }) => {
  const { courses, students, teachers, announcements, systemConfig, gradeSettings, getEnrolledCount } = useApp();

  // Search & Filter state for courses catalog
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<number | 'all'>('all');
  const [showCatalogModal, setShowCatalogModal] = useState(false);

  // Filter public announcements
  const publicAnnouncements = announcements.filter(
    a => a.target === 'all' || a.target === 'public'
  );

  // Calculate stats
  const totalStudents = students.length || 3250;
  const totalTeachers = teachers.length;
  const totalCourses = courses.length;
  const totalSeats = courses.reduce((acc, c) => acc + c.maxStudents, 0);
  const totalEnrolled = students.filter(s => s.registeredCourseCode !== null).length;
  const availableSeats = Math.max(0, totalSeats - totalEnrolled);
  const enrolledPercent = totalSeats > 0 ? Math.round((totalEnrolled / totalSeats) * 100) : 0;
  const anyGradeOpen = courses.length > 0 && courses.some(course => gradeSettings[course.grade]?.isOpen ?? true);
  const allCoursesFull = courses.length > 0 && courses.every(course => getEnrolledCount(course.code) >= course.maxStudents);

  // Filter courses by grade and search query (name or teacher)
  const filteredCourses = courses.filter(course => {
    const matchesGrade = selectedGrade === 'all' || course.grade === selectedGrade;
    const query = searchQuery.trim().toLowerCase();
    if (!query) return matchesGrade;
    const matchesQuery =
      course.name.toLowerCase().includes(query) ||
      course.code.toLowerCase().includes(query) ||
      course.teacherName.toLowerCase().includes(query) ||
      (course.classroom && course.classroom.toLowerCase().includes(query));
    return matchesGrade && matchesQuery;
  });

  return (
    <div className="landing-page flex flex-col w-full min-w-0 bg-[#f8fafc] items-stretch">
      
      {/* Hero Section */}
      <section className="relative w-full bg-gradient-to-b from-blue-50 via-white to-[#f8fafc] py-12 lg:py-16 text-center overflow-hidden border-b border-blue-100/60">
        <div className="w-full max-w-5xl mx-auto px-3 sm:px-4 relative z-10 flex flex-col items-center">
          
          {/* Official Transparent School Emblem */}
          <div className="mb-4">
            <img
              src="/assets/aistudio/Spr_-_1_7d810253.png"
              alt="ตราโรงเรียนสายปัญญารังสิต"
              className="w-24 h-24 sm:w-28 sm:h-28 object-contain drop-shadow-sm hover:scale-105 transition-transform"
            />
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 text-blue-900 text-xs sm:text-sm font-semibold mb-4 border border-blue-200/80 shadow-2xs">
            <span className="material-symbols-outlined text-base text-blue-700">school</span>
            <span>ภาคเรียนที่ {systemConfig.semester} ปีการศึกษา {systemConfig.academicYear} | โรงเรียนสายปัญญารังสิต</span>
          </div>

          {/* Main Title */}
          <h1 className="w-full text-center text-[clamp(0.72rem,3.65vw,1.15rem)] sm:text-4xl lg:text-5xl font-extrabold text-[#00236f] tracking-tight leading-tight mb-7 sm:mb-8">
            <span className="block whitespace-nowrap">ระบบเลือกลงทะเบียนรายวิชาเพิ่มเติม</span>
            <span className="block whitespace-nowrap text-[0.9em] sm:text-[1em] bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">โรงเรียนสายปัญญารังสิต</span>
          </h1>

          {/* CTA Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-4">
            <button
              onClick={onGoToLogin}
              disabled={!anyGradeOpen || allCoursesFull}
              className={`flex items-center justify-center gap-2.5 font-bold text-sm sm:text-base px-5 sm:px-6 py-3.5 rounded-2xl shadow-lg transition-all ${!anyGradeOpen || allCoursesFull ? 'bg-slate-200 text-slate-500 cursor-not-allowed shadow-none' : 'bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-600 hover:from-blue-600 hover:to-indigo-500 text-white shadow-blue-600/30 hover:shadow-blue-600/40 transform hover:-translate-y-0.5 cursor-pointer active:scale-95'}`}
            >
              <span className="material-symbols-outlined text-xl text-amber-300">how_to_reg</span>
              <span className="whitespace-nowrap">{!anyGradeOpen ? 'ยังไม่เปิดระบบ' : allCoursesFull ? 'นักเรียนครบตามจำนวน' : 'เข้าสู่ระบบเพื่อลงทะเบียน'}</span>
            </button>

            <button
              onClick={() => {
                setShowCatalogModal(true);
                const catalogElem = document.getElementById('course-catalog-section');
                if (catalogElem) {
                  catalogElem.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="flex items-center gap-2 bg-white hover:bg-amber-50 text-slate-800 font-bold text-sm sm:text-base px-6 py-3.5 rounded-2xl shadow-md border border-amber-300 hover:border-amber-400 transform hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl text-amber-500">menu_book</span>
              <span>รายวิชาที่เปิดรับสมัคร</span>
            </button>
          </div>
        </div>
      </section>

      {/* Key Institutional Metrics Cards Section */}
      <section className="w-full py-8 lg:py-12 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            
            {/* 1. Total Students */}
            <div className="bg-gradient-to-br from-blue-50 via-white to-blue-50/40 p-5 sm:p-6 rounded-3xl shadow-sm border border-blue-100 hover:border-blue-200 hover:shadow-md transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-blue-900">นักเรียนในระบบทั้งหมด</span>
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/30">
                  <span className="material-symbols-outlined text-xl">group</span>
                </div>
              </div>
              <div className="mb-2">
                <span className="text-3xl font-extrabold text-[#00236f]">{totalStudents.toLocaleString()}</span>
                <span className="text-xs text-slate-500 ml-1.5">คน (ม.1 - ม.6)</span>
              </div>
              <div>
                <div className="flex justify-between items-center text-xs font-semibold mb-1 text-slate-500">
                  <span>ลงทะเบียนแล้ว</span>
                  <span className="text-blue-700 font-bold">{enrolledPercent}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-blue-100 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, enrolledPercent)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* 2. Total Teachers */}
            <div className="bg-gradient-to-br from-purple-50 via-white to-purple-50/40 p-5 sm:p-6 rounded-3xl shadow-sm border border-purple-100 hover:border-purple-200 hover:shadow-md transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-purple-900">ครูผู้สอนและที่ปรึกษา</span>
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-purple-500/30">
                  <span className="material-symbols-outlined text-xl">record_voice_over</span>
                </div>
              </div>
              <div className="mb-2">
                <span className="text-3xl font-extrabold text-purple-950">{totalTeachers}</span>
                <span className="text-xs text-slate-500 ml-1.5">ท่าน</span>
              </div>
            </div>

            {/* 3. Total Courses */}
            <div className="bg-gradient-to-br from-cyan-50 via-white to-cyan-50/40 p-5 sm:p-6 rounded-3xl shadow-sm border border-cyan-100 hover:border-cyan-200 hover:shadow-md transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-cyan-950">รายวิชาเพิ่มเติมที่เปิดรับ</span>
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white shadow-sm shadow-cyan-500/30">
                  <span className="material-symbols-outlined text-xl">auto_stories</span>
                </div>
              </div>
              <div className="mb-2">
                <span className="text-3xl font-extrabold text-[#00236f]">{totalCourses}</span>
                <span className="text-xs text-slate-500 ml-1.5">รายวิชา</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-cyan-800 bg-cyan-100/60 px-3 py-1 rounded-full w-fit font-medium">
                <span className="material-symbols-outlined text-sm text-cyan-600">category</span>
                <span>ระดับชั้น ม.1 ถึง ม.6</span>
              </div>
            </div>

            {/* 4. Available Seats */}
            <div className="bg-gradient-to-br from-amber-50 via-white to-amber-50/40 p-5 sm:p-6 rounded-3xl shadow-sm border border-amber-100 hover:border-amber-200 hover:shadow-md transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-950">ที่นั่งคงเหลือรวม</span>
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-sm shadow-amber-500/30">
                  <span className="material-symbols-outlined text-xl">event_seat</span>
                </div>
              </div>
              <div className="mb-2">
                <span className="text-3xl font-extrabold text-orange-600">{availableSeats.toLocaleString()}</span>
                <span className="text-xs text-slate-500 ml-1.5">ที่นั่ง</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-100/80 px-3 py-1 rounded-full w-fit font-semibold shadow-2xs">
                <span className="material-symbols-outlined text-sm text-emerald-600">bolt</span>
                <span>อัปเดตแบบ Real-time</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Announcements Section */}
      <section className="w-full py-10 bg-white border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-xl">campaign</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                ข่าวสารและประกาศประชาสัมพันธ์
              </h2>
            </div>
            <span className="text-xs font-semibold text-slate-500">โรงเรียนสายปัญญารังสิต</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {publicAnnouncements.map((ann) => (
              <div
                key={ann.id}
                className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 hover:border-blue-200 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
                      {ann.target === 'all' ? 'ทุกคน' : 'บุคคลภายนอก'}
                    </span>
                    <span className="text-slate-600 font-medium">{ann.date}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 mb-2 leading-snug">
                    {ann.title}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{ann.content}</p>
                  {ann.attachments?.length ? <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">{ann.attachments.map((file, index) => (
                    file.type.startsWith('image/') ? <a key={`${file.name}-${index}`} href={file.url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border border-slate-200"><img src={file.url} alt={file.name} className="w-full h-28 object-cover"/><span className="block px-2 py-1 text-[10px] truncate text-slate-600">{file.name}</span></a> : <a key={`${file.name}-${index}`} href={file.url} download={file.name} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-2 text-[11px] font-semibold text-blue-800 break-all">📎 {file.name}</a>
                  ))}</div> : null}
                  {ann.link ? <a className="mt-3 inline-flex text-xs font-bold text-blue-700 underline break-all" href={ann.link} target="_blank" rel="noreferrer">เปิดลิงก์เพิ่มเติม</a> : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Course Catalog Search & Filter Section */}
      <section className="w-full py-10 lg:py-14 bg-[#f8fafc]" id="course-catalog-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
          
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-blue-700 font-bold text-xs uppercase tracking-wider mb-1">
                <span className="material-symbols-outlined text-base">explore</span>
                <span>ค้นหาและตรวจสอบรายวิชา</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#00236f] tracking-tight">
                รายวิชาเพิ่มเติมที่เปิดรับสมัคร
              </h2>
            </div>
            
            {/* Search Input for Course / Teacher */}
            <div className="w-full md:w-80 relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="กรอกชื่อวิชา / รหัสวิชา / ชื่อคุณครู..."
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white border border-slate-300 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 shadow-2xs transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs p-1"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              )}
            </div>
          </div>

          {/* Grade Level Buttons Filter: "โดยถ้าเลือกระดับชั้นอย่างเดียวจะแสดงทุกรายวิชาของระดับชั้นนั้น" */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <span className="text-xs font-bold text-slate-500 whitespace-nowrap mr-1">
              ระดับชั้น:
            </span>
            <button
              onClick={() => setSelectedGrade('all')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedGrade === 'all'
                  ? 'bg-blue-700 text-white shadow-md shadow-blue-700/25'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              ทั้งหมด
            </button>
            {[1, 2, 3, 4, 5, 6].map((grade) => {
              return (
                <button
                  key={grade}
                  onClick={() => setSelectedGrade(grade)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                    selectedGrade === grade
                      ? 'bg-blue-700 text-white shadow-md shadow-blue-700/25'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  มัธยมศึกษาปีที่ {grade}
                </button>
              );
            })}
          </div>

          {/* Courses Grid Cards */}
          {filteredCourses.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-3 shadow-sm">
              <span className="material-symbols-outlined text-5xl text-slate-300">search_off</span>
              <h3 className="text-base font-bold text-slate-800">ไม่พบรายวิชาที่ตรงกับเงื่อนไขการค้นหา</h3>
              <p className="text-xs text-slate-500">กรุณาลองเปลี่ยนคำค้นหา หรือเลือกดูระดับชั้นอื่น</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedGrade('all');
                }}
                className="px-4 py-2 bg-blue-50 text-blue-700 text-xs font-bold rounded-xl hover:bg-blue-100 transition-colors cursor-pointer"
              >
                แสดงรายวิชาทั้งหมด
              </button>
            </div>
          ) : (
            <div className="course-card-grid grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              {filteredCourses.map((course) => {
                const enrolled = getEnrolledCount(course.code);
                const isFull = enrolled >= course.maxStudents;
                const percent = Math.min(100, Math.round((enrolled / course.maxStudents) * 100));

                return (
                  <div
                    key={course.code}
                    className="course-card min-w-0 bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-6 border border-slate-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300 flex flex-col justify-between group sm:hover:-translate-y-1"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 border border-blue-200/60 font-bold text-xs font-mono">
                            {course.code}
                          </span>
                          <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-600 font-semibold text-xs">
                            มัธยมศึกษาปีที่ {course.grade}
                          </span>
                        </div>
                        <span
                          className={`shrink-0 whitespace-nowrap px-2 py-1 rounded-full text-[10px] sm:text-xs font-bold ${
                            gradeSettings[course.grade]?.isOpen === false ? 'bg-slate-100 text-slate-600' : isFull ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {gradeSettings[course.grade]?.isOpen === false ? 'ปิดระบบ' : isFull ? 'ที่นั่งเต็ม' : 'เปิดรับสมัคร'}
                        </span>
                      </div>

                      {/* Course Title */}
                      <h3 className="text-xs sm:text-base font-bold text-slate-900 group-hover:text-blue-700 transition-colors leading-snug mb-2 break-words">
                        {course.name}
                      </h3>

                      {course.description && (
                        <p className="text-[10px] sm:text-xs text-slate-500 line-clamp-2 mb-3 sm:mb-4 leading-relaxed">
                          {course.description}
                        </p>
                      )}

                      {/* Course Details Box */}
                      <div className="space-y-1.5 sm:space-y-2 bg-slate-50/90 rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 text-[10px] sm:text-xs text-slate-600 border border-slate-100 mb-3 sm:mb-4 break-words">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-blue-600 text-base shrink-0">person</span>
                          <span>คุณครูผู้สอน: <strong className="text-slate-800 font-semibold">{course.teacherName}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-amber-500 text-base shrink-0">schedule</span>
                          <span>วันที่เรียน: <span className="font-medium text-slate-800">{course.dayOfWeek} {course.period}</span></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-indigo-600 text-base shrink-0">meeting_room</span>
                          <span>ห้องเรียน: <span className="font-medium text-slate-800">{course.classroom}</span></span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500">
                          <span className="material-symbols-outlined text-purple-600 text-base shrink-0">groups</span>
                          <span>ห้องเรียนที่เปิดรับ: <strong className="text-slate-700">{course.allowedRooms.join(', ')}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Seats & Action */}
                    <div className="pt-3 border-t border-slate-100 space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">จำนวนนักเรียนที่เข้าแล้ว:</span>
                        <div className="text-right">
                          <span className="font-bold text-slate-900 text-sm">{enrolled} / {course.maxStudents}</span> คน
                          <span className={`ml-1 font-semibold ${isFull ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {isFull ? '(เต็ม)' : `(เหลือ ${course.maxStudents - enrolled})`}
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isFull
                              ? 'bg-rose-500'
                              : percent > 75
                              ? 'bg-amber-500'
                              : 'bg-blue-600'
                          }`}
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>

                      <button
                        onClick={onGoToLogin}
                        disabled={gradeSettings[course.grade]?.isOpen === false || isFull}
                        className={`w-full min-h-9 px-1.5 py-2 rounded-xl font-bold text-[10px] sm:text-xs leading-tight flex items-center justify-center gap-1 transition-all ${
                          gradeSettings[course.grade]?.isOpen === false || isFull ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-700 to-indigo-600 hover:from-blue-600 hover:to-indigo-500 text-white shadow-md shadow-blue-600/20 active:scale-98 cursor-pointer'
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm sm:text-base">how_to_reg</span>
                        <span className="text-center">{gradeSettings[course.grade]?.isOpen === false ? 'ยังไม่เปิดระบบ' : isFull ? 'นักเรียนครบตามจำนวน' : 'เข้าสู่ระบบเพื่อลงทะเบียน'}</span>
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      </section>

      {/* FAQ & Support Section */}
      <section className="w-full py-10 bg-slate-50 border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            <div className="lg:col-span-7 space-y-4">
              <div>
                <span className="text-blue-700 font-bold text-xs uppercase tracking-wider">
                  คำถามที่พบบ่อย (FAQ)
                </span>
                <h3 className="text-xl font-bold text-[#00236f] mt-1">
                  ข้อสงสัยเกี่ยวกับการลงทะเบียนวิชาเพิ่มเติม
                </h3>
              </div>

              <div className="space-y-3 text-xs sm:text-sm">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                  <h4 className="font-bold text-slate-800 mb-1 flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-600 text-base">help</span>
                    <span>หากรายวิชาที่ต้องการเลือกเต็มแล้ว ต้องทำอย่างไร?</span>
                  </h4>
                  <p className="text-slate-600 pl-6 leading-relaxed">
                    นักเรียนสามารถเลือกลงทะเบียนรายวิชาอื่นในระดับชั้นเดียวกันที่มีที่นั่งว่างอยู่
                    หรือติดต่อครูที่ปรึกษาประจำชั้นเพื่อขอคำแนะนำเพิ่มเติม
                  </p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                  <h4 className="font-bold text-slate-800 mb-1 flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-600 text-base">help</span>
                    <span>รหัสผ่านเข้าสู่ระบบของนักเรียนคืออะไร?</span>
                  </h4>
                  <p className="text-slate-600 pl-6 leading-relaxed">
                    ชื่อผู้ใช้งาน (Username) คือ <strong>รหัสประจำตัวนักเรียน 5 หลัก</strong> และรหัสผ่าน (Password) คือ <strong>เลขประจำตัวประชาชน 13 หลัก</strong> ของนักเรียน
                  </p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                  <h4 className="font-bold text-slate-800 mb-1 flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-600 text-base">help</span>
                    <span>เข้าสู่ระบบแล้วรีเฟรชหน้าจอจะหลุดออกจากระบบหรือไม่?</span>
                  </h4>
                  <p className="text-slate-600 pl-6 leading-relaxed">
                    ระบบได้รับการออกแบบให้บันทึกสถานะการเข้าสู่ระบบไว้อย่างปลอดภัย นักเรียนสามารถรีเฟรชหน้าจอได้โดยระบบจะไม่หลุดออกจากระบบ
                  </p>
                </div>
              </div>
            </div>

            {/* Support contact info */}
            <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-2xl">support_agent</span>
                </div>
                <h4 className="text-base font-bold text-slate-900 mb-1">
                  ศูนย์ประสานงานวิชาการ โรงเรียนสายปัญญารังสิต
                </h4>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  หากพบปัญหาทางเทคนิค หรือข้อมูลวิชาไม่ถูกต้อง สามารถติดต่อได้ในวันและเวลาราชการ
                </p>
                <div className="space-y-2 text-xs text-slate-700">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2">
                    <span className="material-symbols-outlined text-blue-600 text-base mt-0.5">location_on</span>
                    <div>
                      <strong className="block text-slate-800">กลุ่มบริหารวิชาการ (อาคาร 2 ชั้น 1)</strong>
                      <span className="text-slate-500">เลขที่ 99 หมู่ 2 ตำบลประชาธิปัตย์ อำเภอธัญบุรี จังหวัดปทุมธานี 12130</span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-600 text-base">call</span>
                    <div>
                      <strong className="text-slate-800">โทรศัพท์: </strong>
                      <span className="text-slate-600">02-531-1558 ต่อ 104, 105</span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-600 text-base">mail</span>
                    <div>
                      <strong className="text-slate-800">อีเมล: </strong>
                      <span className="text-slate-600">academic@sprs.ac.th</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <button
                  onClick={onGoToLogin}
                  className="w-full py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">login</span>
                  <span>เข้าสู่ระบบเพื่อใช้งานระบบ</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full bg-white border-t border-slate-200/80 py-8 text-center text-xs text-slate-500">
        <p className="font-semibold text-slate-700 mb-1">
          โรงเรียนสายปัญญารังสิต (Saipanyarangsit School) • สำนักงานเขตพื้นที่การศึกษามัธยมศึกษาปทุมธานี
        </p>
        <p>© 2570 ระบบลงทะเบียนรายวิชาเพิ่มเติม. สงวนลิขสิทธิ์ทุกประการ.</p>
      </footer>

    </div>
  );
};
