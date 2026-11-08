import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textColor?: string;
}

export const SchoolLogo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showText = false,
  textColor = 'text-slate-900'
}) => {
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20'
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Official transparent school crest (โรงเรียนสายปัญญารังสิต) */}
      <div className={`${sizeMap[size]} shrink-0 flex items-center justify-center relative select-none`}>
        <img
          src="/assets/aistudio/Spr_-_1_7d810253.png"
          alt="ตราโรงเรียนสายปัญญารังสิต"
          className="w-full h-full object-contain filter drop-shadow-xs"
        />
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className={`font-bold text-sm sm:text-base leading-tight tracking-tight ${textColor}`}>
            โรงเรียนสายปัญญารังสิต
          </span>
          <span className="text-[11px] text-blue-600 font-semibold tracking-wide">
            Saipanyarangsit School (SPR)
          </span>
        </div>
      )}
    </div>
  );
};
