import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  AdminUser,
  Announcement,
  AttendanceRecord,
  AttendanceStatus,
  Classroom,
  CurrentUser,
  ElectiveCourse,
  GradePeriodSetting,
  Student,
  SystemConfig,
  Teacher
} from '../types';
import {
  initialAdmins,
  initialAnnouncements,
  initialAttendance,
  initialClassrooms,
  initialCourses,
  initialGradeSettings,
  initialStudents,
  initialSystemConfig,
  initialTeachers
} from '../data/mockData';

interface AppContextType {
  // Data
  systemConfig: SystemConfig;
  currentUser: CurrentUser | null;
  gradeSettings: Record<number, GradePeriodSetting>;
  classrooms: Classroom[];
  teachers: Teacher[];
  admins: AdminUser[];
  courses: ElectiveCourse[];
  students: Student[];
  attendance: AttendanceRecord[];
  announcements: Announcement[];

  // Auth
  login: (username: string, password: string) => { success: boolean; message?: string };
  logout: () => void;

  // Student Enrollment Actions
  enrollCourse: (studentId: string, courseCode: string, adminOverride?: boolean) => { success: boolean; message: string };
  dropCourse: (studentId: string) => { success: boolean; message: string };

  // Teacher / Attendance Actions
  updateAttendanceStatus: (courseCode: string, studentId: string, sessionIndex: number, status: AttendanceStatus) => void;
  markAllPresentForSession: (courseCode: string, sessionIndex: number) => void;

  // Admin Actions: Electives & Grade Settings
  toggleGradeRegistration: (grade: number, isOpen: boolean) => void;
  saveGradePeriodSettings: (grade: number, dayOfWeek: string, periodText: string, startDate: string, endDate: string, dates: string[]) => void;
  addCourse: (course: ElectiveCourse) => { success: boolean; message: string; warning?: boolean };
  importCoursesCSV: (csvText: string) => { added: number; warnings: string[]; errors: string[] };
  removeCourse: (courseCode: string) => void;

  // Admin Actions: Students & Classrooms
  addClassroom: (roomNumber: string, advisor: string, grade: number) => { success: boolean; message: string };
  importClassroomsCSV: (csvText: string) => { added: number; errors: string[] };
  addStudent: (student: Student) => { success: boolean; message: string };
  importStudentsCSV: (csvText: string) => { added: number; errors: string[] };
  removeStudent: (studentId: string) => void;

  // Admin Actions: Teachers
  addTeacher: (teacher: Teacher) => { success: boolean; message: string };
  updateTeacher: (username: string, updated: Partial<Teacher>) => { success: boolean; message: string };
  resetTeacherPassword: (username: string, newPassword: string) => { success: boolean; message: string };
  removeTeacher: (username: string) => { success: boolean; message: string };
  importTeachersCSV: (csvText: string) => { added: number; errors: string[] };

  // Admin Actions: Admins
  addAdmin: (adminUser: AdminUser) => { success: boolean; message: string };
  updateAdmin: (username: string, updated: Partial<AdminUser>) => { success: boolean; message: string };
  removeAdmin: (username: string, adminPassword: string) => { success: boolean; message: string };
  importAdminsCSV: (csvText: string) => { added: number; errors: string[] };

  // Admin Actions: Announcements
  addAnnouncement: (announcement: Omit<Announcement, 'id'>) => void;
  deleteAnnouncement: (id: string) => void;

  // Admin Actions: System Reset & Config
  updateSystemConfig: (academicYear: string, semester: string) => void;
  resetAllEnrollments: (adminPassword: string) => { success: boolean; message: string };
  deleteAllCourses: (adminPassword: string) => { success: boolean; message: string };
  deleteAllStudents: (adminPassword: string) => { success: boolean; message: string };
  deleteAllTeachers: (adminPassword: string) => { success: boolean; message: string };
  resetSemesterData: (adminPassword: string) => { success: boolean; message: string };

  // Helper selectors
  getEnrolledCount: (courseCode: string) => number;
  getEnrolledStudents: (courseCode: string) => Student[];
  getCourseByCode: (courseCode: string) => ElectiveCourse | undefined;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

/** Parses RFC-4180 style CSV rows, including quoted commas and escaped quotes. */
const parseCsvRows = (csvText: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  const input = csvText.replace(/^\uFEFF/, '');
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (char === '"') {
      if (quoted && input[i + 1] === '"') { field += '"'; i++; }
      else quoted = !quoted;
    } else if (char === ',' && !quoted) {
      row.push(field.trim()); field = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && input[i + 1] === '\n') i++;
      row.push(field.trim());
      if (row.some(cell => cell.length > 0)) rows.push(row);
      row = []; field = '';
    } else {
      field += char;
    }
  }
  row.push(field.trim());
  if (row.some(cell => cell.length > 0)) rows.push(row);
  return rows;
};


