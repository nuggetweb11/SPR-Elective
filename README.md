# School Elective Demo (Frontend only)

ระบบตัวอย่าง React + Vite สำหรับทดลองหน้าจอและ workflow โดยจัดเก็บข้อมูลใน localStorage ของเบราว์เซอร์ ไม่เชื่อมต่อฐานข้อมูลออนไลน์หรือ API

## Run locally
- Node.js 20.19+ recommended
- `npm install`
- `npm run dev`

## Build
- `npm run build`
- Vite output: `dist`

## Demo accounts
- Teacher: User1 / Pass1
- Student: User2 / Pass2
- Admin: User3 / Pass3

บัญชีทดลองเป็นข้อมูลในระบบปกติ สามารถแก้ไขหรือลบจากหน้าจัดการได้เช่นเดียวกับข้อมูลอื่น ข้อมูลที่ลบจะไม่ถูกเพิ่มกลับอัตโนมัติในเบราว์เซอร์เดิม

## Notes
- ข้อมูลถูกเก็บเฉพาะใน browser localStorage ของอุปกรณ์นั้น
- ผู้ใช้คนละเครื่องจะไม่เห็นข้อมูลที่อีกเครื่องเพิ่ม
- ใช้ข้อมูลสมมติเท่านั้น ห้ามใส่ข้อมูลนักเรียนจริง
