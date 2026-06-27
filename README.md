# Nexus Social

A full-stack social media platform built with React 19, Node.js/Express, and Firebase — featuring real-time messaging, live notifications, and a professional dark/light themed UI.

## Tech Stack

| Layer         | Technology                                         |
|---------------|----------------------------------------------------|
| Frontend      | React 19 (CRA), React Router DOM 7, Axios          |
| Backend       | Node.js, Express 4, Socket.IO 4, Firebase Admin 12 |
| Database      | Firestore (NoSQL)                                  |
| Auth          | Firebase Authentication + Firebase Admin SDK       |
| File Storage  | Firebase Storage / base64 fallback                 |
| Real-time     | Socket.IO (JWT-authenticated WebSocket)            |
| Styling       | Plain CSS with custom properties (no framework)    |
| Icons         | Tabler Icons (CDN)                                 |
| Fonts         | DM Serif Display + DM Sans (Google Fonts)          |

## Project Structure

```
nexus-social/
├── backend/
│   ├── index.js                    # Express + Socket.IO server entry
│   ├── config/
│   │   ├── database.js             # Firestore connection health check
│   │   └── Firebase.js             # Firebase Admin init, Firestore/Auth/Storage refs
│   ├── middleware/auth.js          # Firebase ID token verification
│   ├── models/                     # Mongoose-like wrappers using Firestore
│   │   └── User.js, Post.js, Comment.js, Like.js, Follow.js,
│   │       Conversation.js, Message.js, Notification.js
│   ├── routes/
│   │   ├── auth.js                 # /api/auth (register, login, me)
│   │   ├── posts.js                # /api/posts (CRUD, like, comment, reply, share, trending)
│   │   ├── users.js                # /api/users (profile, follow, search, suggested)
│   │   ├── messages.js             # /api/messages (conversations, send, upload, delete)
│   │   └── notifications.js        # /api/notifications (list, unread, mark read)
│   ├── socket/
│   │   ├── socket.js               # Socket.IO setup, auth, connection tracking
│   │   └── notify.js               # sendNotification helper
│   └── uploads/messages/           # Message file attachments (local fallback)
│
├── frontend/
│   ├── public/
│   │   ├── index.html              # Tabler Icons CDN
│   │   ├── manifest.json           # PWA manifest
│   │   └── Nexus Social icon.png   # App icon / favicon
│   └── src/
│       ├── index.jsx               # React entry point
│       ├── App.jsx                 # Routing, Sidebar, MobileBottomNav, ProtectedLayout
│       ├── firebase.js             # Firebase client SDK init
│       ├── components/
│       │   ├── Navbar.jsx          # Top nav, user dropdown, theme toggle
│       │   ├── PostCard.jsx        # Post display with like/comment/share/delete
│       │   ├── CreatePost.jsx      # Post creation form
│       │   ├── EditProfile.jsx     # Edit profile modal
│       │   └── ImageViewer.jsx     # Full-screen image viewer
│       ├── context/
│       │   ├── AuthContext.jsx     # Auth state (Firebase + backend)
│       │   ├── ThemeContext.js     # Dark/light theme toggle
│       │   └── SocketContext.jsx   # Socket.IO connection context
│       ├── pages/
│       │   ├── Home.jsx            # Feed + trending + suggested users
│       │   ├── Login.jsx           # Firebase Auth login
│       │   ├── Register.jsx        # Firebase Auth registration
│       │   ├── Profile.jsx         # User profile with posts, follow/unfollow
│       │   ├── Messages.jsx        # Chat UI (conversations, emoji, attachments)
│       │   ├── Notifications.jsx   # Notification list with mark-read
│       │   ├── Search.jsx          # User search by name/email
│       │   ├── Settings.jsx        # Theme toggle, account info, stats
│       │   └── DesignSystem.jsx    # Design token preview page
│       ├── hooks/
│       │   └── useSocket.jsx       # Socket.IO connection hook
│       ├── services/api.js         # Axios instance + all API endpoint functions
│       ├── utils/sound.js          # Web Audio API notification sound
│       └── styles/
│           ├── tokens.css          # Design tokens (CSS custom properties)
│           ├── global.css          # Reset, base typography, fonts, scrollbar
│           ├── responsive.css      # Mobile/tablet breakpoints
│           └── components/         # Per-component CSS files
│               ├── auth.css, navbar.css, post.css, home.css,
│               ├── profile.css, messages.css, notifications.css,
│               ├── search.css, settings.css, skeleton.css,
│               └── design-system.css
```

## Features

### Authentication
- Firebase Authentication (email/password) via Firebase client SDK
- Firebase Admin SDK verifies ID tokens on the backend
- Axios interceptor auto-attaches Bearer token; 401 redirects to login

### Posts & Social Interactions
- Create posts with text + optional image
- Like/unlike with real-time notification to post author
- Comment with nested replies (1 level deep)
- Share/repost (creates new post quoting original); duplicate share blocked
- Paginated feed from followed users + own posts with "Load More"
- Trending hashtags via aggregation
- Delete own posts (cascades likes/comments via batch writes)

