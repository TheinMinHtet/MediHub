import React from 'react';
import { AttendanceStatus } from '@/lib/types';

interface StatusBadgeProps {
  status: AttendanceStatus | string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const getStyles = () => {
    switch (status) {
      case 'Checked-In':
        return 'bg-[#EBF2ED] text-[#2F4838] border-[#CFDDD2]';
      case 'Completed':
        return 'bg-[#EAF5EC] text-[#1E562F] border-[#BFE3C7]';
      case 'Pending':
      case 'Scheduled':
        return 'bg-[#FDF6E2] text-[#8C6D1F] border-[#F5E6B5]';
      case 'Absent':
      case 'Absent/No-Show':
      case 'Cancelled':
        return 'bg-[#FDF0EE] text-[#9E3E34] border-[#F8D1CC]';
      case 'Active':
        return 'bg-[#EAF5EC] text-[#1E562F] border-[#BFE3C7]';
      case 'On Leave':
      case 'Inactive':
        return 'bg-[#F3F4F6] text-[#4B5563] border-[#E5E7EB]';
      default:
        return 'bg-[#EBF2ED] text-[#2F4838] border-[#CFDDD2]';
    }
  };

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${getStyles()}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75" />
      {status}
    </span>
  );
}
