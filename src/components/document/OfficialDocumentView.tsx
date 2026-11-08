import React from 'react';
import {
  AttendanceRecord,
  Classroom,
  ElectiveCourse,
  Student,
  SystemConfig
} from '../../types';

export type DocumentType =
  | 'course_roster' // ใบรายชื่อนักเรียนในรายวิชาเพิ่มเติม (ใบเช็คชื่อเปล่า / ทะเบียนวิชา)
  | 'attendance_summary' // รายงานเวลาเรียนนักเรียน (แนวนอน)
  | 'room_roster' // รายชื่อนักเรียนรายวิชาเพิ่มเติมรายห้อง
  | 'all_courses'; // รายวิชาเพิ่มเติมทั้งหมด

interface OfficialDocumentViewProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: DocumentType;
  systemConfig: SystemConfig;
  course?: ElectiveCourse;
  selectedCourses?: ElectiveCourse[];
  datesByGrade?: Record<number, string[]>;
  courses?: ElectiveCourse[];
  classroom?: Classroom;
  students: Student[];
  allClassrooms?: Classroom[];
  dates?: string[];
  attendanceRecords?: AttendanceRecord[];
}

export const OfficialDocumentView: React.FC<OfficialDocumentViewProps> = ({
  isOpen,
  onClose,
  documentType,
  systemConfig,
  course,
  selectedCourses = [],
  datesByGrade,
  courses = [],
  classroom,
  students,
  allClassrooms = [],
  dates = [],
  attendanceRecords = []
}) => {
  if (!isOpen) return null;

  const isLandscape = documentType === 'attendance_summary';

  const handlePrint = () => {
    window.print();
  };

  // Helper to sort students for a course:
  // "กฎการแสดงรายชื่อนักเรียนคือเรียงจากห้องเช่น ห้อง 5 6 7 8 9 เรียงน้อยบนมากล่างตามลำดับ แล้วถ้าในห้องมีนักเรียนจึงเรียงตามรหัสนักเรียน โดยจะให้แสดงลำดับตามกฏที่เรียงเลย"
  const getSortedStudentsForCourse = (courseCode: string) => {
    const enrolled = students.filter(s => s.registeredCourseCode === courseCode);
    return [...enrolled].sort((a, b) => {
      // Required order: grade 1–6, room 1–10, then student ID ascending.
      const [gradeA, roomA] = a.room.split('/').map(Number);
      const [gradeB, roomB] = b.room.split('/').map(Number);
      if (gradeA !== gradeB) return gradeA - gradeB;
      if (roomA !== roomB) return roomA - roomB;
      return a.studentId.localeCompare(b.studentId, 'th', { numeric: true });
    });
  };

  // Helper to sort students for a classroom:
  // "ตารางเรียงจากเลขที่ รหัสนักเรียน ชื่อนามสกุล รายวิชาเพิ่มเติมที่นักเรียนเลือก"
  const getSortedStudentsForRoom = (roomNumber: string) => {
    const inRoom = students.filter(s => s.room === roomNumber);
    return [...inRoom].sort((a, b) => {
      if (a.numberInRoom !== b.numberInRoom) {
        return a.numberInRoom - b.numberInRoom;
      }
      return a.studentId.localeCompare(b.studentId, 'th', { numeric: true });
    });
  };

  // Helper to sort all courses:
  // "แสดงลำดับวิชาซึ่งเรียงจากรหัสวิชาตัวแรก"
  const getSortedAllCourses = () => {
    return [...courses].sort((a, b) => a.code.localeCompare(b.code, 'th'));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex justify-center p-2 sm:p-4 print:p-0 print:bg-white print:fixed print:inset-0">
      {/* Container Card */}
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col my-auto border border-slate-300 print:border-none print:shadow-none print:m-0 print:w-full print:max-w-none">
        
        {/* Modal Controls (Hidden in Print) */}
        <div className="p-4 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 no-print rounded-t-2xl">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-700 text-2xl">description</span>
            <div>
              <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                พิมพ์รายงานเอกสารราชการ (ฟอนต์สารบัญ • โรงเรียนสายปัญญารังสิต)
              </h3>
              <p className="text-xs text-slate-500">
                รูปแบบตามระเบียบงานสารบรรณ • {isLandscape ? 'แนวนอน (Landscape)' : 'แนวตั้ง (Portrait)'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">print</span>
              พิมพ์เอกสาร / บันทึกเป็น PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              title="ปิดหน้าต่าง"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>
        </div>

        {/* Official Printable Sheet Area (Strictly Sarabun Font, No Colors on Table) */}
        <div
          className={`sarabun-font sarabun-doc p-6 sm:p-10 bg-white text-black min-h-[842px] overflow-x-auto ${isLandscape ? 'attendance-landscape' : ''}`}
          style={{ fontFamily: "'Sarabun', sans-serif" }}
        >
          {/* ========================================================================= */}
          {/* 1. DOCUMENT TYPE: COURSE ROSTER (ใบรายชื่อนักเรียนในรายวิชาเพิ่มเติม) */}
          {/* ========================================================================= */}
          {documentType === 'course_roster' && (selectedCourses.length > 0 || course) && (
            <>
              {(selectedCourses.length > 0 ? selectedCourses : course ? [course] : []).map((courseItem, courseIndex) => (
                <div key={courseItem.code} className={`space-y-4 ${courseIndex > 0 ? 'print:break-before-page pt-10' : ''}`} style={courseIndex > 0 ? { pageBreakBefore: 'always' } : undefined}>
              {/* Header */}
              <div className="flex flex-col items-center text-center space-y-1 pb-2">
                <div className="w-16 h-16 mb-1 flex items-center justify-center">
                  <img
                    src="/assets/aistudio/Spr_-_1_7d810253.png"
                    alt="ตราโรงเรียนสายปัญญารังสิต"
                    className="w-16 h-16 object-contain"
                  />
                </div>
                <h1 className="text-xl font-bold tracking-tight">โรงเรียนสายปัญญารังสิต</h1>
                <h2 className="text-lg font-bold">
                  รายชื่อนักเรียนในรายวิชาเพิ่มเติม ปีการศึกษา {systemConfig.academicYear} ภาคเรียนที่ {systemConfig.semester}
                </h2>
                <div className="text-sm font-medium">
                  วิชา {courseItem.name} ({courseItem.code}) • คุณครูผู้สอน {courseItem.teacherName} • ระดับชั้น ม.{courseItem.grade}
                </div>
              </div>

              {/* Course Meta Info */}
              <div className="border border-black p-3 text-sm flex flex-col gap-1.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <strong>รหัสวิชา:</strong> {courseItem.code} &nbsp;&nbsp;
                    <strong>ชื่อวิชา:</strong> {courseItem.name}
                  </div>
                  <div className="text-left sm:text-right">
                    <strong>ระดับชั้น:</strong> มัธยมศึกษาปีที่ {courseItem.grade}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <strong>คุณครูผู้สอน:</strong> {courseItem.teacherName}
                  </div>
                  <div>
                    <strong>ห้องเรียน:</strong> {courseItem.classroom}
                  </div>
                  <div className="text-left sm:text-right">
                    <strong>จำนวนนักเรียน:</strong> {getSortedStudentsForCourse(courseItem.code).length} คน (เปิดรับ {courseItem.maxStudents} คน)
                  </div>
                </div>
                <div>
                  <strong>วันและเวลาเรียน:</strong> {courseItem.dayOfWeek} {courseItem.period}
                </div>
              </div>

              {/* Student roster: text columns only, no empty check boxes. */}
              <table className="w-full border-collapse border border-black text-xs text-center">
                <thead>
                  <tr className="border-b border-black bg-slate-50">
                    <th className="border-r border-black py-2 px-2 w-12">ลำดับ</th>
                    <th className="border-r border-black py-2 px-3 w-24">รหัสนักเรียน</th>
                    <th className="border-r border-black py-2 px-3 text-left">ชื่อ - นามสกุล</th>
                    <th className="border-r border-black py-2 px-2 w-20">ชั้น/ห้อง</th>
                    <th className="py-2 px-2 w-16">เลขที่</th>
                  </tr>
                </thead>
                <tbody>
                  {getSortedStudentsForCourse(courseItem.code).length === 0 ? (
                    <tr><td colSpan={5} className="border-b border-black py-6 text-center text-sm">ยังไม่มีนักเรียนลงทะเบียนในรายวิชานี้</td></tr>
                  ) : getSortedStudentsForCourse(courseItem.code).map((student, idx) => (
                    <tr key={`${courseItem.code}-${student.studentId}`} className="border-b border-black">
                      <td className="border-r border-black py-2 px-2">{idx + 1}</td>
                      <td className="border-r border-black py-2 px-3 font-mono">{student.studentId}</td>
                      <td className="border-r border-black py-2 px-3 text-left font-medium">{student.fullName}</td>
                      <td className="border-r border-black py-2 px-2">{student.room}</td>
                      <td className="py-2 px-2">{student.numberInRoom}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Official Sign-off Footer */}
              <div className="pt-8 grid grid-cols-2 gap-8 text-center text-sm">
                <div></div>
                <div className="flex flex-col items-center">
                  <p>ลงชื่อ..............................................................ครูผู้สอน</p>
                  <p className="mt-1">({courseItem.teacherName})</p>
                  <p className="mt-1">วันที่ ........ เดือน ........................ พ.ศ. ............</p>
                </div>
              </div>

                </div>
              ))}
            </>
          )}

          {/* ========================================================================= */}
          {/* 2. DOCUMENT TYPE: ATTENDANCE SUMMARY (รายงานเวลาเรียนนักเรียน - แนวนอน) */}
          {/* ========================================================================= */}
          {documentType === 'attendance_summary' && (selectedCourses.length > 0 || course) && (
            <>
              {(selectedCourses.length > 0 ? selectedCourses : course ? [course] : []).map((courseItem, courseIndex) => {
                const printDates = datesByGrade?.[courseItem.grade] || dates;
                return (
                  <div key={courseItem.code} className={`space-y-4 ${courseIndex > 0 ? 'print:break-before-page pt-10' : ''}`} style={courseIndex > 0 ? { pageBreakBefore: 'always' } : undefined}>
              {/* Header */}
              <div className="flex flex-col items-center text-center space-y-1 pb-1">
                <div className="w-14 h-14 mb-1 flex items-center justify-center">
                  <img
                    src="/assets/aistudio/Spr_-_1_7d810253.png"
                    alt="ตราโรงเรียนสายปัญญารังสิต"
                    className="w-14 h-14 object-contain"
                  />
                </div>
                <h1 className="text-xl font-bold tracking-tight">โรงเรียนสายปัญญารังสิต</h1>
                <h2 className="text-lg font-bold">
                  บันทึกเวลาเรียนและการมาเรียนรายวิชาเพิ่มเติม ปีการศึกษา {systemConfig.academicYear} ภาคเรียนที่ {systemConfig.semester}
                </h2>
                <div className="text-sm font-medium">
                  วิชา {courseItem.name} ({courseItem.code}) • คุณครูผู้สอน {courseItem.teacherName}
                </div>
                <div className="text-xs text-gray-800">
                  ห้องเรียน {courseItem.classroom} • ระดับชั้น ม.{courseItem.grade} • วันเวลาเรียน {courseItem.dayOfWeek} {courseItem.period}
                </div>
              </div>

              {/* Attendance Table */}
              <table className="w-full border-collapse border border-black text-[11px] text-center">
                <thead>
                  <tr className="border-b border-black">
                    <th className="border-r border-black py-1.5 px-1 w-8">ลำดับ</th>
                    <th className="border-r border-black py-1.5 px-1 w-14">ชั้น/ห้อง</th>
                    <th className="border-r border-black py-1.5 px-1 w-16">รหัส</th>
                    <th className="border-r border-black py-1.5 px-1 w-10">เลขที่</th>
                    <th className="border-r border-black py-1.5 px-2 text-left min-w-[130px]">ชื่อ - นามสกุล</th>
                    {/* Session dates */}
                    {printDates.map((d, i) => (
                      <th key={i} className="border-r border-black py-1 px-1 min-w-[26px]">
                        <div className="font-bold">ค.{i + 1}</div>
                        <div className="text-[9px] font-normal leading-tight">{d.split(' ')[0]}</div>
                      </th>
                    ))}
                    <th className="border-r border-black py-1 px-1 w-9">มา (/)</th>
                    <th className="border-r border-black py-1 px-1 w-9">ขาด (ข)</th>
                    <th className="border-r border-black py-1 px-1 w-9">ลากิจ (ล)</th>
                    <th className="border-r border-black py-1 px-1 w-9">ลาป่วย (ป)</th>
                    <th className="border-r border-black py-1 px-1 w-14">รวมมาเรียน</th>
                    <th className="py-1 px-1.5 w-14">ร้อยละ (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {getSortedStudentsForCourse(courseItem.code).length === 0 ? (
                    <tr>
                      <td colSpan={printDates.length + 11} className="py-6 text-center text-sm border-b border-black">
                        ยังไม่มีนักเรียนลงทะเบียนในรายวิชานี้
                      </td>
                    </tr>
                  ) : (
                    getSortedStudentsForCourse(courseItem.code).map((student, idx) => {
                      // Calculate attendance numbers
                      let present = 0;
                      let absent = 0;
                      let leave = 0;
                      let sick = 0;

                      const sessionCells = printDates.map((_, sIdx) => {
                        const rec = attendanceRecords.find(
                          r => r.courseCode === courseItem.code && r.studentId === student.studentId && r.sessionIndex === sIdx
                        );
                        const status = rec?.status || 'unmarked'; // ถ้ายังไม่เช็คให้เว้นช่องว่าง
                        if (status === 'present') present++;
                        else if (status === 'absent') absent++;
                        else if (status === 'leave') leave++;
                        else if (status === 'sick') sick++;

                        const symbol =
                          status === 'unmarked' ? '' : status === 'present' ? '/' : status === 'absent' ? 'ข' : status === 'leave' ? 'ล' : 'ป';

                        return (
                          <td key={sIdx} className="border-r border-black py-1 px-0.5">
                            {symbol}
                          </td>
                        );
                      });

                      const totalSessions = printDates.length || 1;
                      const attendedTotal = present + leave; // usually attendance rate includes approved leave or present
                      const percent = ((present / totalSessions) * 100).toFixed(1);

                      return (
                        <tr key={`${courseItem.code}-${student.studentId}`} className="border-b border-black">
                          <td className="border-r border-black py-1 px-1">{idx + 1}</td>
                          <td className="border-r border-black py-1 px-1">{student.room}</td>
                          <td className="border-r border-black py-1 px-1 font-mono">{student.studentId}</td>
                          <td className="border-r border-black py-1 px-1">{student.numberInRoom}</td>
                          <td className="border-r border-black py-1 px-2 text-left font-medium">{student.fullName}</td>
                          {sessionCells}
                          <td className="border-r border-black py-1 px-1 font-bold">{present}</td>
                          <td className="border-r border-black py-1 px-1">{absent}</td>
                          <td className="border-r border-black py-1 px-1">{leave}</td>
                          <td className="border-r border-black py-1 px-1">{sick}</td>
                          <td className="border-r border-black py-1 px-1 font-bold">{present}/{totalSessions}</td>
                          <td className="py-1 px-1 font-bold">{percent}%</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>

              {/* Summary and Signatures */}
              <div className="pt-6 grid grid-cols-2 gap-8 text-center text-xs">
                <div className="flex flex-col items-center">
                  <p>ลงชื่อ..............................................................ครูผู้สอน</p>
                  <p className="mt-1">({courseItem.teacherName})</p>
                  <p className="mt-1">ตำแหน่ง ครูผู้สอนรายวิชาเพิ่มเติม</p>
                </div>
                <div className="flex flex-col items-center">
                  <p>ลงชื่อ..............................................................หัวหน้ากลุ่มบริหารวิชาการ</p>
                  <p className="mt-1">(นางสาววิภาดา รัตนโชติ)</p>
                  <p className="mt-1">รองผู้อำนวยการกลุ่มบริหารวิชาการ</p>
                </div>
              </div>

                  </div>
                );
              })}
            </>
          )}

          {/* ========================================================================= */}
          {/* 3. DOCUMENT TYPE: ROOM ROSTER (พิมพ์รายห้อง) */}
          {/* ========================================================================= */}
          {documentType === 'room_roster' && classroom && (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex flex-col items-center text-center space-y-1 pb-2">
                <div className="w-16 h-16 mb-1 flex items-center justify-center">
                  <img
                    src="/assets/aistudio/Spr_-_1_7d810253.png"
                    alt="ตราโรงเรียนสายปัญญารังสิต"
                    className="w-16 h-16 object-contain"
                  />
                </div>
                <h1 className="text-xl font-bold tracking-tight">โรงเรียนสายปัญญารังสิต</h1>
                <h2 className="text-lg font-bold">
                  รายชื่อนักเรียนในรายวิชาเพิ่มเติม ปีการศึกษา {systemConfig.academicYear} ภาคเรียนที่ {systemConfig.semester}
                </h2>
                <div className="text-sm font-medium">
                  ระดับชั้นมัธยมศึกษาปีที่ {classroom.grade} ชั้น/ห้อง ม.{classroom.roomNumber} • คุณครูที่ปรึกษา: {classroom.advisor}
                </div>
              </div>

              {/* Roster Table */}
              <table className="w-full border-collapse border border-black text-xs text-center">
                <thead>
                  <tr className="border-b border-black">
                    <th className="border-r border-black py-2 px-2 w-16">เลขที่</th>
                    <th className="border-r border-black py-2 px-3 w-28">รหัสนักเรียน</th>
                    <th className="border-r border-black py-2 px-4 text-left min-w-[200px]">ชื่อ - นามสกุล</th>
                    <th className="border-r border-black py-2 px-3 w-24">รหัสวิชา</th>
                    <th className="border-r border-black py-2 px-4 text-left min-w-[220px]">รายวิชาเพิ่มเติมที่นักเรียนเลือก</th>
                    <th className="py-2 px-3 text-left w-36">ครูผู้สอน</th>
                  </tr>
                </thead>
                <tbody>
                  {getSortedStudentsForRoom(classroom.roomNumber).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-sm border-b border-black">
                        ยังไม่มีข้อมูลนักเรียนในห้องเรียนนี้
                      </td>
                    </tr>
                  ) : (
                    getSortedStudentsForRoom(classroom.roomNumber).map((student) => {
                      const selectedCourse = courses.find(c => c.code === student.registeredCourseCode);
                      return (
                        <tr key={student.studentId} className="border-b border-black">
                          <td className="border-r border-black py-2 px-2 font-medium">{student.numberInRoom}</td>
                          <td className="border-r border-black py-2 px-3 font-mono">{student.studentId}</td>
                          <td className="border-r border-black py-2 px-4 text-left font-medium">{student.fullName}</td>
                          <td className="border-r border-black py-2 px-3 font-bold">
                            {selectedCourse ? selectedCourse.code : '-'}
                          </td>
                          <td className="border-r border-black py-2 px-4 text-left">
                            {selectedCourse ? selectedCourse.name : (
                              <span className="text-gray-500 italic">ยังไม่ได้ลงทะเบียน</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-left text-xs">
                            {selectedCourse ? selectedCourse.teacherName : '-'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>

              {/* Official Sign-off Footer */}
              <div className="pt-8 grid grid-cols-2 gap-8 text-center text-sm">
                <div></div>
                <div className="flex flex-col items-center">
                  <p>ลงชื่อ..............................................................ครูที่ปรึกษา</p>
                  <p className="mt-1">({classroom.advisor.split(',')[0]?.trim()})</p>
                  <p className="mt-1">วันที่ ........ เดือน ........................ พ.ศ. ............</p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 4. DOCUMENT TYPE: ALL ELECTIVES (พิมพ์รายวิชาทั้งหมด) */}
          {/* ========================================================================= */}
          {documentType === 'all_courses' && (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex flex-col items-center text-center space-y-1 pb-2">
                <div className="w-16 h-16 mb-1 flex items-center justify-center">
                  <img
                    src="/assets/aistudio/Spr_-_1_7d810253.png"
                    alt="ตราโรงเรียนสายปัญญารังสิต"
                    className="w-16 h-16 object-contain"
                  />
                </div>
                <h1 className="text-xl font-bold tracking-tight">โรงเรียนสายปัญญารังสิต</h1>
                <h2 className="text-lg font-bold">
                  รายวิชาเพิ่มเติม ปีการศึกษา {systemConfig.academicYear} ภาคเรียนที่ {systemConfig.semester}
                </h2>
                <div className="text-xs text-gray-700">
                  สรุปรายวิชาเพิ่มเติมที่เปิดรับสมัคร ทุกระดับชั้น • เรียงตามรหัสวิชาตัวแรก
                </div>
              </div>

              {/* Course Catalog Table */}
              <table className="w-full border-collapse border border-black text-xs text-center">
                <thead>
                  <tr className="border-b border-black">
                    <th className="border-r border-black py-2 px-2 w-12">ลำดับ</th>
                    <th className="border-r border-black py-2 px-3 w-24">รหัสวิชา</th>
                    <th className="border-r border-black py-2 px-4 text-left min-w-[200px]">ชื่อวิชา</th>
                    <th className="border-r border-black py-2 px-2 w-16">ระดับชั้น</th>
                    <th className="border-r border-black py-2 px-3 w-24">ห้องที่เปิดรับ</th>
                    <th className="border-r border-black py-2 px-3 text-left w-36">ครูผู้สอน</th>
                    <th className="border-r border-black py-2 px-3 text-left min-w-[140px]">ห้องเรียน</th>
                    <th className="py-2 px-2 w-16">จำนวนรับ</th>
                  </tr>
                </thead>
                <tbody>
                  {getSortedAllCourses().map((c, idx) => (
                    <tr key={c.code} className="border-b border-black">
                      <td className="border-r border-black py-2 px-2">{idx + 1}</td>
                      <td className="border-r border-black py-2 px-3 font-bold font-mono">{c.code}</td>
                      <td className="border-r border-black py-2 px-4 text-left font-semibold">{c.name}</td>
                      <td className="border-r border-black py-2 px-2">ม.{c.grade}</td>
                      <td className="border-r border-black py-2 px-3 text-xs">{c.allowedRooms.join(', ')}</td>
                      <td className="border-r border-black py-2 px-3 text-left">{c.teacherName}</td>
                      <td className="border-r border-black py-2 px-3 text-left text-xs">{c.classroom}</td>
                      <td className="py-2 px-2 font-medium">{c.maxStudents} คน</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Official Sign-off Footer */}
              <div className="pt-8 grid grid-cols-2 gap-8 text-center text-sm">
                <div className="flex flex-col items-center">
                  <p>ลงชื่อ..............................................................ผู้จัดทำ</p>
                  <p className="mt-1">(เจ้าหน้าที่งานหลักสูตรและทะเบียนวิชา)</p>
                </div>
                <div className="flex flex-col items-center">
                  <p>ลงชื่อ..............................................................ผู้อนุมัติ</p>
                  <p className="mt-1">(นางสาววิภาดา รัตนโชติ)</p>
                  <p className="mt-1">รองผู้อำนวยการกลุ่มบริหารวิชาการ</p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
