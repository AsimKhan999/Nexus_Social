import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { messagesAPI, usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const emojiToTwemojiUrl = (emoji) => {
  const codes = [];
  for (const ch of emoji) {
    const cp = ch.codePointAt(0);
    if (cp !== 0xFE0F) codes.push(cp.toString(16));
  }
  return `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${codes.join('-')}.svg`;
};

const EMOJIS = ['😀','😂','🤣','😍','🥰','😘','😊','🙂','😉','😎','🤩','😢','😭','😤','😡','🥺','😰','😱','🥶','🤗','🤔','🙄','😴','🤤','😈','👻','💀','☠️','💩','👍','👎','👊','✊','🤝','👏','🙌','💪','🔥','❤️','💔','💯','💀','✨','⭐','🌟','🌈','☀️','🌙','🌍','🍕','🍔','🌮','🍺','🥂','🎉','🎊','🎂','🎁','🚀','✈️','🏠','❤️'];

const Messages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [following, setFollowing] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [creating, setCreating] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [menuMsg, setMenuMsg] = useState(null);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [convMenuConv, setConvMenuConv] = useState(null);
  const [convMenuPos, setConvMenuPos] = useState({ x: 0, y: 0 });
  const convMenuJustOpened = useRef(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const searchTimer = useRef(null);
  const messagesEndRef = useRef(null);
  const emojiRef = useRef(null);
  const inputRef = useRef(null);
  const swipeStartRef = useRef(null);
  const swipeElRef = useRef(null);
  const swipeMsgRef = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      const convRes = await messagesAPI.getConversations();
      setConversations(convRes.data);
      try {
        const followRes = await usersAPI.getFollowing(user.id);
        setFollowing(followRes.data.filter((u) => !convRes.data.some((c) =>
          c.participants.some((p) => p.id === u.id)
        )));
      } catch {
        setFollowing([]);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openConversation = async (conv) => {
    setActiveConv(conv);
    setMessages([]);
    setLoadingMessages(true);
    setReplyTo(null);
    try {
      const { data } = await messagesAPI.getConversation(conv.id);
      setMessages(data.messages);
      setConversations((prev) => prev.map((c) =>
        c.id === conv.id
          ? { ...c, unreadCount: { ...c.unreadCount, [user.id]: 0 } }
          : c
      ));
      window.dispatchEvent(new Event('msgUnreadChanged'));
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const startConversation = async (participantId) => {
    if (creating) return;
    setCreating(participantId);
    try {
      const { data } = await messagesAPI.getOrCreateConversation(participantId);
      setConversations((prev) => {
        if (prev.some((c) => c.id === data.id)) return prev;
        return [data, ...prev];
      });
      setFollowing((prev) => prev.filter((u) => u.id !== participantId));
      openConversation(data);
    } catch (err) {
      console.error('Failed to start conversation:', err);
    } finally {
      setCreating(null);
    }
  };

  const handleReply = (msg) => {
    setReplyTo(msg);
    setShowEmojiPicker(false);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const cancelReply = () => setReplyTo(null);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activeConv || sending) return;
    setSending(true);
    try {
      const { data } = await messagesAPI.sendMessage(activeConv.id, text, replyTo?.id);
      setMessages((prev) => [...prev, data]);
      setText('');
      setReplyTo(null);
      window.dispatchEvent(new Event('msgUnreadChanged'));
      setConversations((prev) => {
        const updated = prev.map((c) =>
          c.id === activeConv.id
            ? { ...c, lastMessage: { content: data.content, sender: data.sender, createdAt: data.createdAt } }
            : c
        );
        const idx = updated.findIndex((c) => c.id === activeConv.id);
        if (idx > 0) {
          const item = updated.splice(idx, 1)[0];
          updated.unshift(item);
        }
        return updated;
      });
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleEmojiClick = (emoji) => {
    setText((prev) => prev + emoji);
  };

  const otherParticipant = (conv) => conv?.participants?.find((p) => p.id !== user?.id);

  const handleClearChat = async () => {
    if (!activeConv || clearing) return;
    setShowClearModal(true);
  };

  const confirmClearChat = async () => {
    setClearing(true);
    setShowClearModal(false);
    try {
      await messagesAPI.clearMessages(activeConv.id);
      setMessages([]);
      setConversations((prev) => prev.map((c) =>
        c.id === activeConv.id ? { ...c, lastMessage: undefined } : c
      ));
    } catch (err) {
      console.error('Failed to clear chat:', err);
    } finally {
      setClearing(false);
    }
  };

  const ClearModal = () => (
    <div className="modal-overlay" onClick={() => setShowClearModal(false)}>
      <div className="modal-content messages-clear-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Clear chat?</h3>
        <p>This will permanently delete all messages in this conversation.</p>
        <div className="modal-actions">
          <button className="modal-btn modal-btn-cancel" onClick={() => setShowClearModal(false)}>Cancel</button>
          <button className="modal-btn modal-btn-danger" onClick={confirmClearChat} disabled={clearing}>
            {clearing ? 'Clearing...' : 'Clear chat'}
          </button>
        </div>
      </div>
    </div>
  );

  const timeAgo = (date) => {
    if (!date) return '';
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return new Date(date).toLocaleDateString();
  };

  const goBack = () => setActiveConv(null);

  const handleSearchChange = (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!q.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const { data } = await usersAPI.search(q);
        setSearchResults(data);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  const startFromSearch = async (userId) => {
    setSearchQuery('');
    setSearchResults([]);
    await startConversation(userId);
  };

  const getSenderName = (msg) => {
    if (!msg.sender) return 'Unknown';
    if (typeof msg.sender === 'string') return msg.sender;
    return msg.sender.name || 'Unknown';
  };

  const longPressTimer = useRef(null);
  const pointerStart = useRef(null);

  const showMenu = (x, y, msg) => {
    const menuWidth = 180;
    const menuHeight = 130;
    const margin = 8;
    let adjustedX = x;
    if (adjustedX + menuWidth > window.innerWidth - margin) {
      adjustedX = window.innerWidth - menuWidth - margin;
    }
    if (adjustedX < margin) adjustedX = margin;
    let adjustedY = y;
    if (adjustedY + menuHeight > window.innerHeight - margin) {
      adjustedY = window.innerHeight - menuHeight - margin;
    }
    if (adjustedY < margin) adjustedY = margin;
    setMenuPos({ x: adjustedX, y: adjustedY });
    setMenuMsg(msg);
    menuJustOpened.current = true;
    setTimeout(() => { menuJustOpened.current = false; }, 300);
  };

  const handleContextMenu = (e, msg) => {
    e.preventDefault();
    const x = window.innerWidth <= 768 ? e.currentTarget.getBoundingClientRect().left : (e.clientX || e.currentTarget.getBoundingClientRect().left + 20);
    const y = e.clientY || e.currentTarget.getBoundingClientRect().top;
    showMenu(x, y, msg);
  };

  const SWIPE_THRESHOLD = 60;

  const handleTouchStart = (e, msg) => {
    swipeStartRef.current = e.touches[0].clientX;
    swipeElRef.current = e.currentTarget;
    swipeMsgRef.current = msg;
  };

  const handleTouchMove = (e) => {
    if (swipeStartRef.current === null || !swipeElRef.current) return;
    const currentX = e.touches[0].clientX;
    const dx = currentX - swipeStartRef.current;
    const isMine = swipeMsgRef.current?.sender.id === user?.id;
    if ((!isMine && dx < 0) || (isMine && dx > 0)) {
      swipeElRef.current.style.transform = '';
      return;
    }
    const clamped = Math.max(-120, Math.min(120, dx));
    swipeElRef.current.style.transform = `translateX(${clamped}px)`;
    swipeElRef.current.style.transition = 'none';
  };

  const handleTouchEnd = (e) => {
    if (swipeStartRef.current === null || !swipeElRef.current) return;
    const endX = e.changedTouches[0].clientX;
    const dx = endX - swipeStartRef.current;
    const msg = swipeMsgRef.current;
    const el = swipeElRef.current;
    swipeStartRef.current = null;
    swipeMsgRef.current = null;
    swipeElRef.current = null;
    if (!msg) return;
    const isMine = msg.sender.id === user?.id;
    if (Math.abs(dx) >= SWIPE_THRESHOLD &&
        ((!isMine && dx > 0) || (isMine && dx < 0))) {
      el.style.transition = 'transform 0.2s ease';
      el.style.transform = `translateX(${isMine ? -120 : 120}px)`;
      setTimeout(() => {
        el.style.transition = '';
        el.style.transform = '';
        handleReply(msg);
      }, 200);
    } else {
      el.style.transition = 'transform 0.25s ease';
      el.style.transform = '';
      setTimeout(() => { el.style.transition = ''; }, 250);
    }
  };

  const handlePointerDown = (e, msg) => {
    if (e.button !== 0) return;
    if (e.pointerType === 'mouse') return;
    pointerStart.current = { x: e.clientX, y: e.clientY };
    const rect = e.currentTarget.getBoundingClientRect();
    longPressTimer.current = setTimeout(() => {
      showMenu(rect.left, e.clientY, msg);
    }, 500);
  };

  const handlePointerUp = () => {
    pointerStart.current = null;
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handlePointerMove = (e) => {
    if (!pointerStart.current) return;
    const dx = Math.abs(e.clientX - pointerStart.current.x);
    const dy = Math.abs(e.clientY - pointerStart.current.y);
    if (dx > 15 || dy > 15) {
      pointerStart.current = null;
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    }
  };

  const closeMenu = () => setMenuMsg(null);
  const menuJustOpened = useRef(false);

  const handleDeleteForMe = async () => {
    if (!menuMsg || !activeConv) return;
    const msgId = menuMsg.id;
    closeMenu();
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
    try {
      await messagesAPI.deleteMessage(activeConv.id, msgId, 'me');
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  const handleDeleteForEveryone = async () => {
    if (!menuMsg || !activeConv) return;
    const msgId = menuMsg.id;
    closeMenu();
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
    try {
      await messagesAPI.deleteMessage(activeConv.id, msgId, 'everyone');
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  useEffect(() => {
    if (menuMsg) {
      const handler = () => {
        if (menuJustOpened.current) return;
        closeMenu();
      };
      document.addEventListener('click', handler);
      return () => document.removeEventListener('click', handler);
    }
  }, [menuMsg]);

  const closeConvMenu = () => setConvMenuConv(null);

  const handleConvClear = async () => {
    const conv = convMenuConv;
    closeConvMenu();
    if (!conv) return;
    try {
      await messagesAPI.clearMessages(conv.id);
      if (activeConv?.id === conv.id) {
        setMessages([]);
      }
      setConversations((prev) => prev.map((c) =>
        c.id === conv.id ? { ...c, lastMessage: undefined } : c
      ));
    } catch (err) {
      console.error('Failed to clear chat:', err);
    }
  };

  const handleConvDelete = async () => {
    const conv = convMenuConv;
    closeConvMenu();
    if (!conv) return;
    try {
      await messagesAPI.deleteConversation(conv.id);
      if (activeConv?.id === conv.id) {
        setActiveConv(null);
        setMessages([]);
      }
      setConversations((prev) => prev.filter((c) => c.id !== conv.id));
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  const handleConvMute = async () => {
    const conv = convMenuConv;
    closeConvMenu();
    if (!conv) return;
    try {
      const { data } = await messagesAPI.muteConversation(conv.id);
      setConversations((prev) => prev.map((c) =>
        c.id === conv.id ? { ...c, mutedBy: data.muted ? [...(c.mutedBy || []), user.id] : (c.mutedBy || []).filter((id) => id !== user.id) } : c
      ));
    } catch (err) {
      console.error('Failed to toggle mute:', err);
    }
  };

  const handleConvBlock = async () => {
    const conv = convMenuConv;
    const other = conv ? otherParticipant(conv) : null;
    closeConvMenu();
    if (!other?.id) return;
    try {
      await usersAPI.block(other.id);
      if (activeConv?.id === conv.id) {
        setActiveConv(null);
        setMessages([]);
      }
      setConversations((prev) => prev.filter((c) => c.id !== conv.id));
    } catch (err) {
      console.error('Failed to block user:', err);
    }
  };

  const showConvMenu = (x, y, conv) => {
    const menuWidth = 180;
    const menuHeight = 190;
    const margin = 8;
    let adjustedX = x;
    if (adjustedX + menuWidth > window.innerWidth - margin) {
      adjustedX = window.innerWidth - menuWidth - margin;
    }
    if (adjustedX < margin) adjustedX = margin;
    let adjustedY = y;
    if (adjustedY + menuHeight > window.innerHeight - margin) {
      adjustedY = window.innerHeight - menuHeight - margin;
    }
    if (adjustedY < margin) adjustedY = margin;
    setConvMenuPos({ x: adjustedX, y: adjustedY });
    setConvMenuConv(conv);
    convMenuJustOpened.current = true;
    setTimeout(() => { convMenuJustOpened.current = false; }, 300);
  };

  const handleConvContextMenu = (e, conv) => {
    e.preventDefault();
    showConvMenu(e.clientX, e.clientY, conv);
  };

  const convPointerStart = useRef(null);
  const convLongPressTimer = useRef(null);

  const handleConvPointerDown = (e, conv) => {
    if (e.button !== 0) return;
    if (e.pointerType === 'mouse') return;
    convPointerStart.current = { x: e.clientX, y: e.clientY };
    const rect = e.currentTarget.getBoundingClientRect();
    convLongPressTimer.current = setTimeout(() => {
      showConvMenu(rect.left, e.clientY, conv);
    }, 500);
  };

  const handleConvPointerUp = () => {
    convPointerStart.current = null;
    if (convLongPressTimer.current) {
      clearTimeout(convLongPressTimer.current);
      convLongPressTimer.current = null;
    }
  };

  const handleConvPointerMove = (e) => {
    if (!convPointerStart.current) return;
    const dx = Math.abs(e.clientX - convPointerStart.current.x);
    const dy = Math.abs(e.clientY - convPointerStart.current.y);
    if (dx > 15 || dy > 15) {
      convPointerStart.current = null;
      if (convLongPressTimer.current) {
        clearTimeout(convLongPressTimer.current);
        convLongPressTimer.current = null;
      }
    }
  };

  useEffect(() => {
    if (convMenuConv) {
      const handler = () => {
        if (convMenuJustOpened.current) return;
        closeConvMenu();
      };
      document.addEventListener('click', handler);
      return () => document.removeEventListener('click', handler);
    }
  }, [convMenuConv]);

  return (
    <div className={`messages-page${activeConv ? ' chat-open' : ''}`}>
      <div className="messages-sidebar">
        <div className="messages-sidebar-header">
          <h2>Messages</h2>
        </div>
        <div className="messages-search">
          <svg className="messages-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            type="text"
            className="messages-search-input"
            placeholder="Search people..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
          {searchQuery && (
            <button className="messages-search-clear" onClick={() => setSearchQuery('')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          )}
        </div>
        <div className="messages-conversations">
          {loading ? (
            <>
              <div className="skeleton-conv-item">
                <div className="skeleton skeleton-avatar skeleton-round" />
                <div className="skeleton-conv-content">
                  <div className="skeleton skeleton-conv-name" />
                  <div className="skeleton skeleton-conv-msg" />
                </div>
              </div>
              <div className="skeleton-conv-item">
                <div className="skeleton skeleton-avatar skeleton-round" />
                <div className="skeleton-conv-content">
                  <div className="skeleton skeleton-conv-name" />
                  <div className="skeleton skeleton-conv-msg" />
                </div>
              </div>
              <div className="skeleton-conv-item">
                <div className="skeleton skeleton-avatar skeleton-round" />
                <div className="skeleton-conv-content">
                  <div className="skeleton skeleton-conv-name" />
                  <div className="skeleton skeleton-conv-msg" />
                </div>
              </div>
              <div className="skeleton-conv-item">
                <div className="skeleton skeleton-avatar skeleton-round" />
                <div className="skeleton-conv-content">
                  <div className="skeleton skeleton-conv-name" />
                  <div className="skeleton skeleton-conv-msg" />
                </div>
              </div>
              <div className="skeleton-conv-item">
                <div className="skeleton skeleton-avatar skeleton-round" />
                <div className="skeleton-conv-content">
                  <div className="skeleton skeleton-conv-name" />
                  <div className="skeleton skeleton-conv-msg" />
                </div>
              </div>
            </>
          ) : searchQuery ? (
            <>
              {searching ? (
                <p className="messages-loading">Searching...</p>
              ) : searchResults.length > 0 ? (
                searchResults.map((u) => (
                  <div
                    key={u.id}
                    className="messages-conv-item"
                    onClick={() => startFromSearch(u.id)}
                  >
                    <div className="messages-conv-avatar">
                      {u.avatar ? <img src={u.avatar} alt="" /> : u.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="messages-conv-info">
                      <div className="messages-conv-name">{u.name}</div>
                      <div className="messages-conv-preview">
                        {u.bio || 'Start a conversation'}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="messages-empty">No users found</p>
              )}
            </>
          ) : (
            <>
              {conversations.map((conv) => {
                const other = otherParticipant(conv);
                const isMuted = conv.mutedBy?.includes(user.id);
                return (
                  <div
                    key={conv.id}
                    className={`messages-conv-item${activeConv?.id === conv.id ? ' active' : ''}`}
                    onClick={() => openConversation(conv)}
                    onContextMenu={(e) => handleConvContextMenu(e, conv)}
                    onPointerDown={(e) => handleConvPointerDown(e, conv)}
                    onPointerUp={handleConvPointerUp}
                    onPointerCancel={handleConvPointerUp}
                    onPointerMove={handleConvPointerMove}
                    onPointerLeave={handleConvPointerUp}
                  >
                    <div className="messages-conv-avatar">
                      {other?.avatar ? <img src={other.avatar} alt="" /> : other?.name?.charAt(0).toUpperCase()}
                    </div>
                      <div className="messages-conv-info">
                      <div className="messages-conv-name">{other?.name}{isMuted && <span className="messages-muted-icon" title="Muted">🔇</span>}</div>
                      <div className="messages-conv-preview">
                        {conv.lastMessage?.content || 'No messages yet'}
                      </div>
                    </div>
                    <div className="messages-conv-meta">
                      {(() => {
                        const cnt = conv.unreadCount?.[user.id];
                        return cnt > 0 ? <span className="messages-conv-badge">{cnt}</span> : null;
                      })()}
                      {conv.lastMessage?.createdAt && (
                        <span className="messages-conv-time">{timeAgo(conv.lastMessage.createdAt)}</span>
                      )}
                    </div>
                  </div>
                );
              })}
              {following.length > 0 && (
                <div className="messages-people-section">
                  <div className="sidebar-section">People</div>
                  {following.map((p) => (
                    <div
                      key={p.id}
                      className="messages-conv-item"
                      onClick={() => startConversation(p.id)}
                    >
                      <div className="messages-conv-avatar">
                        {p.avatar ? <img src={p.avatar} alt="" /> : p.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="messages-conv-info">
                        <div className="messages-conv-name">{p.name}</div>
                        <div className="messages-conv-preview">Start a conversation</div>
                      </div>
                      {creating === p.id && <span className="messages-conv-time">...</span>}
                    </div>
                  ))}
                </div>
              )}
              {conversations.length === 0 && following.length === 0 && (
                <p className="messages-empty">No conversations yet</p>
              )}
            </>
          )}
        </div>
      </div>
      <div className="messages-main">
        {activeConv ? (
          <>
            <div className="messages-chat-header">
              <div className="messages-chat-header-left">
                <button className="messages-back-btn" onClick={goBack} title="Back">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <Link to={`/profile/${otherParticipant(activeConv)?.id}`} className="messages-chat-user">
                <div className="messages-chat-avatar">
                  {otherParticipant(activeConv)?.avatar
                    ? <img src={otherParticipant(activeConv).avatar} alt="" />
                    : otherParticipant(activeConv)?.name?.charAt(0).toUpperCase()}
                </div>
                <span>{otherParticipant(activeConv)?.name}</span>
              </Link>
              </div>
              {messages.length > 0 && (
                <button
                  className="messages-clear-btn"
                  onClick={handleClearChat}
                  disabled={clearing}
                  title="Clear chat"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              )}
            </div>
            <div className="messages-chat-body">
              {loadingMessages ? (
                <div className="messages-chat-loading">
                  <div className="messages-chat-loading-dot" />
                  <div className="messages-chat-loading-dot" />
                  <div className="messages-chat-loading-dot" />
                </div>
              ) : messages.length === 0 ? (
                <p className="messages-chat-empty">No messages yet. Send a message to start the conversation.</p>
              ) : (
                messages.map((msg) => {
                const isMine = msg.sender.id === user?.id;
                return (
                  <div key={msg.id} className={`messages-msg-swipe-wrap${isMine ? ' mine' : ''}`}>
                    <div className="messages-msg-swipe-bg">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 17 4 12 9 7" />
                        <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
                      </svg>
                    </div>
                    <div
                      className={`messages-msg${isMine ? ' mine' : ''}`}
                      onDoubleClick={(e) => { e.preventDefault(); showMenu(e.clientX, e.clientY, msg); }}
                      onContextMenu={(e) => handleContextMenu(e, msg)}
                      onPointerDown={(e) => handlePointerDown(e, msg)}
                      onPointerUp={handlePointerUp}
                      onPointerCancel={handlePointerUp}
                      onPointerMove={handlePointerMove}
                      onPointerLeave={handlePointerUp}
                      onTouchStart={(e) => handleTouchStart(e, msg)}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                    >
                    <div className="messages-msg-bubble">
                      {msg.replyTo && (
                        <div className="messages-reply-preview">
                          <div className="messages-reply-line"></div>
                          <div className="messages-reply-content">
                            <span className="messages-reply-name">
                              {typeof msg.replyTo.sender === 'object' && msg.replyTo.sender
                                ? msg.replyTo.sender.name || 'Unknown'
                                : 'Unknown'}
                            </span>
                            <span className="messages-reply-text">{msg.replyTo.content}</span>
                          </div>
                        </div>
                      )}
                      {msg.content && <p>{msg.content}</p>}
                      <span className="messages-msg-time">{timeAgo(msg.createdAt)}</span>
                    </div>
                    <button
                      className="messages-reply-btn"
                      onClick={(e) => { e.stopPropagation(); handleReply(msg); }}
                      onDoubleClick={(e) => e.stopPropagation()}
                      title="Reply"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 17 4 12 9 7" />
                        <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
                      </svg>
                    </button>
                  </div>
                  </div>
                );
              }))}
              <div ref={messagesEndRef} />
            </div>
            {menuMsg && (
              <div
                className="messages-context-menu"
                style={{ left: menuPos.x, top: menuPos.y }}
                onClick={(e) => e.stopPropagation()}
              >
                {menuMsg.sender.id === user?.id && (
                  <button className="messages-context-item" onClick={handleDeleteForEveryone}>Delete for everyone</button>
                )}
                <button className="messages-context-item" onClick={handleDeleteForMe}>Delete for me</button>
                <button className="messages-context-item cancel" onClick={closeMenu}>Cancel</button>
              </div>
            )}
            <form className="messages-chat-input" onSubmit={handleSend}>
              {replyTo && (
                <div className="messages-reply-bar">
                  <div className="messages-reply-bar-info">
                    <span className="messages-reply-bar-label">Replying to <strong>{getSenderName(replyTo)}</strong></span>
                    <span className="messages-reply-bar-text">{replyTo.content}</span>
                  </div>
                  <button type="button" className="messages-reply-bar-close" onClick={cancelReply}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              )}
              <div className="messages-chat-input-row">
                <div className="messages-input-wrapper" ref={emojiRef}>
                  <button
                    type="button"
                    className="messages-emoji-btn"
                    onClick={() => setShowEmojiPicker((prev) => !prev)}
                    title="Emoji"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                      <line x1="9" y1="9" x2="9.01" y2="9" />
                      <line x1="15" y1="9" x2="15.01" y2="9" />
                    </svg>
                  </button>
                  {showEmojiPicker && (
                    <div className="messages-emoji-picker">
                      {EMOJIS.map((emoji, i) => (
                        <button key={i} type="button" className="messages-emoji-item" onClick={() => handleEmojiClick(emoji)}>
                          <img src={emojiToTwemojiUrl(emoji)} alt={emoji} className="messages-emoji-img" loading="lazy" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Type a message..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  maxLength={1000}
                />
                <button type="submit" disabled={!text.trim() || sending}>
                  {sending ? '...' : 'Send'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="messages-placeholder">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3, marginBottom: 12 }}>
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <p>Select a conversation or click on someone to chat</p>
          </div>
        )}
      </div>
      {showClearModal && <ClearModal />}
      {convMenuConv && (
        <div
          className="messages-context-menu"
          style={{ left: convMenuPos.x, top: convMenuPos.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button className="messages-context-item" onClick={handleConvClear}>Clear chat</button>
          <button className="messages-context-item" onClick={handleConvDelete}>Delete chat</button>
          <button className="messages-context-item" onClick={handleConvMute}>
            {convMenuConv.mutedBy?.includes(user.id) ? 'Unmute notifications' : 'Mute notifications'}
          </button>
          <button className="messages-context-item" onClick={handleConvBlock}>Block</button>
          <button className="messages-context-item cancel" onClick={closeConvMenu}>Cancel</button>
        </div>
      )}
    </div>
  );
};

export default Messages;
