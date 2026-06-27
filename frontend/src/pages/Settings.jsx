import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { usersAPI } from '../services/api';
import '../styles/components/settings.css';

const Settings = () => {
  const { user, refreshUser } = useAuth();
  const { theme, systemTheme, setThemeMode } = useTheme();
  const [isPrivate, setIsPrivate] = useState(user?.isPrivate ?? false);

  const handlePrivacyToggle = async () => {
    const next = !isPrivate;
    setIsPrivate(next);
    try {
      const { data } = await usersAPI.updateSettings({ isPrivate: next });
      setIsPrivate(data.user.isPrivate);
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...stored, isPrivate: data.user.isPrivate }));
      refreshUser();
    } catch (err) {
      setIsPrivate(!next);
      console.error('Failed to update privacy:', err);
    }
  };

  return (
    <div className="settings-page">
      <h2 className="settings-title">Settings</h2>

      <div className="settings-section">
        <h3 className="settings-section-title">Appearance</h3>
        <div className="settings-row">
          <div className="settings-row-info">
            <span className="settings-row-label">Theme</span>
            <span className="settings-row-desc">
              {theme === 'system'
                ? `System (${systemTheme === 'dark' ? 'Dark' : 'Light'})`
                : theme === 'dark' ? 'Dark mode' : 'Light mode'}
            </span>
          </div>
          <div className="theme-options">
            <button
              className={`theme-option${theme === 'system' ? ' active' : ''}`}
              onClick={() => setThemeMode('system')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
              System
            </button>
            <button
              className={`theme-option${theme === 'light' ? ' active' : ''}`}
              onClick={() => setThemeMode('light')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
              Light
            </button>
            <button
              className={`theme-option${theme === 'dark' ? ' active' : ''}`}
              onClick={() => setThemeMode('dark')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
              Dark
            </button>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3 className="settings-section-title">Privacy</h3>
        <div className="settings-row">
          <div className="settings-row-info">
            <span className="settings-row-label">Private account</span>
            <span className="settings-row-desc">
              {isPrivate
                ? 'Only followers can see your posts and followers'
                : 'Everyone can see your posts and followers'}
            </span>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={handlePrivacyToggle}
            />
            <span className="switch-slider"></span>
          </label>
        </div>
      </div>

      <div className="settings-section">
        <h3 className="settings-section-title">Account</h3>
        <div className="settings-row">
          <div className="settings-row-info">
            <span className="settings-row-label">Name</span>
            <span className="settings-row-desc">{user?.name}</span>
          </div>
        </div>
        <div className="settings-row">
          <div className="settings-row-info">
            <span className="settings-row-label">Email</span>
            <span className="settings-row-desc">{user?.email}</span>
          </div>
        </div>
        <div className="settings-row">
          <div className="settings-row-info">
            <span className="settings-row-label">Member since</span>
            <span className="settings-row-desc">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</span>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3 className="settings-section-title">Stats</h3>
        <div className="settings-row">
          <div className="settings-row-info">
            <span className="settings-row-label">Followers</span>
            <span className="settings-row-desc">{user?.followers?.length || 0}</span>
          </div>
        </div>
        <div className="settings-row">
          <div className="settings-row-info">
            <span className="settings-row-label">Following</span>
            <span className="settings-row-desc">{user?.following?.length || 0}</span>
          </div>
        </div>
        <div className="settings-row">
          <div className="settings-row-info">
            <span className="settings-row-label">Posts</span>
            <span className="settings-row-desc">{user?.postCount || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
