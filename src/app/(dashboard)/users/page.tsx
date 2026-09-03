'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { User } from '@/types';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { UsersTable } from '@/components/users/UsersTable';
import { CreateUserModal } from '@/components/users/CreateUserModal';
import {
  ShieldAlert,
  UserPlus,
  Search,
  RefreshCw,
  Users,
  Shield,
  UserCheck,
  Lock,
  ArrowLeft,
  X,
  FileText,
  FileSpreadsheet,
} from 'lucide-react';

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.getUsers();
      const safeList = Array.isArray(res) ? res : (res as any)?.items || (res as any)?.users || [];
      setUsers(safeList);
    } catch (err) {
      console.error('Failed to load users:', err);
      setUsers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      loadUsers();
    }
  }, [currentUser]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  const handleToggleStatus = async (userId: number, currentStatus: 'active' | 'disabled') => {
    const nextStatus = currentStatus === 'active' ? 'disabled' : 'active';
    try {
      const updated = await api.updateUser(userId, { status: nextStatus });
      setUsers((prev) =>
        (prev || []).map((u) => (u.id === userId ? { ...u, status: updated?.status || nextStatus } : u))
      );
      await loadUsers();
    } catch (err) {
      console.error('Failed to update status:', err);
      alert(err instanceof Error ? err.message : 'Could not update user status.');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to remove this user login?')) return;

    try {
      await api.deleteUser(userId);
      setUsers((prev) => (prev || []).filter((u) => u.id !== userId));
      await loadUsers();
    } catch (err) {
      console.error('Failed to delete user:', err);
      alert(err instanceof Error ? err.message : 'Could not delete user.');
    }
  };

  const handleUserCreated = async (newUser: User) => {
    setUsers((prev) => [newUser, ...(prev || [])]);
    await loadUsers();
  };

  const filteredUsers = useMemo(() => {
    const safeList = users || [];
    if (!searchQuery) return safeList;
    const q = searchQuery.toLowerCase().trim();
    return safeList.filter((u) => u.email.toLowerCase().includes(q));
  }, [users, searchQuery]);

  // Metrics
  const adminCount = useMemo(() => (users || []).filter((u) => u.role === 'admin').length, [users]);
  const activeViewerCount = useMemo(
    () => (users || []).filter((u) => u.role === 'viewer' && u.status !== 'disabled').length,
    [users]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A] dark:text-white">Staff Management</h1>
          <p className="text-sm text-[#6B7280]">Manage user access and system permissions</p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="p-2.5 rounded-xl text-[#6B7280] hover:text-[#D92228] dark:hover:text-white bg-white dark:bg-[#162026] border border-[#E5E7EB] dark:border-[#26353d] transition-colors disabled:opacity-50 cursor-pointer flex-shrink-0"
            title="Refresh Users"
          >
            <RefreshCw className={`w-4 h-4 text-[#D92228] ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#D92228] hover:bg-[#B71C21] text-white shadow-xs transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New User</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#111b21] p-5 rounded-2xl border border-gray-200/80 dark:border-[#222e35] shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/15 text-purple-500 flex items-center justify-center flex-shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#8696a0] uppercase tracking-wider">
              Total Staff Logins
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-extrabold text-[#111b21] dark:text-[#e9edef]">
                {users.length}
              </span>
              <span className="text-[11px] text-[#8696a0]">app_users rows</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111b21] p-5 rounded-2xl border border-gray-200/80 dark:border-[#222e35] shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-500 flex items-center justify-center flex-shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#8696a0] uppercase tracking-wider">
              Active Viewers
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-extrabold text-[#111b21] dark:text-[#e9edef]">
                {activeViewerCount}
              </span>
              <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                Read-Only Staff
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#162026] p-5 rounded-2xl border border-[#E5E7EB] dark:border-[#26353d] shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#FDEBEC] text-[#D92228] flex items-center justify-center flex-shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wider">
              Administrators
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-[#1A1A1A] dark:text-[#F3F4F6]">
                {adminCount}
              </span>
              <span className="text-[11px] text-[#16A34A] font-semibold">
                Full Privileges
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white dark:bg-[#162026] p-3 sm:p-4 rounded-2xl border border-[#E5E7EB] dark:border-[#26353d] shadow-xs">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9CA3AF]">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter staff by email address..."
            className="w-full pl-10 pr-9 py-2 rounded-xl border border-[#E5E7EB] dark:border-[#26353d] bg-[#F9FAFB] dark:bg-[#202c33] text-xs text-[#1A1A1A] dark:text-[#F3F4F6] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#D92228] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#6B7280] hover:text-[#D92228]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Users Table */}
      <div className="bg-white dark:bg-[#111b21] rounded-2xl border border-gray-200/80 dark:border-[#222e35] shadow-xs overflow-hidden">
        <UsersTable
          users={filteredUsers}
          currentUserId={currentUser?.id || 1}
          onToggleStatus={handleToggleStatus}
          onDeleteUser={handleDeleteUser}
        />
      </div>

      {/* Add User Modal */}
      <CreateUserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUserCreated={handleUserCreated}
      />
    </div>
  );
}
