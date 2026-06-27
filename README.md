# Social Media App

A full-stack social media application built with the MERN stack (MongoDB, Express, React, Node.js) featuring real-time messaging, notifications, and a professional dark-themed UI.

## Tech Stack

| Layer         | Technology                                      |
|---------------|-------------------------------------------------|
| Frontend      | React 19 (CRA), React Router DOM 7, Axios       |
| Backend       | Node.js, Express 4, Socket.IO 4                 |
| Database      | MongoDB + Mongoose 8                            |
| Auth          | JWT + bcryptjs                                  |
| File Uploads  | Multer (disk storage)                           |
| Real-time     | Socket.IO (JWT-authenticated WebSocket)         |
| Styling       | Plain CSS with custom properties (no framework) |
| Icons         | Tabler Icons (CDN)                              |
| Fonts         | DM Serif Display + DM Sans (Google Fonts)       |

## Project Structure

```
social_media_app/
├── backend/
│   ├── index.js                  # Express + Socket.IO server entry
│   ├── config/database.js        # MongoDB connection
│   ├── middleware/auth.js        # JWT auth middleware
│   ├── models/
│   │   ├── User.js               # name, email, password, avatar, bio, followers, following
│   │   ├── Post.js               # content, image, author, likes, shares, sharedFrom, comments
│   │   ├── Comment.js            # content, author, post
│   │   ├── Like.js               # user, post
│   │   ├── Follow.js             # follower, following
│   │   ├── Conversation.js       # participants, lastMessage, unreadCount
│   │   ├── Message.js            # conversation, sender, content, replyTo, attachments, deleted
│   │   └── Notification.js       # recipient, sender, type, post, isRead
│   ├── routes/
│   │   ├── auth.js               # /api/auth (register, login, me)
│   │   ├── posts.js              # /api/posts (CRUD, like, comment, reply, share, trending)
│   │   ├── users.js              # /api/users (profile, follow, search, suggested)
│   │   ├── messages.js           # /api/messages (conversations, send, upload, delete, clear)
│   │   └── notifications.js      # /api/notifications (list, unread, mark read)
│   ├── socket/
│   │   ├── socket.js             # Socket.IO setup, auth, connection tracking
│   │   └── notify.js             # sendNotification helper
│   └── uploads/messages/         # Message file attachments
│
├── frontend/
│   ├── public/
│   │   ├── index.html            # Tabler Icons CDN
│   │   └── manifest.json         # PWA manifest
│   └── src/
│       ├── index.jsx             # React entry point
│       ├── App.jsx               # Routing, Sidebar, MobileBottomNav, ProtectedLayout
│       ├── components/
│       │   ├── Navbar.jsx        # Top nav, user dropdown, theme toggle
│       │   ├── PostCard.jsx      # Post display with like/comment/share/delete
│       │   └── CreatePost.jsx    # Post creation form
│       ├── context/
│       │   ├── AuthContext.jsx   # Auth state (login, register, logout, loadUser)
│       │   └── ThemeContext.js   # Dark/light theme toggle
│       ├── pages/
│       │   ├── Home.jsx          # Feed + trending + suggested users
│       │   ├── Login.jsx         # Login form
│       │   ├── Register.jsx      # Registration form
│       │   ├── Profile.jsx       # User profile with posts, follow/unfollow
│       │   ├── Messages.jsx      # Chat UI (conversations, emoji, attachments, context menu)
│       │   ├── Notifications.jsx # Notification list with mark-read
│       │   ├── Search.jsx        # User search by name/email
│       │   └── Settings.jsx      # Theme toggle, account info, stats
│       ├── services/api.js       # Axios instance + all API endpoint functions
│       ├── hooks/useSocket.jsx   # Socket.IO connection hook
│       ├── utils/sound.js        # Web Audio API notification sound
│       └── styles/
│           ├── tokens.css        # Design tokens (CSS custom properties)
│           ├── global.css        # Reset, base typography, fonts
│           ├── responsive.css    # Mobile/tablet breakpoints
│           └── components/       # Per-component CSS files
│               ├── auth.css, navbar.css, post.css, home.css,
│               ├── profile.css, messages.css, notifications.css,
│               ├── search.css, settings.css, design-system.css
```

## Features

### Authentication
- Register/login with JWT tokens stored in localStorage
- Axios interceptor auto-attaches Bearer token; 401 redirects to login

### Posts & Social Interactions
- Create posts with text + optional image URL
- Like/unlike with real-time notification to post author
- Comment with nested replies (1 level deep)
- Share/repost (creates new post quoting original); duplicate share blocked
- Paginated feed from followed users + own posts with "Load More"
- Trending hashtags via aggregation pipeline
- Delete own posts (cascades likes/comments)

### User Profiles & Social Graph
- Profile page with avatar, bio, follower/following/post counts
- Follow/unfollow with real-time notification
- Suggested users (random 5 not followed)
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
- Socket.IO with JWT auth, per-user rooms
- Events: new notification (like/comment/follow/message)
- Badge count in sidebar (notifications + messages)
- Notification sound via Web Audio API

### Theme System
- Dark/light toggle persisted in localStorage
- 4 surface levels, 4 text levels, accent/success/gold/alert colors
- Toggle in navbar + settings page

### Responsive Design
- Desktop: 3-column grid (sidebar 220px, feed, right panel 260px)
- Mobile (<=768px): Single column, fixed bottom nav, hamburger sidebar
- Small mobile (<=480px): Compact sizing throughout

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### Environment Variables

**backend/.env**
```
MONGO_URI=mongodb://localhost:27017/socialmedia
JWT_SECRET=your_jwt_secret
PORT=5000
```

**frontend/.env**
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

### Installation

```bash
# Backend
cd backend
npm install
npm start        # starts on port 5000

# Frontend
cd frontend
npm install
npm start        # starts on port 3000
```

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| POST   | /api/auth/register | Register user |
| POST   | /api/auth/login | Login |
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
