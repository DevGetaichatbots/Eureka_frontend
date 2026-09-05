# 📋 Eureka Jo CRM & AI WhatsApp Bot — Standard Operating Procedure (SOP) & Master Handover Document

---

## 01. Executive Summary & Project Overview

The **Eureka Jo Real Estate CRM & AI Inbox** is an enterprise-grade omnichannel customer engagement platform designed to automate lead generation, provide real-time conversational AI in Arabic via WhatsApp, and deliver an intuitive inbox for real estate sales and customer support agents.

### 🏢 Key Stakeholder & Repository Info
- **Project Name**: Eureka Jo CRM Inbox & WhatsApp AI Engine
- **Frontend Repository**: `DevGetaichatbots/Eureka_frontend` (`main` branch)
- **Backend Repository**: `DevGetaichatbots/Eureka_backend-` (`main` branch)
- **Primary Database**: Supabase PostgreSQL (`kwmwnqrmfershspfkcws`)
- **Automation / AI Workflow Engine**: n8n Cloud (`https://eurekajo.app.n8n.cloud`)
- **AI Model Provider**: OpenAI GPT-4o / GPT-4o-mini
- **Production Hosting**: Render.com (Frontend & Backend Web Services)
- **Primary Operational Timezone**: Asia/Karachi (UTC+5)

---

## 02. System Architecture & High-Level Flow

```mermaid
graph TD
    User([Customer on WhatsApp]) <-->|WhatsApp Cloud API Graph v21.0| Meta[Meta Servers]
    Meta <-->|POST /webhook Inbound| FastAPI[FastAPI Backend Core]
    FastAPI <-->|Log Inbound / Read Context| Supabase[(Supabase PostgreSQL)]
    FastAPI -->|1. Dispatch Prompt + Session| n8n[n8n AI Workflow Engine]
    FastAPI -->|2. Register 60s Watchdog Timer| Watchdog[Reply Watchdog Service]
    
    n8n <-->|LLM Chat Completions| OpenAI[OpenAI API]
    n8n <-->|Real Estate Property Search| EurekaAPI[EurekaJo Real Estate API]
    
    n8n -->|Sync Response OR POST /internal/reply| FastAPI
    FastAPI -->|Resolve / Cancel Watchdog| Watchdog
    FastAPI -->|Send Outbound Bot Reply| Meta
    
    Watchdog -.->|Fallback on Timeout| Meta
    
    Agent([CRM Agent / Admin]) <-->|HTTPS / Next.js 16| NextJS[Next.js CRM Frontend]
    NextJS <-->|REST API + JWT Auth| FastAPI
```

---

## 03. Complete Database Schema & Data Models

The system runs on **Supabase PostgreSQL**. All customer interactions, chat threads, and operational logs are permanently retained.

### 1. `contacts` Table
Stores unique customer phone numbers and profiles.
- `id` (INT, Primary Key): Auto-incrementing unique contact ID.
- `wa_id` (VARCHAR, Unique): E.164 phone number without `+` (e.g. `13252088366`, `962797381553`).
- `profile_name` (VARCHAR): WhatsApp display name.
- `first_seen_at` (TIMESTAMPTZ): Initial customer inbound message timestamp.
- `last_seen_at` (TIMESTAMPTZ): Latest customer activity timestamp.

### 2. `conversations` Table
Tracks conversational threads between customers and the bot/agent.
- `id` (INT, Primary Key): Conversation thread ID.
- `contact_id` (INT, Foreign Key -> `contacts.id`): Associated contact ID.
- `started_at` (TIMESTAMPTZ): Thread creation time.
- `last_message_at` (TIMESTAMPTZ): Most recent message timestamp.
- `message_count` (INT): Total message counter.
- `is_archived` (BOOLEAN): Current archive status flag.
- `archived_at` (TIMESTAMPTZ): Timestamp when conversation was archived.

