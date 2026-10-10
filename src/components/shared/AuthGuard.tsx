'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getStoredUser } from '@/lib/auth';

export function AuthGuard({ children, requiredRole }: { children: React.ReactNode; requiredRole?: 'patient' | 'doctor' | 'admin' }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const user = getStoredUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      if (requiredRole && user.role !== requiredRole) {
        // Role mismatch - send them back to login to pick the right persona
        router.push('/login');
        return;
      }

      setIsAuthorized(true);
    };

    checkAuth();
  }, [pathname, requiredRole, router]);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#F5F7F5] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 rounded-full border-4 border-[#5A7C65] border-t-transparent animate-spin" />
        <p className="text-sm font-bold text-[#617467] animate-pulse">Authenticating Session...</p>
      </div>
    );
  }

  return <>{children}</>;
}
