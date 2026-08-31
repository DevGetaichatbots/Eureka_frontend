'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  MessageSquare,
  Users,
  Search,
  AlertTriangle,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface NavRailProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function NavRail({ collapsed = false, onToggleCollapse }: NavRailProps) {
  const pathname = usePathname();

  const navItems = [
    {
      href: '/conversations',
      label: 'Inbox',
      icon: MessageSquare,
      active: pathname.startsWith('/conversations'),
    },
    {
      href: '/leads',
      label: 'Contacts & Leads',
      icon: Users,
      active: pathname.startsWith('/leads'),
    },
    {
      href: '/users',
      label: 'Team Management',
      icon: Settings,
      active: pathname.startsWith('/users'),
    },
  ];

  return (
    <aside className="w-14 sm:w-16 flex-shrink-0 bg-white border-r border-[#E5E7EB] flex flex-col items-center justify-between py-4 select-none z-20">
      {/* Top: Brand Emblem */}
      <div className="flex flex-col items-center gap-6 w-full">
        <Link
          href="/conversations"
          className="relative group flex items-center justify-center"
          title="Eureka Jo Real Estate"
        >
          <div className="w-10 h-10 rounded-2xl bg-[#D92228] text-white flex items-center justify-center font-black text-sm shadow-md shadow-[#D92228]/20 group-hover:scale-105 transition-transform">
            <span>EJ</span>
          </div>
          <span className="absolute -bottom-1 -right-1 px-1 py-0.2 rounded-full text-[8px] font-bold bg-[#1A1A1A] text-white uppercase tracking-tighter">
            Pro
          </span>
        </Link>

        {/* Navigation Item Icons */}
        <nav className="flex flex-col items-center gap-2 w-full px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative group w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  item.active
                    ? 'bg-[#FDEBEC] text-[#D92228] font-bold shadow-xs'
                    : 'text-[#6B7280] hover:text-[#1A1A1A] hover:bg-[#F9FAFB]'
                }`}
                title={item.label}
              >
                <Icon className={`w-5 h-5 ${item.active ? 'stroke-[2.3]' : 'stroke-[1.8]'}`} />

                {/* Active Red Indicator Bar */}
                {item.active && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[#D92228]" />
                )}

                {/* Tooltip on hover */}
                <span className="absolute left-12 ml-2 px-2.5 py-1 rounded-lg bg-[#1A1A1A] text-white text-[11px] font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-lg">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom: Collapse & User Avatar */}
      <div className="flex flex-col items-center gap-3 w-full px-2">
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="w-10 h-10 rounded-xl text-[#9CA3AF] hover:text-[#1A1A1A] hover:bg-[#F9FAFB] flex items-center justify-center transition-colors cursor-pointer"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}

        <Link
          href="/users"
          className="w-9 h-9 rounded-xl bg-gray-100 hover:ring-2 hover:ring-[#D92228] text-[#1A1A1A] font-bold text-xs flex items-center justify-center transition-all border border-[#E5E7EB]"
          title="Account Profile"
        >
          <span>E</span>
        </Link>
      </div>
    </aside>
  );
}