### 3. `messages` Table
Permanent immutable log of every WhatsApp inbound and outbound message.
- `id` (INT, Primary Key): Unique message ID.
- `conversation_id` (INT, Foreign Key -> `conversations.id`): Target conversation thread.
- `contact_id` (INT, Foreign Key -> `contacts.id`): Target contact.
- `wa_message_id` (VARCHAR): Meta WhatsApp message ID (`wamid.HB...`).
- `direction` (VARCHAR): `'customer'` (inbound) or `'bot'` (outbound).
- `body` (TEXT): Full message body text.
- `msg_type` (VARCHAR): `'text'`, `'image'`, `'audio'`, `'document'`.
- `media_url` (TEXT): URL to uploaded media assets.
- `sent_at` (TIMESTAMPTZ): Timestamp delivered by WhatsApp.
- `meta_status` (VARCHAR): `'sent'`, `'delivered'`, `'read'`.
- `created_at` (TIMESTAMPTZ): Ingestion timestamp.

### 4. `archived_chats` Table
Global persistence table for archived conversations across all users and browsers.
- `id` (INT, Primary Key): Auto-incrementing archive entry ID.
- `conversation_id` (INT, Unique): Target conversation ID.
- `contact_id` (INT): Associated contact ID.
- `wa_id` (VARCHAR): Contact phone number.
- `chat_user_name` (VARCHAR): Contact display name.
- `last_message` (TEXT): Last message preview snippet.
- `message_count` (INT): Active message count when archived.
- `archived_by_user` (VARCHAR): Email of user who archived the chat.
- `archived_at` (TIMESTAMPTZ): Archive timestamp.

### 5. `deleted_chats` Table
WhatsApp-style clear/delete cutoff table. Preserves historical data permanently in the database while resetting the active view.
- `id` (INT, Primary Key): Auto-incrementing clear chat entry ID.
- `conversation_id` (INT, Unique): Target conversation ID.
- `contact_id` (INT): Target contact ID.
- `wa_id` (VARCHAR): Contact phone number.
- `deleted_by_user` (VARCHAR): Email of administrator who cleared the chat.
- `deleted_at` (TIMESTAMPTZ): Cutoff timestamp. Messages prior to this timestamp are hidden from active view.

### 6. `app_users` Table
Internal system users (Admins and Viewers).
- `id` (INT, Primary Key): Auto-incrementing user ID.
- `email` (VARCHAR, Unique): Login email address.
- `password_hash` (VARCHAR): bcrypt encrypted password hash.
- `role` (VARCHAR): `'admin'` or `'viewer'`.
- `status` (VARCHAR): `'active'`, `'disabled'`, `'deleted'`.
- `created_at` (TIMESTAMPTZ): Account creation time.
- `last_login_at` (TIMESTAMPTZ): Last login timestamp.

### 7. `error_log` Table
Real-time diagnostic log for automated bot, webhook, and network errors.
- `id` (INT, Primary Key): Error log entry ID.
- `step` (VARCHAR): Failure step (`'n8n'`, `'meta_send'`, `'watchdog'`).
- `error_text` (TEXT): High-level error summary.
- `conversation_id` (INT): Related conversation ID.
- `wa_id` (VARCHAR): Customer phone number.
- `inbound_body` (TEXT): Message content triggering the error.
- `payload` (JSONB): Stack trace or JSON payload error.
- `created_at` (TIMESTAMPTZ): Error timestamp.

---

## 04. Inbound & Outbound WhatsApp Messaging Pipeline

### Inbound Flow
1. Customer sends a WhatsApp message to the Eureka Jo business number.
2. Meta sends a `POST /webhook` request to the FastAPI backend.
3. FastAPI validates the Meta webhook signature.
4. FastAPI creates or updates the record in `contacts` and `conversations`.
5. FastAPI inserts the inbound message into `messages` with `direction='customer'`.
6. FastAPI dispatches the normalized message payload to n8n (`N8N_WEBHOOK_URL`).
7. FastAPI registers a 60-second watchdog timer in `watchdog.py`.

