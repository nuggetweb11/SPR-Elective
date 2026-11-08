import React, { useState } from 'react';
import { exportToExcel } from '../document/ExportExcel';
import { DocumentType, OfficialDocumentView } from '../document/OfficialDocumentView';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { Toast } from '../common/Toast';
import { useApp } from '../../context/AppContext';
import { CSVUploadField } from '../common/CSVUploadField';
import { AdminUser, Classroom, ElectiveCourse, Student, Teacher } from '../../types';

interface AdminPortalProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ activeTab, onSelectTab }) => {
  const {
    currentUser,
    systemConfig,
    gradeSettings,
    classrooms,
    teachers,
    admins,
    courses,
    students,
    attendance,
    announcements,
    updateSystemConfig,
    toggleGradeRegistration,
    saveGradePeriodSettings,
    addCourse,
    importCoursesCSV,
    removeCourse,
    addClassroom,
    importClassroomsCSV,
    addStudent,
    importStudentsCSV,
    removeStudent,
    addTeacher,
    updateTeacher,
    resetTeacherPassword,
    removeTeacher,
    deleteAllTeachers,
    resetSemesterData,
    importTeachersCSV,
    addAdmin,
    updateAdmin,
    removeAdmin,
    importAdminsCSV,
    addAnnouncement,
    deleteAnnouncement,
    enrollCourse,
    dropCourse,
    resetAllEnrollments,
    deleteAllCourses,
    deleteAllStudents,
    getEnrolledCount,
    getEnrolledStudents
  } = useApp();

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

  // Official Document Viewer
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [docType, setDocType] = useState<DocumentType>('all_courses');
  const [selectedCourseForDoc, setSelectedCourseForDoc] = useState<ElectiveCourse | undefined>(undefined);
  const [selectedRoomForDoc, setSelectedRoomForDoc] = useState<Classroom | undefined>(undefined);

  // System Reset Confirmation Modals (Requiring Password)
  const [resetEnrollmentModalOpen, setResetEnrollmentModalOpen] = useState(false);
  const [deleteCoursesModalOpen, setDeleteCoursesModalOpen] = useState(false);
  const [deleteStudentsModalOpen, setDeleteStudentsModalOpen] = useState(false);
  const [deleteTeachersModalOpen, setDeleteTeachersModalOpen] = useState(false);
  const [resetAcademicYearModalOpen, setResetAcademicYearModalOpen] = useState(false);
  const [selectedReportCourses, setSelectedReportCourses] = useState<string[]>(() => courses.map(c => c.code));
  const [reportPickerOpen, setReportPickerOpen] = useState(false);
  const [reportPickerType, setReportPickerType] = useState<'course_roster' | 'attendance_summary'>('course_roster');

  // Grade Electives Management Tab
  const [selectedElectiveGrade, setSelectedElectiveGrade] = useState<number>(1);
  const [scheduleSettingModalOpen, setScheduleSettingModalOpen] = useState(false);
  const [addCourseModalOpen, setAddCourseModalOpen] = useState(false);
  const [courseCSVModalOpen, setCourseCSVModalOpen] = useState(false);
  const [viewCourseStudentsCode, setViewCourseStudentsCode] = useState<string | null>(null);

  // Classroom & Student Management State
  const [addClassroomModalOpen, setAddClassroomModalOpen] = useState(false);
  const [classroomCSVModalOpen, setClassroomCSVModalOpen] = useState(false);
  const [selectedRoomForStudents, setSelectedRoomForStudents] = useState<Classroom | null>(null);
  const [addStudentModalOpen, setAddStudentModalOpen] = useState(false);
  const [studentCSVModalOpen, setStudentCSVModalOpen] = useState(false);
  const [roomSearchQuery, setRoomSearchQuery] = useState('');

  // Teacher Management State
  const [addTeacherModalOpen, setAddTeacherModalOpen] = useState(false);
  const [teacherCSVModalOpen, setTeacherCSVModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  // Admin Management State
  const [addAdminModalOpen, setAddAdminModalOpen] = useState(false);
  const [adminCSVModalOpen, setAdminCSVModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);

  // Announcement State
  const [addAnnouncementModalOpen, setAddAnnouncementModalOpen] = useState(false);

  // Enrollment Management State (Assign Course to Student)
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [assignCourseModalStudent, setAssignCourseModalStudent] = useState<Student | null>(null);
  const [pendingAssignCourse, setPendingAssignCourse] = useState<ElectiveCourse | null>(null);
  const [confirmReassignOpen, setConfirmReassignOpen] = useState(false);
  const [batchEnrollCourseCode, setBatchEnrollCourseCode] = useState<string>('');
  const [batchEnrollModalOpen, setBatchEnrollModalOpen] = useState(false);
  const [batchSelectedStudentIds, setBatchSelectedStudentIds] = useState<string[]>([]);
  const [batchStudentSearch, setBatchStudentSearch] = useState('');
  const [batchReassignConfirmOpen, setBatchReassignConfirmOpen] = useState(false);
  const [deleteAdminTarget, setDeleteAdminTarget] = useState<string | null>(null);
  const [deleteStudentTarget, setDeleteStudentTarget] = useState<Student | null>(null);

  // -------------------------------------------------------------
  // Helpers for Grade Schedule Generator
  // -------------------------------------------------------------
  const [tempDayOfWeek, setTempDayOfWeek] = useState('วันพฤหัสบดี');
  const [tempPeriodText, setTempPeriodText] = useState('คาบ 7 - 8 (13:00 - 15:00 น.)');
  const [tempStartDate, setTempStartDate] = useState('2027-05-15');
  const [tempEndDate, setTempEndDate] = useState('2027-07-31');
  const [generatedDates, setGeneratedDates] = useState<string[]>([]);

  const handleGenerateDates = () => {
    // Generate dates weekly between startDate and endDate
    const start = new Date(tempStartDate);
    const end = new Date(tempEndDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
      showToast('ข้อผิดพลาด', 'กรุณาระบุช่วงวันที่เริ่มต้นและสิ้นสุดให้ถูกต้อง');
      return;
    }

    const thaiMonthsShort = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const list: string[] = [];
    const current = new Date(start);

    while (current <= end && list.length < 20) {
      const d = current.getDate();
      const m = thaiMonthsShort[current.getMonth()];
      const y = current.getFullYear() + 543;
      list.push(`${d} ${m} ${y}`);
      // Advance by 7 days
      current.setDate(current.getDate() + 7);
    }

    if (list.length === 0) {
      list.push('15 พ.ค. 2570', '22 พ.ค. 2570', '29 พ.ค. 2570', '5 มิ.ย. 2570');
    }
    setGeneratedDates(list);
  };

  const handleSaveGradeSchedule = () => {
    if (generatedDates.length === 0) {
      showToast('แจ้งเตือน', 'กรุณากดปุ่ม "สร้างคาบ" ก่อนบันทึก');
      return;
    }
    saveGradePeriodSettings(
      selectedElectiveGrade,
      tempDayOfWeek,
      tempPeriodText,
      tempStartDate,
      tempEndDate,
      generatedDates
    );
    setScheduleSettingModalOpen(false);
    showToast('สำเร็จ', `บันทึกตารางวันเวลาเรียน ม.${selectedElectiveGrade} เรียบร้อยแล้ว (จำนวน ${generatedDates.length} คาบ)`);
  };

  // -------------------------------------------------------------
  // Add Elective Course Form State
  // -------------------------------------------------------------
  const [courseFormCode, setCourseFormCode] = useState('');
  const [courseFormName, setCourseFormName] = useState('');
  const [courseFormTeacher, setCourseFormTeacher] = useState(teachers[0]?.fullName || '');
  const [courseFormGrade, setCourseFormGrade] = useState<number>(selectedElectiveGrade);
  const [courseFormAllowedRooms, setCourseFormAllowedRooms] = useState<string[]>([]);
  const [courseFormClassroom, setCourseFormClassroom] = useState('');
  const [courseFormMax, setCourseFormMax] = useState(35);
  const [courseFormDesc, setCourseFormDesc] = useState('');

  // When grade changes in course form, update time from gradeSettings
  const currentGradeSetting = gradeSettings[courseFormGrade] || gradeSettings[selectedElectiveGrade];
  const roomsInGrade = classrooms.filter(c => c.grade === courseFormGrade);

  const handleOpenAddCourse = () => {
    setCourseFormGrade(selectedElectiveGrade);
    const rooms = classrooms.filter(c => c.grade === selectedElectiveGrade).map(c => c.roomNumber);
    setCourseFormAllowedRooms(rooms);
    setCourseFormCode('');
    setCourseFormName('');
    setCourseFormTeacher(teachers[0]?.fullName || '');
    setCourseFormClassroom('');
    setCourseFormMax(35);
    setCourseFormDesc('');
    setAddCourseModalOpen(true);
  };

  const handleSaveCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseFormCode.trim() || !courseFormName.trim()) {
      showToast('ข้อผิดพลาด', 'กรุณากรอกรหัสวิชาและชื่อวิชาให้ครบถ้วน');
      return;
    }

    const gSetting = gradeSettings[courseFormGrade];
    const newCourse: ElectiveCourse = {
      code: courseFormCode.trim(),
      name: courseFormName.trim(),
      teacherName: courseFormTeacher.trim(),
      grade: courseFormGrade,
      allowedRooms: courseFormAllowedRooms,
      dayOfWeek: gSetting?.dayOfWeek || 'วันพฤหัสบดี',
      period: gSetting?.periodText || 'คาบ 7 - 8',
      classroom: courseFormClassroom.trim() || 'ห้องเรียนประจำอาคาร',
      maxStudents: courseFormMax,
      description: courseFormDesc.trim()
    };