### User Profiles & Social Graph
- Profile page with avatar, bio, follower/following/post counts
- Follow/unfollow with real-time notification
- Suggested users (random selection from Firestore)
- Real-time user search by name/email

### Direct Messaging
- One-on-one conversations, sorted by recency
- Text messages with 1000-char limit
- Reply to messages with quoted preview
- File attachments (images, documents, audio, zip) via Multer (10MB limit, 5 files)
- Emoji picker (56 Twemoji SVGs)
- Location sharing via OpenStreetMap link
- Unread counts per conversation with sidebar badges
- Delete for me (soft hide) / Delete for everyone (sender only)
- Clear entire chat
- Context menu via double-click (desktop) or long-press (mobile)

### Real-Time Notifications
- Socket.IO with Firebase Auth token, per-user rooms
- Events: new notification (like/comment/follow/message)
- Badge count in sidebar (notifications + messages)
- Notification sound via Web Audio API

### Theme System
- Dark/light toggle persisted in localStorage
- 4 surface levels, 4 text levels, accent/success/gold/alert colors
- Toggle in navbar + settings page
- Custom scrollbar adapting to theme

### Responsive Design
- Desktop: 3-column grid (sidebar 220px, feed, right panel 260px)
- Mobile (<=768px): Single column, fixed bottom nav, hamburger sidebar
- Small mobile (<=480px): Compact sizing throughout

## Getting Started

### Prerequisites
- Node.js 18+
- A Firebase project (Firestore, Authentication, Storage enabled)

### Firebase Setup
1. Create a Firebase project at https://console.firebase.google.com
2. Enable **Authentication** (Email/Password sign-in)
3. Create a **Firestore** database
4. Enable **Storage** (optional)
5. Generate a **service account key** (Project Settings > Service Accounts > Generate New Private Key)
6. Register a web app in Firebase to get the client SDK config

### Environment Variables

**backend/.env**
```
PORT=5000
FIREBASE_PROJECT_ID=your_firebase_project_id
CLIENT_URL=http://localhost:3000
```

Then add your Firebase Admin SDK credentials — either:
- Save the service account JSON as `backend/config/service_account_key.json`, or
- Set the `FIREBASE_SERVICE_ACCOUNT` env var to the full JSON string

**frontend/.env**
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

Also configure your Firebase client SDK in `frontend/src/firebase.js` with your project's web app config.

### Installation

```bash
# Backend
cd backend
npm install
npm run dev     # starts on port 5000 with nodemon

# Frontend
cd frontend
npm install
npm start       # starts on port 3000
```

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| POST   | /api/auth/register | Register user (Firebase ID token) |
| POST   | /api/auth/login | Login (auto-creates user doc if new) |
| GET    | /api/auth/me | Get current user |
| GET    | /api/posts | Paginated feed |
| POST   | /api/posts | Create post |
| DELETE | /api/posts/:id | Delete post |
| POST   | /api/posts/:id/like | Toggle like |
| POST   | /api/posts/:id/comment | Add comment |
| POST   | /api/posts/:id/comment/:cid/reply | Reply to comment |
| POST   | /api/posts/:id/share | Share/repost |
| GET    | /api/posts/trending | Trending hashtags |
| GET    | /api/users/:id | Get profile |
| POST   | /api/users/:id/follow | Toggle follow |
| GET    | /api/users/search | Search users |
| GET    | /api/users/suggested | Suggested users |
| GET    | /api/users/:id/followers | Follower list |
| GET    | /api/users/:id/following | Following list |
| GET    | /api/messages/conversations | List conversations |
| POST   | /api/messages/conversations | Get or create conversation |
| GET    | /api/messages/conversations/:id | Get conversation + messages |
| POST   | /api/messages/conversations/:id/messages | Send message |
| POST   | /api/messages/conversations/:id/upload | Upload attachments |
| DELETE | /api/messages/conversations/:id/messages | Clear chat |
| GET    | /api/messages/unread-count | Total unread messages |
| DELETE | /api/messages/messages/:id | Delete message (scope=me/everyone) |
| GET    | /api/notifications | List notifications |
| GET    | /api/notifications/unread-count | Unread count |
| PUT    | /api/notifications/:id/read | Mark notification read |
| PUT    | /api/notifications/mark-all-read | Mark all read |

## Design Tokens

### Dark Theme (default)

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-base` | `#0d0f12` | Page background |
| `--bg-surface` | `#13161b` | Cards, panels |
| `--bg-elevated` | `#1a1e25` | Modals, dropdowns |
| `--bg-hover` | `#1f2430` | Hover states |
| `--accent` | `#4f8ef7` | Primary actions, links |
| `--text-primary` | `#e8eaf0` | Headings, names |
| `--text-secondary` | `#8b909e` | Body copy |
| `--text-muted` | `#555b6a` | Labels, timestamps |
| `--success` | `#3ecf8e` | Positive indicators |
| `--alert` | `#f47387` | Likes, errors |
| `--gold` | `#c9a84c` | Verified badges |

### Light Theme

Applied via `[data-theme="light"]` on `<html>`. Inverts backgrounds and text colors appropriately.
