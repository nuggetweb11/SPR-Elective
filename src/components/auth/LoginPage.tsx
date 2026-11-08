import React, { useState } from 'react';
import { SchoolLogo } from '../common/Logo';
import { useApp } from '../../context/AppContext';

interface LoginPageProps {
  onBackToHome: () => void;
  onLoginSuccess?: () => void;
}


export const LoginPage: React.FC<LoginPageProps> = ({ onBackToHome, onLoginSuccess }) => {
  const { login } = useApp();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMessage('กรุณากรอกชื่อผู้ใช้งานและรหัสผ่านให้ครบถ้วน');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    setTimeout(() => {
      const result = login(username, password);
      setIsLoading(false);
      if (result.success) {
        if (onLoginSuccess) onLoginSuccess();
      } else {
        setErrorMessage(result.message || 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง');
      }
    }, 350);
  };

  return (
    <div className="min-h-screen w-full bg-[#f4f7fc] text-slate-800 flex flex-col justify-between relative selection:bg-blue-600 selection:text-white overflow-x-hidden">
      
      {/* Soft pastel mesh gradient background */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden bg-gradient-to-br from-[#dbe9fe] via-[#edf4ff] via-45% to-[#fef9c3]/60">
        <div className="absolute -top-32 -left-20 w-[44rem] h-[44rem] rounded-full bg-gradient-to-br from-[#bfdbfe]/60 via-[#dbeafe]/50 to-transparent blur-[110px]"></div>
        <div className="absolute top-1/4 -right-20 w-[40rem] h-[40rem] rounded-full bg-gradient-to-bl from-[#fef08a]/40 via-[#fef9c3]/50 to-transparent blur-[120px]"></div>
        <div className="absolute -bottom-28 left-1/4 w-[42rem] h-[38rem] rounded-full bg-[#fffbeb]/70 blur-[130px]"></div>
      </div>

      {/* Top Header Bar */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-3 sm:py-5 flex items-center justify-between gap-4 z-20">
        <div className="flex items-center gap-3 cursor-pointer" onClick={onBackToHome}>
          <SchoolLogo size="md" showText={true} />
        </div>

        <button
          onClick={onBackToHome}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 sm:px-4 sm:py-2 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-blue-700 border border-white/80 shadow-2xs backdrop-blur-md transition-all text-xs sm:text-sm font-semibold cursor-pointer active:scale-95"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          <span>กลับหน้าหลัก</span>
        </button>
      </header>

      {/* Main Login Area */}
      <main className="w-full flex-1 flex items-center justify-center px-3 sm:px-6 py-4 sm:py-8 z-10">
        <div className="w-full max-w-[460px]">
          
          <div className="bg-white/95 backdrop-blur-xl rounded-[28px] sm:rounded-[32px] border border-white/90 shadow-[0_20px_50px_-12px_rgba(29,78,216,0.14),0_8px_20px_-6px_rgba(0,0,0,0.04)] overflow-hidden p-5 sm:p-8 text-slate-800 transition-all">
            
            {/* Header with School Crest */}
            <div className="flex flex-col items-center text-center">
              <div className="mb-3">
                <img
                  src="/assets/aistudio/Spr_-_1_7d810253.png"
                  alt="ตราโรงเรียนสายปัญญารังสิต"
                  className="w-20 h-20 sm:w-24 sm:h-24 object-contain filter drop-shadow-sm"
                />
              </div>

              <h1 className="text-xl sm:text-2xl font-extrabold text-[#00236f] tracking-tight leading-snug">
                ระบบลงทะเบียนรายวิชาเพิ่มเติม<br />
                <span className="text-blue-700">โรงเรียนสายปัญญารังสิต (SPR)</span>
              </h1>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                กรุณาระบุข้อมูลเพื่อเข้าสู่ระบบ
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              
              {/* Shared username field for every role */}
              <div className="space-y-1.5 text-left">
                <label className="block text-xs sm:text-sm font-bold text-slate-700">ชื่อผู้ใช้งาน (Username)</label>
                <div className="relative flex items-center group">
                  <span className="material-symbols-outlined absolute left-3.5 text-slate-400 group-focus-within:text-blue-600 transition-colors text-lg pointer-events-none">
                    person
                  </span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setErrorMessage('');
                    }}
                    placeholder="กรอกชื่อผู้ใช้งานหรือรหัสนักเรียน"
                    required
                    className="w-full h-12 pl-11 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-600/10 transition-all shadow-2xs"
                  />
                </div>
              </div>

              {/* Shared password field for every role */}
              <div className="space-y-1.5 text-left">
                <label className="block text-xs sm:text-sm font-bold text-slate-700">รหัสผ่าน (Password)</label>
                <div className="relative flex items-center group">
                  <span className="material-symbols-outlined absolute left-3.5 text-slate-400 group-focus-within:text-blue-600 transition-colors text-lg pointer-events-none">
                    lock
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrorMessage('');
                    }}
                    placeholder="กรอกรหัสผ่านของคุณ"
                    required
                    className="w-full h-12 pl-11 pr-11 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-600/10 transition-all shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
                    title={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-3.5 text-left">
                <div className="flex items-center gap-2 mb-2"><span className="material-symbols-outlined text-blue-700 text-lg">science</span><span className="text-xs font-bold text-slate-800">บัญชีสำหรับทดลองใช้งาน</span><span className="ml-auto rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">DEMO</span></div>
                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <button type="button" onClick={() => {setUsername('User1');setPassword('Pass1');setErrorMessage('');}} className="rounded-xl bg-white border border-blue-100 p-2 hover:border-blue-400 hover:shadow-sm transition-all text-left"><b className="block text-slate-800">ครู</b><span className="text-slate-500">User1 / Pass1</span></button>
                  <button type="button" onClick={() => {setUsername('User2');setPassword('Pass2');setErrorMessage('');}} className="rounded-xl bg-white border border-blue-100 p-2 hover:border-blue-400 hover:shadow-sm transition-all text-left"><b className="block text-slate-800">นักเรียน</b><span className="text-slate-500">User2 / Pass2</span></button>
                  <button type="button" onClick={() => {setUsername('User3');setPassword('Pass3');setErrorMessage('');}} className="rounded-xl bg-white border border-blue-100 p-2 hover:border-blue-400 hover:shadow-sm transition-all text-left"><b className="block text-slate-800">ผู้ดูแล</b><span className="text-slate-500">User3 / Pass3</span></button>
                </div>
                <p className="text-[10px] text-slate-500 mt-2">กดบัญชีเพื่อกรอกข้อมูลอัตโนมัติ บัญชีทดลองจัดการหรือลบได้เหมือนข้อมูลทั่วไป</p>
              </div>

              {/* Error feedback */}
              {errorMessage && (
                <div className="text-xs py-2.5 px-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-center font-medium animate-in fade-in">
                  {errorMessage}
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 rounded-xl bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white font-bold text-sm sm:text-base shadow-lg shadow-blue-700/30 hover:shadow-blue-700/40 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>กำลังเข้าสู่ระบบ...</span>
                    </span>
                  ) : (
                    <>
                      <span>เข้าสู่ระบบ</span>
                      <span className="material-symbols-outlined text-lg">arrow_forward</span>
                    </>
                  )}
                </button>
              </div>

            </form>

            {/* Back link */}
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={onBackToHome}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-blue-700 font-medium transition-colors cursor-pointer py-1"
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                <span>กลับหน้าหลัก</span>
              </button>
            </div>

          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-3 px-4 text-center z-10 text-xs text-slate-500">
        <p>© โรงเรียนสายปัญญารังสิต (Saipanyarangsit School - SPR) • กลุ่มบริหารวิชาการ</p>
      </footer>

    </div>
  );
};
