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
} from 'lucide-react';

interface UsersTableProps {
  users: User[];
  currentUserId: number;
  onToggleStatus: (userId: number, currentStatus: 'active' | 'disabled') => void;
  onDeleteUser: (userId: number) => void;
}

export function UsersTable({
  users,
  currentUserId,
  onToggleStatus,
  onDeleteUser,
}: UsersTableProps) {
  if (users.length === 0) {
    return (
      <div className="py-12 text-center text-xs text-[#6B7280]">
        No users found matching your search.
      </div>
    );
  }

  return (
    <>
      {/* Mobile Card Layout (< md screens) */}
      <div className="md:hidden divide-y divide-[#E5E7EB] dark:divide-[#26353d]">
        {users.map((user) => {
          const isSelf = user.id === currentUserId;
          const isAdmin = user.role === 'admin';
          const isActive = user.status !== 'disabled';

          return (
            <div key={user.id} className="p-4 space-y-3 hover:bg-[#F9FAFB] dark:hover:bg-[#202c33]/40 transition-colors">
              {/* Top Row: Avatar, Email, Self badge & Role badge */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-xs ${
                      isAdmin
                        ? 'bg-[#FDEBEC] text-[#D92228] border border-[#F5C2C4]'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}
                  >
                    {user.email[0]?.toUpperCase() || 'U'}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-sm text-[#1A1A1A] dark:text-[#F3F4F6] truncate">
                        {user.email}
                      </span>
                      {isSelf && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#FDEBEC] text-[#D92228]">
                          You
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] font-mono mt-0.5">
                      ID #{user.id}
                    </p>
                  </div>
                </div>

                {/* Role Badge */}
                <div>
                  {isAdmin ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#FDEBEC] text-[#D92228] border border-[#F5C2C4]">
                      <Shield className="w-3 h-3" />
                      Admin
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      <UserIcon className="w-3 h-3" />
                      Viewer
                    </span>
                  )}
                </div>
              </div>

              {/* Status & Timing metadata */}
              <div className="flex items-center justify-between text-xs text-[#6B7280] dark:text-[#9CA3AF] pt-0.5">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#D92228]" />
                  <span>
                    {user.last_login_at
                      ? `Last: ${formatKarachiDateTime(user.last_login_at)}`
                      : 'Never logged in'}
                  </span>
                </div>

                {/* Status indicator */}
                {isActive ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#16A34A] bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 px-2 py-0.5 rounded-full">
                    <CheckCircle className="w-3 h-3 text-[#16A34A]" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#6B7280] bg-gray-100 border border-[#E5E7EB] px-2 py-0.5 rounded-full">
                    <XCircle className="w-3 h-3" />
                    Disabled
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={isSelf}
                  onClick={() =>
                    onToggleStatus(user.id, isActive ? 'active' : 'disabled')
                  }
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-center ${
                    isActive
                      ? 'border-amber-200 bg-amber-50/50 text-amber-700 hover:bg-amber-100'
                      : 'border-emerald-200 bg-emerald-50/50 text-emerald-700 hover:bg-emerald-100'
                  } disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs`}
                >
                  {isActive ? 'Disable Account' : 'Enable Account'}
                </button>

                {!isSelf && user.id !== 1 && (
                  <button
                    type="button"
                    onClick={() => onDeleteUser(user.id)}
                    className="p-2 rounded-xl text-[#6B7280] hover:text-red-600 bg-white dark:bg-[#162026] border border-[#E5E7EB] dark:border-[#26353d] hover:border-red-200 transition-colors cursor-pointer shadow-xs"
                    title="Delete User"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table View (>= md screens) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#E5E7EB] dark:border-[#26353d] bg-[#F9FAFB] dark:bg-[#202c33]/40 text-[11px] font-semibold text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wider">
              <th className="py-3.5 px-6">User / Email</th>
              <th className="py-3.5 px-4">Role</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">Created Date</th>
              <th className="py-3.5 px-4">Last Login</th>
              <th className="py-3.5 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#26353d] text-xs">
            {users.map((user) => {
              const isSelf = user.id === currentUserId;
              const isAdmin = user.role === 'admin';
              const isActive = user.status !== 'disabled';

              return (
                <tr
                  key={user.id}
                  className="hover:bg-[#F9FAFB] dark:hover:bg-[#202c33]/40 transition-colors group"
                >
                  {/* User Info */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                          isAdmin
                            ? 'bg-[#FDEBEC] text-[#D92228]'
                            : 'bg-[#F3F4F6] text-[#6B7280]'
                        }`}
                      >
                        {user.email[0]?.toUpperCase() || 'U'}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#1A1A1A] dark:text-[#F3F4F6]">
                            {user.email}
                          </span>
                          {isSelf && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#FDEBEC] text-[#D92228]">
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
                    {isAdmin ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-[#FDEBEC] text-[#D92228] border border-[#F5C2C4]">
                        <Shield className="w-3 h-3" />
                        Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
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
                  <td className="py-4 px-4 text-[#6B7280] dark:text-[#9CA3AF]">
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
                      <span className="italic text-[#6B7280]">Never logged in</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-6 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        disabled={isSelf}
                        onClick={() =>
                          onToggleStatus(user.id, isActive ? 'active' : 'disabled')
                        }
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                          isActive
                            ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                            : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                        } disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer`}
                      >
                        {isActive ? 'Disable' : 'Enable'}
                      </button>

                      {!isSelf && user.id !== 1 && (
                        <button
                          type="button"
                          onClick={() => onDeleteUser(user.id)}
                          className="p-1.5 rounded-xl text-[#6B7280] hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
