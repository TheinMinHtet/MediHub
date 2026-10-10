'use client';

import { useState, useEffect } from 'react';
import { supabase } from './supabase';

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: 'patient' | 'doctor' | 'admin';
  roleDesc?: string;
  doctorId?: string;
  department?: string;
}

const STORAGE_KEY = 'medihub_current_user';

export function getStoredUser(): CurrentUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredUser(user: CurrentUser): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    window.dispatchEvent(new Event('medihub_auth_changed'));
  } catch (err) {
    console.warn('Failed to save user in sessionStorage:', err);
  }
}

export function clearStoredUser(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event('medihub_auth_changed'));
  } catch (err) {
    console.warn('Failed to clear user from sessionStorage:', err);
  }
}

function getDefaultUser(defaultRole: 'patient' | 'doctor' | 'admin'): CurrentUser {
  if (defaultRole === 'doctor') {
    return {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Dr. Su Su Hlaing, MD',
      email: 'susu.hlaing@medihub.com',
      role: 'doctor',
      roleDesc: 'Cardiovascular Care',
      doctorId: '11111111-1111-1111-1111-111111111111',
    };
  }
  if (defaultRole === 'admin') {
    return {
      id: 'admin-1',
      name: 'Admin Officer',
      email: 'admin@medihub.com',
      role: 'admin',
      roleDesc: 'Reception & Operations',
    };
  }
  return {
    id: 'patient-new',
    name: 'Guest Patient',
    email: 'patient@medihub.com',
    role: 'patient',
    roleDesc: 'Patient Account',
  };
}

export function useCurrentUser(defaultRole: 'patient' | 'doctor' | 'admin' = 'patient') {
  const [user, setUser] = useState<CurrentUser>(() => getDefaultUser(defaultRole));
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const syncUser = () => {
      const stored = getStoredUser();
      if (stored) {
        setUser(stored);
      }
    };

    syncUser();
    window.addEventListener('storage', syncUser);
    window.addEventListener('medihub_auth_changed', syncUser);

    return () => {
      window.removeEventListener('storage', syncUser);
      window.removeEventListener('medihub_auth_changed', syncUser);
    };
  }, []);

  const logout = async () => {
    clearStoredUser();
    try {
      await supabase.auth.signOut();
    } catch {}
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  return { user, isMounted, setUser: setStoredUser, logout };
}
