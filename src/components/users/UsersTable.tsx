'use client';

import React from 'react';
import { User } from '@/types';
import { formatKarachiDateTime } from '@/lib/utils';
import {
  Shield,
  User as UserIcon,
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  Trash2,
  Lock,
  Crown,
} from 'lucide-react';

interface UsersTableProps {
  users: User[];
  currentUserId: number;
  currentUserEmail?: string;
  onToggleStatus: (userId: number, currentStatus: 'active' | 'disabled') => void;
  onDeleteUser: (userId: number) => void;
}

export function UsersTable({
  users,
  currentUserId,
  currentUserEmail,
  onToggleStatus,
  onDeleteUser,
}: UsersTableProps) {
  const isCurrentSuperAdmin =
    currentUserId === 1 ||
    (currentUserEmail && currentUserEmail.toLowerCase() === 'admin@eurekajo.com');

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[620px] text-left border-collapse">
        <thead>
          <tr className="border-b border-[#E5E7EB] dark:border-[#26353d] bg-[#F9FAFB] dark:bg-[#162026] text-[11px] font-semibold text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wider">
            <th className="py-3.5 px-4 sm:px-6">User / Email</th>
            <th className="py-3.5 px-4">Role</th>
            <th className="py-3.5 px-4">Status</th>
            <th className="py-3.5 px-4 hidden md:table-cell">Created Date</th>
            <th className="py-3.5 px-4">Last Login</th>
            <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#26353d] text-xs">
          {users.map((user) => {
            const isTargetSuperAdmin =
              user.id === 1 || (user.email || '').toLowerCase() === 'admin@eurekajo.com';
            const isSelf =
              user.id === currentUserId ||
              (currentUserEmail && user.email.toLowerCase() === currentUserEmail.toLowerCase());
            const isTargetAdmin = user.role === 'admin';
            const isActive = user.status !== 'disabled';

            return (
              <tr
                key={user.id}
                className="hover:bg-[#F9FAFB] dark:hover:bg-[#162026]/60 transition-colors group"
              >
                {/* User Info */}
                <td className="py-4 px-4 sm:px-6">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                        isTargetSuperAdmin
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                          : isTargetAdmin
                          ? 'bg-[#FDEBEC] text-[#D92228] dark:bg-red-950/50 dark:text-red-400'
                          : 'bg-[#F3F4F6] text-[#6B7280] dark:bg-[#202c33] dark:text-[#9CA3AF]'
                      }`}
                    >
                      {isTargetSuperAdmin ? (
                        <Crown className="w-5 h-5 text-amber-600" />
                      ) : (
                        user.email[0]?.toUpperCase() || 'U'
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#1A1A1A] dark:text-[#F3F4F6]">
                          {user.email}
                        </span>
                        {isSelf && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-[#FDEBEC] text-[#D92228] dark:bg-red-950/60 dark:text-red-300">
                            You
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] font-mono mt-0.5">
                        ID #{user.id}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Role */}
                <td className="py-4 px-4">
                  {isTargetSuperAdmin ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700/50">
                      <Crown className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                      Super Admin
                    </span>
                  ) : isTargetAdmin ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-[#FDEBEC] text-[#D92228] border border-[#F5C2C4] dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/50">
                      <Shield className="w-3 h-3" />
                      Admin
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/50">
                      <UserIcon className="w-3 h-3" />
                      Viewer
                    </span>
                  )}
                </td>

                {/* Status */}
                <td className="py-4 px-4">
                  {isActive ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#16A34A]">
                      <CheckCircle className="w-3.5 h-3.5 text-[#16A34A]" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#6B7280]">
                      <XCircle className="w-3.5 h-3.5" />
                      Disabled
                    </span>
                  )}
                </td>

                {/* Created Date */}
                <td className="py-4 px-4 hidden md:table-cell text-[#6B7280] dark:text-[#9CA3AF]">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#D92228]" />
                    <span>{formatKarachiDateTime(user.created_at)}</span>
                  </div>
                </td>

                {/* Last Login */}
                <td className="py-4 px-4 text-[#6B7280] dark:text-[#9CA3AF]">
                  {user.last_login_at ? (
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#D92228]" />
                      <span>{formatKarachiDateTime(user.last_login_at)}</span>
                    </div>
                  ) : (
                    <span className="italic text-[#6B7280] dark:text-[#9CA3AF]">Never logged in</span>
                  )}
                </td>

                {/* Actions */}
                <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-2">
                    {isTargetSuperAdmin ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/40 shadow-2xs">
                        <Lock className="w-3 h-3 text-amber-600" />
                        Root Protected
                      </span>
                    ) : isSelf ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-gray-50 dark:bg-[#162026] text-[#6B7280] dark:text-[#9CA3AF] border border-[#E5E7EB] dark:border-[#26353d]">
                        <CheckCircle className="w-3 h-3 text-[#16A34A]" />
                        Active Session
                      </span>
                    ) : isTargetAdmin && !isCurrentSuperAdmin ? (
                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-gray-50 dark:bg-[#162026] text-[#6B7280] dark:text-[#9CA3AF] border border-[#E5E7EB] dark:border-[#26353d]"
                        title="Only the primary Super Administrator can manage other administrator accounts"
                      >
                        <Lock className="w-3 h-3 text-[#9CA3AF]" />
                        Admin Protected
                      </span>
                    ) : (
                      <>
                        {/* Toggle Status */}
                        <button
                          type="button"
                          onClick={() =>
                            onToggleStatus(user.id, isActive ? 'active' : 'disabled')
                          }
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                            isActive
                              ? 'border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                              : 'border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                          } cursor-pointer`}
                        >
                          {isActive ? 'Disable' : 'Enable'}
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => onDeleteUser(user.id)}
                          className="p-1.5 rounded-xl text-[#6B7280] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

