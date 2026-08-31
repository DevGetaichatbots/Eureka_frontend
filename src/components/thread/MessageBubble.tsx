'use client';

import React, { useState } from 'react';
import { Message } from '@/types';
import { formatKarachiTime } from '@/lib/utils';
import {
  Bot,
  User,
  CheckCheck,
  Check,
  AlertTriangle,
  FileText,
  Play,
  Pause,
  Volume2,
  Download,
  ExternalLink,
  HelpCircle,
  Quote,
} from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  contactName: string;
  onImageClick?: (url: string) => void;
}

export function MessageBubble({
  message,
  contactName,
  onImageClick,
}: MessageBubbleProps) {
  const isBot = message.direction === 'bot';
  const [isPlaying, setIsPlaying] = useState(false);

  const toggleAudio = (audioId: string) => {
    const el = document.getElementById(audioId) as HTMLAudioElement;
    if (el) {
      if (isPlaying) {
        el.pause();
        setIsPlaying(false);
      } else {
        el.play();
        setIsPlaying(true);
      }
    }
  };

  // Detect simulated quoted text if present (e.g. lines starting with ">")
  const hasQuote = Boolean(message.body?.includes('> '));
  const quoteLines = hasQuote && message.body
    ? message.body.split('\n').filter((l) => l.startsWith('> '))
    : [];
  const normalText = hasQuote && message.body
    ? message.body.split('\n').filter((l) => !l.startsWith('> ')).join('\n')
    : message.body;

  return (
    <div
      className={`flex items-end gap-2.5 my-2.5 ${
        isBot ? 'justify-end' : 'justify-start'
      } group`}
    >
      {/* Left Avatar for Customer */}
      {!isBot && (
        <div
          className="w-8 h-8 rounded-full bg-gray-100 border border-[#E5E7EB] text-[#6B7280] flex items-center justify-center flex-shrink-0 mb-1 shadow-xs"
          title={contactName}
        >
          <User className="w-4 h-4" />
        </div>
      )}

      {/* Bubble Container */}
      <div
        className={`relative max-w-[85%] sm:max-w-[70%] rounded-2xl p-3 sm:p-3.5 shadow-xs text-sm transition-all ${
          isBot
            ? 'bg-[#D92228] text-white rounded-br-xs shadow-md shadow-[#D92228]/10'
            : 'bg-[#F9FAFB] text-[#1A1A1A] rounded-bl-xs border border-[#E5E7EB]'
        }`}
      >
        {/* Quoted Message Card (if message replies to another) */}
        {hasQuote && quoteLines.length > 0 && (
          <div
            className={`mb-2 p-2 rounded-xl text-xs flex flex-col gap-0.5 border-l-3 ${
              isBot
                ? 'bg-black/15 border-white text-white/90'
                : 'bg-white border-[#D92228] text-[#6B7280]'
            }`}
          >
            <span
              className={`font-semibold text-[10px] uppercase tracking-wider ${
                isBot ? 'text-white' : 'text-[#D92228]'
              }`}
            >
              Replying to {contactName}
            </span>
            <p className="italic text-[11px] truncate">
              {quoteLines.map((q) => q.replace('> ', '')).join(' ')}
            </p>
          </div>
        )}

        {/* Media Renderers */}
        {/* 1. Image Message */}
        {message.msg_type === 'image' && message.media_url && (
          <div className="mb-2">
            <div
              onClick={() => onImageClick?.(message.media_url!)}
              className="relative group/img cursor-pointer overflow-hidden rounded-xl border border-white/20 max-w-sm bg-black/5"
            >
              <img
                src={message.media_url}
                alt="WhatsApp Media"
                className="w-full max-h-64 object-cover group-hover/img:scale-102 transition-transform duration-200"
              />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white">
                <span className="text-xs font-semibold bg-black/60 px-2.5 py-1 rounded-md flex items-center gap-1">
                  <ExternalLink className="w-3 h-3" />
                  Click to Expand
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 2. Audio / Voice Message */}
        {message.msg_type === 'audio' && (
          <div
            className={`my-1 p-2 rounded-xl border flex items-center gap-3 min-w-[230px] ${
              isBot
                ? 'bg-white/10 border-white/20 text-white'
                : 'bg-white border-[#E5E7EB] text-[#1A1A1A]'
            }`}
          >
            {message.media_url && (
              <audio
                id={`audio-${message.id}`}
                src={message.media_url}
                onEnded={() => setIsPlaying(false)}
                className="hidden"
              />
            )}
            <button
              onClick={() => toggleAudio(`audio-${message.id}`)}
              className={`w-8 h-8 rounded-full flex items-center justify-center shadow-xs flex-shrink-0 transition-transform cursor-pointer ${
                isBot
                  ? 'bg-white text-[#D92228] hover:scale-105'
                  : 'bg-[#D92228] text-white hover:bg-[#B71C21]'
              }`}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
            </button>

            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-1 h-3.5">
                {[4, 8, 12, 16, 10, 6, 14, 18, 12, 8, 14, 10, 6, 12, 8].map((h, idx) => (
                  <span
                    key={idx}
                    className={`w-1 rounded-full ${
                      isPlaying
                        ? isBot
                          ? 'bg-white animate-pulse'
                          : 'bg-[#D92228] animate-pulse'
                        : isBot
                        ? 'bg-white/50'
                        : 'bg-gray-300'
                    }`}
                    style={{ height: `${h}px` }}
                  />
                ))}
              </div>
              <div
                className={`flex items-center justify-between text-[10px] ${
                  isBot ? 'text-white/80' : 'text-[#6B7280]'
                }`}
              >
                <span>Voice Note</span>
                <span className="flex items-center gap-0.5">
                  <Volume2 className="w-3 h-3" />
                  0:14
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 3. Document Attachment */}
        {message.msg_type === 'document' && (
          <div
            className={`my-1 p-2.5 rounded-xl border flex items-center justify-between gap-3 ${
              isBot
                ? 'bg-white/10 border-white/20 text-white'
                : 'bg-white border-[#E5E7EB] text-[#1A1A1A]'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isBot ? 'bg-white text-[#D92228]' : 'bg-[#FDEBEC] text-[#D92228]'
                }`}
              >
                <FileText className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate">Document Attachment</p>
                <p className={`text-[10px] ${isBot ? 'text-white/80' : 'text-[#6B7280]'}`}>
                  PDF Document
                </p>
              </div>
            </div>

            {message.media_url && (
              <a
                href={message.media_url}
                target="_blank"
                rel="noreferrer"
                className={`p-1.5 rounded-lg border transition-colors ${
                  isBot
                    ? 'bg-white/20 border-white/30 text-white hover:bg-white/30'
                    : 'bg-white hover:bg-gray-100 text-[#D92228] border-[#E5E7EB]'
                }`}
                title="Download / View Document"
              >
                <Download className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        )}

        {/* 4. Unknown / Fallback Type */}
        {message.msg_type !== 'text' &&
          message.msg_type !== 'image' &&
          message.msg_type !== 'audio' &&
          message.msg_type !== 'document' && (
            <div className="my-1 p-2 rounded-lg bg-amber-50 text-amber-800 text-xs flex items-center gap-2">
              <HelpCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>[{message.msg_type} attachment]</span>
            </div>
          )}

        {/* Message Text Body */}
        {normalText && message.msg_type !== 'audio' && (
          <p className="whitespace-pre-wrap leading-relaxed break-words text-[13.5px]">
            {normalText}
          </p>
        )}

        {/* Bottom Metadata: Timestamp & Status */}
        <div
          className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
            isBot ? 'text-white/80' : 'text-[#6B7280]'
          }`}
        >
          <span>{formatKarachiTime(message.sent_at)}</span>

          {isBot && (
            <div className="flex items-center ml-0.5">
              {message.meta_status === 'read' && (
                <span title="Read by customer">
                  <CheckCheck className="w-3.5 h-3.5 text-white" />
                </span>
              )}
              {message.meta_status === 'delivered' && (
                <span title="Delivered">
                  <CheckCheck className="w-3.5 h-3.5 text-white/70" />
                </span>
              )}
              {message.meta_status === 'sent' && (
                <span title="Sent">
                  <Check className="w-3.5 h-3.5 text-white/70" />
                </span>
              )}
              {message.meta_status === 'failed' && (
                <span title="Failed to deliver">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-200" />
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Avatar for Eureka Jo Bot */}
      {isBot && (
        <div
          className="w-8 h-8 rounded-full bg-[#D92228] text-white flex items-center justify-center flex-shrink-0 mb-1 shadow-xs border border-[#B71C21]"
          title="Eureka Jo Bot (AI)"
        >
          <Bot className="w-4 h-4" />
        </div>
      )}
    </div>
  );
}
