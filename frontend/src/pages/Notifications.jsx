import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { notificationsAPI } from '../services/api';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);
  const holdTimerRef = useRef(null);

  const handleTouchStart = (notifId) => {
    holdTimerRef.current = setTimeout(() => {
      setOpenMenuId(notifId);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await notificationsAPI.getAll();
      setNotifications(data);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleDelete = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await notificationsAPI.delete(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
    setOpenMenuId(null);
  };

  const handleClearAll = async () => {
    setClearing(true);
    setShowClearModal(false);
    try {
      await notificationsAPI.clearAll();
      setNotifications([]);
    } catch (err) {
      console.error('Failed to clear notifications:', err);
    } finally {
      setClearing(false);
    }
  };

  const getNotificationText = (notif) => {
    switch (notif.type) {
      case 'like':
        return 'liked your post';
      case 'comment':
        return 'commented on your post';
      case 'follow':
        return 'started following you';
      case 'post':
        return 'posted something new';
      case 'share':
        return 'shared your post';
      case 'message':
        return 'sent you a message';
      default:
        return 'interacted with you';
    }
  };

  const getNotificationLink = (notif) => {
    if (notif.type === 'message') return '/messages';
    if (notif.post) return `/profile/${notif.sender?.id}`;
    return `/profile/${notif.sender?.id}`;
  };

  const hasUnread = notifications.some((n) => !n.isRead);

  if (loading) {
    return (
      <div className="notifications-page">
        <div className="notifications-header">
          <h1 className="notifications-title">Notifications</h1>
        </div>
        <div className="notifications-list">
          <div className="skeleton-notif-item">
            <div className="skeleton skeleton-avatar skeleton-round" />
            <div className="skeleton-notif-content">
              <div className="skeleton skeleton-notif-text" />
              <div className="skeleton skeleton-notif-text short" />
            </div>
          </div>
          <div className="skeleton-notif-item">
            <div className="skeleton skeleton-avatar skeleton-round" />
            <div className="skeleton-notif-content">
              <div className="skeleton skeleton-notif-text" />
              <div className="skeleton skeleton-notif-text short" />
            </div>
          </div>
          <div className="skeleton-notif-item">
            <div className="skeleton skeleton-avatar skeleton-round" />
            <div className="skeleton-notif-content">
              <div className="skeleton skeleton-notif-text" />
              <div className="skeleton skeleton-notif-text short" />
            </div>
          </div>
          <div className="skeleton-notif-item">
            <div className="skeleton skeleton-avatar skeleton-round" />
            <div className="skeleton-notif-content">
              <div className="skeleton skeleton-notif-text" />
              <div className="skeleton skeleton-notif-text short" />
            </div>
          </div>
          <div className="skeleton-notif-item">
            <div className="skeleton skeleton-avatar skeleton-round" />
            <div className="skeleton-notif-content">
              <div className="skeleton skeleton-notif-text" />
              <div className="skeleton skeleton-notif-text short" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <h1 className="notifications-title">Notifications</h1>
        <div className="notifications-header-actions">
          {hasUnread && (
            <button className="btn-mark-read" onClick={handleMarkAllRead}>
              Mark all as read
            </button>
          )}
          {notifications.length > 0 && (
            <button className="notif-clear-all-btn" onClick={() => setShowClearModal(true)} title="Clear all notifications">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="notifications-empty">
          <i className="ti ti-bell-off"></i>
          <p>No notifications yet</p>
          <span>When someone likes, comments on your posts or follows you, it will show up here.</span>
        </div>
      ) : (
        <div className="notifications-list">
          {notifications.map((notif) => (
            <div key={notif.id} className="notification-item-wrapper" onTouchStart={() => handleTouchStart(notif.id)} onTouchEnd={handleTouchEnd} onTouchMove={handleTouchEnd}>
              <Link
                to={getNotificationLink(notif)}
                className={`notification-item${!notif.isRead ? ' unread' : ''}`}
                onClick={() => !notif.isRead && handleMarkRead(notif.id)}
              >
                <div className="notif-avatar">
                  {notif.sender?.avatar ? (
                    <img src={notif.sender.avatar} alt={notif.sender.name} />
                  ) : (
                    notif.sender?.name?.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="notif-body">
                  <p className="notif-text">
                    <strong>{notif.sender?.name || 'Someone'}</strong>{' '}
                    {getNotificationText(notif)}
                  </p>
                  {notif.post?.content && (
                    <p className="notif-preview">{notif.post.content}</p>
                  )}
                  <span className="notif-time">
                    {timeAgo(notif.createdAt)}
                  </span>
                </div>
                {!notif.isRead && <span className="notif-dot"></span>}
              </Link>
              <div className="notif-menu-container" ref={openMenuId === notif.id ? menuRef : null}>
                <button
                  className="notif-menu-trigger"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpenMenuId(openMenuId === notif.id ? null : notif.id); }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="5" r="2" />
                    <circle cx="12" cy="12" r="2" />
                    <circle cx="12" cy="19" r="2" />
                  </svg>
                </button>
                {openMenuId === notif.id && (
                  <div className="notif-dropdown">
                    <button className="notif-dropdown-item" onClick={(e) => handleDelete(notif.id, e)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                      Delete this notification
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showClearModal && (
        <div className="modal-overlay" onClick={() => setShowClearModal(false)}>
          <div className="modal-content notif-clear-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Clear all notifications?</h3>
            <p>This will permanently delete all your notifications.</p>
            <div className="modal-actions">
              <button className="modal-btn modal-btn-cancel" onClick={() => setShowClearModal(false)}>Cancel</button>
              <button className="modal-btn modal-btn-danger" onClick={handleClearAll} disabled={clearing}>
                {clearing ? 'Clearing...' : 'Clear all notifications'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const timeAgo = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
};

export default Notifications;