### Outbound AI Flow
1. n8n executes the AI Agent node using OpenAI and performs property searches on EurekaJo.
2. **Synchronous Response Mode**: n8n returns the Arabic response directly in the webhook HTTP response.
3. **Asynchronous Callback Mode**: If configured asynchronously, n8n makes a protected `POST /internal/reply` call back to FastAPI with header `X-Callback-Secret`.
4. FastAPI cancels the watchdog timer.
5. FastAPI delivers the message to the customer via Meta Graph API (`POST https://graph.facebook.com/v21.0/{PHONE_ID}/messages`).
6. FastAPI records the outbound message in `messages` with `direction='bot'` and `meta_status='sent'`.

### Fallback Watchdog Protection
1. If the AI workflow takes longer than 60 seconds:
2. The watchdog timer expires automatically.
3. An entry is recorded in `error_log` with `step='n8n'`.
4. The watchdog triggers an automated fallback reply to the customer:
   > *"Sorry, I'm having trouble answering right now. Please try again in a moment."*
5. This ensures the customer is never left without a timely response.

---

## 05. Standard Operating Procedures (SOPs)

### SOP 01: Daily Inbox Navigation & Lead Response
- **Goal**: Monitor and manage live WhatsApp chats.
- **Access**: Navigate to `/conversations` on the web portal.
- **Default View**: **Open Chats** shows active conversations.
- **24-Hour Indicator**: Conversations with a green indicator are within the Meta 24-hour service window.
- **Search (Ctrl + F)**: Click the Search icon or press `Ctrl + F` to search across chat history with `Enter` (next) and `Shift + Enter` (previous).
- **Date Filters**: Filter conversations by `Today`, `Yesterday`, `Last 3/7/30 days`, or `Custom Range`.

### SOP 02: Conversation Archiving & Unarchiving
- **Goal**: Move completed or inactive chats to the archive.
- **To Archive**:
  1. Select the conversation in Open Chats.
  2. Click the **Archive** button in the top action bar.
  3. The conversation moves to the **Archived** tab across all user accounts.
- **To Unarchive**:
  1. Switch the folder dropdown to **Archived**.
  2. Select the conversation and click **Archived** (unarchive toggle).
  3. The conversation returns to **Open Chats**.

### SOP 03: Soft-Delete Clear Chat (WhatsApp-Style)
- **Goal**: Clear chat messages from active view while preserving historical data.
- **To Clear Chat**:
  1. Select the conversation and click **Delete** (Trash icon).
  2. Confirm in the dialog modal.
  3. The conversation is removed from the active inbox list.
- **Customer Re-engagement**:
  1. If the customer messages again in the future, the conversation automatically restarts as a fresh thread.
  2. Historical messages prior to the clear cutoff remain hidden from the active view, and message count resets cleanly.

### SOP 04: Leads CRM Management & Export
- **Goal**: Export customer contact lists and conversation histories.
- **Access**: Navigate to `/leads`.
- **Export All**: Click **Export CSV** or **Export Excel (.xlsx)** in the top header.
- **Individual Export**: Click **CSV** or **XLSX** on any specific customer row to download their individual transcript and metadata.

### SOP 05: User Management & Role-Based Access Control
- **Goal**: Manage internal team members and permissions.
- **Access**: Navigate to `/users` (Admin only).
- **Roles**:
  - `Admin`: Full access to chat, leads, user management, and error logs.
  - `Viewer`: Read-only access to chats and leads.
- **Actions**:
  - **Add User**: Click **+ Add User**, provide email, password, and role.
  - **Disable/Enable**: Toggle the status switch to instantly block or restore user access.
  - **Delete**: Click the trash icon to remove the account.

