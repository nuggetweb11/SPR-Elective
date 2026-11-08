import React, { useState } from 'react';

interface CSVUploadFieldProps {
  id: string;
  label?: string;
}

/** CSV imports are performed from a selected .csv file, never by pasting CSV text. */
export const CSVUploadField: React.FC<CSVUploadFieldProps> = ({ id, label = 'เลือกไฟล์ CSV จากอุปกรณ์' }) => {
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');

  const handleFile = (file?: File) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv' && file.type !== 'application/vnd.ms-excel') {
      setError('กรุณาเลือกไฟล์นามสกุล .csv เท่านั้น');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const target = document.getElementById(id) as HTMLTextAreaElement | null;
      if (target) target.value = String(reader.result || '').replace(/^\uFEFF/, '');
      setFileName(file.name);
      setError('');
    };
    reader.onerror = () => setError('ไม่สามารถอ่านไฟล์ได้ กรุณาลองอีกครั้ง');
    reader.readAsText(file, 'UTF-8');
  };

  return (
    <div className="space-y-2">
      <label className="flex min-h-28 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/60 px-4 py-5 text-center transition-colors hover:border-blue-400 hover:bg-blue-50">
        <span className="material-symbols-outlined text-3xl text-blue-700">upload_file</span>
        <span className="text-sm font-bold text-slate-800">{label}</span>
        <span className="text-xs text-slate-500">รองรับไฟล์ .csv · UTF-8</span>
        <input type="file" accept=".csv,text/csv,application/vnd.ms-excel" className="sr-only" onChange={(event) => handleFile(event.target.files?.[0])} />
      </label>
      {fileName && <p className="text-xs font-semibold text-emerald-700">เลือกไฟล์แล้ว: {fileName}</p>}
      {error && <p role="alert" className="text-xs font-semibold text-rose-600">{error}</p>}
      <textarea id={id} className="hidden" aria-hidden="true" tabIndex={-1} defaultValue="" />
    </div>
  );
};
