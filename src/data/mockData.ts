import {
  AdminUser,
  Announcement,
  AttendanceRecord,
  Classroom,
  ElectiveCourse,
  GradePeriodSetting,
  Student,
  SystemConfig,
  Teacher
} from '../types';

export const initialSystemConfig: SystemConfig = {
  academicYear: '2570',
  semester: '1'
};

export const initialAdmins: AdminUser[] = [
  {
    username: 'Nugget',
    password: '151154'
  },
  {
    username: 'admin_academic',
    password: 'password'
  }
];

export const initialTeachers: Teacher[] = [
  {
    username: 'thanakorn',
    password: 'password',
    fullName: 'ครูธนกร จารุวัตร'
  },
  {
    username: 'kritsana',
    password: 'password',
    fullName: 'ครูกฤษณะ เมธากุล'
  },
  {
    username: 'patcharaporn',
    password: 'password',
    fullName: 'ครูพัชราภรณ์ วงษ์สุวรรณ'
  },
  {
    username: 'orathai',
    password: 'password',
    fullName: 'ครูอรทัย ศรีประเสริฐ'
  },
  {
    username: 'waranya',
    password: 'password',
    fullName: 'ครูวรัญญา มหานที'
  },
  {
    username: 'kittipong',
    password: 'password',
    fullName: 'ครูกิตติพงษ์ สว่างเนตร'
  },
  {
    username: 'nalinee',
    password: 'password',
    fullName: 'ครูนลินี ปรีชาชาญ'
  },
  {
    username: 'thanadol',
    password: 'password',
    fullName: 'ครูธนดล เมธากุล'
  }
];

// Initial classrooms matching the user's rules:
// M.1/5-10, M.2/5-10, M.3/5-10, M.4/3-4, M.5/3-4, M.6/3-4
export const initialClassrooms: Classroom[] = [
  // M.1
  { id: '1-5', grade: 1, roomNumber: '1/5', advisor: 'ครูกมลพร บุญประเสริฐ, ครูชยุตม์ ธนาพร' },
  { id: '1-6', grade: 1, roomNumber: '1/6', advisor: 'ครูวิภาวัลย์ กุลพงษ์, ครูสิทธิชัย สดใส' },
  { id: '1-7', grade: 1, roomNumber: '1/7', advisor: 'ครูรัชนีกร สุขสมบูรณ์, ครูอภิสิทธิ์ วรเดช' },
  { id: '1-8', grade: 1, roomNumber: '1/8', advisor: 'ครูพรทิพย์ ชัยชนะ, ครูดนัย มีสุข' },
  { id: '1-9', grade: 1, roomNumber: '1/9', advisor: 'ครูกนกพร เจริญกิจ, ครูสุทธิพงษ์ รัตนวิชัย' },
  { id: '1-10', grade: 1, roomNumber: '1/10', advisor: 'ครูยุพารัตน์ วิจิตร, ครูธีรศักดิ์ เปรมปรีดิ์' },

  // M.2
  { id: '2-5', grade: 2, roomNumber: '2/5', advisor: 'ครูณัฐพล ชัยชนะ, ครูอัญชลี ศิริพงษ์' },
  { id: '2-6', grade: 2, roomNumber: '2/6', advisor: 'ครูประภาส เกษมศรี, ครูปิยวรรณ รุ่งโรจน์' },
  { id: '2-7', grade: 2, roomNumber: '2/7', advisor: 'ครูสุมาลี ทรัพย์เจริญ, ครูเอกชัย วัฒนา' },
  { id: '2-8', grade: 2, roomNumber: '2/8', advisor: 'ครูจริยา บุญชู, ครูภานุวัฒน์ สิงห์ทอง' },
  { id: '2-9', grade: 2, roomNumber: '2/9', advisor: 'ครูวราภรณ์ วิเศษศรี, ครูพงศ์ศักดิ์ สมใจ' },
  { id: '2-10', grade: 2, roomNumber: '2/10', advisor: 'ครูศศิธร เจริญผล, ครูชวลิต มณีโชติ' },

  // M.3
  { id: '3-5', grade: 3, roomNumber: '3/5', advisor: 'ครูวารุณี มั่นคง, ครูทรงพล เลิศวิไล' },
  { id: '3-6', grade: 3, roomNumber: '3/6', advisor: 'ครูปราณี สระทอง, ครูอนุชา ปัญญาวงศ์' },
  { id: '3-7', grade: 3, roomNumber: '3/7', advisor: 'ครูทิพวรรณ ศิริชัย, ครูไกรสร เพชรดี' },
  { id: '3-8', grade: 3, roomNumber: '3/8', advisor: 'ครูมัลลิกา ชัยยศ, ครูสมชาย บุญมา' },
  { id: '3-9', grade: 3, roomNumber: '3/9', advisor: 'ครูเบญจมาศ อุดมทรัพย์, ครูณรงค์ ปรีชา' },
  { id: '3-10', grade: 3, roomNumber: '3/10', advisor: 'ครูวรรณภา รัตนพาณิชย์, ครูสุวิทย์ วรรณกิจ' },

  // M.4
  { id: '4-3', grade: 4, roomNumber: '4/3', advisor: 'อาจารย์สมใจ นวลอนงค์, อาจารย์ธีรพัฒน์ สุวรรณรัตน์' },
  { id: '4-4', grade: 4, roomNumber: '4/4', advisor: 'อาจารย์เกรียงไกร มั่งคั่ง, อาจารย์พรนภา จิตดี' },

  // M.5
  { id: '5-3', grade: 5, roomNumber: '5/3', advisor: 'อาจารย์ชัชวาลย์ สมเกียรติ, อาจารย์พิมพาภรณ์ เรืองศรี' },
  { id: '5-4', grade: 5, roomNumber: '5/4', advisor: 'อาจารย์นพรัตน์ แสงทอง, อาจารย์ดวงฤทัย ค้ำชู' },

  // M.6
  { id: '6-3', grade: 6, roomNumber: '6/3', advisor: 'อาจารย์สุวรรณา สุขสันต์, อาจารย์วิทยา พิทักษ์' },
  { id: '6-4', grade: 6, roomNumber: '6/4', advisor: 'อาจารย์ธวัชชัย รุ่งเรือง, อาจารย์กัญญารัตน์ ทองทา' }
];

