import React from 'react';

interface InfoCardProps {
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  iconBg: string;
  label?: string;
  children: React.ReactNode;
}

export function InfoCard({ icon: Icon, iconColor, iconBg, label, children }: InfoCardProps) {
  return (
    <div className="flex items-center gap-2.5 p-2.5 rounded-md bg-white/60 border border-slate-100">
      <div className={`p-1.5 rounded-md ${iconBg}`}>
        <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
      </div>
      <div className="min-w-0 text-sm">
        {label && (
          <div className="text-[9px] font-medium text-slate-500 uppercase tracking-wide mb-0.5">
            {label}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
