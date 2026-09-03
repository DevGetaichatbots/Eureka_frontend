'use client';

import React, { Suspense } from 'react';
import { SplitChatView } from '@/components/chat/SplitChatView';
import { Loader2 } from 'lucide-react';

export default function ConversationsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center min-h-[500px] text-[#8696a0]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#D92228]" />
            <p className="text-xs font-medium">Loading chat inbox...</p>
          </div>
        </div>
      }
    >
      <SplitChatView />
    </Suspense>
  );
}
