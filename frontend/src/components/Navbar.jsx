import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, systemTheme, toggleTheme } = useTheme();
  const resolvedTheme = theme === 'system' ? systemTheme : theme;
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (user) {
        const userMenu = document.querySelector('.user-menu');
        if (userMenu && !userMenu.contains(event.target)) {
          userMenu.classList.remove('show');
          const dropdown = document.querySelector('.user-dropdown');
          if (dropdown) {
            dropdown.classList.remove('show');
          }
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [user]);

  const toggleSidebar = () => {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      sidebar.classList.toggle('sidebar-open');
    }
  };

  const closeSidebar = (e) => {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;
    const isNavClick = e.target.closest('.nav-item');
    const isOutside = !sidebar.contains(e.target) && !e.target.closest('.hamburger-btn');
    if (isOutside || isNavClick) {
      sidebar.classList.remove('sidebar-open');
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', closeSidebar);
    return () => document.removeEventListener('mousedown', closeSidebar);
  }, []);

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="navbar-left">
          <button className="hamburger-btn" onClick={toggleSidebar} aria-label="Toggle menu">
            <i className="ti ti-menu-2"></i>
          </button>
          <Link to="/" className="navbar-brand">
            <img
              src={resolvedTheme === 'dark' ? '/Nexus Social Black Theme 2.png' : '/Nexus Social White Theme 2.png'}
              alt="Nexus Social"
              className="navbar-brand-img"
            />
          </Link>
        </div>
        <div className="navbar-links">
          <button className="navbar-theme-toggle" onClick={toggleTheme} title="Toggle theme">
            {resolvedTheme === 'dark' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
          {user ? (
            <div className="user-menu" onClick={(e) => {
              e.stopPropagation();
              const menu = e.currentTarget;
              menu.classList.toggle('show');
              const dropdown = menu.querySelector('.user-dropdown');
              dropdown.classList.toggle('show');
            }}>
              <div className="user-avatar-wrapper">
                <div className="user-avatar">
                  {user.avatar ? <img src={user.avatar} alt={user.name} /> : user.name.charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="user-dropdown">
                <div className="user-dropdown-header">
                  <div className="dropdown-avatar">
                    {user.avatar ? <img src={user.avatar} alt={user.name} /> : user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="dropdown-user-info">
                    <span className="dropdown-user-name">{user.name}</span>
                    <span className="dropdown-user-email">{user.email}</span>
                  </div>
                </div>
                <Link to={`/profile/${user.id}`} className="dropdown-item profile-link">
                  <i className="ti ti-user"></i> Profile
                </Link>

                <button onClick={(e) => { e.stopPropagation(); handleLogout(); }} className="dropdown-item logout">
                  <i className="ti ti-logout"></i> Logout
                </button>
              </div>
            </div>
          ) : (
            <>
              <Link to="/login" className="navbar-link">Login</Link>
              <Link to="/register" className="navbar-link">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