// Grade session settings
export const initialGradeSettings: Record<number, GradePeriodSetting> = {
  1: {
    grade: 1,
    dayOfWeek: 'วันอังคาร',
    periodText: 'คาบ 7 - 8 (13:00 - 15:00 น.)',
    startDate: '2027-05-18',
    endDate: '2027-08-03',
    dates: [
      '18 พ.ค. 2570', '25 พ.ค. 2570', '1 มิ.ย. 2570', '8 มิ.ย. 2570',
      '15 มิ.ย. 2570', '22 มิ.ย. 2570', '29 มิ.ย. 2570', '6 ก.ค. 2570',
      '13 ก.ค. 2570', '20 ก.ค. 2570', '27 ก.ค. 2570', '3 ส.ค. 2570'
    ],
    isOpen: true
  },
  2: {
    grade: 2,
    dayOfWeek: 'วันศุกร์',
    periodText: 'คาบ 7 - 8 (13:00 - 15:00 น.)',
    startDate: '2027-05-21',
    endDate: '2027-08-06',
    dates: [
      '21 พ.ค. 2570', '28 พ.ค. 2570', '4 มิ.ย. 2570', '11 มิ.ย. 2570',
      '18 มิ.ย. 2570', '25 มิ.ย. 2570', '2 ก.ค. 2570', '9 ก.ค. 2570',
      '16 ก.ค. 2570', '23 ก.ค. 2570', '30 ก.ค. 2570', '6 ส.ค. 2570'
    ],
    isOpen: true
  },
  3: {
    grade: 3,
    dayOfWeek: 'วันพุธ',
    periodText: 'คาบ 7 - 8 (13:00 - 15:00 น.)',
    startDate: '2027-05-19',
    endDate: '2027-08-04',
    dates: [
      '19 พ.ค. 2570', '26 พ.ค. 2570', '2 มิ.ย. 2570', '9 มิ.ย. 2570',
      '16 มิ.ย. 2570', '23 มิ.ย. 2570', '30 มิ.ย. 2570', '7 ก.ค. 2570',
      '14 ก.ค. 2570', '21 ก.ค. 2570', '28 ก.ค. 2570', '4 ส.ค. 2570'
    ],
    isOpen: true
  },
  4: {
    grade: 4,
    dayOfWeek: 'วันพฤหัสบดี',
    periodText: 'คาบ 7 - 8 (13:00 - 15:00 น.)',
    startDate: '2027-05-15',
    endDate: '2027-07-31',
    dates: [
      '15 พ.ค. 2570', '22 พ.ค. 2570', '29 พ.ค. 2570', '5 มิ.ย. 2570',
      '12 มิ.ย. 2570', '19 มิ.ย. 2570', '26 มิ.ย. 2570', '3 ก.ค. 2570',
      '10 ก.ค. 2570', '17 ก.ค. 2570', '24 ก.ค. 2570', '31 ก.ค. 2570'
    ],
    isOpen: true
  },
  5: {
    grade: 5,
    dayOfWeek: 'วันศุกร์',
    periodText: 'คาบ 5 - 6 (10:10 - 12:10 น.)',
    startDate: '2027-05-21',
    endDate: '2027-08-06',
    dates: [
      '21 พ.ค. 2570', '28 พ.ค. 2570', '4 มิ.ย. 2570', '11 มิ.ย. 2570',
      '18 มิ.ย. 2570', '25 มิ.ย. 2570', '2 ก.ค. 2570', '9 ก.ค. 2570',
      '16 ก.ค. 2570', '23 ก.ค. 2570', '30 ก.ค. 2570', '6 ส.ค. 2570'
    ],
    isOpen: true
  },
  6: {
    grade: 6,
    dayOfWeek: 'วันอังคาร',
    periodText: 'คาบ 3 - 4 (10:10 - 12:10 น.)',
    startDate: '2027-05-18',
    endDate: '2027-08-03',
    dates: [
      '18 พ.ค. 2570', '25 พ.ค. 2570', '1 มิ.ย. 2570', '8 มิ.ย. 2570',
      '15 มิ.ย. 2570', '22 มิ.ย. 2570', '29 มิ.ย. 2570', '6 ก.ค. 2570',
      '13 ก.ค. 2570', '20 ก.ค. 2570', '27 ก.ค. 2570', '3 ส.ค. 2570'
    ],
    isOpen: true
  }
};

