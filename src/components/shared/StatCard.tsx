import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  sub?: string;
  icon?: LucideIcon;
  badge?: string;
  badgeColor?: 'green' | 'amber' | 'blue' | 'rose';
}

export function StatCard({ title, value, sub, icon: Icon, badge, badgeColor = 'green' }: StatCardProps) {
  const getBadgeStyle = () => {
    switch (badgeColor) {
      case 'green':
        return 'bg-[#EAF5EC] text-[#1E562F] border-[#BFE3C7]';
      case 'amber':
        return 'bg-[#FDF6E2] text-[#8C6D1F] border-[#F5E6B5]';
      case 'blue':
        return 'bg-[#EBF2ED] text-[#2F4838] border-[#CFDDD2]';
      case 'rose':
        return 'bg-[#FDF0EE] text-[#9E3E34] border-[#F8D1CC]';
      default:
        return 'bg-[#EBF2ED] text-[#2F4838] border-[#CFDDD2]';
    }
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-[#E0E7E1] shadow-sm hover:border-[#CFDDD2] transition-colors">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#617467]">{title}</p>
        {Icon && (
          <div className="w-9 h-9 rounded-lg bg-[#EBF2ED] text-[#2F4838] flex items-center justify-center">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <h3 className="text-2xl font-bold text-[#1C2A21] mt-3">{value}</h3>
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#F5F7F5]">
        {sub && <p className="text-xs text-[#829688]">{sub}</p>}
        {badge && (
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${getBadgeStyle()}`}>
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}
