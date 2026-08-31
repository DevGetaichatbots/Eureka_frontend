export type UserRole = 'admin' | 'viewer';

export interface User {
  id: number;
  email: string;
  role: UserRole;
  status?: 'active' | 'disabled';
  created_at: string;
  last_login_at: string | null;
}

export interface Contact {
  id: number;
  wa_id: string; // E.164 without '+'
  profile_name: string | null;
  first_seen_at: string;
  last_seen_at: string;
  message_count: number;
}

export type MessageDirection = 'customer' | 'bot';
export type MessageStatus = 'sent' | 'delivered' | 'read' | 'failed';

export interface Message {
  id: number;
  conversation_id: number;
  contact_id: number;
  wa_message_id: string | null;
  direction: MessageDirection;
  body: string | null;
  msg_type: string; // 'text', 'image', 'audio', 'document', etc.
  media_url: string | null;
  sent_at: string;
  meta_status: MessageStatus | null;
  created_at: string;
}

export interface Conversation {
  id: number;
  contact_id: number;
  contact?: Contact;
  started_at: string;
  last_message_at: string;
  message_count: number;
  last_message?: Message;
}

export interface SearchResultItem extends Conversation {
  matching_messages: Message[];
}

export type ErrorStep = 'webhook' | 'n8n' | 'openai' | 'meta_send' | 'db';

export interface ErrorLog {
  id: number;
  conversation_id: number | null;
  wa_id: string | null;
  inbound_body: string | null;
  step: ErrorStep;
  error_text: string;
  payload: Record<string, unknown> | null;
  created_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  user: User;
  token?: string;
  message?: string;
}
