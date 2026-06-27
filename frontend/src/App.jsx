import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { notificationsAPI, messagesAPI } from './services/api';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider, useSocket } from './context/SocketContext';
import { playNotificationSound } from './utils/sound';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Search from './pages/Search';
import Notifications from './pages/Notifications';
import Messages from './pages/Messages';
import Settings from './pages/Settings';
import DesignSystem from './pages/DesignSystem';

const Sidebar = ({ collapsed, onToggleCollapse }) => {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const { socket } = useSocket();
  const [unreadCount, setUnreadCount] = useState(0);
  const [msgUnread, setMsgUnread] = useState(0);

  const fetchUnread = useCallback(async () => {
    if (!user) return;
    try {
      const [notifRes, msgRes] = await Promise.all([
        notificationsAPI.getUnreadCount(),
        messagesAPI.getUnreadCount()
      ]);
      setUnreadCount(notifRes.data.count);
      setMsgUnread(msgRes.data.count);
    } catch {}
  }, [user]);

  useEffect(() => { fetchUnread(); }, [fetchUnread]);
  useEffect(() => { fetchUnread(); }, [pathname, fetchUnread]);

  useEffect(() => {
    const handler = () => fetchUnread();
    window.addEventListener('msgUnreadChanged', handler);
    return () => window.removeEventListener('msgUnreadChanged', handler);
  }, [fetchUnread]);

  useEffect(() => {
    if (!socket) return;
    const onNotif = () => {
      setUnreadCount((prev) => prev + 1);
      playNotificationSound();
    };
    const onMsg = () => setMsgUnread((prev) => prev + 1);
    socket.on('newNotification', onNotif);
    socket.on('newMessage', onMsg);
    return () => {
      socket.off('newNotification', onNotif);
      socket.off('newMessage', onMsg);
    };
  }, [socket]);

  return (
    <aside className={`sidebar${collapsed ? ' sidebar-collapsed' : ''}`}>
      <button className="sidebar-collapse-btn" onClick={onToggleCollapse} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
        {collapsed ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        )}
      </button>
      <div className="sidebar-section">{collapsed ? '' : 'Main'}</div>
      <Link className={`nav-item${pathname === '/' ? ' active' : ''}`} to="/" title={collapsed ? 'Home' : ''}>
        <i className="ti ti-home-2"></i> {collapsed ? '' : 'Home'}
      </Link>
      <Link className={`nav-item${pathname === '/search' ? ' active' : ''}`} to="/search" title={collapsed ? 'Discover' : ''}>
        <i className="ti ti-search"></i> {collapsed ? '' : 'Discover'}
      </Link>
      <Link className={`nav-item${pathname === '/notifications' ? ' active' : ''}`} to="/notifications" title={collapsed ? 'Notifications' : ''}>
        <i className="ti ti-bell"></i> {collapsed ? '' : 'Notifications'}
        {unreadCount > 0 && <span className="nav-badge">{unreadCount}</span>}
      </Link>
      <Link className={`nav-item${pathname === '/messages' ? ' active' : ''}`} to="/messages" title={collapsed ? 'Messages' : ''}>
        <i className="ti ti-message-circle"></i> {collapsed ? '' : 'Messages'}
        {msgUnread > 0 && <span className="nav-badge">{msgUnread}</span>}
      </Link>
      <Link className={`nav-item${pathname.startsWith('/profile') ? ' active' : ''}`} to={user ? `/profile/${user.id}` : '/login'} title={collapsed ? 'Profile' : ''}>
        <i className="ti ti-user"></i> {collapsed ? '' : 'Profile'}
      </Link>
      <Link className={`nav-item${pathname === '/settings' ? ' active' : ''}`} to="/settings" title={collapsed ? 'Settings' : ''}>
        <i className="ti ti-settings"></i> {collapsed ? '' : 'Settings'}
      </Link>
    </aside>
  );
};