### SOP 06: System Error Monitoring & Health Checks
- **Goal**: Review error logs and maintain high uptime.
- **Access**: Navigate to `/errors` on the portal.
- **Error Categories**:
  - `n8n`: Webhook response delays or workflow timeouts.
  - `meta_send`: Meta API connectivity or phone number delivery status.
  - `watchdog`: Automated timeout fallbacks triggered.

---

## 06. Environment Configuration (.env.example)

### Backend Configuration (`backend/.env.example`)
```bash
# Server Environment
APP_ENV=production
DEBUG=false
PORT=8000
CORS_ORIGINS=http://localhost:3000,https://your-frontend-domain.com

# Meta WhatsApp Cloud API Credentials
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
META_VERIFY_TOKEN=your_meta_verify_token
META_ACCESS_TOKEN=your_meta_system_user_access_token
META_PHONE_NUMBER_ID=your_meta_phone_number_id
META_WABA_ID=your_meta_whatsapp_business_account_id
META_API_VERSION=v21.0

# n8n AI Workflow Integration
N8N_WEBHOOK_URL=https://your-n8n-instance.cloud/webhook/your-webhook-path
N8N_CALLBACK_SECRET=your_n8n_callback_secret_token

# Supabase (PostgreSQL) Service Credentials
DATABASE_URL=postgresql+asyncpg://postgres:your_password@db.your_project.supabase.co:5432/postgres
SUPABASE_URL=https://your_project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
USE_MOCK_DB=false

# Security & Authentication
SESSION_SECRET=your_jwt_session_secret_key
JWT_SECRET_KEY=your_jwt_secret_key
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=1440
JWT_ALGORITHM=HS256

# Reliability, Watchdog & Defaults
APP_BASE_URL=https://your-backend-domain.com
WATCHDOG_TIMEOUT_SECONDS=50
ADMIN_NOTIFICATION_PHONE=your_admin_phone_number
FALLBACK_MESSAGE=Sorry, I'm having trouble answering right now. Please try again in a moment.
LOG_LEVEL=INFO
TZ=Asia/Karachi
CONVERSATION_WINDOW_HOURS=24
```

### Frontend Configuration (`frontend/.env.example`)
```bash
# Next.js Public API Target URL
NEXT_PUBLIC_API_URL=https://your-backend-domain.com
```

---

## 07. Troubleshooting Matrix

| Issue / Symptom | Root Cause | Solution |
| :--- | :--- | :--- |
| **Fallback reply sent to customer** | n8n workflow took longer than 60s or service offline | Check `/errors` table in CRM and verify n8n workflow execution status. |
| **Messages not showing in real time** | Meta Webhook URL disconnected or verify token mismatch | Check Meta App Dashboard -> WhatsApp -> Configuration. Verify webhook URL is `https://<backend-domain>/webhook` and verify token matches `META_VERIFY_TOKEN`. |
| **Chat was cleared, customer messages again** | Expected WhatsApp behavior | Conversation resets and reappears as a fresh thread starting from the new message timestamp. |
| **Archived chat showing in Open list** | Browser cache or multi-tab sync | Click **Reload** in header or refresh page. Ensure Supabase `archived_chats` record is active. |
| **Admin cannot log in** | User disabled or token expired | Check `app_users` table in Supabase. Verify `status` is `'active'`. Reset password using backend seed script. |
| **Arabic characters displayed improperly** | Encoding mismatch | FastAPI, Supabase, and Next.js use standard UTF-8 charset. Ensure terminal clients configure UTF-8 stdout. |

---

## 08. Handover Sign-Off & Maintenance Schedule

- **Database Maintenance**: Automatic daily backups via Supabase Point-in-Time Recovery (PITR).
- **Error Log Audits**: Review `/errors` weekly to ensure zero unhandled exceptions.
- **Service Monitoring**: Regular status checks on Meta Cloud API and n8n workflow endpoints.
- **Support Contact**: Technical DevOps & Development Team (`admin@eurekajo.com`).
