export interface Student {
  studentId: string;
  nationalId: string;
  fullName: string;
  room: string; // e.g. "4/3", "1/5"
  numberInRoom: number;
  registeredCourseCode: string | null;
  registeredAt?: string | null;
}

export interface Classroom {
  id: string; // e.g. "1-5"
  grade: number; // 1 to 6
  roomNumber: string; // e.g. "1/5"
  advisor: string; // e.g. "อาจารย์สมใจ นวลอนงค์, อาจารย์ธีรพัฒน์ สุวรรณรัตน์"
}

export interface Teacher {
  username: string;
  password: string;
  fullName: string;
}

export interface AdminUser {
  username: string;
  password: string;
}

export interface GradePeriodSetting {
  grade: number;
  dayOfWeek: string;
  periodText: string;
  startDate: string;
  endDate: string;
  dates: string[]; // List of class dates in Thai format e.g. ["15 พ.ค. 2570", ...]
  isOpen: boolean; // Registration status for this grade
}

export interface ElectiveCourse {
  code: string;
  name: string;
  englishName?: string;
  teacherName: string;
  grade: number; // 1 to 6
  allowedRooms: string[]; // e.g. ["4/3", "4/4"]
  dayOfWeek: string;
  period: string;
  classroom: string; // e.g. "ห้องปฏิบัติการคอมพิวเตอร์ 2 (อาคาร 3 ชั้น 3)"
  maxStudents: number;
  description: string;
}

export type AttendanceStatus = 'unmarked' | 'present' | 'absent' | 'leave' | 'sick';

export interface AttendanceRecord {
  courseCode: string;
  studentId: string;
  sessionIndex: number; // 0-based index of the class date
  status: AttendanceStatus;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  target: 'all' | 'public' | 'students' | 'teachers';
  important?: boolean;
  link?: string;
  attachments?: Array<{ name: string; type: string; url: string }>;
}

export interface SystemConfig {
  academicYear: string; // e.g. "2570"
  semester: string; // "1" or "2"
}

export type UserRole = 'student' | 'teacher' | 'admin' | null;

export interface CurrentUser {
  role: UserRole;
  username: string;
  fullName: string;
  // Specific properties
  studentData?: Student;
  teacherData?: Teacher;
  adminData?: AdminUser;
}
