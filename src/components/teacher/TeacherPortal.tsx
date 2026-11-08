import React, { useState } from 'react';
import { exportToExcel } from '../document/ExportExcel';
import { DocumentType, OfficialDocumentView } from '../document/OfficialDocumentView';
import { Toast } from '../common/Toast';
import { useApp } from '../../context/AppContext';
import { AttendanceStatus, ElectiveCourse, Student } from '../../types';

interface TeacherPortalProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
}

export const TeacherPortal: React.FC<TeacherPortalProps> = ({ activeTab, onSelectTab }) => {
  const {
    currentUser,
    courses,
    students,
    attendance,
    gradeSettings,
    systemConfig,
    updateAttendanceStatus,
    markAllPresentForSession
  } = useApp();

  const teacher = currentUser?.teacherData;
  const teacherName = teacher?.fullName || currentUser?.fullName || 'ครูผู้สอน';

  // Find all courses taught by this teacher ("ครูบางคนสามารถมีหลายเสรี")
  const myCourses = courses.filter(
    c => c.teacherName.trim() === teacherName.trim()
  );

  // Selected course to manage
  const [selectedCourseCode, setSelectedCourseCode] = useState<string>(
    myCourses[0]?.code || ''
  );

  // Active session index for interactive checking on web (e.g. session 0..11)
  const [activeSessionIndex, setActiveSessionIndex] = useState<number>(0);

  // View mode switcher: 'table' (full table) or 'cards' (touch-friendly cards for mobile & iPad)
  const [displayMode, setDisplayMode] = useState<'table' | 'cards'>('table');
  const [cardFilterRoom, setCardFilterRoom] = useState<string>('all');
  const [cardSearchQuery, setCardSearchQuery] = useState<string>('');

  // Official PDF Document Modal
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [docType, setDocType] = useState<DocumentType>('course_roster');
  const [selectedCoursesForReport, setSelectedCoursesForReport] = useState<string[]>(
    myCourses[0] ? [myCourses[0].code] : []
  );

  // Toast
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
      } else if (titleOrType.includes('เตือน') || titleOrType.includes('ปิด')) {
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

  const currentCourse = myCourses.find(c => c.code === selectedCourseCode) || myCourses[0];

  // Grade setting for the course
  const gradeSetting = currentCourse ? gradeSettings[currentCourse.grade] : undefined;
  const sessionDates = gradeSetting?.dates || [
    '15 พ.ค. 2570', '22 พ.ค. 2570', '29 พ.ค. 2570', '5 มิ.ย. 2570',
    '12 มิ.ย. 2570', '19 มิ.ย. 2570', '26 มิ.ย. 2570', '3 ก.ค. 2570',
    '10 ก.ค. 2570', '17 ก.ค. 2570', '24 ก.ค. 2570', '31 ก.ค. 2570'
  ];

  // Helper to get students sorted strictly according to the rule:
  // "กฎการแสดงรายชื่อนักเรียนคือเรียงจากห้องเช่น ห้อง 5 6 7 8 9 เรียงน้อยบนมากล่างตามลำดับ แล้วถ้าในห้องมีนักเรียนจึงเรียนตามรหัสนักเรียนโดยจะให้แสดงลำดับตามกฏที่เรียงเลย"
  const getSortedEnrolledStudents = (courseCode: string): Student[] => {
    const enrolled = students.filter(s => s.registeredCourseCode === courseCode);
    return [...enrolled].sort((a, b) => {
      const gradeDiff = Number(a.room.split('/')[0] || 0) - Number(b.room.split('/')[0] || 0);
      if (gradeDiff) return gradeDiff;
      const idDiff = a.studentId.localeCompare(b.studentId, 'th', { numeric: true });
      if (idDiff) return idDiff;
      const roomDiff = Number(a.room.split('/')[1] || 0) - Number(b.room.split('/')[1] || 0);
      return roomDiff || a.numberInRoom - b.numberInRoom;
    });
  };

  const enrolledStudents = currentCourse ? getSortedEnrolledStudents(currentCourse.code) : [];

  // Status cycle: ยังไม่เช็ค -> มา -> ขาด -> ลากิจ -> ลาป่วย -> ยังไม่เช็ค
  const cycleStatus = (currentStatus: AttendanceStatus): AttendanceStatus => {
    const order: AttendanceStatus[] = ['unmarked', 'present', 'absent', 'leave', 'sick'];
    return order[(order.indexOf(currentStatus) + 1) % order.length] || 'unmarked';
  };

  const handleToggleAttendance = (studentId: string, sessionIdx: number) => {
    if (!currentCourse) return;
    const rec = attendance.find(
      r => r.courseCode === currentCourse.code && r.studentId === studentId && r.sessionIndex === sessionIdx
    );
    const nextStatus = cycleStatus(rec?.status || 'unmarked');
    updateAttendanceStatus(currentCourse.code, studentId, sessionIdx, nextStatus);
  };

  const handleSetDirectStatus = (studentId: string, sessionIdx: number, status: AttendanceStatus) => {
    if (!currentCourse) return;
    updateAttendanceStatus(currentCourse.code, studentId, sessionIdx, status);
  };

  const handleMarkAllPresent = () => {
    if (!currentCourse) return;
    markAllPresentForSession(currentCourse.code, activeSessionIndex);
    showToast('สำเร็จ', `เช็คชื่อนักเรียนทุกคนว่า "มาเรียน" สำหรับคาบที่ ${activeSessionIndex + 1} เรียบร้อยแล้ว`);
  };

  // Unique rooms in this course for tablet/phone quick filter
  const uniqueRooms = Array.from(new Set(enrolledStudents.map(s => s.room))).sort((a, b) => {
    const numA = parseInt(a.split('/')[1] || '0', 10);
    const numB = parseInt(b.split('/')[1] || '0', 10);
    return numA - numB;
  });

  // Filtered students for cards view
  const filteredCardStudents = enrolledStudents.filter(s => {
    if (cardFilterRoom !== 'all' && s.room !== cardFilterRoom) return false;
    if (cardSearchQuery.trim()) {
      const q = cardSearchQuery.trim().toLowerCase();
      return (
        s.fullName.toLowerCase().includes(q) ||
        s.studentId.includes(q) ||
        s.numberInRoom.toString().includes(q)
      );
    }
    return true;
  });

  // Trigger Excel Export for Course Roster
  const handleExportRosterExcel = (course: ElectiveCourse) => {
    const sorted = getSortedEnrolledStudents(course.code);
    const headers = ['ลำดับ', 'รหัสนักเรียน', 'ชื่อ-นามสกุล', 'ชั้น/ห้อง', 'เลขที่'];
    const rows = sorted.map((s, idx) => [
      idx + 1,
      s.studentId,
      s.fullName,
      s.room,
      s.numberInRoom
    ]);
    exportToExcel(`รายชื่อนักเรียน_${course.code}`, 'รายชื่อนักเรียน', headers, rows);
    showToast('ส่งออก Excel สำเร็จ', `ดาวน์โหลดไฟล์ Excel รายชื่อนักเรียนวิชา ${course.code} แล้ว`);
  };

  // Trigger Excel Export for Attendance Data
  const handleExportAttendanceExcel = (course: ElectiveCourse) => {
    const sorted = getSortedEnrolledStudents(course.code);
    const dateHeaders = sessionDates.map((_, i) => `คาบที่ ${i + 1}`);
    const headers = [
      'ลำดับ', 'ชั้น/ห้อง', 'รหัสนักเรียน', 'เลขที่', 'ชื่อ-นามสกุล',
      ...dateHeaders,
      'มาเรียน', 'ขาดเรียน', 'ลากิจ', 'ลาป่วย', 'ร้อยละ'
    ];

    const rows = sorted.map((s, idx) => {
      let present = 0;
      let absent = 0;
      let leave = 0;
      let sick = 0;

      const sessionStatuses = sessionDates.map((_, sIdx) => {
        const rec = attendance.find(
          r => r.courseCode === course.code && r.studentId === s.studentId && r.sessionIndex === sIdx
        );
        const status = rec?.status || 'unmarked';
        if (status === 'present') present++;
        else if (status === 'absent') absent++;
        else if (status === 'leave') leave++;
        else if (status === 'sick') sick++;
        return status === 'unmarked' ? '' : status === 'present' ? '/' : status === 'absent' ? 'ข' : status === 'leave' ? 'ล' : 'ป';
      });

      const total = sessionDates.length || 1;
      const pct = ((present / total) * 100).toFixed(1) + '%';

      return [
        idx + 1,
        s.room,
        s.studentId,
        s.numberInRoom,
        s.fullName,
        ...sessionStatuses,
        present,
        absent,
        leave,
        sick,
        pct
      ];
    });

    exportToExcel(`บันทึกเวลาเรียน_${course.code}`, 'บันทึกเวลาเรียน', headers, rows);
    showToast('ส่งออก Excel สำเร็จ', `ดาวน์โหลดไฟล์ Excel สรุปเวลาเรียนวิชา ${course.code} แล้ว`);
  };

  // Calculate live stats for today's active session
  let livePresent = 0;
  let liveAbsent = 0;
  let liveLeave = 0;
  let liveSick = 0;

  enrolledStudents.forEach(st => {
    const rec = attendance.find(
      r => currentCourse && r.courseCode === currentCourse.code && r.studentId === st.studentId && r.sessionIndex === activeSessionIndex
    );
    const status = rec?.status || 'unmarked';
    if (status === 'present') livePresent++;
    else if (status === 'absent') liveAbsent++;
    else if (status === 'leave') liveLeave++;
    else if (status === 'sick') liveSick++;
  });

  return (
    <div className="space-y-6 pb-12">
      
      {/* Toast Notification */}
      <Toast
        show={toast.show}
        type={toast.type}
        title={toast.title}
        message={toast.message}
        onClose={() => setToast(prev => ({ ...prev, show: false }))}
      />

      {/* Official Document Viewer Modal (strictly Sarabun font, official layout) */}
      {currentCourse && (
        <OfficialDocumentView
          isOpen={docModalOpen}
          onClose={() => setDocModalOpen(false)}
          documentType={docType}
          systemConfig={systemConfig}
          course={currentCourse}
          courses={courses}
          students={students}
          dates={sessionDates}
          attendanceRecords={attendance}
        />
      )}

      {/* Hero Welcome Banner */}
      <section className="bg-white rounded-3xl border border-blue-100 shadow-md overflow-hidden">
        <div className="relative bg-gradient-to-r from-[#00236f] via-blue-700 to-indigo-600 p-6 sm:p-7 text-white overflow-hidden">
          <div className="absolute -top-16 -right-16 w-80 h-80 bg-gradient-to-br from-cyan-400/25 to-pink-500/20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="px-3 py-1 rounded-full bg-amber-400 text-slate-900 font-bold text-xs shadow-2xs">
                  ระบบครูผู้สอน • ภาคเรียนที่ {systemConfig.semester} / {systemConfig.academicYear}
                </span>
                <span className="text-xs text-blue-200">โรงเรียนสายปัญญารังสิต</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                ยินดีต้อนรับ {teacherName}
              </h1>
              <p className="text-xs text-blue-100 mt-1">
                รายวิชาเพิ่มเติมที่คุณดูแล: <strong>{myCourses.length} รายวิชา</strong>
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-2 bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20">
              <div className="px-3.5 py-2 text-center rounded-xl bg-white/5">
                <div className="text-[11px] text-cyan-200">วิชาที่สอน</div>
                <div className="text-lg sm:text-xl font-bold text-white">{myCourses.length}</div>
              </div>
              <div className="px-3.5 py-2 text-center rounded-xl bg-white/5 border-x border-white/10">
                <div className="text-[11px] text-indigo-200">นักเรียนรวม</div>
                <div className="text-lg sm:text-xl font-bold text-white">
                  {myCourses.reduce((acc, c) => acc + getSortedEnrolledStudents(c.code).length, 0)} คน
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Course Switcher: "ครูบางคนสามารถมีหลายเสรี ให้เลือกเสรีที่ดูแล โดยจะแสดงชื่อวิชา รหัสวิชา คาบเรียน ห้องเรียน" */}
        <div className="p-4 sm:p-5 bg-slate-50/80 border-t border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-blue-600 text-base">view_carousel</span>
              เลือกรายวิชาเพิ่มเติมที่ต้องการจัดการ:
            </span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
              {myCourses.length} รายวิชา
            </span>
          </div>

          {myCourses.length === 0 ? (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
              ยังไม่มีรายวิชาเพิ่มเติมที่ระบุชื่อคุณครู ({teacherName}) ในระบบ กรุณาติดต่อผู้ดูแลระบบเพื่อมอบหมายวิชา
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {myCourses.map((c) => {
                const isSelected = c.code === selectedCourseCode;
                const studentCount = getSortedEnrolledStudents(c.code).length;

                return (
                  <div
                    key={c.code}
                    onClick={() => setSelectedCourseCode(c.code)}
                    className={`p-4 rounded-2xl cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                      isSelected
                        ? 'bg-white border-2 border-blue-600 shadow-md shadow-blue-600/15 ring-2 ring-blue-50'
                        : 'bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2.5 py-0.5 rounded-lg bg-blue-100 text-blue-800 font-bold text-xs font-mono">
                          {c.code}
                        </span>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            isSelected
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {isSelected ? 'กำลังจัดการ' : 'คลิกเพื่อเลือก'}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 line-clamp-1 mb-1">
                        {c.name}
                      </h3>
                      <div className="text-xs text-slate-500 space-y-0.5">
                        <div><strong>คาบเรียน:</strong> {c.dayOfWeek} {c.period}</div>
                        <div><strong>ห้องเรียน:</strong> {c.classroom}</div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500">ระดับชั้น ม.{c.grade}</span>
                      <span className="font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded-md">
                        {studentCount} / {c.maxStudents} คน
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Course Actions Toolbar & Export Tools */}
      {currentCourse && activeTab === 'attendance' && (
        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4">
          
          {/* Session Selector & Quick Buttons */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-600">เลือกคาบที่จะเช็คชื่อ:</span>
              <select
                value={activeSessionIndex}
                onChange={(e) => setActiveSessionIndex(parseInt(e.target.value, 10))}
                className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold text-blue-900 focus:bg-white focus:outline-none focus:border-blue-600 cursor-pointer"
              >
                {sessionDates.map((date, idx) => (
                  <option key={idx} value={idx}>
                    สัปดาห์ที่ {idx + 1} • คาบที่ {idx + 1} ({date})
                  </option>
                ))}
              </select>

              <span className="px-3 py-1 rounded-full bg-blue-100/70 text-blue-800 text-xs font-bold">
                {currentCourse.dayOfWeek} {currentCourse.period}
              </span>
            </div>

            {/* Quick check buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleMarkAllPresent}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">done_all</span>
                <span>เช็คชื่อมาเรียนทั้งหมด (Quick)</span>
              </button>
            </div>
          </div>


        </section>
      )}


      {activeTab === 'teacher_reports' && (
        <section className="space-y-5">
          <div className="rounded-3xl bg-gradient-to-r from-[#00236f] to-indigo-700 p-5 sm:p-7 text-white shadow-lg">
            <div className="flex items-center gap-3"><span className="material-symbols-outlined text-3xl">print</span><div><h2 className="text-xl font-extrabold">พิมพ์เอกสารและส่งออกข้อมูล</h2><p className="text-xs text-blue-100 mt-1">แสดงเฉพาะรายวิชาที่คุณเป็นผู้สอน</p></div></div>
          </div>
          {myCourses.length === 0 ? <div className="rounded-2xl bg-white p-8 text-center text-slate-500">ยังไม่มีรายวิชาที่ผูกกับบัญชีครูนี้</div> : myCourses.map(course => (
            <div key={course.code} className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4"><div><div className="text-xs font-mono text-blue-700 font-bold">{course.code}</div><h3 className="font-bold text-slate-900">{course.name}</h3><p className="text-xs text-slate-500">ม.{course.grade} • {getSortedEnrolledStudents(course.code).length} คน</p></div><span className="text-xs text-slate-500">{course.dayOfWeek} {course.period}</span></div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button type="button" onClick={() => { setSelectedCourseCode(course.code); setSelectedCoursesForReport([course.code]); setDocType('course_roster'); setDocModalOpen(true); }} className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-left text-xs font-bold text-rose-800">PDF รายชื่อ</button>
                <button type="button" onClick={() => { setSelectedCourseCode(course.code); setSelectedCoursesForReport([course.code]); setDocType('attendance_summary'); setDocModalOpen(true); }} className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-left text-xs font-bold text-amber-800">PDF เวลาเรียน</button>
                <button type="button" onClick={() => handleExportRosterExcel(course)} className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-left text-xs font-bold text-emerald-800">Excel รายชื่อ</button>
                <button type="button" onClick={() => handleExportAttendanceExcel(course)} className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-left text-xs font-bold text-blue-800">Excel เวลาเรียน</button>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Live Table Instruction & Legend */}
      {activeTab === 'attendance' && <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-xl">
            วิธีเช็คชื่อ:
          </span>
          <span className="text-slate-600">คลิกที่ปุ่มสถานะของนักเรียนเพื่อวนเปลี่ยน</span>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1.5 flex-wrap font-bold">
            <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-300">— ยังไม่เช็ค</span>
            <span className="text-slate-400">→</span>
            <span className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300">
              / มาเรียน
            </span>
            <span className="text-slate-400">→</span>
            <span className="px-2 py-0.5 rounded-lg bg-rose-100 text-rose-800 border border-rose-300">
              ข ขาดเรียน
            </span>
            <span className="text-slate-400">→</span>
            <span className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-800 border border-amber-300">
              ล ลากิจ
            </span>
            <span className="text-slate-400">→</span>
            <span className="px-2 py-0.5 rounded-lg bg-blue-100 text-blue-800 border border-blue-300">
              ป ลาป่วย
            </span>
          </div>
        </div>

        {/* Live Counters */}
        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200 shrink-0">
          <span className="text-slate-500 font-bold px-1.5">คาบที่ {activeSessionIndex + 1}:</span>
          <span className="px-2.5 py-0.5 rounded-xl bg-emerald-500 text-white font-bold text-xs">
            มา {livePresent}
          </span>
          <span className="px-2.5 py-0.5 rounded-xl bg-rose-500 text-white font-bold text-xs">
            ขาด {liveAbsent}
          </span>
          <span className="px-2.5 py-0.5 rounded-xl bg-amber-500 text-white font-bold text-xs">
            ลากิจ {liveLeave}
          </span>
          <span className="px-2.5 py-0.5 rounded-xl bg-blue-500 text-white font-bold text-xs">
            ป่วย {liveSick}
          </span>
        </div>
      </div>}

      {/* Attendance Check Section (Supports Table & Touch Cards for iPad/Mobile) */}
      {currentCourse && activeTab === 'attendance' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          
          {/* Header & View Mode Switcher */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-gradient-to-r from-slate-50 via-blue-50/30 to-slate-50">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-bold text-slate-800 text-sm">
                  รายชื่อนักเรียนวิชา {currentCourse.code} ({enrolledStudents.length} คน)
                </span>
                <span className="text-xs text-slate-500 hidden sm:inline">
                  • จัดเรียงตามห้องและรหัสอัตโนมัติ
                </span>
              </div>
              <div className="text-xs text-blue-700 font-semibold mt-1">
                คาบที่กำลังเช็คชื่อ: คาบที่ {activeSessionIndex + 1} ({sessionDates[activeSessionIndex]})
              </div>
            </div>

            {/* View Mode Switcher: Table vs Cards (Optimized for iPad & Mobile) */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-200/80 border border-slate-200 self-start md:self-auto">
              <button
                type="button"
                onClick={() => setDisplayMode('table')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  displayMode === 'table'
                    ? 'bg-white text-blue-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-base">table_chart</span>
                <span>ตารางเต็ม (คอมพิวเตอร์)</span>
              </button>

              <button
                type="button"
                onClick={() => setDisplayMode('cards')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  displayMode === 'cards'
                    ? 'bg-white text-blue-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-base">grid_view</span>
                <span>การ์ดสัมผัสเร็ว (ไอแพด/มือถือ)</span>
              </button>
            </div>
          </div>

          {/* Conditional Rendering: Cards View (Touch-Optimized) OR Table View */}
          {displayMode === 'cards' ? (
            <div className="p-4 sm:p-5 space-y-4">
              
              {/* Filter & Search Bar for Touch Devices */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                {/* Room Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                  <span className="text-xs font-bold text-slate-500 whitespace-nowrap mr-1">ห้อง:</span>
                  <button
                    type="button"
                    onClick={() => setCardFilterRoom('all')}
                    className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                      cardFilterRoom === 'all'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    ทุกห้อง ({enrolledStudents.length})
                  </button>
                  {uniqueRooms.map(room => {
                    const countInRoom = enrolledStudents.filter(s => s.room === room).length;
                    return (
                      <button
                        key={room}
                        type="button"
                        onClick={() => setCardFilterRoom(room)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                          cardFilterRoom === room
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {room} ({countInRoom})
                      </button>
                    );
                  })}
                </div>

                {/* Quick Search */}
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-2.5 top-2 text-slate-400 text-base pointer-events-none">
                    search
                  </span>
                  <input
                    type="text"
                    value={cardSearchQuery}
                    onChange={(e) => setCardSearchQuery(e.target.value)}
                    placeholder="ค้นหาชื่อ / รหัสนักเรียน..."
                    className="h-8 pl-8 pr-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 w-full sm:w-56"
                  />
                  {cardSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setCardSearchQuery('')}
                      className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Cards Grid */}
              {filteredCardStudents.length === 0 ? (
                <div className="py-12 text-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  <span className="material-symbols-outlined text-4xl mb-1 text-slate-300">person_search</span>
                  <p className="text-xs">ไม่พบนักเรียนตามเงื่อนไขที่เลือก</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {filteredCardStudents.map((student) => {
                    // Overall rank from the original sorted enrolled list
                    const globalIndex = enrolledStudents.findIndex(s => s.studentId === student.studentId);
                    const rec = attendance.find(
                      r => r.courseCode === currentCourse.code && r.studentId === student.studentId && r.sessionIndex === activeSessionIndex
                    );
                    const currentStatus = rec?.status || 'unmarked';

                    // Calculate totals
                    let present = 0;
                    sessionDates.forEach((_, sIdx) => {
                      const r = attendance.find(
                        item => item.courseCode === currentCourse.code && item.studentId === student.studentId && item.sessionIndex === sIdx
                      );
                      if ((r?.status || 'unmarked') === 'present') present++;
                    });
                    const total = sessionDates.length || 1;
                    const percent = Math.round((present / total) * 100);

                    return (
                      <div
                        key={student.studentId}
                        className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between gap-3"
                      >
                        {/* Student Meta Row */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold">
                                #{globalIndex + 1}
                              </span>
                              <span className="px-2 py-0.5 rounded-lg bg-blue-100 text-blue-800 font-bold text-xs">
                                {student.room}
                              </span>
                              <span className="text-xs text-slate-500 font-medium">
                                เลขที่ {student.numberInRoom}
                              </span>
                            </div>
                            <span className="text-[11px] font-mono text-slate-500 font-semibold">
                              {student.studentId}
                            </span>
                          </div>

                          <h4 className="text-sm font-bold text-slate-900 line-clamp-1">
                            {student.fullName}
                          </h4>

                          <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
                            <span>สถิติรวม: มา {present}/{total} ครั้ง</span>
                            <span
                              className={`px-1.5 py-0.5 rounded-md font-bold text-[10px] ${
                                percent >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {percent}%
                            </span>
                          </div>
                        </div>

                        {/* 4 Large Touch Buttons for Current Active Session (Thumb/Finger Friendly) */}
                        <div className="pt-2 border-t border-slate-100">
                          <div className="text-[11px] font-bold text-slate-600 mb-1.5 flex items-center justify-between">
                            <span>คาบที่ {activeSessionIndex + 1}:</span>
                            <span className={`font-bold ${
                              currentStatus === 'present' ? 'text-emerald-700' :
                              currentStatus === 'absent' ? 'text-rose-700' :
                              currentStatus === 'leave' ? 'text-amber-700' : currentStatus === 'sick' ? 'text-blue-700' : 'text-slate-500'
                            }`}>
                              {currentStatus === 'present' ? 'มาเรียน' :
                               currentStatus === 'absent' ? 'ขาดเรียน' :
                               currentStatus === 'leave' ? 'ลากิจ' : currentStatus === 'sick' ? 'ลาป่วย' : 'ยังไม่เช็ค'}
                            </span>
                          </div>

                          <div className="grid grid-cols-5 gap-1.5">
                            {/* Unmarked / ยังไม่เช็ค */}
                            <button type="button" onClick={() => handleSetDirectStatus(student.studentId, activeSessionIndex, 'unmarked')} className={`py-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center cursor-pointer active:scale-95 ${currentStatus === 'unmarked' ? 'bg-slate-500 text-white ring-2 ring-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`} title="ยังไม่เช็ค"><span className="font-extrabold text-sm leading-none">—</span><span className="text-[10px] mt-0.5">ยังไม่เช็ค</span></button>
                            {/* Present / */}
                            <button
                              type="button"
                              onClick={() => handleSetDirectStatus(student.studentId, activeSessionIndex, 'present')}
                              className={`py-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center cursor-pointer active:scale-95 ${
                                currentStatus === 'present'
                                  ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300'
                                  : 'bg-slate-100 hover:bg-emerald-50 text-slate-700'
                              }`}
                              title="มาเรียน"
                            >
                              <span className="font-extrabold text-sm leading-none">/</span>
                              <span className="text-[10px] mt-0.5">มา</span>
                            </button>

                            {/* Absent ข */}
                            <button
                              type="button"
                              onClick={() => handleSetDirectStatus(student.studentId, activeSessionIndex, 'absent')}
                              className={`py-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center cursor-pointer active:scale-95 ${
                                currentStatus === 'absent'
                                  ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-300'
                                  : 'bg-slate-100 hover:bg-rose-50 text-slate-700'
                              }`}
                              title="ขาดเรียน"
                            >
                              <span className="font-extrabold text-sm leading-none">ข</span>
                              <span className="text-[10px] mt-0.5">ขาด</span>
                            </button>

                            {/* Leave ล */}
                            <button
                              type="button"
                              onClick={() => handleSetDirectStatus(student.studentId, activeSessionIndex, 'leave')}
                              className={`py-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center cursor-pointer active:scale-95 ${
                                currentStatus === 'leave'
                                  ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-300'
                                  : 'bg-slate-100 hover:bg-amber-50 text-slate-700'
                              }`}
                              title="ลากิจ"
                            >
                              <span className="font-extrabold text-sm leading-none">ล</span>
                              <span className="text-[10px] mt-0.5">กิจ</span>
                            </button>

                            {/* Sick ป */}
                            <button
                              type="button"
                              onClick={() => handleSetDirectStatus(student.studentId, activeSessionIndex, 'sick')}
                              className={`py-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center cursor-pointer active:scale-95 ${
                                currentStatus === 'sick'
                                  ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-300'
                                  : 'bg-slate-100 hover:bg-blue-50 text-slate-700'
                              }`}
                              title="ลาป่วย"
                            >
                              <span className="font-extrabold text-sm leading-none">ป</span>
                              <span className="text-[10px] mt-0.5">ป่วย</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          ) : (
            /* Table View (for desktop & full matrix view) */
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200 select-none">
                    <th className="py-3 px-2 text-center w-12 sticky left-0 bg-slate-100">ลำดับ</th>
                    <th className="py-3 px-2 text-center w-16 sticky left-12 bg-slate-100">ชั้น/ห้อง</th>
                    <th className="py-3 px-2 text-center w-20 font-mono">รหัส</th>
                    <th className="py-3 px-2 text-center w-12">เลขที่</th>
                    <th className="py-3 px-3 min-w-[170px]">ชื่อ - สกุล</th>
                    
                    {/* Current Active Session Check Toggle */}
                    <th className="py-3 px-3 text-center min-w-[130px] bg-blue-100/80 text-blue-900 border-x border-blue-300">
                      <div className="font-bold">คาบที่ {activeSessionIndex + 1} (คลิกสลับ)</div>
                      <div className="text-[10px] text-blue-700 font-normal">{sessionDates[activeSessionIndex]}</div>
                    </th>

                    {/* Summary Breakdown Columns */}
                    <th className="py-3 px-1 text-center w-12 bg-emerald-50 text-emerald-800">มา (/)</th>
                    <th className="py-3 px-1 text-center w-12 bg-rose-50 text-rose-800">ขาด (ข)</th>
                    <th className="py-3 px-1 text-center w-12 bg-amber-50 text-amber-800">ลา (ล)</th>
                    <th className="py-3 px-1 text-center w-12 bg-blue-50 text-blue-800">ป่วย (ป)</th>
                    <th className="py-3 px-3 text-center min-w-[100px]">ร้อยละ (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {enrolledStudents.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-slate-400">
                        ยังไม่มีนักเรียนลงทะเบียนในรายวิชานี้ (เมื่อนักเรียนเลือกลงทะเบียน รายชื่อจะปรากฏที่นี่แบบเรียลไทม์)
                      </td>
                    </tr>
                  ) : (
                    enrolledStudents.map((student, idx) => {
                      const rec = attendance.find(
                        r => r.courseCode === currentCourse.code && r.studentId === student.studentId && r.sessionIndex === activeSessionIndex
                      );
                      const currentStatus = rec?.status || 'unmarked';

                      // Calculate totals across all sessions
                      let present = 0;
                      let absent = 0;
                      let leave = 0;
                      let sick = 0;

                      sessionDates.forEach((_, sIdx) => {
                        const r = attendance.find(
                          item => item.courseCode === currentCourse.code && item.studentId === student.studentId && item.sessionIndex === sIdx
                        );
                        const st = r?.status || 'unmarked';
                        if (st === 'present') present++;
                        else if (st === 'absent') absent++;
                        else if (st === 'leave') leave++;
                        else if (st === 'sick') sick++;
                      });

                      const total = sessionDates.length || 1;
                      const percent = Math.round((present / total) * 100);

                      return (
                        <tr key={student.studentId} className="hover:bg-blue-50/30 transition-colors">
                          <td className="py-2.5 px-2 text-center text-slate-400 font-semibold sticky left-0 bg-white">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-2 text-center sticky left-12 bg-white">
                            <span className="px-2 py-0.5 rounded-lg bg-blue-100 text-blue-800 font-bold text-[11px]">
                              {student.room}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-center font-mono font-bold text-blue-900">
                            {student.studentId}
                          </td>
                          <td className="py-2.5 px-2 text-center text-slate-600 font-semibold">
                            {student.numberInRoom}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-800">
                            {student.fullName}
                          </td>

                          {/* Interactive Status Cycle Button */}
                          <td className="py-2 px-2 text-center bg-blue-50/40 border-x border-blue-200">
                            <button
                              type="button"
                              onClick={() => handleToggleAttendance(student.studentId, activeSessionIndex)}
                              className={`inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all transform active:scale-95 cursor-pointer shadow-2xs ${
                                currentStatus === 'present'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                                  : currentStatus === 'absent'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300 hover:bg-rose-200'
                                  : currentStatus === 'leave'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200'
                                  : currentStatus === 'sick'
                                  ? 'bg-blue-100 text-blue-800 border border-blue-300 hover:bg-blue-200'
                                  : 'bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200'
                              }`}
                            >
                              <span className="font-extrabold text-sm">
                                {currentStatus === 'unmarked' ? '—' : currentStatus === 'present' ? '/' : currentStatus === 'absent' ? 'ข' : currentStatus === 'leave' ? 'ล' : 'ป'}
                              </span>
                              <span>
                                {currentStatus === 'present' ? 'มาเรียน' : currentStatus === 'absent' ? 'ขาดเรียน' : currentStatus === 'leave' ? 'ลากิจ' : currentStatus === 'sick' ? 'ลาป่วย' : 'ยังไม่เช็ค'}
                              </span>
                            </button>
                          </td>

                          {/* Summary Numbers */}
                          <td className="py-2.5 px-1 text-center font-bold text-emerald-600 bg-emerald-50/30">
                            {present}
                          </td>
                          <td className="py-2.5 px-1 text-center font-bold text-rose-600 bg-rose-50/30">
                            {absent}
                          </td>
                          <td className="py-2.5 px-1 text-center font-bold text-amber-700 bg-amber-50/30">
                            {leave}
                          </td>
                          <td className="py-2.5 px-1 text-center font-bold text-blue-700 bg-blue-50/30">
                            {sick}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <span className="font-bold text-slate-800">{present}/{total}</span>
                              <span
                                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  percent >= 80 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                }`}
                              >
                                {percent}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