export const initialCourses: ElectiveCourse[] = [
  // Grade 4 Courses
  {
    code: 'ว30219',
    name: 'การเขียนโปรแกรมไพทอนและการประยุกต์ใช้ AI เบื้องต้น',
    englishName: 'Introduction to Python Programming and Applied AI',
    teacherName: 'ครูธนกร จารุวัตร',
    grade: 4,
    allowedRooms: ['4/3', '4/4'],
    dayOfWeek: 'วันพฤหัสบดี',
    period: 'คาบ 7 - 8 (13:00 - 15:00 น.)',
    classroom: 'ห้องปฏิบัติการคอมพิวเตอร์ 2 (อาคาร 3 ชั้น 3)',
    maxStudents: 35,
    description: 'ศึกษาโครงสร้างข้อมูลพื้นฐานภาษาไพทอน การประมวลผลข้อมูล การใช้งานไลบรารี NumPy, Pandas และการสร้างโมเดล Machine Learning อย่างง่าย เพื่อแก้ปัญหาเชิงวิทยาศาสตร์และคณิตศาสตร์'
  },
  {
    code: 'ง30245',
    name: 'การสร้างสรรค์สื่อนวัตกรรมดิจิทัล 3D และ AR',
    englishName: 'Creative 3D Digital Media & Augmented Reality',
    teacherName: 'ครูอรทัย ศรีประเสริฐ',
    grade: 4,
    allowedRooms: ['4/3', '4/4'],
    dayOfWeek: 'วันพฤหัสบดี',
    period: 'คาบ 7 - 8 (13:00 - 15:00 น.)',
    classroom: 'ห้องปฏิบัติการนวัตกรรม (อาคาร 4 ชั้น 2)',
    maxStudents: 30,
    description: 'ศึกษาและฝึกปฏิบัติการออกแบบโมเดล 3 มิติด้วยซอฟต์แวร์ Blender การพัฒนาสื่อปฏิสัมพันธ์เสมือนจริง (AR) สำหรับการนำเสนอนิทรรศการและการศึกษา'
  },
  {
    code: 'ญ30201',
    name: 'ภาษาญี่ปุ่นเพื่อการสื่อสารและวัฒนธรรมสมัยใหม่',
    englishName: 'Japanese for Daily Communication & Pop Culture',
    teacherName: 'ครูพัชราภรณ์ วงษ์สุวรรณ',
    grade: 4,
    allowedRooms: ['4/3', '4/4'],
    dayOfWeek: 'วันพฤหัสบดี',
    period: 'คาบ 7 - 8 (13:00 - 15:00 น.)',
    classroom: 'ศูนย์ภาษาต่างประเทศ 1 (อาคาร 2 ชั้น 4)',
    maxStudents: 32,
    description: 'ฝึกทักษะการฟัง พูด อ่าน และเขียนตัวอักษรฮิระงะนะและคะตะคะนะเบื้องต้น การสนทนาทักทายชีวิตประจำวัน วัฒนธรรมเยาวชน และบริบทสังคมญี่ปุ่น'
  },
  {
    code: 'ศ30201',
    name: 'ดนตรีสากลร่วมสมัยและการบรรเลงรวมวง (Ensemble)',
    englishName: 'Contemporary Western Music & Ensemble Performance',
    teacherName: 'ครูกฤษณะ เมธากุล',
    grade: 4,
    allowedRooms: ['4/3', '4/4'],
    dayOfWeek: 'วันพฤหัสบดี',
    period: 'คาบ 7 - 8 (13:00 - 15:00 น.)',
    classroom: 'ห้องดนตรีสากล (อาคารศิลปะและกิจกรรม ชั้น 1)',
    maxStudents: 25,
    description: 'หลักทฤษฎีดนตรีสากล โครงสร้างคอร์ด การรวมวงขนาดเล็กและวงคอมโบ การจัดสมดุลเสียง และการเรียบเรียงเสียงประสานสำหรับงานแสดงดนตรี'
  },
  {
    code: 'ง30208',
    name: 'ผู้ประกอบการรุ่นเยาว์และพาณิชย์อิเล็กทรอนิกส์',
    englishName: 'Young Entrepreneurship & Global E-Commerce',
    teacherName: 'ครูวรัญญา มหานที',
    grade: 4,
    allowedRooms: ['4/3', '4/4'],
    dayOfWeek: 'วันพฤหัสบดี',
    period: 'คาบ 7 - 8 (13:00 - 15:00 น.)',
    classroom: 'ห้องจำลองธุรกิจ Smart Business (อาคาร 1 ชั้น 3)',
    maxStudents: 35,
    description: 'การคิดวิเคราะห์โมเดลธุรกิจ (Business Model Canvas) การตลาดบนโซเชียลมีเดีย กฎหมายดิจิทัล และการจัดทำบัญชีรายรับรายจ่ายเบื้องต้น'
  },

  // Grade 5 Courses
  {
    code: 'ว30248',
    name: 'เทคโนโลยีปัญญาประดิษฐ์ขั้นสูงและการพัฒนาเว็บแอปพลิเคชัน',
    englishName: 'Advanced AI Technology and Web Application Development',
    teacherName: 'ครูธนกร จารุวัตร',
    grade: 5,
    allowedRooms: ['5/3', '5/4'],
    dayOfWeek: 'วันศุกร์',
    period: 'คาบ 5 - 6 (10:10 - 12:10 น.)',
    classroom: 'ห้องปฏิบัติการคอมพิวเตอร์ 1 (อาคาร 3 ชั้น 2)',
    maxStudents: 30,
    description: 'การพัฒนา Full-stack Web Application และการเชื่อมต่อ AI API เพื่อประยุกต์ใช้งานในชีวิตประจำวัน'
  },
  {
    code: 'ญ30205',
    name: 'ภาษาเกาหลีเพื่อการสื่อสารและการท่องเที่ยว',
    englishName: 'Korean for Communication and Tourism',
    teacherName: 'ครูพัชราภรณ์ วงษ์สุวรรณ',
    grade: 5,
    allowedRooms: ['5/3', '5/4'],
    dayOfWeek: 'วันศุกร์',
    period: 'คาบ 5 - 6 (10:10 - 12:10 น.)',
    classroom: 'ห้องศูนย์ภาษาต่างประเทศ 2 (อาคาร 2 ชั้น 2)',
    maxStudents: 35,
    description: 'ฝึกทักษะการฟัง พูด อ่าน และเขียนภาษาเกาหลีในชีวิตประจำวัน ความรู้ทางวัฒนธรรม และการสนทนาสถานการณ์จำลอง'
  },

  // Grade 6 Courses
  {
    code: 'ว30282',
    name: 'โครงงานนวัตกรรมดิจิทัลเพื่อชุมชน',
    englishName: 'Digital Innovation Project for Community Development',
    teacherName: 'ครูธนกร จารุวัตร',
    grade: 6,
    allowedRooms: ['6/3', '6/4'],
    dayOfWeek: 'วันอังคาร',
    period: 'คาบ 3 - 4 (10:10 - 12:10 น.)',
    classroom: 'ห้องปฏิบัติการ Maker Space (อาคาร 4 ชั้น 4)',
    maxStudents: 28,
    description: 'การนำเทคโนโลยีดิจิทัลและ Internet of Things (IoT) มาแก้ปัญหาจริงในชุมชนและการทำโครงงานบูรณาการ'
  },

  // Grade 1 Courses
  {
    code: 'ว21201',
    name: 'วิทยาการคำนวณและสนุกกับโค้ดดิ้งบล็อก',
    englishName: 'Block-Based Coding and Computational Thinking',
    teacherName: 'ครูกิตติพงษ์ สว่างเนตร',
    grade: 1,
    allowedRooms: ['1/5', '1/6', '1/7', '1/8', '1/9', '1/10'],
    dayOfWeek: 'วันอังคาร',
    period: 'คาบ 7 - 8 (13:00 - 15:00 น.)',
    classroom: 'ห้องคอมพิวเตอร์มัธยมต้น (อาคาร 3 ชั้น 1)',
    maxStudents: 40,
    description: 'การคิดเชิงคำนวณ การใช้ Scratch และ Micro:bit พัฒนาเกมและแอนิเมชันสร้างสรรค์'
  },
  {
    code: 'ศ21201',
    name: 'ศิลปะสร้างสรรค์และการออกแบบกราฟิกเบื้องต้น',
    englishName: 'Creative Arts and Basic Graphic Design',
    teacherName: 'ครูนลินี ปรีชาชาญ',
    grade: 1,
    allowedRooms: ['1/5', '1/6', '1/7', '1/8', '1/9', '1/10'],
    dayOfWeek: 'วันอังคาร',
    period: 'คาบ 7 - 8 (13:00 - 15:00 น.)',
    classroom: 'ห้องปฏิบัติการศิลปะ (อาคาร 1 ชั้น 2)',
    maxStudents: 35,
    description: 'ทัศนศิลป์พื้นฐาน องค์ประกอบศิลป์ และการใช้โปรแกรมวาดภาพดิจิทัลเบื้องต้น'
  },

  // Grade 2 Courses
  {
    code: 'ศ20211',
    name: 'ดนตรีสากลและดนตรีร่วมสมัย',
    englishName: 'Contemporary Music Ensemble & Rhythm',
    teacherName: 'ครูธนดล เมธากุล',
    grade: 2,
    allowedRooms: ['2/5', '2/6', '2/7', '2/8', '2/9', '2/10'],
    dayOfWeek: 'วันศุกร์',
    period: 'คาบ 7 - 8 (13:00 - 15:00 น.)',
    classroom: 'ห้องปฏิบัติการดนตรี 1 (อาคารศิลปะ ชั้น 1)',
    maxStudents: 30,
    description: 'การรวมวงดนตรีสากล ทฤษฎีดนตรีเบื้องต้น และการจัดเรียงเสียงประสาน'
  },

  // Grade 3 Courses
  {
    code: 'ง20245',
    name: 'การเป็นผู้ประกอบการดิจิทัลสำหรับเยาวชน',
    englishName: 'Junior Digital Entrepreneurship',
    teacherName: 'ครูนลินี ปรีชาชาญ',
    grade: 3,
    allowedRooms: ['3/5', '3/6', '3/7', '3/8', '3/9', '3/10'],
    dayOfWeek: 'วันพุธ',
    period: 'คาบ 7 - 8 (13:00 - 15:00 น.)',
    classroom: 'ห้องปฏิบัติการคอมพิวเตอร์ 3 (อาคาร 3 ชั้น 2)',
    maxStudents: 35,
    description: 'การสร้างโมเดลธุรกิจยุคดิจิทัล การตลาดออนไลน์ผ่านแพลตฟอร์มโซเชียลมีเดีย และการวิเคราะห์กลุ่มเป้าหมาย'
  }
];