const MobileBottomNav = () => {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const { socket } = useSocket();
  const [notifCount, setNotifCount] = useState(0);
  const [msgCount, setMsgCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      notificationsAPI.getUnreadCount(),
      messagesAPI.getUnreadCount()
    ]).then(([notifRes, msgRes]) => {
      setNotifCount(notifRes.data.count);
      setMsgCount(msgRes.data.count);
    }).catch(() => {});
  }, [user, pathname]);

  useEffect(() => {
    const handler = () => {
      Promise.all([
        notificationsAPI.getUnreadCount(),
        messagesAPI.getUnreadCount()
      ]).then(([notifRes, msgRes]) => {
        setNotifCount(notifRes.data.count);
        setMsgCount(msgRes.data.count);
      }).catch(() => {});
    };
    window.addEventListener('msgUnreadChanged', handler);
    return () => window.removeEventListener('msgUnreadChanged', handler);
  }, [user]);

  useEffect(() => {
    if (!socket) return;
    const onNotif = () => setNotifCount((p) => p + 1);
    const onMsg = () => setMsgCount((p) => p + 1);
    socket.on('newNotification', onNotif);
    socket.on('newMessage', onMsg);
    return () => {
      socket.off('newNotification', onNotif);
      socket.off('newMessage', onMsg);
    };
  }, [socket]);

  return (
    <nav className="mobile-bottom-nav">
      <Link className={`nav-item${pathname === '/' ? ' active' : ''}`} to="/">
        <i className="ti ti-home-2"></i>
      </Link>
      <Link className={`nav-item${pathname === '/search' ? ' active' : ''}`} to="/search">
        <i className="ti ti-search"></i>
      </Link>
      <Link className={`nav-item${pathname === '/notifications' ? ' active' : ''}`} to="/notifications">
        <i className="ti ti-bell"></i>
        {notifCount > 0 && <span className="nav-badge">{notifCount}</span>}
      </Link>
      <Link className={`nav-item${pathname === '/messages' ? ' active' : ''}`} to="/messages">
        <i className="ti ti-message-circle"></i>
        {msgCount > 0 && <span className="nav-badge">{msgCount}</span>}
      </Link>
      <Link className={`nav-item${pathname.startsWith('/profile') ? ' active' : ''}`} to={user ? `/profile/${user.id}` : '/login'}>
        <i className="ti ti-user"></i>
      </Link>
    </nav>
  );
};

const ProtectedLayout = ({ children }) => {
  const { user, loading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleToggleCollapse = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sidebarCollapsed', next);
      return next;
    });
  };

  const showCollapsed = sidebarCollapsed && !isMobile;

  if (loading) return (
    <div className="app-loading-skeleton">
      <div className="app-loading-sidebar">
        <div className="skeleton" style={{ height: 20, width: 80, margin: '20px auto' }} />
        <div className="skeleton" style={{ height: 20, width: 80, margin: '12px auto' }} />
        <div className="skeleton" style={{ height: 20, width: 80, margin: '12px auto' }} />
        <div className="skeleton" style={{ height: 20, width: 80, margin: '12px auto' }} />
      </div>
      <div className="app-loading-content">
        <div className="skeleton-post-card">
          <div className="skeleton-post-header">
            <div className="skeleton skeleton-avatar skeleton-round" />
            <div className="skeleton skeleton-name" />
          </div>
          <div>
            <div className="skeleton skeleton-text" style={{ marginBottom: 6 }} />
            <div className="skeleton skeleton-text short" />
          </div>
          <div className="skeleton skeleton-media" />
          <div className="skeleton-actions">
            <div className="skeleton skeleton-action" />
            <div className="skeleton skeleton-action" />
            <div className="skeleton skeleton-action" />
          </div>
        </div>
        <div className="skeleton-post-card" style={{ marginTop: 12 }}>
          <div className="skeleton-post-header">
            <div className="skeleton skeleton-avatar skeleton-round" />
            <div className="skeleton skeleton-name" />
          </div>
          <div>
            <div className="skeleton skeleton-text" style={{ marginBottom: 6 }} />
            <div className="skeleton skeleton-text short" />
          </div>
          <div className="skeleton skeleton-media" />
          <div className="skeleton-actions">
            <div className="skeleton skeleton-action" />
            <div className="skeleton skeleton-action" />
            <div className="skeleton skeleton-action" />
          </div>
        </div>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" />;
  return (
    <div>
      <Navbar />
      <div className={`app-layout${showCollapsed ? ' sidebar-collapsed' : ''}`}>
        <Sidebar collapsed={showCollapsed} onToggleCollapse={handleToggleCollapse} />
        <main className="app-content">{children}</main>
      </div>
      <MobileBottomNav />
    </div>
  );
};

const PublicLayout = ({ children }) => {
  return <div>{children}</div>;
};

const AppContent = () => {
  return (
    <Routes>
      <Route path="/login" element={<PublicLayout><Login /></PublicLayout>} />
      <Route path="/register" element={<PublicLayout><Register /></PublicLayout>} />
      <Route path="/design-system" element={<DesignSystem />} />
      <Route path="/" element={<ProtectedLayout><Home /></ProtectedLayout>} />
      <Route path="/profile/:id" element={<ProtectedLayout><Profile /></ProtectedLayout>} />
      <Route path="/search" element={<ProtectedLayout><Search /></ProtectedLayout>} />
      <Route path="/notifications" element={<ProtectedLayout><Notifications /></ProtectedLayout>} />
      <Route path="/messages" element={<ProtectedLayout><Messages /></ProtectedLayout>} />
      <Route path="/settings" element={<ProtectedLayout><Settings /></ProtectedLayout>} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <AppContent />
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;