    const res = addCourse(newCourse);
    setAddCourseModalOpen(false);
    if (res.warning) {
      showToast('แจ้งเตือน', res.message);
    } else {
      showToast('สำเร็จ', res.message);
    }
  };

  // Helper to get sorted students for a course:
  // "กฎการแสดงรายชื่อนักเรียนคือเรียงจากห้องเช่น ห้อง 5 6 7 8 9 เรียงน้อยบนมากล่างตามลำดับ แล้วถ้าในห้องมีนักเรียนจึงเรียนตามรหัสนักเรียนโดยจะให้แสดงลำดับตามกฏที่เรียงเลย"
  const getSortedStudentsForCourse = (courseCode: string) => {
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

  const finishBatchEnrollment = () => {
    const targetCourse = courses.find(c => c.code === batchEnrollCourseCode);
    if (!targetCourse) return;
    let enrolledCount = 0;
    let movedCount = 0;
    batchSelectedStudentIds.forEach(id => {
      const student = students.find(s => s.studentId === id);
      if (!student || student.registeredCourseCode === batchEnrollCourseCode) return;
      const result = enrollCourse(id, batchEnrollCourseCode, true);
      if (result.success) {
        enrolledCount++;
        if (student.registeredCourseCode) movedCount++;
      }
    });
    setBatchReassignConfirmOpen(false);
    setBatchEnrollModalOpen(false);
    setBatchSelectedStudentIds([]);
    showToast('สำเร็จ', `เพิ่มนักเรียน ${enrolledCount} คน${movedCount ? ` (ย้ายจากวิชาเดิม ${movedCount} คน)` : ''} เข้าวิชา ${batchEnrollCourseCode} แล้ว`);
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-16">
      
      {/* Toast Notification */}
      <Toast
        show={toast.show}
        type={toast.type}
        title={toast.title}
        message={toast.message}
        onClose={() => setToast(prev => ({ ...prev, show: false }))}
      />

      {/* Official Government Document Viewer Modal */}
      <OfficialDocumentView
        isOpen={docModalOpen}
        onClose={() => setDocModalOpen(false)}
        documentType={docType}
        systemConfig={systemConfig}
        course={selectedCourseForDoc}
        selectedCourses={courses.filter(c => selectedReportCourses.includes(c.code))}
        datesByGrade={Object.fromEntries(Object.entries(gradeSettings).map(([grade, setting]) => [Number(grade), setting.dates || []]))}
        courses={courses}
        classroom={selectedRoomForDoc}
        students={students}
        allClassrooms={classrooms}
        dates={
          selectedCourseForDoc
            ? gradeSettings[selectedCourseForDoc.grade]?.dates || []
            : gradeSettings[4]?.dates || []
        }
        attendanceRecords={attendance}
      />

      {reportPickerOpen && (
        <div className="fixed inset-0 z-[70] bg-slate-950/55 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6" onClick={() => setReportPickerOpen(false)}>
          <div className="w-full max-w-2xl max-h-[88vh] overflow-hidden rounded-3xl bg-white shadow-2xl border border-white/60 flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 sm:px-6 bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 text-white flex items-center justify-between">
              <div><p className="text-xs text-blue-200">REPORT BUILDER</p><h3 className="text-lg sm:text-xl font-bold">เลือกรายวิชาที่ต้องการ</h3><p className="text-xs text-blue-100 mt-1">เลือกได้หลายวิชา เอกสารจะแยกหน้าให้แต่ละวิชา</p></div>
              <button onClick={() => setReportPickerOpen(false)} className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 transition-colors" aria-label="ปิด"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between gap-3"><span className="text-sm font-semibold text-slate-700">เลือกแล้ว {selectedReportCourses.length} / {courses.length} วิชา</span><button type="button" onClick={() => setSelectedReportCourses(selectedReportCourses.length === courses.length ? [] : courses.map(c => c.code))} className="text-xs font-semibold text-blue-700 hover:text-blue-900">{selectedReportCourses.length === courses.length ? 'ล้างการเลือก' : 'เลือกทั้งหมด'}</button></div>
            <div className="p-4 sm:p-5 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2">
              {courses.slice().sort((a,b)=>a.code.localeCompare(b.code,'th',{numeric:true})).map(c => <label key={c.code} className={`group flex gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${selectedReportCourses.includes(c.code) ? 'border-blue-400 bg-blue-50 shadow-sm' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}><input type="checkbox" checked={selectedReportCourses.includes(c.code)} onChange={e => setSelectedReportCourses(prev => e.target.checked ? [...prev,c.code] : prev.filter(code => code !== c.code))} className="mt-1 h-4 w-4 accent-blue-700"/><span className="min-w-0"><strong className="block text-xs text-blue-800">{c.code}</strong><span className="block text-sm font-medium text-slate-800 leading-snug">{c.name}</span><span className="block text-[11px] text-slate-500 mt-1">ม.{c.grade} · {c.teacherName}</span></span></label>)}
              {courses.length === 0 && <p className="text-sm text-slate-500">ยังไม่มีรายวิชาในระบบ</p>}
            </div>
            <div className="p-4 sm:px-5 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row gap-2 justify-end">
              <button onClick={() => setReportPickerOpen(false)} className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-white text-sm font-semibold">ยกเลิก</button>
              <button disabled={!selectedReportCourses.length} onClick={() => { const picked = courses.filter(c => selectedReportCourses.includes(c.code)); if (!picked.length) return; picked.forEach(targetCourse => { const sorted = getSortedStudentsForCourse(targetCourse.code); if (reportPickerType === 'course_roster') { exportToExcel(`รายชื่อนักเรียน_${targetCourse.code}`, 'รายชื่อ', ['ลำดับ','รหัสนักเรียน','ชื่อ-นามสกุล','ชั้น/ห้อง','เลขที่'], sorted.map((st,idx)=>[idx+1,st.studentId,st.fullName,st.room,st.numberInRoom])); } else { const dates = gradeSettings[targetCourse.grade]?.dates || []; const rows = sorted.map((st,idx) => { let present=0,absent=0,leave=0,sick=0; const marks=dates.map((_,sessionIndex)=>{ const rec=attendance.find(r=>r.courseCode===targetCourse.code&&r.studentId===st.studentId&&r.sessionIndex===sessionIndex); const status=rec?.status||'unmarked'; if(status==='present')present++; if(status==='absent')absent++; if(status==='leave')leave++; if(status==='sick')sick++; return status==='present'?'/':status==='absent'?'ข':status==='leave'?'ล':status==='sick'?'ป':''; }); return [idx+1,st.room,st.studentId,st.numberInRoom,st.fullName,...marks,present,absent,leave,sick,((present/(dates.length||1))*100).toFixed(1)+'%']; }); exportToExcel(`บันทึกเวลาเรียน_${targetCourse.code}`, 'เวลาเรียน', ['ลำดับ','ชั้น/ห้อง','รหัสนักเรียน','เลขที่','ชื่อ-นามสกุล',...dates.map((_,i)=>`คาบที่ ${i+1}`),'มาเรียน','ขาดเรียน','ลากิจ','ลาป่วย','ร้อยละ'], rows); } }); setReportPickerOpen(false); showToast('ส่งออก Excel สำเร็จ', `สร้างไฟล์แยก ${picked.length} วิชาแล้ว`); }} className="px-4 py-2.5 rounded-xl border border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-700 text-sm font-semibold">ส่งออก Excel</button>
              <button disabled={!selectedReportCourses.length} onClick={() => { const picked = courses.filter(c => selectedReportCourses.includes(c.code)); if (!picked.length) return; setSelectedCourseForDoc(picked[0]); setDocType(reportPickerType); setDocModalOpen(true); setReportPickerOpen(false); }} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 disabled:opacity-40 text-white text-sm font-semibold shadow-md transition-all">เปิดเอกสาร PDF ({selectedReportCourses.length} วิชา)</button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SYSTEM RESET CONFIRMATION MODALS (PASSWORD REQUIRED) */}
      {/* ========================================================================= */}
      <ConfirmationModal
        isOpen={resetEnrollmentModalOpen}
        title="ยืนยันการลบข้อมูลการเลือกลงทะเบียนทั้งหมด"
        message="การดำเนินการนี้จะลบข้อมูลการเลือกลงทะเบียนของนักเรียนทุกคนในทุกระดับชั้น แต่ข้อมูลรายวิชาจะยังคงอยู่ นักเรียนจะต้องทำการเลือกลงทะเบียนใหม่ทั้งหมด"
        requirePassword={true}
        confirmVariant="danger"
        confirmText="ยืนยันล้างการลงทะเบียน"
        cancelText="ยกเลิก"
        onConfirm={(password) => {
          if (!password) return;
          setResetEnrollmentModalOpen(false);
          const res = resetAllEnrollments(password);
          if (res.success) {
            showToast('สำเร็จ', res.message);
          } else {
            showToast('ข้อผิดพลาด', res.message);
          }
        }}
        onCancel={() => setResetEnrollmentModalOpen(false)}
      />

      <ConfirmationModal
        isOpen={deleteCoursesModalOpen}
        title="ยืนยันการลบรายวิชาเพิ่มเติมทั้งหมด"
        message="คุณต้องล้างข้อมูลการเลือกลงทะเบียนก่อนจึงจะสามารถลบรายวิชาได้ เมื่อยืนยันแล้ว รายวิชาเพิ่มเติมทั้งหมดในระบบจะถูกลบออกถาวร"
        requirePassword={true}
        confirmVariant="danger"
        confirmText="ยืนยันลบรายวิชาทั้งหมด"
        cancelText="ยกเลิก"
        onConfirm={(password) => {
          if (!password) return;
          setDeleteCoursesModalOpen(false);
          const res = deleteAllCourses(password);
          if (res.success) {
            showToast('สำเร็จ', res.message);
          } else {
            showToast('ข้อผิดพลาด', res.message);
          }
        }}
        onCancel={() => setDeleteCoursesModalOpen(false)}
      />

      <ConfirmationModal
        isOpen={deleteTeachersModalOpen}
        title="ยืนยันล้างข้อมูลระบบครูผู้สอน"
        message="บัญชีครูผู้สอนทั้งหมดจะถูกลบออกจากระบบ การดำเนินการนี้ต้องกรอกรหัสผ่านผู้ดูแลระบบ"
        requirePassword={true}
        confirmVariant="danger"
        confirmText="ยืนยันล้างข้อมูลครู"
        onConfirm={(password) => { if (!password) return; const result = deleteAllTeachers(password); setDeleteTeachersModalOpen(false); showToast(result.success ? 'สำเร็จ' : 'ข้อผิดพลาด', result.message); }}
        onCancel={() => setDeleteTeachersModalOpen(false)}
      />
      <ConfirmationModal
        isOpen={resetAcademicYearModalOpen}
        title="ยืนยันล้างข้อมูลปีการศึกษานี้"
        message={`ข้อมูลนักเรียน ห้องเรียน รายวิชา ครูผู้สอน การมาเรียน และประกาศของปีการศึกษา ${systemConfig.academicYear} จะถูกลบ โดยคงบัญชีผู้ดูแลระบบไว้ กรุณากรอกรหัสผ่านเพื่อยืนยัน`}
        requirePassword={true}
        confirmVariant="danger"
        confirmText="ยืนยันล้างข้อมูลปีการศึกษา"
        onConfirm={(password) => { if (!password) return; const result = resetSemesterData(password); setResetAcademicYearModalOpen(false); showToast(result.success ? 'สำเร็จ' : 'ข้อผิดพลาด', result.message); }}
        onCancel={() => setResetAcademicYearModalOpen(false)}
      />
      <ConfirmationModal
        isOpen={batchReassignConfirmOpen}
        title="ยืนยันย้ายนักเรียนเข้ารายวิชาใหม่"
        message={`มีนักเรียนที่เลือก ${batchSelectedStudentIds.filter(id => { const st = students.find(s => s.studentId === id); return st?.registeredCourseCode && st.registeredCourseCode !== batchEnrollCourseCode; }).length} คน ที่มีรายวิชาเดิมอยู่แล้ว หากยืนยัน ระบบจะนำออกจากวิชาเดิมและย้ายเข้าวิชา ${batchEnrollCourseCode} โดยรายชื่อวิชาเดิมจะแสดงในรายการนักเรียนที่เลือก`}
        confirmVariant="danger"
        confirmText="ยืนยันย้ายและบันทึก"
        onConfirm={finishBatchEnrollment}
        onCancel={() => setBatchReassignConfirmOpen(false)}
      />
      <ConfirmationModal
        isOpen={!!deleteAdminTarget}
        title="ยืนยันลบบัญชีผู้ดูแลระบบ"
        message={`ต้องการลบบัญชี ${deleteAdminTarget || ''} ใช่หรือไม่? ระบบจะบันทึกประวัติการดำเนินการไว้`}
        requirePassword={true}
        confirmVariant="danger"
        confirmText="ยืนยันลบบัญชี"
        onConfirm={(password) => { if (!deleteAdminTarget || !password) return; const result = removeAdmin(deleteAdminTarget, password); if (result.success) setDeleteAdminTarget(null); showToast(result.success ? 'สำเร็จ' : 'ข้อผิดพลาด', result.message); }}
        onCancel={() => setDeleteAdminTarget(null)}
      />
      <ConfirmationModal
        isOpen={!!deleteStudentTarget}
        title="ยืนยันลบข้อมูลนักเรียน"
        message={`ต้องการลบข้อมูล ${deleteStudentTarget?.fullName || 'นักเรียน'} ใช่หรือไม่?`}
        confirmVariant="danger"
        confirmText="ยืนยันลบ"
        onConfirm={() => { if (!deleteStudentTarget) return; removeStudent(deleteStudentTarget.studentId); showToast('สำเร็จ', `ลบข้อมูล ${deleteStudentTarget.fullName} เรียบร้อย`); setDeleteStudentTarget(null); }}
        onCancel={() => setDeleteStudentTarget(null)}
      />
      <ConfirmationModal
        isOpen={confirmReassignOpen}
        title="ยืนยันเปลี่ยนรายวิชาของนักเรียน"
        message={assignCourseModalStudent && pendingAssignCourse ? `${assignCourseModalStudent.fullName} ลงทะเบียนวิชา ${assignCourseModalStudent.registeredCourseCode} อยู่แล้ว หากยืนยันจะนำออกจากวิชาเดิมและย้ายเข้า ${pendingAssignCourse.code} ${pendingAssignCourse.name} ต้องการดำเนินการต่อหรือไม่?` : 'ยืนยันเปลี่ยนรายวิชา?'}
        confirmVariant="danger"
        confirmText="ยืนยันย้ายรายวิชา"
        onConfirm={() => { if (!assignCourseModalStudent || !pendingAssignCourse) return; const res = enrollCourse(assignCourseModalStudent.studentId, pendingAssignCourse.code, true); setConfirmReassignOpen(false); setPendingAssignCourse(null); setAssignCourseModalStudent(null); showToast(res.success ? 'สำเร็จ' : 'ข้อผิดพลาด', res.success ? `ย้ายนักเรียน ${assignCourseModalStudent.fullName} เข้าวิชา ${pendingAssignCourse.code} แล้ว` : res.message); }}
        onCancel={() => { setConfirmReassignOpen(false); setPendingAssignCourse(null); }}
      />

      <ConfirmationModal
        isOpen={deleteStudentsModalOpen}
        title="ยืนยันการลบข้อมูลนักเรียนทั้งหมด"
        message="การดำเนินการนี้จะลบรายชื่อนักเรียนทั้งหมดออกจากระบบอย่างถาวร กรุณากรอกรหัสผ่านเพื่อยืนยัน"
        requirePassword={true}
        confirmVariant="danger"
        confirmText="ยืนยันลบข้อมูลนักเรียน"
        cancelText="ยกเลิก"
        onConfirm={(password) => {
          if (!password) return;
          setDeleteStudentsModalOpen(false);
          const res = deleteAllStudents(password);
          if (res.success) {
            showToast('สำเร็จ', res.message);
          } else {
            showToast('ข้อผิดพลาด', res.message);
          }
        }}
        onCancel={() => setDeleteStudentsModalOpen(false)}
      />

      {/* ========================================================================= */}
      {/* 1. OVERVIEW DASHBOARD (แดชบอร์ดภาพรวม) */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <section className="space-y-6">
          
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-[#00236f] via-blue-800 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex flex-col items-start gap-1.5 mb-2">
                <span className="px-3 py-1 rounded-full bg-amber-400 text-slate-900 text-xs font-bold shadow-2xs">ระบบผู้ดูแลระบบ (Administrator)</span>
                <span className="text-xs text-blue-200">โรงเรียนสายปัญญารังสิต</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                ยินดีต้อนรับ ผู้ดูแลระบบ <span className="break-all">({currentUser?.username || 'ผู้ดูแลระบบ'})</span>
              </h1>
              <p className="text-xs sm:text-sm text-blue-100 mt-1 max-w-2xl">
                ระบบจัดการลงทะเบียนรายวิชาเพิ่มเติมและเวลาเรียน ปีการศึกษา {systemConfig.academicYear} ภาคเรียนที่ {systemConfig.semester}
              </p>
            </div>
          </div>

          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500">จำนวนนักเรียนทั้งหมด</span>
                <div className="text-2xl sm:text-3xl font-extrabold text-[#00236f] mt-1">
                  {students.length.toLocaleString()} <span className="text-xs font-normal text-slate-400">คน</span>
                </div>
                <div className="text-[11px] text-emerald-600 font-semibold mt-1">
                  ลงทะเบียนแล้ว {students.filter(s => s.registeredCourseCode !== null).length} คน
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl">group</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500">จำนวนบุคลากร / ครู</span>
                <div className="text-2xl sm:text-3xl font-extrabold text-purple-950 mt-1">
                  {teachers.length} <span className="text-xs font-normal text-slate-400">ท่าน</span>
                </div>
                <div className="text-[11px] text-purple-700 font-semibold mt-1">
                  ผู้ดูแลระบบ {admins.length} บัญชี
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl">record_voice_over</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500">จำนวนรายวิชาเพิ่มเติม</span>
                <div className="text-2xl sm:text-3xl font-extrabold text-[#00236f] mt-1">
                  {courses.length} <span className="text-xs font-normal text-slate-400">วิชา</span>
                </div>
                <div className="text-[11px] text-blue-600 font-semibold mt-1">
                  ม.1 ถึง ม.6 รวม {classrooms.length} ห้องเรียน
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-700 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl">auto_stories</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500">ที่นั่งว่างคงเหลือ</span>
                <div className="text-2xl sm:text-3xl font-extrabold text-orange-600 mt-1">
                  {Math.max(
                    0,
                    courses.reduce((acc, c) => acc + c.maxStudents, 0) -
                      students.filter(s => s.registeredCourseCode !== null).length
                  ).toLocaleString()}{' '}
                  <span className="text-xs font-normal text-slate-400">ที่นั่ง</span>
                </div>
                <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  ระบบ Real-time
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-orange-600 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl">event_seat</span>
              </div>
            </div>
          </div>

          {/* Quick Shortcuts Grid */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-700">bolt</span>
              ทางลัดจัดการระบบด่วน
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                onClick={() => onSelectTab('reports')}
                className="p-3.5 rounded-2xl bg-blue-50/70 hover:bg-blue-100 text-left transition-all border border-blue-200/60 cursor-pointer"
              >
                <span className="material-symbols-outlined text-blue-700 text-xl block mb-1">print</span>
                <span className="text-xs font-bold text-slate-800 block">พิมพ์รายงานราชการ</span>
                <span className="text-[11px] text-slate-500">PDF ฟอนต์สารบัญ / Excel</span>
              </button>
              <button
                onClick={() => onSelectTab('electives')}
                className="p-3.5 rounded-2xl bg-amber-50/70 hover:bg-amber-100 text-left transition-all border border-amber-200/60 cursor-pointer"
              >
                <span className="material-symbols-outlined text-amber-700 text-xl block mb-1">toggle_on</span>
                <span className="text-xs font-bold text-slate-800 block">เปิด-ปิดระบบ ม.1-ม.6</span>
                <span className="text-[11px] text-slate-500">ควบคุมสถานะแต่ละระดับ</span>
              </button>
              <button
                onClick={() => onSelectTab('enrollment_management')}
                className="p-3.5 rounded-2xl bg-emerald-50/70 hover:bg-emerald-100 text-left transition-all border border-emerald-200/60 cursor-pointer"
              >
                <span className="material-symbols-outlined text-emerald-700 text-xl block mb-1">how_to_reg</span>
                <span className="text-xs font-bold text-slate-800 block">ลงทะเบียนให้นักเรียน</span>
                <span className="text-[11px] text-slate-500">เพิ่มรายคนหรือรายกลุ่ม</span>
              </button>
              <button
                onClick={() => onSelectTab('settings')}
                className="p-3.5 rounded-2xl bg-purple-50/70 hover:bg-purple-100 text-left transition-all border border-purple-200/60 cursor-pointer"
              >
                <span className="material-symbols-outlined text-purple-700 text-xl block mb-1">settings</span>
                <span className="text-xs font-bold text-slate-800 block">ตั้งค่าปีการศึกษา</span>
                <span className="text-[11px] text-slate-500">ภาคเรียนและล้างข้อมูล</span>
              </button>
            </div>
          </div>

        </section>
      )}

      {/* ========================================================================= */}
      {/* 2. REPORTS (พิมพ์รายงาน - แอดมินเข้าถึงได้ทุกเสรี) */}
      {/* ========================================================================= */}
      {activeTab === 'reports' && (
        <section className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-700 text-2xl">print</span>
                <h2 className="text-xl font-bold text-slate-900">
                  ศูนย์พิมพ์รายงานราชการ (ฟอนต์สารบัญ • โรงเรียนสายปัญญารังสิต)
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                สร้างเอกสารแบบฟอร์มราชการตามมาตรฐานกระทรวงศึกษาธิการ โดยใช้ฟอนต์สารบัญแท้ และส่งออกไฟล์ Excel ข้อมูลล้วน
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50/70 px-4 py-3 flex items-center gap-3">
              <span className="material-symbols-outlined text-blue-700 text-2xl">touch_app</span>
              <p className="text-sm text-slate-600">เลือกประเภทรายงานจากการ์ดด้านล่าง แล้วเลือกรายวิชาในหน้าต่างของปุ่มนั้นได้เลย</p>
            </div>

            {/* 4 Report Categories Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              
              {/* Report 1: Print Course Roster (All or Selected) */}
              <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-200/80 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-200 text-blue-800 text-[11px] font-bold">
                      เอกสารที่ 1
                    </span>
                    <span className="text-xs font-semibold text-slate-500">แนวตั้ง (Portrait)</span>
                  </div>
                  <h4 className="text-base font-bold text-[#00236f] mt-1">
                    รายชื่อนักเรียนในรายวิชาเพิ่มเติม (ใบเช็คชื่อเปล่า)
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed mt-1">
                    แสดงตราโรงเรียนสายปัญญารังสิต ชื่อวิชา ครูผู้สอน จำนวนนักเรียน ห้องเรียน ตารางเรียงห้องและรหัสนักเรียน พร้อมช่องว่างสำหรับติ๊กเช็คชื่อ
                  </p>
                </div>

                <div className="pt-2 space-y-2">
                  <button onClick={() => { setReportPickerType('course_roster'); setSelectedReportCourses(courses.map(c => c.code)); setReportPickerOpen(true); }} className="report-action-button w-full py-3 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-900/15 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"><span className="material-symbols-outlined">picture_as_pdf</span><span>เลือกวิชาและสร้างเอกสาร</span><span className="material-symbols-outlined text-lg">arrow_forward</span></button>
                </div>
              </div>

              {/* Report 2: Print Room Roster (รายห้อง) */}
              <div className="p-5 rounded-2xl bg-indigo-50/60 border border-indigo-200/80 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-200 text-indigo-900 text-[11px] font-bold">
                      เอกสารที่ 2
                    </span>
                    <span className="text-xs font-semibold text-slate-500">แนวตั้ง (Portrait)</span>
                  </div>
                  <h4 className="text-base font-bold text-indigo-950 mt-1">
                    รายชื่อนักเรียนรายวิชาเพิ่มเติมรายห้อง
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed mt-1">
                    แสดงตราโรงเรียน ระดับชั้นมัธยมศึกษาปีที่ ชั้น/ห้อง คุณครูที่ปรึกษา ตารางเรียงจากเลขที่ รหัสนักเรียน ชื่อนามสกุล และรายวิชาเพิ่มเติมที่นักเรียนเลือก
                  </p>
                </div>

                <div className="pt-2 space-y-2">
                  <label className="block text-xs font-bold text-slate-700">เลือกห้องเรียนที่ต้องการพิมพ์:</label>
                  <select
                    className="w-full h-10 px-3 rounded-xl bg-white border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                    onChange={(e) => {
                      const room = classrooms.find(r => r.roomNumber === e.target.value);
                      if (room) setSelectedRoomForDoc(room);
                    }}
                  >
                    {classrooms.slice().sort((a,b) => a.grade - b.grade || Number(a.roomNumber.split('/')[1]) - Number(b.roomNumber.split('/')[1])).map(r => (
                      <option key={r.id} value={r.roomNumber}>
                        มัธยมศึกษาปีที่ {r.roomNumber} (ครูที่ปรึกษา: {r.advisor})
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => {
                        const targetRoom = selectedRoomForDoc || classrooms[0];
                        if (targetRoom) {
                          setSelectedRoomForDoc(targetRoom);
                          setDocType('room_roster');
                          setDocModalOpen(true);
                        }
                      }}
                      className="flex-1 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base">picture_as_pdf</span>
                      <span>พิมพ์ PDF รายห้อง</span>
                    </button>
                    <button
                      onClick={() => {
                        const targetRoom = selectedRoomForDoc || classrooms[0];
                        if (targetRoom) {
                          const roomStudents = students.filter(s => s.room === targetRoom.roomNumber).sort((a, b) => a.studentId.localeCompare(b.studentId, 'th', { numeric: true }));
                          const headers = ['เลขที่', 'รหัสนักเรียน', 'ชื่อ-นามสกุล', 'ชั้น/ห้อง', 'รหัสวิชา', 'วิชาที่เลือก'];
                          const rows = roomStudents.map(s => {
                            const c = courses.find(item => item.code === s.registeredCourseCode);
                            return [s.numberInRoom, s.studentId, s.fullName, s.room, c?.code || '-', c?.name || 'ยังไม่เลือก'];
                          });
                          exportToExcel(`รายชื่อนักเรียนห้อง_${targetRoom.roomNumber.replace('/', '_')}`, 'รายห้อง', headers, rows);
                          showToast('ส่งออก Excel สำเร็จ', `ดาวน์โหลดรายชื่อห้อง ม.${targetRoom.roomNumber} เรียบร้อย`);
                        }
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base">description</span>
                      <span>Excel</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Report 3: Attendance Summary (Landscape) */}
              <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[11px] font-bold">
                      เอกสารที่ 3
                    </span>
                    <span className="text-xs font-semibold text-amber-800 font-bold">แนวนอน (Landscape)</span>
                  </div>
                  <h4 className="text-base font-bold text-amber-950 mt-1">
                    รายงานเวลาเรียนนักเรียน (สถิติการมา ขาด ลา ป่วย และร้อยละ)
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed mt-1">
                    แสดงตารางรายชื่อนักเรียน วันที่มีการเรียนทั้งหมด พร้อมเครื่องหมาย มา (/) ขาด (ข) ลากิจ (ล) ลาป่วย (ป) และคำนวณร้อยละเป็นแนวนอน
                  </p>
                </div>

                <div className="pt-2 space-y-2">
                  <button onClick={() => { setReportPickerType('attendance_summary'); setSelectedReportCourses(courses.map(c => c.code)); setReportPickerOpen(true); }} className="report-action-button w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-orange-900/15 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"><span className="material-symbols-outlined">table_chart</span><span>เลือกวิชาและสร้างรายงานเวลาเรียน</span><span className="material-symbols-outlined text-lg">arrow_forward</span></button>
                </div>
              </div>

              {/* Report 4: All Electives Catalog */}
              <div className="p-5 rounded-2xl bg-teal-50/60 border border-teal-200/80 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-teal-200 text-teal-900 text-[11px] font-bold">
                      เอกสารที่ 4
                    </span>
                    <span className="text-xs font-semibold text-slate-500">แนวตั้ง (Portrait)</span>
                  </div>
                  <h4 className="text-base font-bold text-teal-950 mt-1">
                    รายวิชาเพิ่มเติมทั้งหมดประจำภาคเรียน
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed mt-1">
                    แสดงตราโรงเรียนสายปัญญารังสิต ปีการศึกษา ภาคเรียนที่ และตารางเรียงลำดับจากรหัสวิชาตัวแรก รหัสวิชา ชื่อวิชา ครูผู้สอน ห้องเรียน
                  </p>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={() => {
                      setDocType('all_courses');
                      setDocModalOpen(true);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">print</span>
                    <span className="whitespace-nowrap">พิมพ์ PDF รายวิชาทั้งหมด</span>
                  </button>
                  <button
                    onClick={() => {
                      const sorted = [...courses].sort((a, b) => a.code.localeCompare(b.code, 'th'));
                      const headers = ['ลำดับ', 'รหัสวิชา', 'ชื่อวิชา', 'ระดับชั้น', 'ห้องที่เปิดรับ', 'ครูผู้สอน', 'ห้องเรียน', 'จำนวนที่รับ'];
                      const rows = sorted.map((c, idx) => [
                        idx + 1,
                        c.code,
                        c.name,
                        `ม.${c.grade}`,
                        c.allowedRooms.join(', '),
                        c.teacherName,
                        c.classroom,
                        c.maxStudents
                      ]);
                      exportToExcel('รายวิชาเพิ่มเติมทั้งหมด_SPR', 'รายวิชาทั้งหมด', headers, rows);
                      showToast('ส่งออก Excel สำเร็จ', 'ดาวน์โหลดรายวิชาเพิ่มเติมทั้งหมดเรียบร้อย');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">description</span>
                    <span>Excel</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 3. CLASSROOMS & STUDENTS (จัดการห้องเรียนและนักเรียน) */}
      {/* ========================================================================= */}
      {activeTab === 'classrooms' && (
        <section className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  จัดการห้องเรียนและรายชื่อนักเรียน
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  ห้องเรียนจะเรียงจากระดับชั้นและห้อง (เช่น 1/1, 2/1, 2/2...) พร้อมค้นหาห้อง
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setAddClassroomModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">add</span>
                  <span>เพิ่มห้องเรียน</span>
                </button>
                <button
                  onClick={() => setClassroomCSVModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">upload_file</span>
                  <span>นำเข้าห้องด้วย CSV</span>
                </button>
                <button
                  onClick={() => setStudentCSVModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">person_add</span>
                  <span>เพิ่มนักเรียนด้วย CSV</span>
                </button>
              </div>
            </div>

            {/* Room Search Box */}
            <div className="relative w-full sm:w-72">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base">
                search
              </span>
              <input
                type="text"
                value={roomSearchQuery}
                onChange={(e) => setRoomSearchQuery(e.target.value)}
                placeholder="ค้นหาห้องเรียน (เช่น 1/5, 4/3)..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:border-blue-600"
              />
            </div>

            {/* Classrooms are grouped by grade first, then by room. */}
            <div className="space-y-6">
              {[1, 2, 3, 4, 5, 6].map((grade) => {
                const gradeRooms = classrooms
                  .filter(room => room.grade === grade)
                  .filter(room => !roomSearchQuery || room.roomNumber.includes(roomSearchQuery) || room.advisor.includes(roomSearchQuery))
                  .sort((a, b) => Number(a.roomNumber.split('/')[1]) - Number(b.roomNumber.split('/')[1]));
                if (gradeRooms.length === 0) return null;
                return (
                  <section key={grade} className="space-y-3">
                    <h3 className="border-b border-slate-200 pb-2 text-base font-extrabold text-slate-800">ระดับชั้นมัธยมศึกษาปีที่ {grade}</h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {gradeRooms.map((room) => {
                        const studentCount = students.filter(student => student.room === room.roomNumber).length;
                        return (
                          <div key={room.id} className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/80 p-5 transition-all hover:border-blue-300 hover:shadow-md">
                            <div>
                              <div className="mb-2 flex items-center justify-between gap-2">
                                <span className="whitespace-nowrap rounded-xl bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">ห้อง ม.{room.roomNumber}</span>
                                <span className="whitespace-nowrap text-xs font-bold text-slate-500">{studentCount} คน</span>
                              </div>
                              <div className="mt-2 text-xs text-slate-600">
                                <strong>ครูที่ปรึกษา:</strong>
                                <p className="mt-0.5 font-medium text-slate-800" title={room.advisor}>{room.advisor || 'ยังไม่ได้ระบุ'}</p>
                              </div>
                            </div>
                            <div className="mt-4 flex items-center gap-2 border-t border-slate-200/60 pt-3">
                              <button onClick={() => setSelectedRoomForStudents(room)} className="flex-1 cursor-pointer rounded-lg bg-blue-700 py-1.5 text-xs font-bold text-white hover:bg-blue-800">ดูรายชื่อนักเรียน ({studentCount})</button>
                              <button onClick={() => { setSelectedRoomForDoc(room); setDocType('room_roster'); setDocModalOpen(true); }} className="cursor-pointer rounded-lg border border-slate-300 p-1.5 text-xs font-medium text-slate-600 hover:bg-white" title="พิมพ์รายงานห้องนี้"><span className="material-symbols-outlined text-base">print</span></button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>

          </div>

          {/* Room Details View Modal (when a room is clicked) */}
          {selectedRoomForStudents && (
            <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col overflow-hidden">
              <div className="bg-white w-full h-full flex flex-col shadow-2xl overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      รายชื่อนักเรียน มัธยมศึกษาปีที่ {selectedRoomForStudents.roomNumber}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 break-words">ครูที่ปรึกษา: {selectedRoomForStudents.advisor}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setAddStudentModalOpen(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base">person_add</span>
                      <span>เพิ่มนักเรียนในห้องนี้</span>
                    </button>
                    <button onClick={() => setSelectedRoomForStudents(null)} className="px-3 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold cursor-pointer">กลับหน้าห้องเรียน</button>
                  </div>
                </div>

                <div className="p-3 sm:p-5 overflow-y-auto flex-1 min-w-0">
                  <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <th className="py-2.5 px-2 text-center w-14">เลขที่</th>
                        <th className="py-2.5 px-3 w-28 font-mono">รหัสนักเรียน</th>
                        <th className="py-2.5 px-3 min-w-[160px]">ชื่อ - นามสกุล</th>
                        <th className="py-2.5 px-3 w-32 font-mono">เลขบัตรประชาชน</th>
                        <th className="py-2.5 px-3">วิชาเพิ่มเติมที่ลงทะเบียน</th>
                        <th className="py-2.5 px-2 text-center w-16">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {students
                        .filter(s => s.room === selectedRoomForStudents.roomNumber)
                        .sort((a, b) => a.studentId.localeCompare(b.studentId, 'th', { numeric: true }))
                        .map((st) => {
                          const regCourse = courses.find(c => c.code === st.registeredCourseCode);
                          return (
                            <tr key={st.studentId} className="hover:bg-slate-50">
                              <td className="py-2 px-2 text-center font-bold">{st.numberInRoom}</td>
                              <td className="py-2 px-3 font-mono font-bold text-blue-900">{st.studentId}</td>
                              <td className="py-2 px-3 font-medium text-slate-800">{st.fullName}</td>
                              <td className="py-2 px-3 font-mono text-slate-500">{st.nationalId}</td>
                              <td className="py-2 px-3">
                                {regCourse ? (
                                  <span className="px-2 py-0.5 rounded-lg bg-blue-100 text-blue-800 font-bold text-[11px]">
                                    {regCourse.code} {regCourse.name}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 italic">ยังไม่ลงทะเบียน</span>
                                )}
                              </td>
                              <td className="py-2 px-2 text-center">
                                <button
                                  onClick={() => {
                                    if (confirm(`คุณต้องการลบนักเรียน ${st.fullName} ใช่หรือไม่?`)) {
                                      removeStudent(st.studentId);
                                      showToast('สำเร็จ', `ลบข้อมูล ${st.fullName} เรียบร้อย`);
                                    }
                                  }}
                                  className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                                  title="ลบนักเรียน"
                                >
                                  <span className="material-symbols-outlined text-base">delete</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                  </div>
                  <div className="sm:hidden space-y-3">
                    {students.filter(st => st.room === selectedRoomForStudents.roomNumber).sort((a,b) => a.numberInRoom-b.numberInRoom || a.studentId.localeCompare(b.studentId,'th',{numeric:true})).map(st => {
                      const regCourse = courses.find(c => c.code === st.registeredCourseCode);
                      return <article key={st.studentId} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm space-y-2">
                        <div className="flex items-start justify-between gap-2"><div className="min-w-0"><div className="text-[11px] text-blue-700 font-mono font-bold">{st.studentId} • เลขที่ {st.numberInRoom}</div><div className="font-bold text-sm text-slate-900 break-words">{st.fullName}</div></div><button onClick={() => setDeleteStudentTarget(st)} className="shrink-0 rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-700">ลบ</button></div>
                        <div className="text-xs text-slate-500">เลขบัตรประชาชน: {st.nationalId}</div><div className="text-xs"><span className="font-bold text-slate-600">วิชา: </span>{regCourse ? `${regCourse.code} ${regCourse.name}` : 'ยังไม่ลงทะเบียน'}</div>
                      </article>;
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Add Classroom Modal */}
          {addClassroomModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
              <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 mb-4">เพิ่มห้องเรียนใหม่</h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.target as HTMLFormElement;
                    const roomNumber = (form.elements.namedItem('roomNumber') as HTMLInputElement).value.trim();
                    const advisor = (form.elements.namedItem('advisor') as HTMLInputElement).value.trim();
                    const grade = parseInt((form.elements.namedItem('grade') as HTMLSelectElement).value, 10);
                    if (!roomNumber) return;
                    addClassroom(roomNumber, advisor || 'ยังไม่ได้ระบุครูที่ปรึกษา', grade);
                    setAddClassroomModalOpen(false);
                    showToast('สำเร็จ', `เพิ่มห้อง ม.${roomNumber} เรียบร้อยแล้ว`);
                  }}
                  className="space-y-4 text-xs"
                >
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">ระดับชั้น:</label>
                    <select name="grade" className="w-full h-10 px-3 rounded-xl border border-slate-300">
                      {[1, 2, 3, 4, 5, 6].map(g => (
                        <option key={g} value={g}>มัธยมศึกษาปีที่ {g}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">เลขห้อง (เช่น 1/1, 2/2, 4/3):</label>
                    <input
                      name="roomNumber"
                      type="text"
                      placeholder="เช่น 1/1 หรือ 4/3"
                      required
                      className="w-full h-10 px-3 rounded-xl border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">ชื่อครูที่ปรึกษา:</label>
                    <input
                      name="advisor"
                      type="text"
                      placeholder="เช่น อาจารย์สมใจ นวลอนงค์, อาจารย์ธีรพัฒน์ สุวรรณรัตน์"
                      className="w-full h-10 px-3 rounded-xl border border-slate-300"
                    />
                  </div>
                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setAddClassroomModalOpen(false)}
                      className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-bold cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-blue-700 text-white font-bold cursor-pointer"
                    >
                      บันทึกห้องเรียน
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Add Student Modal (Single) */}
          {addStudentModalOpen && selectedRoomForStudents && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
              <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 mb-4">
                  เพิ่มนักเรียนในห้อง ม.{selectedRoomForStudents.roomNumber}
                </h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.target as HTMLFormElement;
                    const studentId = (form.elements.namedItem('studentId') as HTMLInputElement).value.trim();
                    const nationalId = (form.elements.namedItem('nationalId') as HTMLInputElement).value.trim();
                    const fullName = (form.elements.namedItem('fullName') as HTMLInputElement).value.trim();
                    const numberInRoom = parseInt((form.elements.namedItem('numberInRoom') as HTMLInputElement).value, 10) || 1;

                    addStudent({
                      studentId,
                      nationalId,
                      fullName,
                      room: selectedRoomForStudents.roomNumber,
                      numberInRoom,
                      registeredCourseCode: null,
                      registeredAt: null
                    });
                    setAddStudentModalOpen(false);
                    showToast('สำเร็จ', `เพิ่มนักเรียน ${fullName} สำเร็จ`);
                  }}
                  className="space-y-3 text-xs"
                >
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">รหัสนักเรียน (5 หลัก):</label>
                    <input name="studentId" required placeholder="54399" className="w-full h-10 px-3 rounded-xl border border-slate-300" />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">เลขบัตรประชาชน (13 หลัก):</label>
                    <input name="nationalId" required placeholder="1100501234999" className="w-full h-10 px-3 rounded-xl border border-slate-300" />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">ชื่อ - นามสกุล:</label>
                    <input name="fullName" required placeholder="นายธนภัทร สุขสมบูรณ์" className="w-full h-10 px-3 rounded-xl border border-slate-300" />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">เลขที่ในห้อง:</label>
                    <input name="numberInRoom" type="number" defaultValue="1" required className="w-full h-10 px-3 rounded-xl border border-slate-300" />
                  </div>
                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setAddStudentModalOpen(false)}
                      className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-bold cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-blue-700 text-white font-bold cursor-pointer"
                    >
                      บันทึกนักเรียน
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Import Students CSV Modal */}
          {studentCSVModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
              <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  นำเข้านักเรียนด้วยไฟล์ CSV
                </h3>
                <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                  เรียงลำดับข้อมูลในแต่ละบรรทัดดังนี้:<br />
                  <strong className="text-slate-800">รหัสนักเรียน, เลขบัตรประชาชน, ชื่อ-นามสกุล, ชั้น/ห้อง, เลขที่</strong><br />
                  (หากห้องเรียนที่ระบุยังไม่มีในระบบ ระบบจะสร้างห้องเรียนใหม่อัตโนมัติ)
                </p>
                <CSVUploadField id="csvStudentsInput" />
                <div className="pt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setStudentCSVModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-bold text-xs cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const txt = (document.getElementById('csvStudentsInput') as HTMLTextAreaElement)?.value || '';
                      if (!txt.trim()) return;
                      const res = importStudentsCSV(txt);
                      setStudentCSVModalOpen(false);
                      showToast('สำเร็จ', `นำเข้านักเรียนสำเร็จ ${res.added} คน`);
                    }}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer"
                  >
                    นำเข้าข้อมูล
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Import Classrooms CSV Modal */}
          {classroomCSVModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
              <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 mb-2">นำเข้าห้องเรียนด้วย CSV</h3>
                <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                  เรียงลำดับข้อมูลในแต่ละบรรทัด: <strong className="text-slate-800">เลขห้อง, ชื่อครูที่ปรึกษา, ระดับชั้น (ตัวเลข 1-6)</strong>
                </p>
                <CSVUploadField id="csvClassroomsInput" />
                <div className="pt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setClassroomCSVModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-bold text-xs cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const txt = (document.getElementById('csvClassroomsInput') as HTMLTextAreaElement)?.value || '';
                      if (!txt.trim()) return;
                      const res = importClassroomsCSV(txt);
                      setClassroomCSVModalOpen(false);
                      showToast('สำเร็จ', `นำเข้าห้องเรียนสำเร็จ ${res.added} ห้อง`);
                    }}
                    className="px-5 py-2 rounded-xl bg-blue-700 text-white font-bold text-xs cursor-pointer"
                  >
                    นำเข้าข้อมูล
                  </button>
                </div>
              </div>
            </div>
          )}

        </section>
      )}

      {/* ========================================================================= */}
      {/* 4. TEACHER MANAGEMENT (จัดการรายชื่อครู) */}
      {/* ========================================================================= */}
      {activeTab === 'teachers' && (
        <section className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">จัดการรายชื่อคุณครู</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  เมื่อบันทึกข้อมูล คุณครูจะถูกจัดเรียงตามพยัญชนะและสระภาษาไทยโดยอัตโนมัติ
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAddTeacherModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">person_add</span>
                  <span>เพิ่มคุณครู</span>
                </button>
                <button
                  onClick={() => setTeacherCSVModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">upload_file</span>
                  <span>อัปโหลด CSV</span>
                </button>
              </div>
            </div>

            {/* Teachers Table (Thai Alphabetically Sorted) */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-2.5 px-3 text-center w-14">ลำดับ</th>
                    <th className="py-2.5 px-3 min-w-[180px]">ชื่อ - นามสกุลคุณครู</th>
                    <th className="py-2.5 px-3 w-36">ชื่อผู้ใช้ (Username)</th>
                    <th className="py-2.5 px-3 w-36">รหัสผ่าน</th>
                    <th className="py-2.5 px-3">วิชาที่รับผิดชอบ</th>
                    <th className="py-2.5 px-3 text-center whitespace-nowrap">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {teachers.map((t, idx) => {
                    const assignedCourses = courses.filter(c => c.teacherName.trim() === t.fullName.trim());
                    return (
                      <tr key={t.username} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">{t.fullName}</td>
                        <td className="py-2.5 px-3 font-mono text-blue-900">{t.username}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">••••••••</td>
                        <td className="py-2.5 px-3">
                          {assignedCourses.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {assignedCourses.map(c => (
                                <span key={c.code} className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 text-[11px] font-mono">
                                  {c.code}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">ยังไม่มีวิชาที่รับผิดชอบ</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center justify-center gap-1.5">
                            <button type="button" onClick={() => setEditingTeacher(t)} className="rounded-lg bg-blue-50 px-2.5 py-1.5 font-bold text-blue-700 hover:bg-blue-100 whitespace-nowrap">แก้ไข</button>
                            <button type="button" onClick={() => { if (confirm(`ยืนยันลบคุณครู ${t.fullName} (${t.username}) หรือไม่?`)) { removeTeacher(t.username); showToast('สำเร็จ', `ลบรายชื่อคุณครู ${t.fullName} แล้ว`); } }} className="rounded-lg bg-rose-50 px-2.5 py-1.5 font-bold text-rose-700 hover:bg-rose-100 whitespace-nowrap">ลบ</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add Teacher Modal */}
          {addTeacherModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
              <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 mb-4">เพิ่มคุณครูใหม่</h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.target as HTMLFormElement;
                    const username = (form.elements.namedItem('username') as HTMLInputElement).value.trim();
                    const password = (form.elements.namedItem('password') as HTMLInputElement).value.trim();
                    const fullName = (form.elements.namedItem('fullName') as HTMLInputElement).value.trim();
                    if (!username || !fullName) return;
                    if (!password) { showToast('ข้อผิดพลาด', 'กรุณากำหนดรหัสผ่านให้คุณครู'); return; }
                    addTeacher({ username, password, fullName });
                    setAddTeacherModalOpen(false);
                    showToast('สำเร็จ', `บันทึกคุณครู ${fullName} เรียบร้อย`);
                  }}
                  className="space-y-3 text-xs"
                >
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">ชื่อผู้ใช้งาน (Username):</label>
                    <input name="username" required placeholder="thanakorn" className="w-full h-10 px-3 rounded-xl border border-slate-300" />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">รหัสผ่าน (Password):</label>
                    <input name="password" type="password" required autoComplete="new-password" placeholder="กำหนดรหัสผ่าน" className="w-full h-10 px-3 rounded-xl border border-slate-300" />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">ชื่อ - นามสกุลคุณครู:</label>
                    <input name="fullName" required placeholder="ครูธนกร จารุวัตร" className="w-full h-10 px-3 rounded-xl border border-slate-300" />
                  </div>
                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setAddTeacherModalOpen(false)}
                      className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-bold cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-blue-700 text-white font-bold cursor-pointer"
                    >
                      บันทึกคุณครู
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Edit teacher account / admin-assisted password reset */}
          {editingTeacher && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
              <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 mb-4">แก้ไขข้อมูลและรหัสผ่านคุณครู</h3>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const username = (form.elements.namedItem('editTeacherUsername') as HTMLInputElement).value.trim();
                  const fullName = (form.elements.namedItem('editTeacherFullName') as HTMLInputElement).value.trim();
                  const password = (form.elements.namedItem('editTeacherPassword') as HTMLInputElement).value;
                  if (!username || !fullName) return;
                  const result = updateTeacher(editingTeacher.username, { username, fullName });
                  if (!result.success) { showToast('ข้อผิดพลาด', result.message); return; }
                  if (password.trim()) resetTeacherPassword(username, password.trim());
                  setEditingTeacher(null);
                  showToast('สำเร็จ', 'บันทึกข้อมูลคุณครูเรียบร้อยแล้ว');
                }} className="space-y-3 text-xs">
                  <div><label className="mb-1 block font-bold text-slate-700">ชื่อผู้ใช้</label><input name="editTeacherUsername" required defaultValue={editingTeacher.username} className="h-10 w-full rounded-xl border border-slate-300 px-3" /></div>
                  <div><label className="mb-1 block font-bold text-slate-700">ชื่อ-นามสกุล</label><input name="editTeacherFullName" required defaultValue={editingTeacher.fullName} className="h-10 w-full rounded-xl border border-slate-300 px-3" /></div>
                  <div><label className="mb-1 block font-bold text-slate-700">ตั้งรหัสผ่านใหม่ (เว้นว่างหากไม่เปลี่ยน)</label><input name="editTeacherPassword" type="password" autoComplete="new-password" placeholder="กรอกรหัสผ่านใหม่" className="h-10 w-full rounded-xl border border-slate-300 px-3" /></div>
                  <p className="text-slate-500">การแก้ไขหรือรีเซ็ตรหัสผ่านดำเนินการโดยผู้ดูแลระบบเท่านั้น</p>
                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setEditingTeacher(null)} className="rounded-xl border border-slate-300 px-4 py-2 font-bold text-slate-600">ยกเลิก</button>
                    <button type="submit" className="rounded-xl bg-blue-700 px-5 py-2 font-bold text-white">บันทึก</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Teacher CSV Modal */}
          {teacherCSVModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
              <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 mb-2">นำเข้าคุณครูด้วย CSV</h3>
                <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                  รูปแบบข้อมูล: <strong className="text-slate-800">Username, Password, ชื่อ-นามสกุล</strong>
                </p>
                <CSVUploadField id="csvTeachersInput" />
                <div className="pt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setTeacherCSVModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-bold text-xs cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const txt = (document.getElementById('csvTeachersInput') as HTMLTextAreaElement)?.value || '';
                      if (!txt.trim()) return;
                      const res = importTeachersCSV(txt);
                      setTeacherCSVModalOpen(false);
                      showToast('สำเร็จ', `นำเข้าคุณครูสำเร็จ ${res.added} ท่าน`);
                    }}
                    className="px-5 py-2 rounded-xl bg-blue-700 text-white font-bold text-xs cursor-pointer"
                  >
                    นำเข้าข้อมูล
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ========================================================================= */}
      {/* 5. ELECTIVE COURSE MANAGEMENT (จัดการวิชาเสรี / วิชาเพิ่มเติม ม.1 - ม.6) */}
      {/* ========================================================================= */}
      {activeTab === 'electives' && (
        <section className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
            
            {/* Header and Grade Tabs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  จัดการรายวิชาเพิ่มเติม (มัธยมศึกษาปีที่ 1 - 6)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  ตั้งค่าวันเวลาเรียน คาบเรียน เปิด/ปิดระบบรับสมัครแยกตามระดับชั้น
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleOpenAddCourse}
                  className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">add</span>
                  <span>เพิ่มวิชาเสรี (ม.{selectedElectiveGrade})</span>
                </button>
                <button
                  onClick={() => setCourseCSVModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">upload_file</span>
                  <span>นำเข้าวิชา CSV</span>
                </button>
              </div>
            </div>

            {/* Grade Switcher Tabs (ม.1 ถึง ม.6) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {[1, 2, 3, 4, 5, 6].map(g => {
                const count = courses.filter(c => c.grade === g).length;
                const isOpen = gradeSettings[g]?.isOpen ?? true;
                return (
                  <button
                    key={g}
                    onClick={() => setSelectedElectiveGrade(g)}
                    className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                      selectedElectiveGrade === g
                        ? 'bg-blue-700 text-white shadow-md shadow-blue-700/25'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>ระดับชั้นมัธยมศึกษาปีที่ {g}</span>
                    <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                  </button>
                );
              })}
            </div>

            {/* Current Grade Management Bar */}
            <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">
                    ระดับชั้นมัธยมศึกษาปีที่ {selectedElectiveGrade}
                  </span>
                  <span className="text-xs text-slate-500">
                    ห้องเรียนในระดับนี้: {classrooms.filter(c => c.grade === selectedElectiveGrade).map(c => c.roomNumber).join(', ') || 'ไม่มีห้อง'}
                  </span>
                </div>
                <div className="text-xs text-slate-600 flex items-center gap-3">
                  <span>
                    <strong>วันเวลาเรียน: </strong>
                    {gradeSettings[selectedElectiveGrade]?.dayOfWeek || 'วันพฤหัสบดี'} {gradeSettings[selectedElectiveGrade]?.periodText || 'คาบ 7 - 8'}
                  </span>
                  <span>•</span>
                  <span>
                    <strong>คาบเรียนเช็คชื่อ: </strong>
                    {gradeSettings[selectedElectiveGrade]?.dates?.length || 12} คาบ
                  </span>
                </div>
              </div>

              {/* Status and Action Buttons */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  onClick={() => {
                    const currentG = gradeSettings[selectedElectiveGrade];
                    if (currentG) {
                      setTempDayOfWeek(currentG.dayOfWeek);
                      setTempPeriodText(currentG.periodText);
                      setTempStartDate(currentG.startDate);
                      setTempEndDate(currentG.endDate);
                      setGeneratedDates(currentG.dates);
                    }
                    setScheduleSettingModalOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">calendar_month</span>
                  <span>ตั้งค่าวันเวลาเรียน & สร้างคาบ</span>
                </button>

                {/* Open/Close Registration Toggle:
                    "หากระบบเปิดอยู่จะขึ้นสถานะว่าเปิดอยู่และมีปุ่มปิดระบบ หากระบบปิดอยู่ให้ขึ้นว่าระบบปิดอยู่ และมีปุ่มเปิดระบบ" */}
                {gradeSettings[selectedElectiveGrade]?.isOpen ? (
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      สถานะ: เปิดรับลงทะเบียนอยู่
                    </span>
                    <button
                      onClick={() => {
                        toggleGradeRegistration(selectedElectiveGrade, false);
                        showToast('ปิดระบบแล้ว', `ปิดระบบรับลงทะเบียนระดับชั้น ม.${selectedElectiveGrade} แล้ว`);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      ปิดระบบ
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1.5 rounded-xl bg-rose-100 text-rose-800 text-xs font-bold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                      สถานะ: ระบบปิดอยู่
                    </span>
                    <button
                      onClick={() => {
                        toggleGradeRegistration(selectedElectiveGrade, true);
                        showToast('เปิดระบบแล้ว', `เปิดระบบรับลงทะเบียนระดับชั้น ม.${selectedElectiveGrade} แล้ว`);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      เปิดระบบ
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Courses Table for Selected Grade */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-2.5 px-3 text-center w-12">ลำดับ</th>
                    <th className="py-2.5 px-3 w-24 font-mono">รหัสวิชา</th>
                    <th className="py-2.5 px-4 min-w-[200px]">ชื่อวิชา</th>
                    <th className="py-2.5 px-3 min-w-[150px]">คุณครูผู้สอน</th>
                    <th className="py-2.5 px-3">ห้องเรียน</th>
                    <th className="py-2.5 px-3 text-center">จำนวนนักเรียน</th>
                    <th className="py-2.5 px-3 text-center">ห้องที่เปิดรับ</th>
                    <th className="py-2.5 px-3 text-center w-36">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {courses.filter(c => c.grade === selectedElectiveGrade).length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        ยังไม่มีรายวิชาเพิ่มเติมในระดับชั้นมัธยมศึกษาปีที่ {selectedElectiveGrade}
                      </td>
                    </tr>
                  ) : (
                    courses
                      .filter(c => c.grade === selectedElectiveGrade)
                      .map((c, idx) => {
                        const enrolled = getEnrolledCount(c.code);
                        const isTeacherMatched = teachers.some(t => t.fullName.trim() === c.teacherName.trim());

                        return (
                          <tr key={c.code} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 text-center text-slate-400 font-bold">{idx + 1}</td>
                            <td className="py-2.5 px-3 font-mono font-bold text-blue-900">{c.code}</td>
                            <td className="py-2.5 px-4 font-semibold text-slate-800">{c.name}</td>
                            <td className="py-2.5 px-3">
                              {isTeacherMatched ? (
                                <span className="text-slate-800 font-medium">{c.teacherName}</span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold text-[11px] border border-amber-300">
                                  ⚠️ {c.teacherName || 'ยังไม่มีคุณครูประจำรายวิชา'}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600">{c.classroom}</td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="font-bold text-slate-800">
                                {enrolled} / {c.maxStudents}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center text-slate-500">
                              {c.allowedRooms.join(', ')}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => setViewCourseStudentsCode(c.code)}
                                  className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold transition-colors cursor-pointer"
                                >
                                  เพิ่มเติม ({enrolled})
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`คุณต้องการลบวิชา ${c.code} ${c.name} ใช่หรือไม่?`)) {
                                      removeCourse(c.code);
                                      showToast('สำเร็จ', `ลบวิชา ${c.code} เรียบร้อยแล้ว`);
                                    }
                                  }}
                                  className="p-1 text-rose-500 hover:text-rose-700 rounded-md cursor-pointer"
                                  title="ลบวิชานี้"
                                >
                                  <span className="material-symbols-outlined text-base">delete</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>

          </div>

          {/* Modal: View Enrolled Students for a Course with Remove option */}
          {viewCourseStudentsCode && (
            <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col overflow-hidden">
              <div className="bg-white w-full h-full rounded-none shadow-2xl border-0 overflow-hidden flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      รายชื่อนักเรียนที่ลงทะเบียนวิชา {viewCourseStudentsCode}
                    </h3>
                    <p className="text-xs text-slate-500">
                      เรียงลำดับตามห้องและรหัสนักเรียน (สามารถลบนักเรียนออกจากวิชาได้)
                    </p>
                  </div>
                  <button onClick={() => setViewCourseStudentsCode(null)} className="px-3 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold cursor-pointer">กลับหน้ารายวิชา</button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)] flex-1 overflow-y-auto min-h-0">
                  <aside className="border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-50 p-4 sm:p-5 space-y-2">
                    {(() => { const detailCourse = courses.find(c => c.code === viewCourseStudentsCode); return detailCourse ? <><div className="text-xs font-mono text-blue-700 font-bold">{detailCourse.code}</div><h4 className="text-base font-extrabold text-slate-900">{detailCourse.name}</h4><div className="text-xs text-slate-600 space-y-1"><p>ผู้สอน: {detailCourse.teacherName}</p><p>ระดับชั้น: ม.{detailCourse.grade}</p><p>ห้องที่รับ: {detailCourse.allowedRooms.join(', ')}</p><p>วันเวลา: {detailCourse.dayOfWeek} {detailCourse.period}</p><p>ห้องเรียน: {detailCourse.classroom}</p><p>จำนวน: {getEnrolledCount(detailCourse.code)} / {detailCourse.maxStudents} คน</p></div><p className="text-xs text-slate-600 whitespace-pre-wrap">{detailCourse.description}</p></> : null; })()}
                  </aside>
                  <div className="overflow-y-auto min-w-0 p-3 sm:p-5">
                  <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <th className="py-2 px-2 text-center w-10">ลำดับ</th>
                        <th className="py-2 px-2 text-center w-16">ห้อง</th>
                        <th className="py-2 px-3 w-24 font-mono">รหัส</th>
                        <th className="py-2 px-2 text-center w-12">เลขที่</th>
                        <th className="py-2 px-3">ชื่อ - นามสกุล</th>
                        <th className="py-2 px-2 text-center w-20">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {getSortedStudentsForCourse(viewCourseStudentsCode).length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400">
                            ยังไม่มีนักเรียนลงทะเบียนในวิชานี้
                          </td>
                        </tr>
                      ) : (
                        getSortedStudentsForCourse(viewCourseStudentsCode).map((st, idx) => (
                          <tr key={st.studentId} className="hover:bg-slate-50">
                            <td className="py-2 px-2 text-center text-slate-400 font-bold">{idx + 1}</td>
                            <td className="py-2 px-2 text-center font-bold text-blue-800">{st.room}</td>
                            <td className="py-2 px-3 font-mono font-bold text-blue-900">{st.studentId}</td>
                            <td className="py-2 px-2 text-center text-slate-600">{st.numberInRoom}</td>
                            <td className="py-2 px-3 font-medium text-slate-800">{st.fullName}</td>
                            <td className="py-2 px-2 text-center">
                              <button
                                onClick={() => {
                                  dropCourse(st.studentId);
                                  showToast('ลบสำเร็จ', `ถอนนักเรียน ${st.fullName} ออกจากวิชาเรียบร้อย`);
                                }}
                                className="px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold border border-rose-200 cursor-pointer"
                              >
                                ลบออก
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                  </div>
                  <div className="sm:hidden space-y-2">
                    {getSortedStudentsForCourse(viewCourseStudentsCode).map((st, idx) => <article key={st.studentId} className="rounded-xl border border-slate-200 bg-white p-3 flex items-start justify-between gap-3"><div className="min-w-0"><div className="text-[11px] text-blue-700 font-mono">{idx+1}. {st.studentId} • ม.{st.room} • เลขที่ {st.numberInRoom}</div><div className="font-bold text-sm text-slate-900 break-words">{st.fullName}</div></div><button onClick={() => { dropCourse(st.studentId); showToast('ลบสำเร็จ', `ถอนนักเรียน ${st.fullName} ออกจากวิชาเรียบร้อย`); }} className="shrink-0 rounded-lg bg-rose-50 border border-rose-200 px-2 py-1.5 text-xs font-bold text-rose-700">ลบออก</button></article>)}
                    {getSortedStudentsForCourse(viewCourseStudentsCode).length === 0 && <p className="py-8 text-center text-slate-400 text-sm">ยังไม่มีนักเรียนลงทะเบียนในวิชานี้</p>}
                  </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal: Schedule & Session Period Generator */}
          {scheduleSettingModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
              <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 mb-1">
                  ตั้งค่าวันเวลาเรียน & สร้างคาบ ม.{selectedElectiveGrade}
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  ตั้งค่าวันและคาบ เพื่อนำไปใช้เป็นเวลาเรียนและตารางเช็คชื่อของทุกวิชาในระดับนี้
                </p>

                <div className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">เรียนทุกวันอะไร:</label>
                    <select
                      value={tempDayOfWeek}
                      onChange={(e) => setTempDayOfWeek(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-slate-300"
                    >
                      <option value="วันจันทร์">วันจันทร์</option>
                      <option value="วันอังคาร">วันอังคาร</option>
                      <option value="วันพุธ">วันพุธ</option>
                      <option value="วันพฤหัสบดี">วันพฤหัสบดี</option>
                      <option value="วันศุกร์">วันศุกร์</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      คาบที่เท่าไหร่ (กรอกเป็นข้อความ เช่น คาบ 7 - 8 (13:00 - 15:00 น.)):
                    </label>
                    <input
                      type="text"
                      value={tempPeriodText}
                      onChange={(e) => setTempPeriodText(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-slate-300"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">วันที่เริ่มต้น:</label>
                      <input
                        type="date"
                        value={tempStartDate}
                        onChange={(e) => setTempStartDate(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">ถึงวันที่:</label>
                      <input
                        type="date"
                        value={tempEndDate}
                        onChange={(e) => setTempEndDate(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-slate-300"
                      />
                    </div>
                  </div>

                  {/* Generate Button */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={handleGenerateDates}
                      className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base">autorenew</span>
                      <span>กดสร้างคาบ (คำนวณวันที่มีเรียนอัตโนมัติ)</span>
                    </button>
                  </div>

                  {/* Generated Dates Preview */}
                  {generatedDates.length > 0 && (
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 max-h-40 overflow-y-auto space-y-1">
                      <span className="font-bold text-slate-700 block mb-1">
                        คาบเรียนที่สร้างขึ้น ({generatedDates.length} คาบ):
                      </span>
                      <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600">
                        {generatedDates.map((d, i) => (
                          <div key={i} className="p-1 rounded bg-white border border-slate-100">
                            คาบที่ {i + 1}: {d}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setScheduleSettingModalOpen(false)}
                      className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-bold cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveGradeSchedule}
                      className="px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold cursor-pointer"
                    >
                      ตกลงบันทึก
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal: Add Elective Course Form */}
          {addCourseModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
              <div className="bg-white w-full max-w-xl rounded-3xl p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-bold text-slate-900 mb-1">
                  เพิ่มวิชาเสรี / วิชาเพิ่มเติม (ม.{courseFormGrade})
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  เวลาเรียนจะแสดงขึ้นมาโดยอัตโนมัติตามระดับชั้นที่เลือก
                </p>

                <form onSubmit={handleSaveCourse} className="space-y-3.5 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">รหัสวิชา:</label>
                      <input
                        type="text"
                        value={courseFormCode}
                        onChange={(e) => setCourseFormCode(e.target.value)}
                        placeholder="เช่น ว30219"
                        required
                        className="w-full h-10 px-3 rounded-xl border border-slate-300 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">ระดับชั้น:</label>
                      <select
                        value={courseFormGrade}
                        onChange={(e) => {
                          const g = parseInt(e.target.value, 10);
                          setCourseFormGrade(g);
                          setCourseFormAllowedRooms(classrooms.filter(c => c.grade === g).map(c => c.roomNumber));
                        }}
                        className="w-full h-10 px-3 rounded-xl border border-slate-300"
                      >
                        {[1, 2, 3, 4, 5, 6].map(g => (
                          <option key={g} value={g}>มัธยมศึกษาปีที่ {g}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">ชื่อวิชา:</label>
                    <input
                      type="text"
                      value={courseFormName}
                      onChange={(e) => setCourseFormName(e.target.value)}
                      placeholder="เช่น การเขียนโปรแกรมไพทอนและการประยุกต์ใช้ AI"
                      required
                      className="w-full h-10 px-3 rounded-xl border border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">คุณครูผู้สอน (เลือกจากระบบ):</label>
                    <select
                      value={courseFormTeacher}
                      onChange={(e) => setCourseFormTeacher(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-slate-300"
                    >
                      {teachers.map(t => (
                        <option key={t.username} value={t.fullName}>
                          {t.fullName} ({t.username})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Auto-filled Schedule from grade settings */}
                  <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 text-slate-700">
                    <span className="font-bold text-blue-900 block mb-1">เวลาเรียนอัตโนมัติตามระดับชั้น:</span>
                    <div>{currentGradeSetting?.dayOfWeek || 'วันพฤหัสบดี'} {currentGradeSetting?.periodText || 'คาบ 7 - 8'}</div>
                  </div>

                  {/* Allowed Rooms Checkboxes */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      ห้องที่เปิดรับ (เลือกได้เฉพาะห้องในระดับ ม.{courseFormGrade}):
                    </label>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {roomsInGrade.map(r => (
                        <label key={r.roomNumber} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={courseFormAllowedRooms.includes(r.roomNumber)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setCourseFormAllowedRooms(prev => [...prev, r.roomNumber]);
                              } else {
                                setCourseFormAllowedRooms(prev => prev.filter(item => item !== r.roomNumber));
                              }
                            }}
                            className="rounded text-blue-600"
                          />
                          <span>ม.{r.roomNumber}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block font-bold text-slate-700 mb-1">
                        ห้องเรียน (ไม่ต้องเติมคำว่าห้องเรียน):
                      </label>
                      <input
                        type="text"
                        value={courseFormClassroom}
                        onChange={(e) => setCourseFormClassroom(e.target.value)}
                        placeholder="คอมพิวเตอร์ 2 (อาคาร 3 ชั้น 3)"
                        required
                        className="w-full h-10 px-3 rounded-xl border border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">เปิดรับกี่คน:</label>
                      <input
                        type="number"
                        value={courseFormMax}
                        onChange={(e) => setCourseFormMax(parseInt(e.target.value, 10) || 35)}
                        required
                        className="w-full h-10 px-3 rounded-xl border border-slate-300"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">คำอธิบายรายวิชา:</label>
                    <textarea
                      value={courseFormDesc}
                      onChange={(e) => setCourseFormDesc(e.target.value)}
                      rows={3}
                      placeholder="เนื้อหารายวิชา จุดประสงค์การเรียนรู้..."
                      className="w-full p-2.5 rounded-xl border border-slate-300"
                    ></textarea>
                  </div>

                  <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setAddCourseModalOpen(false)}
                      className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-bold cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-blue-700 text-white font-bold cursor-pointer"
                    >
                      บันทึกรายวิชา
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Import Courses CSV Modal with Teacher Name Match Validation */}
          {courseCSVModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
              <div className="bg-white w-full max-w-xl rounded-3xl p-6 shadow-2xl border border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 mb-1">นำเข้ารายวิชาด้วย CSV</h3>
                <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                  รูปแบบข้อมูล:<br />
                  <strong className="text-slate-800">รหัสวิชา, ชื่อวิชา, ชื่อคุณครู, ระดับชั้น (1-6), ห้องที่เปิดรับ (คั่นด้วย ;), วันเรียน, คาบเรียน, ห้องเรียน, จำนวนรับ, คำอธิบาย</strong><br />
                  * หากชื่อคุณครูไม่ตรงกับในระบบ ระบบจะแจ้งเตือนและขึ้นสถานะสีเหลือง
                </p>
                <CSVUploadField id="csvCoursesInput" />
                <div className="pt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setCourseCSVModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-bold text-xs cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const txt = (document.getElementById('csvCoursesInput') as HTMLTextAreaElement)?.value || '';
                      if (!txt.trim()) return;
                      const res = importCoursesCSV(txt);
                      setCourseCSVModalOpen(false);
                      if (res.warnings.length > 0) {
                        alert(`พบข้อความเตือน:\n${res.warnings.join('\n')}`);
                      }
                      showToast('สำเร็จ', `นำเข้ารายวิชาสำเร็จ ${res.added} วิชา`);
                    }}
                    className="px-5 py-2 rounded-xl bg-blue-700 text-white font-bold text-xs cursor-pointer"
                  >
                    นำเข้าข้อมูล
                  </button>
                </div>
              </div>
            </div>
          )}

        </section>
      )}

      {/* ========================================================================= */}
      {/* 6. ENROLLMENT MANAGEMENT (จัดการรายวิชาให้นักเรียน) */}
      {/* ========================================================================= */}
      {activeTab === 'enrollment_management' && (
        <section className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  จัดการลงทะเบียนรายวิชาให้นักเรียน
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  แอดมินสามารถเพิ่มวิชาให้นักเรียนได้ทันที แม้ระบบจะปิดอยู่ และสามารถเพิ่มนักเรียนเข้ารายวิชาทีละหลายคนได้
                </p>
              </div>

              <button
                onClick={() => {
                  setBatchEnrollCourseCode(courses[0]?.code || '');
                  setBatchSelectedStudentIds([]);
                  setBatchEnrollModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-600 hover:from-blue-600 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">group_add</span>
                <span>เพิ่มนักเรียนเข้ารายวิชา (Batch)</span>
              </button>
            </div>

            {/* Search Input for Student */}
            <div className="relative w-full sm:w-80">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base">
                search
              </span>
              <input
                type="text"
                value={studentSearchQuery}
                onChange={(e) => setStudentSearchQuery(e.target.value)}
                placeholder="ค้นหาด้วยชื่อ หรือ รหัสนักเรียน..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:border-blue-600"
              />
            </div>

            {/* Students Table with Direct Course Assignment Action */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-2.5 px-3 text-center w-14">ห้อง</th>
                    <th className="py-2.5 px-3 w-28 font-mono">รหัสนักเรียน</th>
                    <th className="py-2.5 px-4 min-w-[180px]">ชื่อ - นามสกุล</th>
                    <th className="py-2.5 px-3 text-center w-14">เลขที่</th>
                    <th className="py-2.5 px-4 min-w-[220px]">วิชาเพิ่มเติมที่ลงทะเบียน</th>
                    <th className="py-2.5 px-3 text-center w-32">ดำเนินการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {students
                    .filter(s => {
                      if (!studentSearchQuery) return true;
                      const q = studentSearchQuery.toLowerCase();
                      return s.fullName.toLowerCase().includes(q) || s.studentId.includes(q) || s.room.includes(q);
                    })
                    .slice(0, 50)
                    .map((st) => {
                      const c = courses.find(item => item.code === st.registeredCourseCode);
                      return (
                        <tr key={st.studentId} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 text-center font-bold text-blue-900">{st.room}</td>
                          <td className="py-2.5 px-3 font-mono font-bold">{st.studentId}</td>
                          <td className="py-2.5 px-4 font-semibold text-slate-800">{st.fullName}</td>
                          <td className="py-2.5 px-3 text-center">{st.numberInRoom}</td>
                          <td className="py-2.5 px-4">
                            {c ? (
                              <span className="px-2.5 py-1 rounded-xl bg-blue-100 text-blue-800 font-bold text-[11px]">
                                {c.code} {c.name}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">ยังไม่ได้ลงทะเบียน</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {c ? (
                              <button
                                onClick={() => {
                                  dropCourse(st.studentId);
                                  showToast('สำเร็จ', `ยกเลิกวิชาของ ${st.fullName} เรียบร้อย`);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold border border-rose-200 cursor-pointer"
                              >
                                ถอนวิชา
                              </button>
                            ) : (
                              <button
                                onClick={() => setAssignCourseModalStudent(st)}
                                className="px-3 py-1 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold cursor-pointer"
                              >
                                + เพิ่มวิชา
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

          </div>

          {/* Modal: Assign Course to Individual Student */}
          {assignCourseModalStudent && (
            <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col overflow-hidden">
              <div className="bg-white w-full h-full flex flex-col p-4 sm:p-6 shadow-2xl border-0 overflow-hidden">
                <h3 className="text-lg font-bold text-slate-900 mb-1">
                  เลือกวิชาให้ {assignCourseModalStudent.fullName}
                </h3>
                <p className="text-xs text-slate-500 mb-4">ห้อง ม.{assignCourseModalStudent.room} (รหัส {assignCourseModalStudent.studentId})</p>
                {assignCourseModalStudent.registeredCourseCode && <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">นักเรียนคนนี้มีวิชาเดิมอยู่แล้ว: <strong>{assignCourseModalStudent.registeredCourseCode} {courses.find(c=>c.code===assignCourseModalStudent.registeredCourseCode)?.name || ''}</strong><p className="mt-1">เมื่อยืนยันวิชาใหม่ ระบบจะนำออกจากวิชาเดิมก่อน</p></div>}

                <div className="space-y-2 flex-1 overflow-y-auto min-h-0">
                  {courses
                    .filter(c => c.grade === parseInt(assignCourseModalStudent.room.split('/')[0] || '4', 10))
                    .map(c => {
                      const enrolled = getEnrolledCount(c.code);
                      return (
                        <div
                          key={c.code}
                          onClick={() => {
                            if (assignCourseModalStudent.registeredCourseCode && assignCourseModalStudent.registeredCourseCode !== c.code) {
                              setPendingAssignCourse(c);
                              setConfirmReassignOpen(true);
                              return;
                            }
                            const res = enrollCourse(assignCourseModalStudent.studentId, c.code, true);
                            setAssignCourseModalStudent(null);
                            if (res.success) showToast('สำเร็จ', `ลงทะเบียนวิชา ${c.code} ให้ ${assignCourseModalStudent.fullName} สำเร็จ`);
                            else showToast('แจ้งเตือน', res.message);
                          }}
                          className="p-3 rounded-xl border border-slate-200 hover:border-blue-600 hover:bg-blue-50/50 cursor-pointer transition-all flex items-center justify-between"
                        >
                          <div>
                            <div className="font-bold text-slate-800 text-xs">{c.code} {c.name}</div>
                            <div className="text-[11px] text-slate-500">ครู{c.teacherName} • {c.classroom}</div>
                          </div>
                          <span className="text-xs font-bold text-blue-700">{enrolled}/{c.maxStudents} คน</span>
                        </div>
                      );
                    })}
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={() => setAssignCourseModalStudent(null)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-bold text-xs cursor-pointer"
                  >
                    ออก
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Full-page: Batch Add Students to a Course */}
          {batchEnrollModalOpen && (
            <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col overflow-hidden">
              <div className="bg-white w-full h-full p-4 sm:p-6 flex flex-col">
                <div className="pb-3 border-b border-slate-100 flex items-center justify-between gap-3">
                  <div><h3 className="text-base sm:text-lg font-bold text-slate-900">เพิ่มนักเรียนเข้ารายวิชาทีละหลายคน</h3><p className="text-xs text-slate-500 mt-1">เลือกนักเรียนได้หลายคน รายชื่อที่มีวิชาเดิมจะแสดงให้ตรวจสอบก่อนย้าย</p></div>
                  <button onClick={() => setBatchEnrollModalOpen(false)} className="shrink-0 px-3 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold">ออก</button>
                </div>
                <div className="py-4 space-y-3 flex-1 overflow-y-auto text-xs">
                  <div><label className="block font-bold text-slate-700 mb-1">เลือกรายวิชา:</label><select value={batchEnrollCourseCode} onChange={(e) => setBatchEnrollCourseCode(e.target.value)} className="w-full h-10 px-3 rounded-xl border border-slate-300 font-semibold">{courses.map(c => <option key={c.code} value={c.code}>{c.code} {c.name} (ม.{c.grade} • ว่าง {c.maxStudents - getEnrolledCount(c.code)} ที่)</option>)}</select></div>
                  <div><label className="block font-bold text-slate-700 mb-1">ค้นหานักเรียนเพื่อเลือก:</label><input type="text" value={batchStudentSearch} onChange={(e) => setBatchStudentSearch(e.target.value)} placeholder="ค้นหาชื่อ หรือ รหัสนักเรียน..." className="w-full h-10 px-3 rounded-xl border border-slate-300" /></div>
                  <div className="border border-slate-200 rounded-2xl overflow-y-auto divide-y divide-slate-100 p-2 max-h-[60vh]">
                    {students.slice().sort((a,b)=>a.studentId.localeCompare(b.studentId,'th',{numeric:true})).filter(st => !batchStudentSearch || st.fullName.toLowerCase().includes(batchStudentSearch.toLowerCase()) || st.studentId.includes(batchStudentSearch)).map(st => (
                      <label key={st.studentId} className="flex items-start gap-2 p-2.5 hover:bg-blue-50/50 rounded-xl cursor-pointer">
                        <input type="checkbox" checked={batchSelectedStudentIds.includes(st.studentId)} onChange={(e) => setBatchSelectedStudentIds(prev => e.target.checked ? [...new Set([...prev, st.studentId])] : prev.filter(id => id !== st.studentId))} className="mt-0.5 rounded text-blue-600" />
                        <span className="min-w-0 flex-1"><strong className="block text-slate-800">{st.fullName}</strong><span className="text-slate-500">ม.{st.room} • รหัส {st.studentId}</span>{st.registeredCourseCode && <span className="mt-1 block text-[10px] text-amber-800">ลงทะเบียนอยู่: {st.registeredCourseCode} {courses.find(c=>c.code===st.registeredCourseCode)?.name || ''}</span>}</span>
                      </label>
                    ))}
                    {students.length === 0 && <p className="p-4 text-center text-slate-500">ยังไม่มีรายชื่อนักเรียน</p>}
                  </div>
                  <div className="text-xs font-semibold text-blue-700">เลือกแล้ว: {batchSelectedStudentIds.length} คน • มีวิชาเดิมและต้องย้าย: {batchSelectedStudentIds.filter(id => { const st=students.find(s=>s.studentId===id); return !!st?.registeredCourseCode && st.registeredCourseCode !== batchEnrollCourseCode; }).length} คน</div>
                </div>
                <div className="pt-3 border-t border-slate-100 flex justify-end gap-2"><button onClick={() => setBatchEnrollModalOpen(false)} className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-bold text-xs">ออก</button><button onClick={() => { if (!batchEnrollCourseCode || batchSelectedStudentIds.length === 0) { showToast('แจ้งเตือน','กรุณาเลือกรายวิชาและนักเรียน'); return; } const moving = batchSelectedStudentIds.some(id => { const st=students.find(s=>s.studentId===id); return !!st?.registeredCourseCode && st.registeredCourseCode !== batchEnrollCourseCode; }); if (moving) setBatchReassignConfirmOpen(true); else finishBatchEnrollment(); }} className="px-5 py-2 rounded-xl bg-blue-700 text-white font-bold text-xs">บันทึก ({batchSelectedStudentIds.length} คน)</button></div>
              </div>
            </div>
          )}

        </section>
      )}

      {/* ========================================================================= */}
      {/* 7. ANNOUNCEMENTS (ประชาสัมพันธ์) */}
      {/* ========================================================================= */}
      {activeTab === 'announcements' && (
        <section className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">จัดการข่าวสารประชาสัมพันธ์</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  สร้างและกระจายข่าวสารตามกลุ่มเป้าหมาย (บุคคลภายนอก, นักเรียน, ครู หรือทุกคน)
                </p>
              </div>

              <button
                onClick={() => setAddAnnouncementModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">campaign</span>
                <span>สร้างข่าวประชาสัมพันธ์</span>
              </button>
            </div>

            <div className="space-y-3">
              {announcements.map((ann) => (
                <div
                  key={ann.id}
                  className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[11px]">
                        {ann.target === 'all'
                          ? 'ทุกคน (All)'
                          : ann.target === 'public'
                          ? 'ผู้คนภายนอก'
                          : ann.target === 'students'
                          ? 'นักเรียน'
                          : 'คุณครู'}
                      </span>
                      <span className="text-xs text-slate-600 font-medium">{ann.date}</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 leading-snug">{ann.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{ann.content}</p>
                  </div>

                  <button
                    onClick={() => {
                      deleteAnnouncement(ann.id);
                      showToast('ลบสำเร็จ', 'ลบข่าวประชาสัมพันธ์เรียบร้อย');
                    }}
                    className="p-1.5 text-rose-500 hover:text-rose-700 rounded-lg cursor-pointer shrink-0"
                    title="ลบข่าวสาร"
                  >
                    <span className="material-symbols-outlined text-base">delete</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Add Announcement Modal */}
          {addAnnouncementModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
              <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 mb-3">สร้างประกาศประชาสัมพันธ์</h3>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const title = (form.elements.namedItem('title') as HTMLInputElement).value.trim();
                    const content = (form.elements.namedItem('content') as HTMLTextAreaElement).value.trim();
                    const target = (form.elements.namedItem('target') as HTMLSelectElement).value as any;
                    const link = (form.elements.namedItem('link') as HTMLInputElement).value.trim();
                    const files = Array.from((form.elements.namedItem('attachments') as HTMLInputElement).files || []);
                    if (files.length > 5 || files.some(file => file.size > 2 * 1024 * 1024) || files.reduce((total, file) => total + file.size, 0) > 1500 * 1024) {
                      showToast('แจ้งเตือน', 'แนบได้ไม่เกิน 5 ไฟล์ ไฟล์ละไม่เกิน 2 MB และรวมไม่เกิน 1.5 MB');
                      return;
                    }
                    try {
                      const attachments = await Promise.all(files.map(file => new Promise<{name:string;type:string;url:string}>((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve({ name: file.name, type: file.type || 'application/octet-stream', url: String(reader.result || '') });
                        reader.onerror = () => reject(new Error(`อ่านไฟล์ ${file.name} ไม่สำเร็จ`));
                        reader.readAsDataURL(file);
                      })));
                      const now = new Date();
                      const dateStr = `${now.getDate()} ${['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'][now.getMonth()]} ${now.getFullYear() + 543}`;
                      addAnnouncement({ title, content, target, date: dateStr, link: link || undefined, attachments });
                      setAddAnnouncementModalOpen(false);
                      showToast('สำเร็จ', 'สร้างข่าวประชาสัมพันธ์เรียบร้อยแล้ว');
                    } catch (error) {
                      showToast('ข้อผิดพลาด', error instanceof Error ? error.message : 'ไม่สามารถอ่านไฟล์แนบได้');
                    }
                  }}
                  className="space-y-3 text-xs"
                >
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">กลุ่มเป้าหมาย:</label>
                    <select name="target" className="w-full h-10 px-3 rounded-xl border border-slate-300 font-semibold">
                      <option value="all">ทุกคน (ภายนอก, นักเรียน, ครู)</option>
                      <option value="public">บุคคลภายนอก (หน้าหลัก)</option>
                      <option value="students">นักเรียน</option>
                      <option value="teachers">คุณครู</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">หัวข้อประกาศ:</label>
                    <input name="title" required placeholder="หัวข้อประกาศ..." className="w-full h-10 px-3 rounded-xl border border-slate-300" />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">เนื้อหาประกาศ:</label>
                    <textarea name="content" required rows={4} placeholder="รายละเอียดประกาศ..." className="w-full p-2.5 rounded-xl border border-slate-300"></textarea>
                  </div>
                  <div><label className="block font-bold text-slate-700 mb-1">ลิงก์เพิ่มเติม (ถ้ามี):</label><input name="link" type="url" placeholder="https://..." className="w-full h-10 px-3 rounded-xl border border-slate-300" /></div>
                  <div><label className="block font-bold text-slate-700 mb-1">แนบรูปภาพหรือไฟล์:</label><input name="attachments" type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" className="w-full rounded-xl border border-slate-300 p-2"/><p className="mt-1 text-[10px] text-slate-500">สูงสุด 5 ไฟล์ ไฟล์ละไม่เกิน 2 MB และรวมไม่เกิน 1.5 MB (โหมดทดลองเก็บในเบราว์เซอร์)</p></div>
                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setAddAnnouncementModalOpen(false)}
                      className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-bold cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-blue-700 text-white font-bold cursor-pointer"
                    >
                      เผยแพร่ประกาศ
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ========================================================================= */}
      {/* 8. SYSTEM SETTINGS (ตั้งค่าระบบ & ล้างข้อมูล) */}
      {/* ========================================================================= */}
      {activeTab === 'settings' && (
        <section className="space-y-6">
          
          {/* Academic Year & Semester Configuration */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-700 text-xl">calendar_month</span>
              <h3 className="text-base font-bold text-slate-900">ตั้งค่าปีการศึกษาและภาคเรียน</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">ปีการศึกษา (พ.ศ.):</label>
                <input
                  type="text"
                  defaultValue={systemConfig.academicYear}
                  id="academicYearInput"
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">ภาคเรียน:</label>
                <select
                  defaultValue={systemConfig.semester}
                  id="semesterInput"
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 font-bold text-slate-800"
                >
                  <option value="1">ภาคเรียนที่ 1</option>
                  <option value="2">ภาคเรียนที่ 2</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => {
                const year = (document.getElementById('academicYearInput') as HTMLInputElement)?.value || '2570';
                const sem = (document.getElementById('semesterInput') as HTMLSelectElement)?.value || '1';
                updateSystemConfig(year, sem);
                showToast('สำเร็จ', `อัปเดตปีการศึกษา ${year} ภาคเรียนที่ ${sem} เรียบร้อยแล้ว`);
              }}
              className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs cursor-pointer shadow-sm"
            >
              บันทึกการตั้งค่าปีการศึกษา
            </button>
          </div>

          {/* Dangerous System Reset Actions (Protected by Admin Password) */}
          <div className="bg-white rounded-3xl p-6 border border-rose-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-rose-700">
              <span className="material-symbols-outlined text-2xl">dangerous</span>
              <h3 className="text-base font-bold">จัดการล้างข้อมูลระบบ (ต้องยืนยันรหัสผ่านผู้ดูแลระบบ)</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              การกระทำในส่วนนี้มีผลกระทบต่อข้อมูลอย่างถาวร ทุกรายการจำเป็นต้องกรอกรหัสผ่านผู้ดูแลระบบเพื่อยืนยันความปลอดภัย
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              
              {/* Action 1: Reset All Enrollments */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-amber-900 text-xs sm:text-sm">
                    1. ลบข้อมูลการเลือกรายวิชาทั้งหมด
                  </h4>
                  <p className="text-xs text-slate-600 mt-1">
                    ลบข้อมูลการเลือกลงทะเบียนทั้งหมด แต่วิชาเพิ่มเติมยังคงอยู่
                  </p>
                </div>
                <button
                  onClick={() => setResetEnrollmentModalOpen(true)}
                  className="mt-4 w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs cursor-pointer shadow-2xs"
                >
                  ล้างข้อมูลการเลือก
                </button>
              </div>

              {/* Action 2: Delete All Courses */}
              <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-rose-900 text-xs sm:text-sm">
                    2. ลบรายวิชาทั้งหมด
                  </h4>
                  <p className="text-xs text-slate-600 mt-1">
                    ต้องลบข้อมูลการเลือกลงทะเบียนก่อน จึงจะสามารถลบรายวิชาได้
                  </p>
                </div>
                <button
                  onClick={() => setDeleteCoursesModalOpen(true)}
                  className="mt-4 w-full py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer shadow-2xs"
                >
                  ลบรายวิชาทั้งหมด
                </button>
              </div>

              {/* Action 3: Delete All Students */}
              <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-rose-900 text-xs sm:text-sm">
                    3. ลบข้อมูลนักเรียนทั้งหมด
                  </h4>
                  <p className="text-xs text-slate-600 mt-1">
                    ลบข้อมูลนักเรียนและประวัติการลงทะเบียนทั้งหมดในระบบ
                  </p>
                </div>
                <button
                  onClick={() => setDeleteStudentsModalOpen(true)}
                  className="mt-4 w-full py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs cursor-pointer shadow-2xs"
                >
                  ลบข้อมูลนักเรียนทั้งหมด
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex flex-col justify-between">
                  <div><h4 className="font-bold text-amber-900 text-xs sm:text-sm">ล้างข้อมูลระบบครูผู้สอนทั้งหมด</h4><p className="text-xs text-slate-600 mt-1">ลบรายชื่อและบัญชีครูผู้สอนทั้งหมดได้โดยไม่ต้องลบข้อมูลอื่นก่อน</p></div>
                  <button onClick={() => setDeleteTeachersModalOpen(true)} className="mt-4 w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs">ล้างข้อมูลระบบครู</button>
                </div>
                <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-300 flex flex-col justify-between">
                  <div><h4 className="font-bold text-rose-900 text-xs sm:text-sm">ล้างข้อมูลปีการศึกษานี้</h4><p className="text-xs text-slate-600 mt-1">ล้างนักเรียน ห้องเรียน รายวิชา ครูผู้สอน การมาเรียน และประกาศของปีการศึกษานี้ โดยคงบัญชีผู้ดูแลระบบไว้</p></div>
                  <button onClick={() => setResetAcademicYearModalOpen(true)} className="mt-4 w-full py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs">ล้างข้อมูลปีการศึกษานี้</button>
                </div>
            </div>
          </div>

        </section>
      )}

      {/* ========================================================================= */}
      {/* 9. ADMIN USER MANAGEMENT (จัดการผู้ดูแลระบบ) */}
      {/* ========================================================================= */}
      {activeTab === 'admins' && (
        <section className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">จัดการผู้ดูแลระบบ (Admin)</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  ผู้ดูแลระบบทุกคนมีสิทธิ์เทียบเท่ากันในการจัดการระบบทั้งหมด
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAddAdminModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">person_add</span>
                  <span>เพิ่มแอดมิน</span>
                </button>
                <button
                  onClick={() => setAdminCSVModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">upload_file</span>
                  <span>อัปโหลด CSV</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-2.5 px-3 text-center w-14">ลำดับ</th>
                    <th className="py-2.5 px-3">ชื่อผู้ใช้ (Username)</th>
                    <th className="py-2.5 px-3">รหัสผ่าน (Password)</th>
                    <th className="py-2.5 px-3">สิทธิ์การใช้งาน</th>
                    <th className="py-2.5 px-3 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {admins.map((a, idx) => (
                    <tr key={a.username} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-900">{a.username}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">••••••••</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px]">
                          ผู้ดูแลระบบเต็มรูปแบบ (Super Admin)
                        </span>
                      </td>
                      <td className="py-2.5 px-3"><div className="flex justify-center gap-1.5"><button type="button" onClick={() => { setEditingAdmin(a); setAddAdminModalOpen(true); }} className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 font-bold">แก้ไข</button><button type="button" onClick={() => { if (a.username.toLowerCase() === currentUser?.username.toLowerCase()) { showToast('แจ้งเตือน','ไม่สามารถลบบัญชีที่กำลังใช้งานอยู่ได้'); return; } setDeleteAdminTarget(a.username); }} className="px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 font-bold">ลบ</button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add / Edit Admin Modal */}
          {addAdminModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
              <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 mb-3">{editingAdmin ? 'แก้ไขบัญชีผู้ดูแลระบบ' : 'เพิ่มผู้ดูแลระบบใหม่'}</h3>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const username = (form.elements.namedItem('username') as HTMLInputElement).value.trim();
                  const password = (form.elements.namedItem('password') as HTMLInputElement).value.trim();
                  if (!username || (!editingAdmin && !password)) return;
                  const result = editingAdmin
                    ? updateAdmin(editingAdmin.username, { username, ...(password ? { password } : {}) })
                    : addAdmin({ username, password });
                  setAddAdminModalOpen(false); setEditingAdmin(null);
                  showToast(result.success ? 'สำเร็จ' : 'ข้อผิดพลาด', result.message);
                }} className="space-y-3 text-xs">
                  <div><label className="block font-bold text-slate-700 mb-1">ชื่อผู้ใช้ (Username):</label><input name="username" required defaultValue={editingAdmin?.username || ''} placeholder="ชื่อผู้ใช้ผู้ดูแลระบบ" className="w-full h-10 px-3 rounded-xl border border-slate-300" /></div>
                  <div><label className="block font-bold text-slate-700 mb-1">รหัสผ่าน (Password):</label><input name="password" type="password" required={!editingAdmin} placeholder={editingAdmin ? 'เว้นว่างหากไม่ต้องการเปลี่ยนรหัสผ่าน' : 'กำหนดรหัสผ่าน'} className="w-full h-10 px-3 rounded-xl border border-slate-300" /></div>
                  <div className="pt-2 flex justify-end gap-2"><button type="button" onClick={() => { setAddAdminModalOpen(false); setEditingAdmin(null); }} className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-bold">ยกเลิก</button><button type="submit" className="px-5 py-2 rounded-xl bg-blue-700 text-white font-bold">{editingAdmin ? 'บันทึกการแก้ไข' : 'บันทึกแอดมิน'}</button></div>
                </form>
              </div>
            </div>
          )}

          {/* Admin CSV Modal */}
          {adminCSVModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
              <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 mb-2">นำเข้าแอดมินด้วย CSV</h3>
                <p className="text-xs text-slate-500 mb-3">รูปแบบข้อมูล: Username, Password</p>
                <CSVUploadField id="csvAdminsInput" />
                <div className="pt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setAdminCSVModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-bold text-xs cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const txt = (document.getElementById('csvAdminsInput') as HTMLTextAreaElement)?.value || '';
                      if (!txt.trim()) return;
                      const res = importAdminsCSV(txt);
                      setAdminCSVModalOpen(false);
                      showToast('สำเร็จ', `นำเข้าผู้ดูแลระบบสำเร็จ ${res.added} บัญชี`);
                    }}
                    className="px-5 py-2 rounded-xl bg-blue-700 text-white font-bold text-xs cursor-pointer"
                  >
                    นำเข้าข้อมูล
                  </button>
                </div>
              </div>
            </div>
          )}

        </section>
      )}

    </div>
  );
};
