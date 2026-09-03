'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function RootPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace('/conversations');
      } else {
        router.replace('/login');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#111b21]">
      <div className="flex flex-col items-center gap-3 text-[#6B7280] dark:text-[#9CA3AF]">
        <Loader2 className="w-8 h-8 animate-spin text-[#D92228]" />
        <p className="text-sm font-medium">Connecting to Eureka Jo WhatsApp Bot...</p>
      </div>
    </div>
  );
}
