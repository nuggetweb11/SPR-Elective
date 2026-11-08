import React, { useState } from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  courseDetails?: {
    code: string;
    name: string;
    teacherName: string;
    dayOfWeek: string;
    period: string;
    classroom: string;
    seatsLeft: number;
    maxSeats: number;
  };
  requirePassword?: boolean;
  passwordPlaceholder?: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'danger';
  onConfirm: (password?: string) => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  courseDetails,
  requirePassword = false,
  passwordPlaceholder = 'กรอกรหัสผ่านผู้ดูแลระบบเพื่อยืนยัน',
  confirmText = 'ยืนยัน',
  cancelText = 'ยกเลิก',
  confirmVariant = 'primary',
  onConfirm,
  onCancel
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (requirePassword && !password.trim()) {
      setError('กรุณากรอกรหัสผ่านเพื่อยืนยันการดำเนินการ');
      return;
    }
    setError('');
    onConfirm(password.trim());
    setPassword('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                confirmVariant === 'danger'
                  ? 'bg-rose-100 text-rose-600'
                  : 'bg-blue-100 text-blue-700'
              }`}
            >
              <span className="material-symbols-outlined text-2xl">
                {confirmVariant === 'danger' ? 'warning' : 'how_to_reg'}
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 leading-tight">
              {title}
            </h3>
          </div>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">
            {message}
          </p>

          {/* Optional Course Details Card */}
          {courseDetails && (
            <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-4 text-xs space-y-2 text-slate-700">
              <div className="flex items-center justify-between font-bold text-blue-900 pb-1 border-b border-blue-200/60">
                <span className="text-sm">{courseDetails.code} {courseDetails.name}</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-200 text-blue-800 text-[11px]">
                  เหลือ {courseDetails.seatsLeft} ที่นั่ง
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 pt-1 text-slate-600">
                <div>
                  <span className="text-slate-600">ผู้สอน: </span>
                  <strong className="text-slate-800 font-semibold">{courseDetails.teacherName}</strong>
                </div>
                <div>
                  <span className="text-slate-600">ห้องเรียน: </span>
                  <span className="text-slate-800 font-medium">{courseDetails.classroom}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-600">เวลาเรียน: </span>
                  <span className="text-slate-800 font-medium">{courseDetails.dayOfWeek} {courseDetails.period}</span>
                </div>
              </div>
            </div>
          )}

          {/* Optional Password Input */}
          {requirePassword && (
            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-bold text-slate-700">
                รหัสผ่านยืนยันความปลอดภัย:
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder={passwordPlaceholder}
                className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-sm focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                autoFocus
              />
              {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 text-xs sm:text-sm font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={`px-5 py-2.5 rounded-xl text-white text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer ${
              confirmVariant === 'danger'
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30'
                : 'bg-blue-700 hover:bg-blue-800 shadow-blue-700/30'
            }`}
          >
            {confirmText}
          </button>
        </div>

      </div>
    </div>
  );
};
