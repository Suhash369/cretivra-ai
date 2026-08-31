# CRETIVRA AI — User Authentication & Data Storage Architecture

This document answers where user login credentials and search/chat history are stored when deploying Cretivra AI for multiple users.

---

## 🔒 1. Where is User Login Info Saved?

User login credentials are saved in **Supabase PostgreSQL** (or SQLite database in local mode) inside the **`users`** table.

### Security Implementation:
- **Passwords**: Passwords are **NEVER stored in plain text**. They are hashed using **PBKDF2-HMAC-SHA256 with 100,000 iterations** and a unique cryptographic salt per user.
- **Authentication Tokens**: Upon login, the system generates a signed **JWT Access Token** stored in the client browser's `localStorage` (`cretivra_auth_token`).

### `users` Table Schema:
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (VARCHAR) | Primary key unique user identifier |
| `email` | VARCHAR (UNIQUE) | User's login email address |
| `password_hash` | VARCHAR | Encrypted PBKDF2 salt + hash |
| `full_name` | VARCHAR | User's display name |
| `created_at` | TIMESTAMP | Account creation timestamp |

---

## 💬 2. Where is Searching & Chat History Saved?

Each user's search and conversation history is saved in **Supabase PostgreSQL** across two tables:
1. **`conversations`**: Stores chat sessions, titles, model configurations, and ownership (`user_id`).
2. **`messages`**: Stores user prompts and AI responses linked to `conversation_id`.

### Multi-User Data Isolation:
- Every conversation has a `user_id` foreign key referencing the logged-in user.
- When **User A** logs in, Cretivra AI queries `WHERE user_id = 'user_A_id'`. User A **only sees their own search history**.
- When **User B** logs in, they only see User B's search history.

---

## 🚀 3. Summary Diagram

```text
  User Interface (Vercel / Local React App)
                     │
              Sign In / Sign Up
                     │
                     ▼
           Render FastAPI Backend
                     │
    ┌────────────────┴────────────────┐
    │                                 │
    ▼                                 ▼
`users` Table                   `conversations` & `messages`
(Supabase PostgreSQL)           (Supabase PostgreSQL)
- email                         - user_id -> User
- password_hash (PBKDF2)        - conversation title & messages
- full_name                     - search history per user
```
