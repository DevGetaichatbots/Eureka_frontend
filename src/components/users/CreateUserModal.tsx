'use client';

import React, { useState } from 'react';
import { User, UserRole } from '@/types';
import { api } from '@/lib/api';
import {
  X,
  UserPlus,
  Mail,
  Lock,
  Shield,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: (user: User) => void;
}

export function CreateUserModal({
  isOpen,
  onClose,
  onUserCreated,
}: CreateUserModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [role, setRole] = useState<UserRole>('viewer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const newUser = await api.createUser({ email, password, role });
      onUserCreated(newUser);
      setEmail('');
      setPassword('password123');
      setRole('viewer');
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 border-b border-[#E5E7EB] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FDEBEC] text-[#D92228] flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-[#1A1A1A]">
              Add New User
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#D92228] hover:bg-[#F9FAFB] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-[#FDEBEC] border border-[#F5C2C4] text-[#B71C21] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-[#D92228]" />
              <span>{error}</span>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B7280] mb-1.5">
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
                placeholder="agent@eurekajo.com"
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs text-[#1A1A1A] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#D92228]"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B7280] mb-1.5">
              Temporary Password
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
                className="w-full pl-10 pr-10 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs text-[#1A1A1A] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#D92228]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#6B7280] hover:text-[#D92228]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-[#6B7280] mt-1">
              Minimum 6 characters. Default is password123.
            </p>
          </div>

          {/* Role */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B7280] mb-1.5">
              Account Role
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9CA3AF]">
                <Shield className="w-4 h-4" />
              </div>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#D92228]"
              >
                <option value="viewer">Viewer (Read-Only Access)</option>
                <option value="admin">Administrator (Full Access & User Management)</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#F9FAFB] text-[#6B7280] hover:bg-[#E5E7EB] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#D92228] hover:bg-[#B71C21] text-white flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Create Account</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
