'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  Activity, 
  ShieldCheck, 
  Stethoscope, 
  AlertCircle, 
  Sparkles,
  KeyRound,
  UserCheck
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { setStoredUser } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<'patient' | 'doctor' | 'admin'>('patient');

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const demoAccounts = [
    {
      role: 'admin' as const,
      label: 'Admin Desk',
      email: 'admin@medihub.com',
      desc: 'Lead Medical Director',
    },
    {
      role: 'doctor' as const,
      label: 'Cardiologist',
      email: 'susu.hlaing@medihub.com',
      desc: 'Dr. Su Su Hlaing, MD',
    },
    {
      role: 'patient' as const,
      label: 'Patient',
      email: 'arthur.pendelton@gmail.com',
      desc: 'Arthur Pendelton',
    },
  ];

  const handleSelectDemo = (acc: (typeof demoAccounts)[number]) => {
    setEmail(acc.email);
    setPassword('Password123!');
    setRole(acc.role);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const payload = {
        action: isLogin ? 'login' : 'signup',
        email: email.trim(),
        password,
        name: name.trim(),
        role,
      };

      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data?.error || 'Invalid login credentials. Please verify your email and password.');
        setIsLoading(false);
        return;
      }

      // Sync Supabase client session if returned
      if (data.session) {
        try {
          await supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          });
        } catch (sessionErr) {
          // session sync fallback
        }
      }

      const targetRole = data.user.role;

      if (isLogin && targetRole !== role) {
        await supabase.auth.signOut();
        setErrorMessage(`Access denied. Please select the correct workspace role for your account.`);
        setIsLoading(false);
        return;
      }

      // Store current authenticated user
      setStoredUser(data.user);

      if (targetRole === 'doctor') {
        router.push('/doctor');
      } else if (targetRole === 'admin') {
        router.push('/admin');
      } else {
        router.push('/patient');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Authentication failed. Please verify your connection and credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    'w-full pl-10 pr-4 py-3 bg-[#F5F7F5] border border-[#E0E7E1] rounded-xl text-sm text-[#1C2A21] focus:bg-white focus:ring-2 focus:ring-[#5A7C65]/20 focus:border-[#5A7C65] outline-none transition-all';

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Side - Branding & Aesthetics */}
      <div className="hidden lg:flex flex-1 relative bg-[#1C2A21] overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/modern_hospital_background.jpg')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-[#1C2A21]/90 via-[#2E4A3F]/80 to-[#1C2A21]/90" />

        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#5A7C65] blur-[120px] opacity-40"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#2F4838] blur-[100px] opacity-60"></div>

        <div className="relative z-10 p-12 flex flex-col justify-between h-full w-full max-w-xl mx-auto">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group w-fit">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <Activity className="w-5 h-5 text-[#96B8A5]" />
            </div>
            <div className="font-serif text-3xl font-bold tracking-tight text-white">
              Medi<span className="text-[#96B8A5]">Hub</span>
            </div>
          </Link>

          {/* Value Proposition */}
          <div className="space-y-6">
            <h1 className="font-serif text-4xl sm:text-5xl font-medium text-white leading-[1.1]">
              Intelligent care starts here.
            </h1>
          </div>

          <div className="text-white/40 text-xs">
            © 2026 MediHub Systems. HIPAA &amp; Enterprise RBAC Compliant.
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative overflow-y-auto">
        <div className="w-full max-w-[420px] space-y-6">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 justify-center mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#1C2A21] text-white flex items-center justify-center shadow-lg">
              <Activity className="w-5 h-5 text-[#96B8A5]" />
            </div>
            <div className="font-serif text-3xl font-bold tracking-tight text-[#1C2A21]">
              Medi<span className="text-[#5A7C65]">Hub</span>
            </div>
          </div>

          {/* Header */}
          <div className="text-center sm:text-left space-y-1">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1C2A21] tracking-tight">
              {isLogin ? 'Welcome back' : 'Create an account'}
            </h2>
            <p className="text-xs sm:text-sm text-[#617467]">
              {isLogin
                ? 'Sign in to access your account.'
                : 'Join MediHub to manage your clinical consultations.'}
            </p>
          </div>

          {/* 1-Click Demo Credentials Pill Bar */}
          {/* <div className="p-3 bg-[#F5F7F5] border border-[#E0E7E1] rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#2F4838]">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>1-Click Seeded Demo Login:</span>
              </span>
              <span className="text-[10px] text-[#829688]">Password: Password123!</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleSelectDemo(acc)}
                  className={`p-2 rounded-xl text-left border transition-all text-[11px] ${
                    email === acc.email
                      ? 'bg-[#5A7C65] text-white border-[#5A7C65] shadow-xs'
                      : 'bg-white hover:bg-[#EBF2ED] text-[#1C2A21] border-[#E0E7E1]'
                  }`}
                >
                  <span className="block font-bold">{acc.label}</span>
                  <span className={`block text-[10px] truncate ${email === acc.email ? 'text-white/80' : 'text-[#829688]'}`}>
                    {acc.desc}
                  </span>
                </button>
              ))}
            </div>
          </div> */}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="relative group">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#829688] group-focus-within:text-[#5A7C65] transition-colors" />
                <input
                  type="text"
                  required
                  placeholder="Full Legal Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                />
              </div>
            )}

            <div className="relative group">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#829688] group-focus-within:text-[#5A7C65] transition-colors" />
              <input
                type="email"
                required
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="space-y-1">
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#829688] group-focus-within:text-[#5A7C65] transition-colors" />
                <input
                  type="password"
                  required
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-[11px] font-bold text-[#829688] uppercase tracking-wider mb-1.5">
                Target Workspace Role:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['patient', 'doctor', 'admin'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                      role === r
                        ? 'border-[#5A7C65] bg-[#EBF2ED] text-[#2F4838] ring-1 ring-[#5A7C65]/30'
                        : 'border-[#E0E7E1] bg-white text-[#617467] hover:bg-[#F5F7F5]'
                    }`}
                  >
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-[#1C2A21] hover:bg-[#2F4838] text-white text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <KeyRound className="w-4 h-4 text-emerald-300" />
                  <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Toggle Login/Signup */}
          <div className="text-center pt-1">
            <p className="text-xs text-[#617467]">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="font-bold text-[#5A7C65] hover:text-[#1C2A21] transition-colors"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