// Generate sample students
export const initialStudents: Student[] = [
  // M.4/3 Students
  {
    studentId: '54301',
    nationalId: '1100501234501',
    fullName: 'นายพีรพล วงศ์สวัสดิ์เจริญ',
    room: '4/3',
    numberInRoom: 1,
    registeredCourseCode: 'ว30219',
    registeredAt: '2027-05-10T09:15:00.000Z'
  },
  {
    studentId: '54302',
    nationalId: '1100501234502',
    fullName: 'น.ส.กัญญาภัทร สิริโชค',
    room: '4/3',
    numberInRoom: 2,
    registeredCourseCode: 'ว30219',
    registeredAt: '2027-05-10T09:16:12.000Z'
  },
  {
    studentId: '54303',
    nationalId: '1100501234503',
    fullName: 'นายชยกร จิตต์ประเสริฐ',
    room: '4/3',
    numberInRoom: 3,
    registeredCourseCode: 'ว30219',
    registeredAt: '2027-05-10T09:17:45.000Z'
  },
  {
    studentId: '54304',
    nationalId: '1100501234504',
    fullName: 'น.ส.ณิชานันท์ รัตนวิชัย',
    room: '4/3',
    numberInRoom: 4,
    registeredCourseCode: 'ง30245',
    registeredAt: '2027-05-10T09:18:22.000Z'
  },
  {
    studentId: '54305',
    nationalId: '1100501234505',
    fullName: 'นายธนกฤต แสงอรุณ',
    room: '4/3',
    numberInRoom: 5,
    registeredCourseCode: 'ศ30201',
    registeredAt: '2027-05-10T09:19:00.000Z'
  },
  {
    studentId: '54306',
    nationalId: '1100501234506',
    fullName: 'น.ส.ปวริศา วงศ์สถิตย์',
    room: '4/3',
    numberInRoom: 6,
    registeredCourseCode: 'ญ30201',
    registeredAt: '2027-05-10T09:20:10.000Z'
  },
  {
    studentId: '54307',
    nationalId: '1100501234507',
    fullName: 'นายพงศธร พิริยะพงศ์',
    room: '4/3',
    numberInRoom: 7,
    registeredCourseCode: 'ว30219',
    registeredAt: '2027-05-10T09:21:05.000Z'
  },
  {
    studentId: '54308',
    nationalId: '1100501234508',
    fullName: 'น.ส.วรัญญา ประเสริฐสุข',
    room: '4/3',
    numberInRoom: 8,
    registeredCourseCode: 'ง30208',
    registeredAt: '2027-05-10T09:22:15.000Z'
  },
  {
    studentId: '54309',
    nationalId: '1100501234509',
    fullName: 'นายศุภณัฐ บารมี',
    room: '4/3',
    numberInRoom: 9,
    registeredCourseCode: 'ว30219',
    registeredAt: '2027-05-10T09:23:40.000Z'
  },
  {
    studentId: '54310',
    nationalId: '1100501234510',
    fullName: 'น.ส.อภิญญา วงศ์สว่าง',
    room: '4/3',
    numberInRoom: 10,
    registeredCourseCode: 'ง30245',
    registeredAt: '2027-05-10T09:24:00.000Z'
  },

  // M.4/4 Students
  {
    studentId: '54321',
    nationalId: '1100501234521',
    fullName: 'นายกิตติศักดิ์ เจริญพร',
    room: '4/4',
    numberInRoom: 1,
    registeredCourseCode: 'ว30219',
    registeredAt: '2027-05-10T09:15:30.000Z'
  },
  {
    studentId: '54322',
    nationalId: '1100501234522',
    fullName: 'น.ส.จิดาภา มณีรัตน์',
    room: '4/4',
    numberInRoom: 2,
    registeredCourseCode: 'ว30219',
    registeredAt: '2027-05-10T09:16:00.000Z'
  },
  {
    studentId: '54323',
    nationalId: '1100501234523',
    fullName: 'นายฉัตรดนัย วัฒนศิริ',
    room: '4/4',
    numberInRoom: 3,
    registeredCourseCode: 'ง30245',
    registeredAt: '2027-05-10T09:17:15.000Z'
  },
  {
    studentId: '54324',
    nationalId: '1100501234524',
    fullName: 'น.ส.ณัฐณิชา กิจเจริญ',
    room: '4/4',
    numberInRoom: 4,
    registeredCourseCode: 'ญ30201',
    registeredAt: '2027-05-10T09:18:00.000Z'
  },
  {
    studentId: '54325',
    nationalId: '1100501234525',
    fullName: 'นายดรัณภพ รัตนโชติ',
    room: '4/4',
    numberInRoom: 5,
    registeredCourseCode: 'ว30219',
    registeredAt: '2027-05-10T09:19:10.000Z'
  },
  {
    studentId: '54326',
    nationalId: '1100501234526',
    fullName: 'น.ส.ทิพานัน เพชรสุวรรณ',
    room: '4/4',
    numberInRoom: 6,
    registeredCourseCode: 'ศ30201',
    registeredAt: '2027-05-10T09:20:00.000Z'
  },
  {
    studentId: '54327',
    nationalId: '1100501234527',
    fullName: 'นายธีรภัทร ชาญวิทย์',
    room: '4/4',
    numberInRoom: 7,
    registeredCourseCode: 'ง30208',
    registeredAt: '2027-05-10T09:21:30.000Z'
  },
  {
    studentId: '54328',
    nationalId: '1100501234528',
    fullName: 'น.ส.นภัสสร อัครเดช',
    room: '4/4',
    numberInRoom: 8,
    registeredCourseCode: 'ว30219',
    registeredAt: '2027-05-10T09:22:45.000Z'
  },

  // M.1/5 Sample Students
  {
    studentId: '51101',
    nationalId: '1100501234101',
    fullName: 'เด็กชายกวินภพ บุญมี',
    room: '1/5',
    numberInRoom: 1,
    registeredCourseCode: 'ว21201',
    registeredAt: '2027-05-11T08:30:00.000Z'
  },
  {
    studentId: '51102',
    nationalId: '1100501234102',
    fullName: 'เด็กหญิงขวัญข้าว พงษ์ศิริ',
    room: '1/5',
    numberInRoom: 2,
    registeredCourseCode: 'ศ21201',
    registeredAt: '2027-05-11T08:31:00.000Z'
  },
  {
    studentId: '51103',
    nationalId: '1100501234103',
    fullName: 'เด็กชายคณิน โรจนศักดิ์',
    room: '1/5',
    numberInRoom: 3,
    registeredCourseCode: null,
    registeredAt: null
  },

  // M.5/3 Sample Students
  {
    studentId: '55301',
    nationalId: '1100501235301',
    fullName: 'นายจิรายุส ปรีชาศิลป์',
    room: '5/3',
    numberInRoom: 1,
    registeredCourseCode: 'ว30248',
    registeredAt: '2027-05-11T08:40:00.000Z'
  },
  {
    studentId: '55302',
    nationalId: '1100501235302',
    fullName: 'น.ส.ชลธิชา เลิศนภา',
    room: '5/3',
    numberInRoom: 2,
    registeredCourseCode: 'ญ30205',
    registeredAt: '2027-05-11T08:41:00.000Z'
  },

  // M.6/3 Sample Students
  {
    studentId: '56301',
    nationalId: '1100501236301',
    fullName: 'นายฐิติกร เจริญลาภ',
    room: '6/3',
    numberInRoom: 1,
    registeredCourseCode: 'ว30282',
    registeredAt: '2027-05-11T08:50:00.000Z'
  }
];

