import React from 'react';

interface PageHeaderProps {
  title: string;
  desc: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, desc, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1C2A21] tracking-tight">{title}</h1>
        <p className="text-sm text-[#617467] mt-1">{desc}</p>
      </div>
      {action && <div className="flex items-center gap-3 shrink-0">{action}</div>}
    </div>
  );
}