// LocalStorage Keys
const STORAGE_PREFIX = 'sprs_';
const STORAGE_KEYS = {
  SYSTEM_CONFIG: `${STORAGE_PREFIX}system_config`,
  GRADE_SETTINGS: `${STORAGE_PREFIX}grade_settings`,
  CLASSROOMS: `${STORAGE_PREFIX}classrooms`,
  TEACHERS: `${STORAGE_PREFIX}teachers`,
  ADMINS: `${STORAGE_PREFIX}admins`,
  COURSES: `${STORAGE_PREFIX}courses`,
  STUDENTS: `${STORAGE_PREFIX}students`,
  ATTENDANCE: `${STORAGE_PREFIX}attendance`,
  ANNOUNCEMENTS: `${STORAGE_PREFIX}announcements`,
  AUTH_USER: `${STORAGE_PREFIX}auth_user`,
  AUDIT_LOGS: `${STORAGE_PREFIX}audit_logs`
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize state with localStorage or default mock data
  const [systemConfig, setSystemConfig] = useState<SystemConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SYSTEM_CONFIG);
    return saved ? JSON.parse(saved) : initialSystemConfig;
  });

  const [gradeSettings, setGradeSettings] = useState<Record<number, GradePeriodSetting>>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.GRADE_SETTINGS);
    return saved ? JSON.parse(saved) : initialGradeSettings;
  });

  const [classrooms, setClassrooms] = useState<Classroom[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CLASSROOMS);
    return saved ? JSON.parse(saved) : initialClassrooms;
  });

  const [teachers, setTeachers] = useState<Teacher[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TEACHERS);
    const list: Teacher[] = saved ? JSON.parse(saved) : [...initialTeachers];
    if (!localStorage.getItem('spr_demo_accounts_v1')) { if (!list.some(x => x.username === 'User1')) list.unshift({ username: 'User1', password: 'Pass1', fullName: 'ครูทดลอง User1' }); localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(list)); }
    return list;
  });

  const [admins, setAdmins] = useState<AdminUser[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ADMINS);
    const list: AdminUser[] = saved ? JSON.parse(saved) : [...initialAdmins];
    if (!localStorage.getItem('spr_demo_accounts_v1')) { if (!list.some(x => x.username === 'User3')) list.unshift({ username: 'User3', password: 'Pass3' }); localStorage.setItem(STORAGE_KEYS.ADMINS, JSON.stringify(list)); }
    return list;
  });

  const [courses, setCourses] = useState<ElectiveCourse[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.COURSES);
    return saved ? JSON.parse(saved) : initialCourses;
  });

  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    const list: Student[] = saved ? JSON.parse(saved) : [...initialStudents];
    if (!localStorage.getItem('spr_demo_accounts_v1')) { if (!list.some(x => x.studentId === 'User2')) list.unshift({ studentId: 'User2', nationalId: 'Pass2', fullName: 'นักเรียนทดลอง User2', room: '4/3', numberInRoom: 99, registeredCourseCode: null }); localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(list)); localStorage.setItem('spr_demo_accounts_v1', '1'); }
    return list;
  });

  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    return saved ? JSON.parse(saved) : initialAttendance;
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS);
    return saved ? JSON.parse(saved) : initialAnnouncements;
  });
  const [auditLogs, setAuditLogs] = useState<Array<{id:string; username:string; action:string; createdAt:string}>>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    return saved ? JSON.parse(saved) : [];
  });
  const recordAudit = (action: string) => {
    const entry = { id: `audit-${Date.now()}-${Math.random().toString(36).slice(2,8)}`, username: currentUser?.username || 'unknown', action, createdAt: new Date().toISOString() };
    setAuditLogs(prev => [entry, ...prev].slice(0, 5000));
  };

  // Preserve user login upon browser refresh
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  });

  // Sync state changes to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SYSTEM_CONFIG, JSON.stringify(systemConfig));
  }, [systemConfig]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.GRADE_SETTINGS, JSON.stringify(gradeSettings));
  }, [gradeSettings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CLASSROOMS, JSON.stringify(classrooms));
  }, [classrooms]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(teachers));
  }, [teachers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ADMINS, JSON.stringify(admins));
  }, [admins]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(courses));
  }, [courses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendance));
  }, [attendance]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(announcements));
  }, [announcements]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
    }
  }, [currentUser]);

  // Keep currentUser.studentData updated if students list changes
  useEffect(() => {
    if (currentUser?.role === 'student' && currentUser.studentData) {
      const updated = students.find(s => s.studentId === currentUser.studentData?.studentId);
      if (updated && JSON.stringify(updated) !== JSON.stringify(currentUser.studentData)) {
        setCurrentUser(prev => (prev ? { ...prev, studentData: updated } : null));
      }
    }
  }, [students, currentUser]);

  // Helper count of enrolled students
  const getEnrolledCount = (courseCode: string): number => {
    return students.filter(s => s.registeredCourseCode === courseCode).length;
  };

  const getEnrolledStudents = (courseCode: string): Student[] => {
    return students.filter(s => s.registeredCourseCode === courseCode).sort((a, b) => {
      const [gradeA, roomA] = a.room.split('/').map(Number);
      const [gradeB, roomB] = b.room.split('/').map(Number);
      if (gradeA !== gradeB) return gradeA - gradeB;
      if (roomA !== roomB) return roomA - roomB;
      const idDiff = a.studentId.localeCompare(b.studentId, 'th', { numeric: true });
      return idDiff || a.numberInRoom - b.numberInRoom;
    });
  };

  const getCourseByCode = (courseCode: string): ElectiveCourse | undefined => {
    return courses.find(c => c.code === courseCode);
  };

  // Auth: Supports Student, Teacher, Admin
  const login = (usernameInput: string, passwordInput: string): { success: boolean; message?: string } => {
    const username = usernameInput.trim();
    const password = passwordInput.trim();

    // 1. Check Admin
    const matchedAdmin = admins.find(a => a.username.toLowerCase() === username.toLowerCase() && a.password === password);
    if (matchedAdmin) {
      const user: CurrentUser = {
        role: 'admin',
        username: matchedAdmin.username,
        fullName: `ผู้ดูแลระบบ (${matchedAdmin.username})`,
        adminData: matchedAdmin
      };
      setCurrentUser(user);
      return { success: true };
    }

    // 2. Check Teacher
    const matchedTeacher = teachers.find(
      t => t.username.toLowerCase() === username.toLowerCase() && t.password === password
    );
    if (matchedTeacher) {
      const user: CurrentUser = {
        role: 'teacher',
        username: matchedTeacher.username,
        fullName: matchedTeacher.fullName,
        teacherData: matchedTeacher
      };
      setCurrentUser(user);
      return { success: true };
    }

    // 3. Check Student: Username = studentId, Password = nationalId
    const matchedStudent = students.find(
      s => s.studentId.toLowerCase() === username.toLowerCase() && s.nationalId === password
    );
    if (matchedStudent) {
      const user: CurrentUser = {
        role: 'student',
        username: matchedStudent.studentId,
        fullName: matchedStudent.fullName,
        studentData: matchedStudent
      };
      setCurrentUser(user);
      return { success: true };
    }

    return {
      success: false,
      message: 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่อีกครั้ง'
    };
  };

  const logout = () => {
    setCurrentUser(null);
  };

  // Student Enrollment Action
  const enrollCourse = (studentId: string, courseCode: string, adminOverride = false): { success: boolean; message: string } => {
    const student = students.find(s => s.studentId === studentId);
    if (!student) {
      return { success: false, message: 'ไม่พบข้อมูลนักเรียน' };
    }

    const course = courses.find(c => c.code === courseCode);
    if (!course) {
      return { success: false, message: 'ไม่พบข้อมูลรายวิชา' };
    }

    // Check if grade registration is open (unless admin override)
    if (!adminOverride) {
      const gradeStatus = gradeSettings[course.grade];
      if (gradeStatus?.isOpen === false) {
        return { success: false, message: `ระบบลงทะเบียนระดับชั้นมัธยมศึกษาปีที่ ${course.grade} ปิดให้บริการอยู่ในขณะนี้` };
      }
    }

    // Check if course allows student's room
    if (!course.allowedRooms.includes(student.room)) {
      return { success: false, message: `รายวิชานี้ไม่ได้เปิดรับสำหรับนักเรียนห้อง ${student.room}` };
    }

    // Check capacity
    const currentEnrolled = getEnrolledCount(courseCode);
    if (currentEnrolled >= course.maxStudents) {
      return { success: false, message: 'รายวิชานี้จำนวนนักเรียนเต็มแล้ว' };
    }

    // Perform enrollment
    recordAudit(`ลงทะเบียนนักเรียน ${studentId} เข้าวิชา ${courseCode}`);
    setStudents(prev =>
      prev.map(s =>
        s.studentId === studentId
          ? { ...s, registeredCourseCode: courseCode, registeredAt: new Date().toISOString() }
          : s
      )
    );

    return { success: true, message: 'ลงทะเบียนสำเร็จ' };
  };

  const dropCourse = (studentId: string): { success: boolean; message: string } => {
    if (currentUser?.role === 'student') {
      return { success: false, message: 'นักเรียนไม่สามารถยกเลิกการลงทะเบียนด้วยตนเองได้ กรุณาติดต่อผู้ดูแลระบบ' };
    }
    recordAudit(`ยกเลิกการลงทะเบียนของนักเรียน ${studentId}`);
    setStudents(prev =>
      prev.map(s =>
        s.studentId === studentId
          ? { ...s, registeredCourseCode: null, registeredAt: null }
          : s
      )
    );
    return { success: true, message: 'ยกเลิกการลงทะเบียนเรียบร้อยแล้ว' };
  };

  // Teacher Attendance Actions
  const updateAttendanceStatus = (
    courseCode: string,
    studentId: string,
    sessionIndex: number,
    status: AttendanceStatus
  ) => {
    recordAudit(`บันทึกเวลาเรียน ${studentId} วิชา ${courseCode} คาบ ${sessionIndex + 1}: ${status}`);
    setAttendance(prev => {
      const existingIndex = prev.findIndex(
        r => r.courseCode === courseCode && r.studentId === studentId && r.sessionIndex === sessionIndex
      );
      if (existingIndex >= 0) {
        const copy = [...prev];
        copy[existingIndex] = { ...copy[existingIndex], status };
        return copy;
      } else {
        return [...prev, { courseCode, studentId, sessionIndex, status }];
      }
    });
  };

  const markAllPresentForSession = (courseCode: string, sessionIndex: number) => {
    recordAudit(`เช็คชื่อมาเรียนทั้งหมด วิชา ${courseCode} คาบ ${sessionIndex + 1}`);
    const enrolled = getEnrolledStudents(courseCode);
    setAttendance(prev => {
      const updated = [...prev];
      for (const st of enrolled) {
        const idx = updated.findIndex(
          r => r.courseCode === courseCode && r.studentId === st.studentId && r.sessionIndex === sessionIndex
        );
        if (idx >= 0) {
          updated[idx] = { ...updated[idx], status: 'present' };
        } else {
          updated.push({ courseCode, studentId: st.studentId, sessionIndex, status: 'present' });
        }
      }
      return updated;
    });
  };

  // Admin Actions: Electives & Grade Settings
  const toggleGradeRegistration = (grade: number, isOpen: boolean) => {
    recordAudit(`${isOpen ? 'เปิด' : 'ปิด'}ระบบลงทะเบียนระดับชั้น ม.${grade}`);
    setGradeSettings(prev => ({
      ...prev,
      [grade]: {
        ...(prev[grade] || {
          grade,
          dayOfWeek: 'วันพฤหัสบดี',
          periodText: 'คาบ 7 - 8',
          startDate: '2027-05-15',
          endDate: '2027-07-31',
          dates: []
        }),
        isOpen
      }
    }));
  };

  const saveGradePeriodSettings = (
    grade: number,
    dayOfWeek: string,
    periodText: string,
    startDate: string,
    endDate: string,
    dates: string[]
  ) => {
    recordAudit(`แก้ไขกำหนดการลงทะเบียนระดับชั้น ม.${grade}`);
    setGradeSettings(prev => ({
      ...prev,
      [grade]: {
        ...(prev[grade] || { grade, isOpen: true }),
        dayOfWeek,
        periodText,
        startDate,
        endDate,
        dates
      }
    }));
  };

  const addCourse = (course: ElectiveCourse): { success: boolean; message: string; warning?: boolean } => {
    // Check teacher matching
    const teacherExists = teachers.some(t => t.fullName.trim() === course.teacherName.trim());
    const warning = !teacherExists;
    recordAudit(`เพิ่มหรือแก้ไขรายวิชา ${course.code}`);

    setCourses(prev => {
      const existing = prev.findIndex(c => c.code === course.code);
      if (existing >= 0) {
        const copy = [...prev];
        copy[existing] = course;
        return copy;
      }
      return [...prev, course];
    });

    return {
      success: true,
      message: warning
        ? `บันทึกวิชาแล้ว แต่ชื่อครู "${course.teacherName}" ไม่ตรงกับครูในระบบ (จะขึ้นสถานะสีเหลือง)`
        : 'บันทึกรายวิชาสำเร็จ',
      warning
    };
  };

  const importCoursesCSV = (csvText: string): { added: number; warnings: string[]; errors: string[] } => {
    const rows = parseCsvRows(csvText);
    let count = 0;
    const warnings: string[] = [];
    const errors: string[] = [];

    // Format: Code,Name,TeacherName,Grade,AllowedRooms,Day,Period,Classroom,MaxStudents,Desc (legacy CSV with Credits is also accepted)
    for (let i = 0; i < rows.length; i++) {
      const parts = rows[i];
      const line = parts.join(',');
      // Skip header if detected
      if (i === 0 && (line.includes('รหัส') || line.toLowerCase().includes('code'))) {
        continue;
      }
      // `parts` was parsed with quote-aware CSV handling above.
      if (parts.length >= 8) {
        const [code, name, teacherName, gradeStr, roomsStr, dayOfWeek, period, classroom, maxStr] = parts;
        const grade = parseInt(gradeStr, 10) || 4;
        const maxStudents = parseInt(maxStr, 10) || 35;
        const desc = parts.length >= 11 ? parts.slice(10).join(',') : (parts[9] || '');
        const allowedRooms = roomsStr ? roomsStr.split(';').map(r => r.trim()) : [];

        const teacherMatch = teachers.some(t => t.fullName.trim() === teacherName);
        if (!teacherMatch) {
          warnings.push(`วิชา ${code} (${name}): คุณครู "${teacherName}" ไม่ตรงกับคุณครูในระบบ`);
        }

        const newCourse: ElectiveCourse = {
          code,
          name,
          teacherName,
          grade,
          allowedRooms,
          dayOfWeek: dayOfWeek || gradeSettings[grade]?.dayOfWeek || 'วันพฤหัสบดี',
          period: period || gradeSettings[grade]?.periodText || 'คาบ 7 - 8',
          classroom,
          maxStudents,
          description: desc || ''
        };

        setCourses(prev => {
          const idx = prev.findIndex(c => c.code === code);
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = newCourse;
            return copy;
          }
          return [...prev, newCourse];
        });
        count++;
      } else {
        errors.push(`แถวที่ ${i + 1} ข้อมูลไม่ครบถ้วน`);
      }
    }

    if (count) recordAudit(`นำเข้าหรือปรับปรุงรายวิชาจาก CSV ${count} รายการ`);
    return { added: count, warnings, errors };
  };

  const removeCourse = (courseCode: string) => {
    recordAudit(`ลบรายวิชา ${courseCode}`);
    setCourses(prev => prev.filter(c => c.code !== courseCode));
    // Clear registration for students in this course
    setStudents(prev =>
      prev.map(s => (s.registeredCourseCode === courseCode ? { ...s, registeredCourseCode: null } : s))
    );
  };

  // Admin Actions: Students & Classrooms
  const addClassroom = (roomNumber: string, advisor: string, grade: number): { success: boolean; message: string } => {
    recordAudit(`เพิ่มหรือแก้ไขห้องเรียน ${roomNumber}`);
    const id = roomNumber.replace('/', '-');
    setClassrooms(prev => {
      const exists = prev.findIndex(c => c.roomNumber === roomNumber);
      if (exists >= 0) {
        const copy = [...prev];
        copy[exists] = { id, roomNumber, advisor, grade };
        return copy;
      }
      const updated = [...prev, { id, roomNumber, advisor, grade }];
      // Sort by grade, then by room number
      return updated.sort((a, b) => {
        if (a.grade !== b.grade) return a.grade - b.grade;
        const numA = parseInt(a.roomNumber.split('/')[1] || '0', 10);
        const numB = parseInt(b.roomNumber.split('/')[1] || '0', 10);
        return numA - numB;
      });
    });
    return { success: true, message: 'บันทึกห้องเรียนสำเร็จ' };
  };

  const importClassroomsCSV = (csvText: string): { added: number; errors: string[] } => {
    const rows = parseCsvRows(csvText);
    let count = 0;
    const errors: string[] = [];

    // Format: RoomNumber, Advisor, Grade
    for (let i = 0; i < rows.length; i++) {
      const parts = rows[i];
      const line = parts.join(',');
      if (i === 0 && (line.includes('ห้อง') || line.toLowerCase().includes('room'))) {
        continue;
      }
      // รองรับทั้ง RoomNumber, Advisor, Grade และ RoomNumber, Advisor1, Advisor2, Grade
      if (parts.length >= 2) {
        const roomNumber = parts[0];
        const lastCell = parts[parts.length - 1];
        const hasSeparateGrade = /^\d+$/.test(lastCell) && parts.length >= 3;
        const grade = hasSeparateGrade ? parseInt(lastCell, 10) : parseInt(roomNumber.split('/')[0] || '1', 10);
        const advisorCells = hasSeparateGrade ? parts.slice(1, -1) : parts.slice(1);
        const advisor = advisorCells.filter(Boolean).join(', ') || 'ยังไม่ได้ระบุครูที่ปรึกษา';
        addClassroom(roomNumber, advisor, grade);
        count++;
      } else {
        errors.push(`แถวที่ ${i + 1} ข้อมูลไม่ถูกต้อง`);
      }
    }
    if (count) recordAudit(`นำเข้าหรือปรับปรุงห้องเรียนจาก CSV ${count} ห้อง`);
    return { added: count, errors };
  };

  const addStudent = (newStudent: Student): { success: boolean; message: string } => {
    recordAudit(`เพิ่มหรือแก้ไขข้อมูลนักเรียน ${newStudent.studentId}`);
    // Check if classroom exists; if not, create it as specified in prompt:
    // "โดยถ้าห้องที่นักเรียนจากCSVไม่มีจะสร้างห้องเรียนมาใหม่แต่ถ้ามีอยู่แล้วชื่อจะเข้าที่ระบบ"
    const grade = parseInt(newStudent.room.split('/')[0] || '1', 10);
    const roomExists = classrooms.some(c => c.roomNumber === newStudent.room);
    if (!roomExists) {
      addClassroom(newStudent.room, 'ยังไม่ได้ระบุครูที่ปรึกษา', grade);
    }

    setStudents(prev => {
      const idx = prev.findIndex(s => s.studentId === newStudent.studentId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = newStudent;
        return copy;
      }
      return [...prev, newStudent];
    });

    return { success: true, message: 'บันทึกข้อมูลนักเรียนสำเร็จ' };
  };

  const importStudentsCSV = (csvText: string): { added: number; errors: string[] } => {
    const rows = parseCsvRows(csvText);
    let count = 0;
    const errors: string[] = [];

    // Requirement: "โดยเรียงข้อมูลจาก รหัสนักเรียน เลขบัตรประชาชน ชื่อ-นามสกุล ชั้น/ห้อง เลขที่"
    for (let i = 0; i < rows.length; i++) {
      const parts = rows[i];
      const line = parts.join(',');
      if (i === 0 && (line.includes('รหัส') || line.includes('บัตร') || line.toLowerCase().includes('id'))) {
        continue;
      }
      // `parts` was parsed with quote-aware CSV handling above.
      if (parts.length >= 5) {
        const [studentId, nationalId, fullName, room, numberInRoomStr] = parts;
        const numberInRoom = parseInt(numberInRoomStr, 10) || 1;

        // Auto create classroom if missing
        const grade = parseInt(room.split('/')[0] || '1', 10);
        if (!classrooms.some(c => c.roomNumber === room)) {
          addClassroom(room, 'ยังไม่ได้ระบุครูที่ปรึกษา', grade);
        }

        const studentObj: Student = {
          studentId,
          nationalId,
          fullName,
          room,
          numberInRoom,
          registeredCourseCode: null,
          registeredAt: null
        };

        setStudents(prev => {
          const idx = prev.findIndex(s => s.studentId === studentId);
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = { ...copy[idx], nationalId, fullName, room, numberInRoom };
            return copy;
          }
          return [...prev, studentObj];
        });
        count++;
      } else {
        errors.push(`แถวที่ ${i + 1} ข้อมูลไม่ครบ 5 ช่อง (รหัสนักเรียน, เลขบัตรประชาชน, ชื่อ-นามสกุล, ชั้น/ห้อง, เลขที่)`);
      }
    }

    if (count) recordAudit(`นำเข้าหรือปรับปรุงข้อมูลนักเรียนจาก CSV ${count} คน`);
    return { added: count, errors };
  };

  const removeStudent = (studentId: string) => {
    recordAudit(`ลบข้อมูลนักเรียน ${studentId}`);
    setStudents(prev => prev.filter(s => s.studentId !== studentId));
  };

  // Admin Actions: Teachers
  // Requirement: "โดยเมื่อบันทึกข้อมูลคุณครูจะเรียงจากพยัญชนะและสระ"
  const addTeacher = (teacher: Teacher): { success: boolean; message: string } => {
    recordAudit(`เพิ่มหรือแก้ไขบัญชีครู ${teacher.username}`);
    setTeachers(prev => {
      const idx = prev.findIndex(t => t.username.toLowerCase() === teacher.username.toLowerCase());
      let updated: Teacher[];
      if (idx >= 0) {
        updated = [...prev];
        updated[idx] = teacher;
      } else {
        updated = [...prev, teacher];
      }
      // Thai alphabetical sorting
      return updated.sort((a, b) => a.fullName.localeCompare(b.fullName, 'th'));
    });
    return { success: true, message: 'บันทึกข้อมูลคุณครูสำเร็จ' };
  };

  const updateTeacher = (username: string, updated: Partial<Teacher>): { success: boolean; message: string } => {
    const existingTeacher = teachers.find(t => t.username.toLowerCase() === username.toLowerCase());
    if (!existingTeacher) return { success: false, message: 'ไม่พบข้อมูลคุณครูที่ต้องการแก้ไข' };
    recordAudit(`แก้ไขข้อมูลครู ${username}`);
    setTeachers(prev => prev.map(t => t.username.toLowerCase() === username.toLowerCase() ? { ...t, ...updated } : t)
      .sort((a, b) => a.fullName.localeCompare(b.fullName, 'th')));
    if (updated.fullName && updated.fullName !== existingTeacher.fullName) {
      setCourses(prev => prev.map(course => course.teacherName.trim() === existingTeacher.fullName.trim() ? { ...course, teacherName: updated.fullName as string } : course));
    }
    return { success: true, message: 'อัปเดตข้อมูลคุณครูเรียบร้อย' };
  };

  const resetTeacherPassword = (username: string, newPassword: string): { success: boolean; message: string } => {
    if (!newPassword.trim()) {
      return { success: false, message: 'กรุณากรอกรหัสผ่านใหม่' };
    }
    if (!teachers.some(t => t.username.toLowerCase() === username.toLowerCase())) {
      return { success: false, message: 'ไม่พบบัญชีคุณครูที่ต้องการแก้ไขรหัสผ่าน' };
    }
    recordAudit(`เปลี่ยนรหัสผ่านครู ${username}`);
    setTeachers(prev => {
      const idx = prev.findIndex(t => t.username.toLowerCase() === username.toLowerCase());
      if (idx === -1) return prev;
      const copy = [...prev];
      copy[idx] = { ...copy[idx], password: newPassword.trim() };
      return copy;
    });
    return { success: true, message: 'แก้ไขรหัสผ่านคุณครูสำเร็จ' };
  };

  const removeTeacher = (username: string): { success: boolean; message: string } => {
    recordAudit(`ลบบัญชีครู ${username}`);
    setTeachers(prev => prev.filter(t => t.username.toLowerCase() !== username.toLowerCase()));
    return { success: true, message: 'ลบรายชื่อคุณครูเรียบร้อย' };
  };

  const importTeachersCSV = (csvText: string): { added: number; errors: string[] } => {
    const rows = parseCsvRows(csvText);
    let count = 0;
    const errors: string[] = [];

    // Format: Username, Password, FullName
    for (let i = 0; i < rows.length; i++) {
      const parts = rows[i];
      const line = parts.join(',');
      if (i === 0 && (line.includes('Username') || line.includes('ชื่อผู้ใช้') || line.includes('ชื่อ-นามสกุล'))) {
        continue;
      }
      // `parts` was parsed with quote-aware CSV handling above.
      if (parts.length >= 3) {
        const [username, password, fullName] = parts;
        addTeacher({ username, password, fullName });
        count++;
      } else {
        errors.push(`แถวที่ ${i + 1} ข้อมูลไม่ครบ 3 ช่อง (Username, Password, ชื่อ-นามสกุล)`);
      }
    }
    if (count) recordAudit(`นำเข้าบัญชีครูจาก CSV ${count} บัญชี`);
    return { added: count, errors };
  };

  // Admin Actions: Admins
  const addAdmin = (adminUser: AdminUser): { success: boolean; message: string } => {
    if (admins.some(a => a.username.toLowerCase() === adminUser.username.toLowerCase())) {
      return { success: false, message: 'ชื่อผู้ใช้นี้มีอยู่แล้ว กรุณาใช้ชื่ออื่น' };
    }
    recordAudit(`เพิ่มบัญชีผู้ดูแล ${adminUser.username}`);
    setAdmins(prev => [...prev, adminUser]);
    return { success: true, message: 'เพิ่มผู้ดูแลระบบสำเร็จ' };
  };

  const updateAdmin = (username: string, updated: Partial<AdminUser>): { success: boolean; message: string } => {
    recordAudit(`แก้ไขบัญชีผู้ดูแล ${username}`);
    setAdmins(prev => {
      const idx = prev.findIndex(a => a.username.toLowerCase() === username.toLowerCase());
      if (idx === -1) return prev;
      const copy = [...prev];
      copy[idx] = { ...copy[idx], ...updated };
      return copy;
    });
    return { success: true, message: 'อัปเดตข้อมูลผู้ดูแลระบบเรียบร้อย' };
  };

  const removeAdmin = (username: string, adminPassword: string): { success: boolean; message: string } => {
    if (!verifyAdminPassword(adminPassword)) {
      return { success: false, message: 'รหัสผ่านยืนยันไม่ถูกต้อง' };
    }
    if (admins.length <= 1) {
      return { success: false, message: 'ไม่สามารถลบได้ เนื่องจากต้องมีผู้ดูแลระบบอย่างน้อย 1 บัญชี' };
    }
    recordAudit(`ลบบัญชีผู้ดูแล ${username}`);
    setAdmins(prev => prev.filter(a => a.username.toLowerCase() !== username.toLowerCase()));
    return { success: true, message: 'ลบผู้ดูแลระบบเรียบร้อย' };
  };

  const importAdminsCSV = (csvText: string): { added: number; errors: string[] } => {
    const rows = parseCsvRows(csvText);
    let count = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const parts = rows[i];
      const line = parts.join(',');
      if (i === 0 && (line.includes('Username') || line.includes('ชื่อผู้ใช้'))) {
        continue;
      }
      // `parts` was parsed with quote-aware CSV handling above.
      if (parts.length >= 2) {
        const [username, password] = parts;
        addAdmin({ username, password });
        count++;
      } else {
        errors.push(`แถวที่ ${i + 1} ข้อมูลไม่ครบ`);
      }
    }
    if (count) recordAudit(`นำเข้าบัญชีผู้ดูแลจาก CSV ${count} บัญชี`);
    return { added: count, errors };
  };

  // Admin Actions: Announcements
  const addAnnouncement = (item: Omit<Announcement, 'id'>) => {
    recordAudit(`เพิ่มข่าวประชาสัมพันธ์: ${item.title}`);
    const newAnn: Announcement = {
      ...item,
      id: `ann-${Date.now()}`
    };
    setAnnouncements(prev => [newAnn, ...prev]);
  };

  const deleteAnnouncement = (id: string) => {
    recordAudit(`ลบข่าวประชาสัมพันธ์ ${id}`);
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  // System Configuration & Reset Actions
  const updateSystemConfig = (academicYear: string, semester: string) => {
    recordAudit(`เปลี่ยนปีการศึกษา ${academicYear} ภาคเรียน ${semester}`);
    setSystemConfig({ academicYear, semester });
  };

  const verifyAdminPassword = (password: string): boolean => {
    return admins.some(a => a.password === password);
  };

  const resetAllEnrollments = (adminPassword: string): { success: boolean; message: string } => {
    if (!verifyAdminPassword(adminPassword)) {
      return { success: false, message: 'รหัสผ่านยืนยันไม่ถูกต้อง' };
    }
    recordAudit('ล้างข้อมูลการลงทะเบียนทั้งหมด');
    setStudents(prev =>
      prev.map(s => ({
        ...s,
        registeredCourseCode: null,
        registeredAt: null
      }))
    );
    setAttendance([]);
    return { success: true, message: 'ล้างข้อมูลการเลือกลงทะเบียนรายวิชาทั้งหมดเรียบร้อยแล้ว' };
  };

  const deleteAllCourses = (adminPassword: string): { success: boolean; message: string } => {
    if (!verifyAdminPassword(adminPassword)) {
      return { success: false, message: 'รหัสผ่านยืนยันไม่ถูกต้อง' };
    }
    recordAudit('ลบรายวิชาทั้งหมด');
    // Check if there are active enrollments
    const activeEnrollments = students.some(s => s.registeredCourseCode !== null);
    if (activeEnrollments) {
      return { success: false, message: 'ไม่สามารถลบรายวิชาได้ เนื่องจากยังมีนักเรียนลงทะเบียนค้างอยู่ กรุณาลบข้อมูลการเลือกลงทะเบียนก่อน' };
    }
    setCourses([]);
    setAttendance([]);
    return { success: true, message: 'ลบรายวิชาเพิ่มเติมทั้งหมดเรียบร้อยแล้ว' };
  };

  const deleteAllStudents = (adminPassword: string): { success: boolean; message: string } => {
    if (!verifyAdminPassword(adminPassword)) {
      return { success: false, message: 'รหัสผ่านยืนยันไม่ถูกต้อง' };
    }
    recordAudit('ลบข้อมูลนักเรียนทั้งหมด');
    setStudents([]);
    setAttendance([]);
    return { success: true, message: 'ลบข้อมูลนักเรียนทั้งหมดเรียบร้อยแล้ว' };
  };

  // Requirement: "ระบบจัดการล้างข้อมูลระบบให้มีล้างระบบครูด้วย โดยไม่ต้องลบอะไรก่อนลบได้เลย"
  const deleteAllTeachers = (adminPassword: string): { success: boolean; message: string } => {
    if (!verifyAdminPassword(adminPassword)) {
      return { success: false, message: 'รหัสผ่านยืนยันไม่ถูกต้อง' };
    }
    recordAudit('ลบข้อมูลครูทั้งหมด');
    setTeachers([]);
    return { success: true, message: 'ลบข้อมูลระบบครูผู้สอนทั้งหมดเรียบร้อยแล้ว' };
  };

  // Requirement: "และก็ปุ่ม ล้างข้อมูลประจำภาคเรียนนี้ โดยจะล้างทั้งหมดยกเว้นแอดมิน"
  const resetSemesterData = (adminPassword: string): { success: boolean; message: string } => {
    if (!verifyAdminPassword(adminPassword)) {
      return { success: false, message: 'รหัสผ่านยืนยันไม่ถูกต้อง' };
    }
    recordAudit('ล้างข้อมูลปีการศึกษา');
    setStudents([]);
    setAttendance([]);
    setCourses([]);
    setClassrooms([]);
    setTeachers([]);
    setAnnouncements([]);
    setSystemConfig(initialSystemConfig);
    setGradeSettings(initialGradeSettings);
    return { success: true, message: 'ล้างข้อมูลปีการศึกษานี้เรียบร้อยแล้ว (คงเหลือเฉพาะบัญชีผู้ดูแลระบบ)' };
  };

  return (
    <AppContext.Provider
      value={{
        systemConfig,
        currentUser,
        gradeSettings,
        classrooms,
        teachers,
        admins,
        courses,
        students,
        attendance,
        announcements,
        login,
        logout,
        enrollCourse,
        dropCourse,
        updateAttendanceStatus,
        markAllPresentForSession,
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
        importTeachersCSV,
        addAdmin,
        importAdminsCSV,
        addAnnouncement,
        deleteAnnouncement,
        updateSystemConfig,
        resetAllEnrollments,
        deleteAllCourses,
        deleteAllStudents,
        deleteAllTeachers,
        resetSemesterData,
        getEnrolledCount,
        getEnrolledStudents,
        getCourseByCode
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
