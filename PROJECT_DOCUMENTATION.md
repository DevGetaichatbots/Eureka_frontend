# WhatsApp Bot & Conversation Viewer — Complete Project Specification & Build Guide

> **Project:** WhatsApp Bot Bridge & Conversation Viewer  
> **Source Spec:** `Technical-Build-Document.pdf` (Version 1.1)  
> **Tech Stack:** Python 3.11 / FastAPI · Supabase (Postgres) · n8n (AI Bot) · Meta WhatsApp Cloud API · Next.js 16 (App Router) · Tailwind CSS v4 · Render  
> **Timezone:** `Asia/Karachi` (Stored in UTC `timestamptz`, rendered in PKT)  

---

## Table of Contents
1. [Executive Summary & System Architecture](#1-executive-summary--system-architecture)
2. [Critical Scope Boundaries (What to Build vs Not Build)](#2-critical-scope-boundaries)
3. [Asynchronous Message Flow Sequence](#3-asynchronous-message-flow-sequence)
4. [Complete Supabase Database Schema & Indexes](#4-complete-supabase-database-schema--indexes)
5. [Environment Variables Matrix](#5-environment-variables-matrix)
6. [Backend API Specification & Webhook Contracts](#6-backend-api-specification--webhook-contracts)
7. [n8n Integration Contract & 60-Second Watchdog](#7-n8n-integration-contract--60-second-watchdog)
8. [Error Handling & Reliability Matrix](#8-error-handling--reliability-matrix)
9. [Security Requirements](#9-security-requirements)
10. [Frontend Status — All 8 Milestones Completed](#10-frontend-status--all-8-milestones-completed)
11. [How to Run & Test the Application](#11-how-to-run--test-the-application)
12. [Deployment & Production Guidelines (Render & Supabase)](#12-deployment--production-guidelines)

---

## 1. Executive Summary & System Architecture

This system replaces third-party chat bridges (e.g., Chatbase) with a dedicated internal FastAPI service and Supabase database. The application serves two primary purposes:
1. **The WhatsApp Messaging Bridge**: Receives inbound customer messages from Meta WhatsApp Cloud API, persists them, dispatches them asynchronously to an already-trained n8n AI workflow, receives the bot reply, and delivers it back to the customer via Meta.
2. **The Read-Only Conversation Viewer**: A clean web application for internal team members to monitor live conversations, review transcripts, inspect errors, filter leads, and export data.

```
                    ┌──────────────────────────────────────────────────────────┐
                    │                      META WHATSAPP                       │
                    └───────────────▲──────────────────────────┬───────────────┘
                                    │ (Outbound Reply)         │ (Inbound POST)
                                    │                          v
┌───────────────────────────┐   ┌───┴──────────────────────────────────────────┐
│        NEXT.JS 16         │   │               FASTAPI BACKEND                │
│    CONVERSATION VIEWER    │◄──┤  1. Verify HMAC & Fast Ack 200 (<300ms)      │
│  (Read-only, Dashboard,   │   │  2. Contact Upsert & 24h Conversation Window │
│   Leads, Search, Errors)  │   │  3. Async Background Task Dispatcher         │
└───────────────────────────┘   └───┬──────────────────────────▲───────────────┘
                                    │                          │
                                    │ POST {N8N_WEBHOOK}       │ POST /internal/reply
                                    v                          │ (Secret header)
                                ┌──────────────────────────────┴───────────────┐
                                │           n8n WORKFLOW (AI AGENT)            │
                                │   (Owns prompts, tools, models & memory)     │
                                └──────────────────────────────────────────────┘
                                    │
                                    v
                                ┌──────────────────────────────────────────────┐
                                │              SUPABASE (POSTGRES)             │
                                │ contacts, conversations, messages, error_log │
                                └──────────────────────────────────────────────┘
```

---

## 2. Critical Scope Boundaries

* **No Bot Training or Prompt UI**: The AI bot is already configured and trained inside **n8n**. The application does **not** store or manage prompts, model temperatures, or embeddings.
* **Strictly Read-Only Viewer**: There is **no message input box** in the conversation viewer for human agents to reply directly. Outbound messages originate strictly from the n8n bot or automated fallback handlers.
* **Separation of Concerns**: n8n owns conversation intelligence; FastAPI owns message delivery, database persistence, webhook verification, and viewer APIs.

---

## 3. Asynchronous Message Flow Sequence

1. **Customer Message**: Customer sends a WhatsApp message to the business phone number.
2. **Meta Webhook**: Meta sends an HTTP POST to `POST /webhook/whatsapp`.
3. **Verify & Fast Ack**:
   - The backend validates the `X-Hub-Signature-256` HMAC against the raw request body.
   - De-duplicates using `wa_message_id`. If already processed, returns `200 OK` immediately (idempotent).
   - Returns `200 OK` to Meta within **under 300 ms** to prevent Meta retry loops.
4. **Background Task Execution**:
   - Upserts the contact record (`contacts`).
   - Checks the **24-hour window**: if the contact's most recent conversation has `last_message_at` within 24 hours, appends to it; otherwise, opens a new conversation row (`conversations`).
   - Writes the inbound message record (`messages`).
5. **Dispatch to n8n**: The background worker POSTs a normalized JSON payload to `N8N_WEBHOOK_URL`.
6. **n8n Processing**: The n8n agent workflow executes and produces the AI response text.
7. **n8n Callback**: n8n calls `POST /internal/reply` with header `X-Callback-Secret: <N8N_CALLBACK_SECRET>`.
8. **Meta Delivery**: The backend sends the text via Meta Graph API (`/{phone_number_id}/messages`), then logs the outbound row in `messages` with the returned Meta message ID.
9. **Instant Viewer Visibility**: Because data is committed directly to Supabase, the conversation is immediately visible in the Next.js viewer.

---

## 4. Complete Supabase Database Schema & Indexes

Execute this in the Supabase SQL editor (`migrations/001_init.sql`):

```sql
-- 1. Contacts
create table contacts (
  id bigserial primary key,
  wa_id text unique not null, -- E.164 without '+', e.g. '923001234567'
  profile_name text,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  message_count integer not null default 0
);

-- 2. Conversations (with 24-hour windowing)
create table conversations (
  id bigserial primary key,
  contact_id bigint not null references contacts(id) on delete cascade,
  started_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  message_count integer not null default 0
);

-- 3. Messages
create table messages (
  id bigserial primary key,
  conversation_id bigint not null references conversations(id) on delete cascade,
  contact_id bigint not null references contacts(id) on delete cascade,
  wa_message_id text unique, -- Meta ID used for idempotency / dedup
  direction text not null check (direction in ('customer', 'bot')),
  body text,
  msg_type text not null default 'text', -- 'text', 'image', 'audio', 'document'
  media_url text,
  sent_at timestamptz not null,
  meta_status text, -- 'sent', 'delivered', 'read', 'failed'
  created_at timestamptz not null default now()
);

-- 4. Error Log
create table error_log (
  id bigserial primary key,
  conversation_id bigint references conversations(id) on delete set null,
  wa_id text,
  inbound_body text,
  step text not null, -- 'webhook', 'n8n', 'openai', 'meta_send', 'db'
  error_text text not null,
  payload jsonb,
  created_at timestamptz not null default now()
);

-- 5. App Users (Viewer & Admin Login)
create table app_users (
  id bigserial primary key,
  email text unique not null,
  password_hash text not null, -- argon2 or bcrypt
  role text not null default 'viewer', -- 'admin' or 'viewer'
  status text not null default 'active', -- 'active' or 'disabled'
  created_at timestamptz not null default now(),
  last_login_at timestamptz
);

-- Performance Indexes
create index on messages (conversation_id, sent_at desc);
create index on messages (contact_id, sent_at desc);
create index on conversations (last_message_at desc);
create index on messages using gin (to_tsvector('english', coalesce(body, '')));
create index on error_log (created_at desc);
```

### Conversation Windowing Rule
* On every inbound message, lookup the contact's most recent conversation.
* If `(now() - last_message_at) <= 24 hours`: Append message to the existing conversation and update `last_message_at = now()`, `message_count = message_count + 1`.
* If `> 24 hours` (or no previous conversation exists): Create a brand new conversation row.

---

## 5. Environment Variables Matrix

Defined in `app/config.py` using Pydantic Settings. The app **must fail fast on startup** if any required variable is missing.

| Variable | Type | Description |
| :--- | :--- | :--- |
| `META_APP_ID` | String | Meta App ID from Meta Developer Dashboard |
| `META_APP_SECRET` | String | Meta App Secret (used to compute `X-Hub-Signature-256`) |
| `META_VERIFY_TOKEN` | String | Custom random token string for webhook setup |
| `META_ACCESS_TOKEN` | String | Permanent System User Token (not the 24-hr temp token) |
| `META_PHONE_NUMBER_ID` | String | Sender Phone Number ID from WhatsApp API Setup |
| `META_WABA_ID` | String | WhatsApp Business Account ID |
| `META_API_VERSION` | String | Pinned Graph API version (e.g., `v21.0`) |
| `DATABASE_URL` | String | Supabase PostgreSQL async connection string (`postgresql+asyncpg://...`) |
| `SUPABASE_URL` | String | Supabase project endpoint URL |
| `SUPABASE_SERVICE_ROLE_KEY` | String | Supabase service-role secret key (server-side only) |
| `N8N_WEBHOOK_URL` | String | Target n8n workflow webhook endpoint |
| `N8N_CALLBACK_SECRET` | String | Shared secret header required on `/internal/reply` |
| `SESSION_SECRET` | String | Encryption key for signing user session cookies |
| `APP_BASE_URL` | String | Public app URL (ngrok locally, onrender.com in prod) |
| `FALLBACK_MESSAGE` | String | Message sent if n8n/AI fails (e.g. *"Sorry, I'm having trouble answering right now. Please try again in a moment."*) |
| `TZ` | String | `Asia/Karachi` |
| `LOG_LEVEL` | String | `INFO` in production, `DEBUG` locally |

---

## 6. Backend API Specification & Webhook Contracts

### Webhook & WhatsApp Bridge
* **`GET /webhook/whatsapp`**: Meta verification challenge.
  * Query parameters: `hub.mode`, `hub.verify_token`, `hub.challenge`.
  * Verifies `hub.verify_token == META_VERIFY_TOKEN`.
  * Returns `hub.challenge` as plain text with status `200`, or `403 Forbidden`.
* **`POST /webhook/whatsapp`**: Inbound WhatsApp event handler.
  * Verifies `X-Hub-Signature-256` HMAC against raw bytes.
  * Extracts message ID, text/media, sender `wa_id`, profile name.
  * Deduplicates against `messages.wa_message_id`.
  * Enqueues background async worker.
  * Returns `{"status": "ok"}` with status `200` in `<300ms`.
* **`POST /internal/reply`**: n8n bot callback receiver.
  * Header required: `X-Callback-Secret: <N8N_CALLBACK_SECRET>` (constant-time comparison).
  * Payload: `{"conversation_id": 4812, "wa_id": "923001234567", "text": "...", "status": "ok"}`.
  * Sends text to Meta Graph API `POST /{META_PHONE_NUMBER_ID}/messages`.
  * Logs outbound row into `messages`.

### System & Health
* **`GET /health`**: Returns `200 OK` with DB ping status. Used by Render health check and external keep-alive pingers.

### Authentication Endpoints
* **`POST /login`**: Validates credentials against `app_users` (Argon2/Bcrypt), returns HTTP-only session cookie.
* **`POST /logout`**: Clears the session cookie.
* **`GET /me`**: Returns currently logged-in user profile (`email`, `role`).

### Conversation Viewer REST Endpoints
* **`GET /conversations?page=1&limit=50`**: List conversations, newest first, with contact name, phone, last message timestamp, and count.
* **`GET /conversations/{id}`**: Returns full message transcript for a specific conversation.
* **`GET /search?q=...&from=...&to=...&page=1&limit=50`**: Full-text search across `messages.body` using the GIN index or phone number search with date range filtering.
* **`GET /leads?page=1&limit=50`**: List unique contacts with first seen, last seen, and message count.
* **`GET /export/leads.csv` & `GET /export/leads.xlsx`**: Stream CSV or Excel file containing filtered leads.
* **`GET /errors?limit=50`**: Returns recent errors from `error_log`.
* **`GET /users`**, **`POST /users`**, **`PATCH /users/{id}`**, **`DELETE /users/{id}`**: Admin user management for viewer accounts.

---

## 7. n8n Integration Contract & 60-Second Watchdog

### 1. App → n8n Dispatch Payload
FastAPI background task POSTs to `N8N_WEBHOOK_URL`:
```json
{
  "conversation_id": 4812,
  "wa_id": "923001234567",
  "profile_name": "Ahmed",
  "message": "Do you deliver to Lahore?",
  "message_id": "wamid.HBgM...",
  "callback_url": "https://<app_url>/internal/reply"
}
```

### 2. n8n → App Callback Payload
n8n POSTs to `POST /internal/reply`:
* **Header:** `X-Callback-Secret: <N8N_CALLBACK_SECRET>`
```json
{
  "conversation_id": 4812,
  "wa_id": "923001234567",
  "text": "Yes — we deliver across Lahore within 2 working days.",
  "status": "ok"
}
```

### 3. The 60-Second Watchdog
If n8n fails to reply within **60 seconds**, an internal timeout handler triggers:
1. Logs a `timeout` entry in `error_log`.
2. Automatically delivers `FALLBACK_MESSAGE` to the customer on WhatsApp so they are not left stranded.

---

## 8. Error Handling & Reliability Matrix

| Scenario | System Behavior |
| :--- | :--- |
| **Invalid HMAC Signature** | Log warning, return `403 Forbidden`. Drop immediately without processing. |
| **Duplicate `wa_message_id`** | Return `200 OK` immediately, skip duplicate execution (Idempotent). |
| **n8n Down / HTTP Non-2xx** | Retry 3× with exponential backoff (`2s`, `4s`, `8s`). On final failure, write `error_log` and send `FALLBACK_MESSAGE`. |
| **No n8n Callback (<60s)** | 60-second watchdog fires, logs timeout in `error_log`, sends `FALLBACK_MESSAGE`. |
| **n8n returns `status: "error"`** | Log reported step and error, send `FALLBACK_MESSAGE`. |
| **Meta Cloud API Send Fails** | Retry 2×. If still failing, write `error_log` with Meta's specific error code and response body. |
| **Supabase DB Unreachable** | Attempt to deliver the WhatsApp reply regardless; log errors to `stdout` so Render captures them. |

---

## 9. Security Requirements

1. **HMAC Webhook Verification**: Compute HMAC-SHA256 on the **raw incoming request body bytes** using `META_APP_SECRET`. Compare with `X-Hub-Signature-256` using constant-time comparison (`hmac.compare_digest`). Never re-serialize JSON before HMAC verification.
2. **Shared Callback Secret**: Guard `/internal/reply` with `X-Callback-Secret` and compare in constant time.
3. **Password Security**: Passwords stored as hashes using Argon2 or Bcrypt.
4. **Session Cookies**: `HttpOnly`, `Secure`, `SameSite=Lax`.
5. **No Customer PII Leaks**: Customer phone numbers and message transcripts must never be committed to source code or logged in plain text.

---

## 10. Frontend Status — All 8 Milestones Completed

The Next.js 16 frontend is fully built and operational inside [`frontend/`](file:///c:/Users/hp/Desktop/Eureka%20%20Web%20Project/frontend):

| Milestone | Status | Description |
| :--- | :---: | :--- |
| **1. Scaffold & Auth** | Done | Next.js App Router, Tailwind v4, login page at `/login`, session context, top navigation. |
| **2. Conversations List** | Done | Split-pane inbox at `/conversations`, contact names, phone formatting, 24h badges, pagination. |
| **3. Thread View** | Done | Chat view at `/conversations/[id]`, customer left / bot right bubbles, day dividers, Asia/Karachi timestamps, image/audio previews, strictly read-only. |
| **4. Search & Filters** | Done | Keyword + phone query at `/search`, date range picker (`From`/`To`), presets (`Today`, `7 Days`, `30 Days`), query chips. |
| **5. Leads Page** | Done | Unique contacts table at `/leads`, metrics cards, CSV & XLSX export functionality. |
| **6. Error Log Page** | Done | Diagnostic log at `/errors`, filter by failure step (`n8n`, `meta_send`, `webhook`, `db`), JSON payload inspector modal. |
| **7. Users Management** | Done | Admin-gated page at `/users`, list viewer accounts, add user modal, enable/disable toggle. |
| **8. Polish Pass** | Done | WhatsApp emerald design theme (`#00a884`), mobile responsive nav, loading skeletons, built-in mock mode (`USE_MOCK`). |

---

## 11. How to Run & Test the Application

### Running the Frontend
```powershell
# Navigate into the frontend folder
cd "c:\Users\hp\Desktop\Eureka  Web Project\frontend"

# Install dependencies (if needed)
npm install

# Start development server
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser:
* Click **"Fill Admin"** or **"Fill Viewer"** on the login page to enter immediately.
* The frontend is currently running in mock mode (`NEXT_PUBLIC_USE_MOCK=true`) for instant testing. When the backend is ready, set `NEXT_PUBLIC_USE_MOCK=false` in `frontend/.env`.

---

## 12. Deployment & Production Guidelines

### Render (Free Plan Constraints)
* **Cold Starts (15-min idle sleep)**: Free web services spin down after 15 minutes of inactivity. First webhook can take ~50 seconds to wake up.
  * **Mitigation**: Setup an external keep-alive cron (e.g. `cron-job.org` or `UptimeRobot`) to ping `GET /health` every 10 minutes.
  * **Idempotency**: Strict deduplication on `wa_message_id` prevents duplicate replies if Meta retries during spin-up.
* **Database**: Do **not** use Render's free PostgreSQL (expires in 30 days). Always use **Supabase** for persistence.
* **Public URL / Tunnel**: For local testing with Meta webhooks, use **ngrok** (`ngrok http 8000`) or **cloudflared**. Set `APP_BASE_URL` to the HTTPS tunnel URL and register `{APP_BASE_URL}/webhook/whatsapp` in Meta's Developer Dashboard.
