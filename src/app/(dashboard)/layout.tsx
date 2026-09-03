'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LogoutConfirmModal } from '@/components/ui/LogoutConfirmModal';
import { ChangePasswordModal } from '@/components/users/ChangePasswordModal';
import { Toast } from '@/components/ui/Toast';
import {
  MessageSquare,
  Users,
  ShieldAlert,
  LogOut,
  Bot,
  Loader2,
  KeyRound,
} from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showLogoutToast, setShowLogoutToast] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleLogoutConfirm = async () => {
    setShowLogoutModal(false);
    setShowLogoutToast(true);
    // Small delay so toast is visible before redirect
    setTimeout(() => logout(), 1200);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3 text-[#6B7280]">
          <Loader2 className="w-8 h-8 animate-spin text-[#D92228]" />
          <p className="text-sm font-medium">Loading session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // AuthContext handles redirect to /login
  }

  const navItems = [
    { label: 'Conversations', href: '/conversations', icon: MessageSquare },
    { label: 'Leads', href: '/leads', icon: Users },
    ...(user.role === 'admin'
      ? [{ label: 'Users', href: '/users', icon: ShieldAlert }]
      : []),
  ];

  return (
    <div
      className={`flex flex-col bg-white ${
        pathname.startsWith('/conversations')
          ? 'h-[100dvh] overflow-hidden'
          : 'min-h-screen'
      }`}
    >
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white text-[#1A1A1A] border-b border-[#E5E7EB] shadow-xs flex-shrink-0">
        <div className="w-full px-3 sm:px-6">
          <div className="flex items-center justify-between h-13 sm:h-14">
            {/* Brand */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#D92228] flex items-center justify-center text-white shadow-md shadow-[#D92228]/25 flex-shrink-0">
                <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-xs sm:text-sm font-black tracking-tight text-[#D92228]">
                  EUREKA JO
                </span>
                <span className="text-[10px] sm:text-xs font-bold text-[#1A1A1A] hidden sm:inline">
                  CRM INBOX
                </span>
              </div>
            </div>

            {/* Navigation Tabs & Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              <nav className="hidden md:flex items-center gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href ||
                    (item.href === '/conversations' && pathname.startsWith('/conversations'));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-[#FDEBEC] text-[#D92228] shadow-xs'
                          : 'text-[#6B7280] hover:text-[#1A1A1A] hover:bg-[#F9FAFB]'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#D92228]' : ''}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* User Session & Logout */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(true)}
                  title="Click to update password"
                  className="hidden sm:flex items-center gap-2 py-1 px-2.5 rounded-xl bg-[#F9FAFB] hover:bg-white border border-[#E5E7EB] hover:border-[#D92228] transition-all cursor-pointer group shadow-xs"
                >
                  <div className="w-6 h-6 rounded-full bg-[#FDEBEC] text-[#D92228] flex items-center justify-center font-bold text-xs group-hover:scale-105 transition-transform">
                    {user.email[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="text-left text-xs">
                    <p className="font-semibold text-[#1A1A1A] group-hover:text-[#D92228] truncate max-w-[120px] transition-colors">
                      {user.email.split('@')[0]}
                    </p>
                  </div>
                  <KeyRound className="w-3 h-3 text-[#9CA3AF] group-hover:text-[#D92228] transition-colors" />
                </button>

                {/* Mobile Password Change Button */}
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(true)}
                  title="Update Password"
                  className="p-2 rounded-xl text-[#6B7280] hover:text-[#D92228] hover:bg-[#FDEBEC] transition-colors cursor-pointer sm:hidden"
                >
                  <KeyRound className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setShowLogoutModal(true)}
                  title="Log Out"
                  className="p-2 rounded-xl text-[#6B7280] hover:text-[#D92228] hover:bg-[#FDEBEC] transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Navigation Tabs */}
          <div className="flex md:hidden border-t border-[#E5E7EB] py-1.5 overflow-x-auto gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href === '/conversations' && pathname.startsWith('/conversations'));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-[#FDEBEC] text-[#D92228]'
                      : 'text-[#6B7280] hover:text-[#1A1A1A] hover:bg-[#F9FAFB]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Page Content */}
      <main
        className={`flex-1 flex flex-col min-h-0 ${
          pathname.startsWith('/conversations')
            ? 'w-full p-0 overflow-hidden'
            : 'max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8'
        }`}
      >
          {children}
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <LogoutConfirmModal
          onConfirm={handleLogoutConfirm}
          onCancel={() => setShowLogoutModal(false)}
        />
      )}

      {/* Logout Toast */}
      {showLogoutToast && (
        <Toast
          message="You have been signed out successfully."
          variant="success"
          duration={2000}
          onClose={() => setShowLogoutToast(false)}
        />
      )}

      {/* Change Password Modal */}
      {showPasswordModal && user && (
        <ChangePasswordModal
          user={user}
          isOpen={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
          onSuccess={(msg) => {
            setToastMessage(msg);
          }}
        />
      )}

      {/* Success Toast for Password Update */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          variant="success"
          duration={3500}
          onClose={() => setToastMessage(null)}
        />
      )}
    </div>
  );
}
