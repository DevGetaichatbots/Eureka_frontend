'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  MessageSquare,
  Search,
  Users,
  AlertTriangle,
  ShieldAlert,
  LogOut,
  Bot,
  User as UserIcon,
  Loader2,
} from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();

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
          ? 'h-screen overflow-hidden'
          : 'min-h-screen'
      }`}
    >
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-white text-[#1A1A1A] border-b border-[#E5E7EB] shadow-xs flex-shrink-0">
        <div className="w-full px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#D92228] flex items-center justify-center text-white shadow-md shadow-[#D92228]/25">
                <Bot className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black tracking-tight text-[#D92228]">
                  EUREKA JO
                </span>
                <span className="text-xs font-bold text-[#1A1A1A] hidden sm:inline">
                  CRM INBOX
                </span>
              </div>
            </div>

            {/* Centered Omnichannel Search Bar */}
            <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
              <Link href="/conversations" className="w-full">
                <div className="relative w-full group">
                  <Search className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#D92228] absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors" />
                  <div className="w-full pl-9 pr-4 py-1.5 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] group-hover:bg-white text-xs text-[#6B7280] group-hover:text-[#1A1A1A] transition-all shadow-xs flex items-center justify-between">
                    <span>Search through Inbox conversations...</span>
                    <kbd className="hidden sm:inline-block text-[10px] font-mono text-[#9CA3AF] bg-white border border-[#E5E7EB] px-1.5 py-0.2 rounded">
                      ⌘K
                    </kbd>
                  </div>
                </div>
              </Link>
            </div>

            {/* Navigation Tabs & Actions */}
            <div className="flex items-center gap-3">
              <nav className="hidden sm:flex items-center gap-1">
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
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2 py-1 px-2.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB]">
                  <div className="w-6 h-6 rounded-full bg-[#FDEBEC] text-[#D92228] flex items-center justify-center font-bold text-xs">
                    {user.email[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="text-left text-xs">
                    <p className="font-semibold text-[#1A1A1A] truncate max-w-[120px]">
                      {user.email.split('@')[0]}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => logout()}
                  title="Log Out"
                  className="p-2 rounded-xl text-[#6B7280] hover:text-[#D92228] hover:bg-[#FDEBEC] transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Navigation Tabs */}
          <div className="flex lg:hidden border-t border-[#E5E7EB] py-1.5 overflow-x-auto gap-1">
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
    </div>
  );
}
