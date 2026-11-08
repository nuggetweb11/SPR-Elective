import React, { useState } from 'react';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { Toast } from '../common/Toast';
import { useApp } from '../../context/AppContext';
import { ElectiveCourse } from '../../types';

interface StudentPortalProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({ activeTab, onSelectTab }) => {
  const {
    currentUser,
    courses,
    classrooms,
    gradeSettings,
    systemConfig,
    attendance,
    enrollCourse,
    getEnrolledCount
  } = useApp();

  const student = currentUser?.studentData;
  const grade = student ? parseInt(student.room.split('/')[0] || '4', 10) : 4;
  const gradeSetting = gradeSettings[grade];
  const isGradeRegistrationOpen = gradeSetting?.isOpen ?? true;

  // Search in student catalog
  const [searchQuery, setSearchQuery] = useState('');

  // Confirmation Modal state
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedCourseForEnroll, setSelectedCourseForEnroll] = useState<ElectiveCourse | null>(null);


  // Toast state
  const [toast, setToast] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
  }>({
    show: false,
    type: 'success',
    title: '',
    message: ''
  });

  const showToast = (
    titleOrType: string,
    messageOrTitle: string,
    optionalMessage?: string
  ) => {
    let type: 'success' | 'error' | 'warning' | 'info' = 'success';
    let title = titleOrType;
    let message = messageOrTitle;

    if (optionalMessage !== undefined) {
      type = (['success', 'error', 'warning', 'info'].includes(titleOrType) ? titleOrType : 'success') as any;
      title = messageOrTitle;
      message = optionalMessage;
    } else {
      if (titleOrType === 'ข้อผิดพลาด' || titleOrType.includes('ไม่สามารถ') || titleOrType.includes('ลบ')) {
        type = 'error';
      } else if (titleOrType.includes('เตือน') || titleOrType.includes('ปิด') || titleOrType.includes('เต็ม')) {
        type = 'warning';
      } else {
        type = 'success';
      }
    }

    setToast({ show: true, type, title, message });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 4500);
  };

  if (!student) {
    return (
      <div className="p-8 text-center text-slate-500">
        ไม่พบข้อมูลนักเรียน กรุณาเข้าสู่ระบบใหม่อีกครั้ง
      </div>
    );
  }

  // Find advisor for student's room
  const classroomObj = classrooms.find(c => c.roomNumber === student.room);
  const advisor = classroomObj?.advisor || 'อาจารย์ที่ปรึกษาประจำชั้น';
  const advisorNames = advisor.split(/\s*[,;|]\s*/).filter(Boolean);

  // Registered course
  const registeredCourse = student.registeredCourseCode
    ? courses.find(c => c.code === student.registeredCourseCode)
    : null;

  // Courses that the student can register:
  // "จะขึ้นรายวิชาที่นักเรียนสามารถลงทะเบียนได้ โดยจะขึ้นชื่อวิชา รหัสวิชา คุณครู วันที่เรียน ห้องเรียน เปิดรับกี่คน ระดับชั้นมัธยมศึกษาปีที่ ห้องเรียนที่เปิดรับ และแสดงจำนวนนักเรียนที่เข้าแล้ว"
  const availableCourses = courses.filter(course => {
    const isSameGrade = course.grade === grade;
    const allowsRoom = course.allowedRooms.includes(student.room);
    return isSameGrade && allowsRoom;
  });

  const filteredCatalog = availableCourses.filter(course => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      course.name.toLowerCase().includes(q) ||
      course.code.toLowerCase().includes(q) ||
      course.teacherName.toLowerCase().includes(q)
    );
  });

  // Calculate attendance statistics for registered course
  const courseDates = gradeSetting?.dates || [];
  const totalSessions = courseDates.length || 12;

  let presentCount = 0;
  let absentCount = 0;
  let leaveCount = 0;
  let sickCount = 0;

  if (registeredCourse) {
    courseDates.forEach((_, idx) => {
      const rec = attendance.find(
        r => r.courseCode === registeredCourse.code && r.studentId === student.studentId && r.sessionIndex === idx
      );
      const status = rec?.status || 'unmarked';
      if (status === 'present') presentCount++;
      else if (status === 'absent') absentCount++;
      else if (status === 'leave') leaveCount++;
      else if (status === 'sick') sickCount++;
    });
  }

  const attendancePercent =
    totalSessions > 0 ? Math.min(100, Math.round((presentCount / totalSessions) * 100)) : 100;

  // Handle clicking Register on a course card
  const handleOpenRegisterConfirm = (course: ElectiveCourse) => {
    if (!isGradeRegistrationOpen) {
      showToast('ระบบปิดอยู่', `ระบบลงทะเบียนระดับชั้น ม.${grade} ปิดให้บริการอยู่ในขณะนี้`);
      return;
    }

    if (student.registeredCourseCode) {
      showToast('ลงทะเบียนแล้ว', `คุณได้ลงทะเบียนวิชา ${student.registeredCourseCode} แล้ว หากต้องการเปลี่ยนวิชา กรุณาติดต่อผู้ดูแลระบบ`);
      return;
    }

    const currentEnrolled = getEnrolledCount(course.code);
    if (currentEnrolled >= course.maxStudents) {
      showToast('ที่นั่งเต็ม', 'รายวิชานี้จำนวนนักเรียนเต็มแล้ว');
      return;
    }

    setSelectedCourseForEnroll(course);
    setConfirmModalOpen(true);
  };

  const handleConfirmEnrollment = () => {
    if (!selectedCourseForEnroll) return;
    setConfirmModalOpen(false);

    const result = enrollCourse(student.studentId, selectedCourseForEnroll.code);
    if (result.success) {
      showToast('ลงทะเบียนสำเร็จ', `คุณได้เลือกลงทะเบียนวิชา ${selectedCourseForEnroll.name} (${selectedCourseForEnroll.code}) สำเร็จแล้ว`);
      onSelectTab('my_courses');
    } else {
      showToast('ไม่สามารถลงทะเบียนได้', result.message);
    }
  };



  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      
      {/* Toast Notification */}
      <Toast
        show={toast.show}
        type={toast.type}
        title={toast.title}
        message={toast.message}
        onClose={() => setToast(prev => ({ ...prev, show: false }))}
      />

      {/* Confirmation Modal for Enrollment */}
      {selectedCourseForEnroll && (
        <ConfirmationModal
          isOpen={confirmModalOpen}
          title="ยืนยันการลงทะเบียนรายวิชาเพิ่มเติม"
          message={`คุณต้องการยืนยันการเลือกลงทะเบียนในรายวิชานี้ใช่หรือไม่? กรุณาตรวจสอบข้อมูลก่อนยืนยัน`}
          courseDetails={{
            code: selectedCourseForEnroll.code,
            name: selectedCourseForEnroll.name,
            teacherName: selectedCourseForEnroll.teacherName,
            dayOfWeek: selectedCourseForEnroll.dayOfWeek,
            period: selectedCourseForEnroll.period,
            classroom: selectedCourseForEnroll.classroom,
            seatsLeft: Math.max(0, selectedCourseForEnroll.maxStudents - getEnrolledCount(selectedCourseForEnroll.code)),
            maxSeats: selectedCourseForEnroll.maxStudents
          }}
          confirmText="ยืนยันการลงทะเบียน"
          cancelText="ยกเลิก"
          onConfirm={handleConfirmEnrollment}
          onCancel={() => setConfirmModalOpen(false)}
        />
      )}

      {/* 1. Student Profile Header Banner matching design */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0b1b3d] via-[#002b7f] to-[#134094] text-white p-6 sm:p-8 shadow-xl border border-blue-900/40">
        <div className="absolute -right-12 -top-12 w-72 h-72 rounded-full bg-amber-400/20 blur-3xl pointer-events-none"></div>
        <div className="absolute left-1/3 -bottom-24 w-80 h-80 rounded-full bg-cyan-400/15 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-3.5">
            {/* Student metadata pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md text-amber-300 border border-white/15">
                <span className="material-symbols-outlined text-sm">badge</span>
                รหัสนักเรียน: {student.studentId}
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-400 text-slate-900 shadow-2xs">
                <span className="material-symbols-outlined text-sm">class</span>
                ชั้นมัธยมศึกษาปีที่ {student.room}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md text-white border border-white/15">
                เลขที่ {student.numberInRoom}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  isGradeRegistrationOpen
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isGradeRegistrationOpen ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
                {isGradeRegistrationOpen ? 'ระบบเปิดรับลงทะเบียน' : 'ระบบปิดรับลงทะเบียน'}
              </span>
            </div>

            {/* Student Full Name */}
            <div>
              <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3 break-words">
                {student.fullName}
              </h1>
            </div>

            {/* Advisor & Semester Info */}
            <div className="pt-2.5 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs sm:text-sm text-blue-100/90 border-t border-white/15">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-amber-300 text-lg shrink-0">supervisor_account</span>
                <span>ครูที่ปรึกษา: <strong className="text-white font-medium block">{advisorNames.map((name, index) => <span key={`${name}-${index}`} className="block break-words">{name}</span>)}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-blue-200 text-lg shrink-0">calendar_month</span>
                <span>ภาคเรียนที่ {systemConfig.semester} / ปีการศึกษา {systemConfig.academicYear}</span>
              </div>
            </div>
          </div>


        </div>
      </section>

      {/* Tabs Switcher for Mobile / Top nav */}
      <div className="flex items-center justify-center gap-2 border-b border-slate-200 pb-3 px-1">
        <button
          onClick={() => onSelectTab('catalog')}
          className={`flex-1 sm:flex-none min-w-0 justify-center flex items-center gap-1.5 sm:gap-2 px-2 sm:px-5 py-2.5 rounded-2xl text-[10px] sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'catalog'
              ? 'bg-blue-700 text-white shadow-md shadow-blue-700/25'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span className="material-symbols-outlined text-lg">how_to_reg</span>
          <span className="whitespace-nowrap">เลือกรายวิชาเพิ่มเติม</span>
        </button>

        <button
          onClick={() => onSelectTab('my_courses')}
          className={`flex-1 sm:flex-none min-w-0 justify-center flex items-center gap-1.5 sm:gap-2 px-2 sm:px-5 py-2.5 rounded-2xl text-[10px] sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'my_courses'
              ? 'bg-blue-700 text-white shadow-md shadow-blue-700/25'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span className="material-symbols-outlined text-lg">menu_book</span>
          <span className="whitespace-nowrap">รายวิชาที่ลงทะเบียนแล้ว</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ELECTIVE COURSE SELECTION (หน้าเลือกรายวิชา - หน้าแรก) */}
      {/* ========================================================================= */}
      {activeTab === 'catalog' && (
        <section className="space-y-6">
          
          {/* Header & Search */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                <h2 className="text-sm sm:text-sm sm:text-lg font-bold text-slate-900 whitespace-nowrap leading-tight whitespace-nowrap">
                  รายวิชาเพิ่มเติมที่เปิดรับสำหรับนักเรียน ม.{student.room}
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                แสดงรายวิชาที่นักเรียนห้อง {student.room} มีสิทธิ์เลือกลงทะเบียนในภาคเรียนนี้
              </p>
            </div>

            {/* Search Input */}
            <div className="w-full md:w-80 relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหารหัสวิชา, ชื่อวิชา หรือชื่อผู้สอน..."
                className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm bg-slate-50 hover:bg-white focus:bg-white text-slate-800 placeholder-slate-400 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
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

          {/* Registration Status Warning if closed */}
          {!isGradeRegistrationOpen && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs sm:text-sm flex items-center gap-3">
              <span className="material-symbols-outlined text-amber-600 text-2xl shrink-0">lock</span>
              <div>
                <strong className="block font-bold">ระบบลงทะเบียนระดับชั้น ม.{grade} ปิดให้บริการอยู่ในขณะนี้</strong>
                <span>นักเรียนสามารถดูรายละเอียดรายวิชาล่วงหน้าได้ แต่ยังไม่สามารถกดยืนยันลงทะเบียนได้จนกว่าระบบจะเปิด</span>
              </div>
            </div>
          )}

          {/* Course Cards Grid */}
          {filteredCatalog.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-2">
              <span className="material-symbols-outlined text-4xl text-slate-300">search_off</span>
              <h4 className="text-base font-bold text-slate-800">ไม่พบรายวิชาที่ตรงกับการค้นหา</h4>
              <p className="text-xs text-slate-500">กรุณาลองค้นหาด้วยคำอื่น หรือกดล้างการค้นหา</p>
              <button
                onClick={() => setSearchQuery('')}
                className="mt-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 rounded-xl transition-all cursor-pointer"
              >
                ล้างคำค้นหา
              </button>
            </div>
          ) : (
            <div className="course-card-grid grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              {filteredCatalog.map((course) => {
                const enrolled = getEnrolledCount(course.code);
                const isFull = enrolled >= course.maxStudents;
                const isSelectedByMe = student.registeredCourseCode === course.code;
                const percent = Math.min(100, Math.round((enrolled / course.maxStudents) * 100));

                return (
                  <div
                    key={course.code}
                    className={`course-card min-w-0 bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-6 border shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between ${
                      isSelectedByMe
                        ? 'border-2 border-emerald-500 ring-4 ring-emerald-50'
                        : 'border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="space-y-2 sm:space-y-4">
                      {/* Top Badges */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-2">
                        <span className="px-2 py-1 rounded-xl text-[10px] sm:text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/60 font-mono w-fit">
                          {course.code}
                        </span>
                        {isSelectedByMe ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">check</span>
                            วิชาที่คุณลงทะเบียน
                          </span>
                        ) : (
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              isFull ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {isFull ? 'เต็มแล้ว' : 'เปิดรับสมัคร'}
                          </span>
                        )}
                      </div>

                      {/* Course Title */}
                      <div>
                        <h3 className="text-xs sm:text-sm sm:text-lg font-bold text-slate-900 whitespace-nowrap leading-snug break-words">
                          {course.name}
                        </h3>
                        {course.description && (
                          <p className="text-[10px] sm:text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                            {course.description}
                          </p>
                        )}
                      </div>

                      {/* Details Box */}
                      <div className="space-y-1.5 sm:space-y-2 bg-slate-50 rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 text-[10px] sm:text-xs text-slate-600 border border-slate-100 break-words">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-slate-400 text-base shrink-0">person</span>
                          <span>คุณครู: <strong className="text-slate-800 font-semibold">{course.teacherName}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-slate-400 text-base shrink-0">schedule</span>
                          <span>วันที่เรียน: <span className="font-medium text-slate-800">{course.dayOfWeek} {course.period}</span></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-slate-400 text-base shrink-0">room</span>
                          <span>ห้องเรียน: <span className="font-medium text-slate-800">{course.classroom}</span></span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500">
                          <span className="material-symbols-outlined text-slate-400 text-base shrink-0">groups</span>
                          <span>ห้องเรียนที่เปิดรับ: <strong className="text-slate-700">{course.allowedRooms.join(', ')}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Seats & Register Action */}
                    <div className="pt-3 sm:pt-4 mt-3 sm:mt-4 border-t border-slate-100 space-y-2 sm:space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">จำนวนนักเรียนที่เข้าแล้ว:</span>
                        <div className="text-right">
                          <span className="font-bold text-slate-900 text-sm">{enrolled} / {course.maxStudents}</span> คน
                          <span className={`ml-1 font-semibold ${isFull ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {isFull ? '(เต็ม)' : `(เหลือ ${course.maxStudents - enrolled} ที่)`}
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isFull ? 'bg-rose-500' : 'bg-blue-600'
                          }`}
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>

                      {/* Action Button */}
                      {isSelectedByMe ? (
                        <div className="w-full rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-center text-xs font-bold text-emerald-800">
                          ลงทะเบียนเรียบร้อย · หากต้องการเปลี่ยนวิชา กรุณาติดต่อผู้ดูแลระบบ
                        </div>
                      ) : (
                        <button
                          onClick={() => handleOpenRegisterConfirm(course)}
                          disabled={isFull || !isGradeRegistrationOpen || !!student.registeredCourseCode}
                          className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            isFull || !isGradeRegistrationOpen || !!student.registeredCourseCode
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              : 'bg-blue-700 hover:bg-blue-800 text-white shadow-md shadow-blue-700/25 active:scale-98'
                          }`}
                        >
                          <span className="material-symbols-outlined text-base">how_to_reg</span>
                          <span>
                            {isFull
                              ? 'จำนวนนักเรียนเต็มแล้ว'
                              : !isGradeRegistrationOpen
                              ? 'ระบบปิดรับสมัคร'
                              : student.registeredCourseCode
                              ? 'คุณได้ลงทะเบียนวิชาอื่นแล้ว'
                              : 'ลงทะเบียนวิชานี้'}
                          </span>
                        </button>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </section>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: REGISTERED COURSE & ATTENDANCE (หน้ารายวิชาที่ลงทะเบียน) */}
      {/* ========================================================================= */}
      {activeTab === 'my_courses' && (
        <section className="space-y-6">
          
          {!registeredCourse ? (
            <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-3xl">menu_book</span>
              </div>
              <h3 className="text-lg font-bold text-slate-800">คุณยังไม่ได้เลือกลงทะเบียนรายวิชาเพิ่มเติม</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                กรุณาไปที่หน้า "เลือกรายวิชาเพิ่มเติม" เพื่อเลือกลงทะเบียนวิชาที่คุณสนใจ
              </p>
              <button
                onClick={() => onSelectTab('catalog')}
                className="px-6 py-3 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
              >
                ไปที่หน้าเลือกลงทะเบียน
              </button>
            </div>
          ) : (
            <>
              {/* Registered Course Header Card */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-blue-200/80 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-3 py-1 rounded-xl text-xs font-bold bg-blue-100 text-blue-800 font-mono">
                      {registeredCourse.code}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                      ลงทะเบียนสำเร็จเรียบร้อย
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#00236f]">
                    {registeredCourse.name}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600 pt-1">
                    <div>
                      <strong>คุณครูผู้สอน:</strong> {registeredCourse.teacherName}
                    </div>
                    <div>
                      <strong>ห้องเรียน:</strong> {registeredCourse.classroom}
                    </div>
                    <div>
                      <strong>วันเวลาเรียน:</strong> {registeredCourse.dayOfWeek} {registeredCourse.period}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-4 py-2.5 rounded-xl bg-slate-50 text-slate-600 text-xs font-semibold border border-slate-200 whitespace-nowrap">
                    หากต้องการเปลี่ยนวิชา กรุณาติดต่อผู้ดูแลระบบ
                  </span>
                </div>
              </div>

              {/* Attendance Statistics Section matching template */}
              <div className="space-y-2 sm:space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-lg">fact_check</span>
                    </div>
                    <h3 className="text-sm sm:text-lg font-bold text-slate-900 whitespace-nowrap">
                      สถิติการเข้าเรียนวิชาเพิ่มเติม ({registeredCourse.code})
                    </h3>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                      attendancePercent >= 80
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        attendancePercent >= 80 ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                      }`}
                    ></span>
                    {attendancePercent >= 80 ? 'ผ่านเกณฑ์เวลาเรียน (เกิน 80%)' : 'ต่ำกว่าเกณฑ์ 80%'}
                  </span>
                </div>

                {/* Grid with Circular Progress & Metric Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  
                  {/* Left Ring Chart */}
                  <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        เปอร์เซ็นต์เวลาเรียนสะสม
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-extrabold text-slate-900">{attendancePercent}%</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${attendancePercent >= 80 ? 'text-emerald-700 bg-emerald-100' : 'text-rose-700 bg-rose-100'}`}>
                          {attendancePercent >= 80 ? 'ผ่านเกณฑ์' : 'เฝ้าระวัง'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                        เกณฑ์ขั้นต่ำตามระเบียบโรงเรียนสายปัญญารังสิตคือ 80.0% เพื่อมีสิทธิ์สอบปลายภาค
                      </p>
                    </div>

                    <div className="my-4 flex items-center justify-center">
                      <div className="relative w-32 h-32 flex items-center justify-center">
                        <svg className="w-32 h-32 -rotate-90 transform" viewBox="0 0 120 120">
                          <circle cx="60" cy="60" fill="none" r="50" stroke="#F1F5F9" strokeWidth="12" />
                          <circle
                            cx="60"
                            cy="60"
                            fill="none"
                            r="50"
                            stroke="#10B981"
                            strokeWidth="12"
                            strokeDasharray="314"
                            strokeDashoffset={314 - (314 * attendancePercent) / 100}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                          <span className="text-2xl font-bold text-slate-900 leading-none">
                            {presentCount}
                            <span className="text-sm font-normal text-slate-400">/{totalSessions}</span>
                          </span>
                          <span className="text-[11px] font-medium text-slate-500 mt-1">คาบเรียน</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span>รวมทั้งหมด: <strong className="text-slate-800">{totalSessions} คาบ</strong></span>
                      <span className="font-semibold text-emerald-600">สถิติระบบเรียลไทม์</span>
                    </div>
                  </div>

                  {/* Right 4 Metric Cards (มา, ขาด, ลากิจ, ลาป่วย) */}
                  <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    
                    {/* 1. Present */}
                    <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                          <span className="material-symbols-outlined text-xl">check_circle</span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          {totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0}%
                        </span>
                      </div>
                      <div className="mt-3">
                        <div className="text-3xl font-extrabold text-slate-900">{presentCount}</div>
                        <div className="text-xs font-bold text-emerald-700 mt-0.5">มาเรียน (ครั้ง)</div>
                      </div>
                      <div className="w-full bg-emerald-50 h-1.5 rounded-full mt-3 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full"
                          style={{ width: `${totalSessions > 0 ? (presentCount / totalSessions) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* 2. Absent */}
                    <div className="bg-white rounded-3xl p-5 border border-rose-100 shadow-sm flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                          <span className="material-symbols-outlined text-xl">cancel</span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                          {totalSessions > 0 ? Math.round((absentCount / totalSessions) * 100) : 0}%
                        </span>
                      </div>
                      <div className="mt-3">
                        <div className="text-3xl font-extrabold text-slate-900">{absentCount}</div>
                        <div className="text-xs font-bold text-rose-700 mt-0.5">ขาดเรียน (ครั้ง)</div>
                      </div>
                      <div className="w-full bg-rose-50 h-1.5 rounded-full mt-3 overflow-hidden">
                        <div
                          className="bg-rose-500 h-full rounded-full"
                          style={{ width: `${totalSessions > 0 ? (absentCount / totalSessions) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* 3. Leave */}
                    <div className="bg-white rounded-3xl p-5 border border-amber-100 shadow-sm flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                          <span className="material-symbols-outlined text-xl">assignment</span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          {totalSessions > 0 ? Math.round((leaveCount / totalSessions) * 100) : 0}%
                        </span>
                      </div>
                      <div className="mt-3">
                        <div className="text-3xl font-extrabold text-slate-900">{leaveCount}</div>
                        <div className="text-xs font-bold text-amber-700 mt-0.5">ลากิจ (ครั้ง)</div>
                      </div>
                      <div className="w-full bg-amber-50 h-1.5 rounded-full mt-3 overflow-hidden">
                        <div
                          className="bg-amber-500 h-full rounded-full"
                          style={{ width: `${totalSessions > 0 ? (leaveCount / totalSessions) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* 4. Sick */}
                    <div className="bg-white rounded-3xl p-5 border border-indigo-100 shadow-sm flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                          <span className="material-symbols-outlined text-xl">medical_services</span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                          {totalSessions > 0 ? Math.round((sickCount / totalSessions) * 100) : 0}%
                        </span>
                      </div>
                      <div className="mt-3">
                        <div className="text-3xl font-extrabold text-slate-900">{sickCount}</div>
                        <div className="text-xs font-bold text-indigo-700 mt-0.5">ลาป่วย (ครั้ง)</div>
                      </div>
                      <div className="w-full bg-indigo-50 h-1.5 rounded-full mt-3 overflow-hidden">
                        <div
                          className="bg-indigo-500 h-full rounded-full"
                          style={{ width: `${totalSessions > 0 ? (sickCount / totalSessions) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Progress Bar Breakdown */}
                    <div className="col-span-2 sm:col-span-4 bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
                        <span>สัดส่วนเวลาเรียนทั้งหมด (รวม {totalSessions} คาบ)</span>
                      </div>
                      <div className="h-3 w-full bg-slate-100 rounded-full flex overflow-hidden p-0.5 gap-0.5">
                        <div
                          className="bg-emerald-500 h-full rounded-l-full transition-all"
                          style={{ width: `${(presentCount / totalSessions) * 100}%` }}
                        ></div>
                        <div
                          className="bg-rose-500 h-full transition-all"
                          style={{ width: `${(absentCount / totalSessions) * 100}%` }}
                        ></div>
                        <div
                          className="bg-amber-500 h-full transition-all"
                          style={{ width: `${(leaveCount / totalSessions) * 100}%` }}
                        ></div>
                        <div
                          className="bg-indigo-500 h-full rounded-r-full transition-all"
                          style={{ width: `${(sickCount / totalSessions) * 100}%` }}
                        ></div>
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-500 pt-1">
                        <span className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> มาเรียน {presentCount} ครั้ง
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> ขาดเรียน {absentCount} ครั้ง
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> ลากิจ {leaveCount} ครั้ง
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> ลาป่วย {sickCount} ครั้ง
                        </span>
                      </div>
                    </div>

                  </div>

                </div>
              </div>
            </>
          )}

        </section>
      )}

    </div>
  );
};