// Sample attendance records for ว30219 (12 sessions)

// Demo accounts are ordinary records and can be removed from the management screens.
initialTeachers.unshift({ username: 'User1', password: 'Pass1', fullName: 'ครูทดลอง User1' });
initialAdmins.unshift({ username: 'User3', password: 'Pass3' });
initialStudents.unshift({ studentId: 'User2', nationalId: 'Pass2', fullName: 'นักเรียนทดลอง User2', room: '4/3', numberInRoom: 99, registeredCourseCode: null });

export const initialAttendance: AttendanceRecord[] = [
  // 54301 (นายพีรพล วงศ์สวัสดิ์เจริญ)
  { courseCode: 'ว30219', studentId: '54301', sessionIndex: 0, status: 'present' },
  { courseCode: 'ว30219', studentId: '54301', sessionIndex: 1, status: 'present' },
  { courseCode: 'ว30219', studentId: '54301', sessionIndex: 2, status: 'present' },
  { courseCode: 'ว30219', studentId: '54301', sessionIndex: 3, status: 'present' },
  { courseCode: 'ว30219', studentId: '54301', sessionIndex: 4, status: 'present' },
  { courseCode: 'ว30219', studentId: '54301', sessionIndex: 5, status: 'present' },
  { courseCode: 'ว30219', studentId: '54301', sessionIndex: 6, status: 'present' },
  { courseCode: 'ว30219', studentId: '54301', sessionIndex: 7, status: 'present' },
  { courseCode: 'ว30219', studentId: '54301', sessionIndex: 8, status: 'present' },
  { courseCode: 'ว30219', studentId: '54301', sessionIndex: 9, status: 'present' },
  { courseCode: 'ว30219', studentId: '54301', sessionIndex: 10, status: 'present' },
  { courseCode: 'ว30219', studentId: '54301', sessionIndex: 11, status: 'present' },

  // 54302 (น.ส.กัญญาภัทร)
  { courseCode: 'ว30219', studentId: '54302', sessionIndex: 0, status: 'present' },
  { courseCode: 'ว30219', studentId: '54302', sessionIndex: 1, status: 'present' },
  { courseCode: 'ว30219', studentId: '54302', sessionIndex: 2, status: 'present' },
  { courseCode: 'ว30219', studentId: '54302', sessionIndex: 3, status: 'present' },
  { courseCode: 'ว30219', studentId: '54302', sessionIndex: 4, status: 'present' },
  { courseCode: 'ว30219', studentId: '54302', sessionIndex: 5, status: 'present' },
  { courseCode: 'ว30219', studentId: '54302', sessionIndex: 6, status: 'leave' },
  { courseCode: 'ว30219', studentId: '54302', sessionIndex: 7, status: 'present' },
  { courseCode: 'ว30219', studentId: '54302', sessionIndex: 8, status: 'present' },
  { courseCode: 'ว30219', studentId: '54302', sessionIndex: 9, status: 'present' },
  { courseCode: 'ว30219', studentId: '54302', sessionIndex: 10, status: 'present' },
  { courseCode: 'ว30219', studentId: '54302', sessionIndex: 11, status: 'present' },

  // 54321 (นายกิตติศักดิ์)
  { courseCode: 'ว30219', studentId: '54321', sessionIndex: 0, status: 'present' },
  { courseCode: 'ว30219', studentId: '54321', sessionIndex: 1, status: 'absent' },
  { courseCode: 'ว30219', studentId: '54321', sessionIndex: 2, status: 'present' },
  { courseCode: 'ว30219', studentId: '54321', sessionIndex: 3, status: 'present' },
  { courseCode: 'ว30219', studentId: '54321', sessionIndex: 4, status: 'present' },
  { courseCode: 'ว30219', studentId: '54321', sessionIndex: 5, status: 'present' },
  { courseCode: 'ว30219', studentId: '54321', sessionIndex: 6, status: 'present' },
  { courseCode: 'ว30219', studentId: '54321', sessionIndex: 7, status: 'present' },
  { courseCode: 'ว30219', studentId: '54321', sessionIndex: 8, status: 'absent' },
  { courseCode: 'ว30219', studentId: '54321', sessionIndex: 9, status: 'absent' },
  { courseCode: 'ว30219', studentId: '54321', sessionIndex: 10, status: 'present' },
  { courseCode: 'ว30219', studentId: '54321', sessionIndex: 11, status: 'present' },

  // 54303
  { courseCode: 'ว30219', studentId: '54303', sessionIndex: 0, status: 'present' },
  { courseCode: 'ว30219', studentId: '54303', sessionIndex: 1, status: 'present' },
  { courseCode: 'ว30219', studentId: '54303', sessionIndex: 2, status: 'present' },
  { courseCode: 'ว30219', studentId: '54303', sessionIndex: 3, status: 'present' },
  { courseCode: 'ว30219', studentId: '54303', sessionIndex: 4, status: 'sick' },
  { courseCode: 'ว30219', studentId: '54303', sessionIndex: 5, status: 'present' },
  { courseCode: 'ว30219', studentId: '54303', sessionIndex: 6, status: 'present' },
  { courseCode: 'ว30219', studentId: '54303', sessionIndex: 7, status: 'present' },
  { courseCode: 'ว30219', studentId: '54303', sessionIndex: 8, status: 'present' },
  { courseCode: 'ว30219', studentId: '54303', sessionIndex: 9, status: 'present' },
  { courseCode: 'ว30219', studentId: '54303', sessionIndex: 10, status: 'present' },
  { courseCode: 'ว30219', studentId: '54303', sessionIndex: 11, status: 'present' }
];

