'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { MessageSquareText, Lock, Mail, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const res = await login({ email, password });
      if (res.success) {
        window.location.href = '/conversations';
        return;
      }
      setError(res.message || 'Invalid email or password.');
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoFill = (type: 'admin' | 'viewer') => {
    if (type === 'admin') {
      setEmail('admin@eurekajo.com');
      setPassword('Admin@123456');
    } else {
      setEmail('viewer@eurekajo.com');
      setPassword('Admin@123456');
    }
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-white">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#D92228] text-white shadow-lg shadow-[#D92228]/25 mb-4">
          <MessageSquareText className="w-8 h-8" />
        </div>
        <div className="flex items-center justify-center gap-2">
          <span className="text-2xl font-black tracking-tight text-[#D92228]">
            EUREKA JO
          </span>
        </div>
        <h1 className="text-lg font-bold text-[#1A1A1A] mt-1">
          WhatsApp Bot & Conversation Viewer
        </h1>
        <p className="mt-1 text-xs text-[#6B7280]">
          Internal monitoring & customer transcript viewer
        </p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-[#E5E7EB] p-8">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-[#FDEBEC] border border-[#F5C2C4] flex items-start gap-3 text-[#B71C21] text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-[#D92228]" />
            <div className="flex-1 text-xs font-medium">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B7280] mb-2">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9CA3AF]">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@eurekajo.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-sm text-[#1A1A1A] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#D92228] focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B7280] mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9CA3AF]">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-sm text-[#1A1A1A] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#D92228] focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#9CA3AF] hover:text-[#1A1A1A] transition-colors cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-[#D92228] hover:bg-[#B71C21] text-white font-medium text-sm flex items-center justify-center gap-2 shadow-md shadow-[#D92228]/25 hover:shadow-lg transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {/* Demo Fast Fill Pill */}
        <div className="mt-8 pt-6 border-t border-[#E5E7EB]">
          <p className="text-xs text-center text-[#6B7280] mb-3">
            Quick testing credentials:
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleDemoFill('admin')}
              className="flex-1 py-2 px-3 text-xs font-semibold rounded-xl border border-[#E5E7EB] hover:bg-[#FDEBEC] hover:text-[#D92228] hover:border-[#F5C2C4] text-[#1A1A1A] transition-colors cursor-pointer"
            >
              Fill Admin
            </button>
            <button
              type="button"
              onClick={() => handleDemoFill('viewer')}
              className="flex-1 py-2 px-3 text-xs font-semibold rounded-xl border border-[#E5E7EB] hover:bg-[#FDEBEC] hover:text-[#D92228] hover:border-[#F5C2C4] text-[#1A1A1A] transition-colors cursor-pointer"
            >
              Fill Viewer
            </button>
          </div>
        </div>
      </div>

      <p className="mt-6 text-xs text-[#6B7280] text-center">
        Secured with session authentication · Read-only internal viewer · Eureka Jo
      </p>
    </div>
  );
}