export const initialAnnouncements: Announcement[] = [
  {
    id: 'ann-1',
    title: 'กำหนดการเปิดระบบเลือกลงทะเบียนรายวิชาเพิ่มเติม ประจำภาคเรียนที่ 1/2570',
    content: 'ขอให้นักเรียนระดับชั้นมัธยมศึกษาปีที่ 1 ถึง 6 ตรวจสอบรายวิชาที่เปิดรับและเข้าสู่ระบบเพื่อเลือกลงทะเบียนตามกำหนดการของแต่ละระดับชั้น ระบบจะเปิดรับตามจำนวนที่นั่งที่กำหนดไว้ และสามารถตรวจสอบเวลาเรียนได้ในพอร์ทัลนักเรียน',
    date: '10 พ.ค. 2570',
    target: 'all',
    important: true
  },
  {
    id: 'ann-2',
    title: 'คู่มือสำหรับครูผู้สอนในการเช็คชื่อและส่งออกเอกสารรายงาน',
    content: 'คุณครูประจำรายวิชาเพิ่มเติมสามารถเข้าสู่ระบบเพื่อเช็คชื่อนักเรียนในแต่ละคาบเรียน และส่งออกใบเช็คชื่อ/รายงานสรุปการมาเรียนเป็นไฟล์ PDF ทางการฟอนต์สารบัญ หรือไฟล์ Excel เพื่อใช้ในการประเมินผลสัมฤทธิ์',
    date: '12 พ.ค. 2570',
    target: 'teachers'
  },
  {
    id: 'ann-3',
    title: 'แจ้งเตือนเกณฑ์เวลาเรียนขั้นต่ำ 80% สำหรับนักเรียนทุกระดับชั้น',
    content: 'นักเรียนจะต้องมีเวลาเรียนในรายวิชาเพิ่มเติมไม่น้อยกว่าร้อยละ 80 ของเวลาเรียนทั้งหมด จึงจะมีสิทธิ์ได้รับการวัดและประเมินผลปลายภาคเรียน',
    date: '14 พ.ค. 2570',
    target: 'students'
  }
];
