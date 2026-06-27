import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import EditProfile from '../components/EditProfile';

const FollowModal = ({ type, userId, onClose }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const fetcher = type === 'followers' ? usersAPI.getFollowers : usersAPI.getFollowing;
        const { data } = await fetcher(userId);
        if (data.isPrivate) {
          setUsers([]);
        } else {
          setUsers(data);
        }
      } catch {
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [type, userId]);

  return (
    <div className="follow-modal-overlay" onClick={onClose}>
      <div className="follow-modal" onClick={(e) => e.stopPropagation()}>
        <div className="follow-modal-header">
          <h3>{type === 'followers' ? 'Followers' : 'Following'}</h3>
          <button className="follow-modal-close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="follow-modal-body">
          {loading ? (
            <>
              <div className="follow-modal-user">
                <div className="skeleton skeleton-avatar skeleton-round" style={{ width: 36, height: 36 }} />
                <div className="follow-modal-user-info">
                  <div className="skeleton" style={{ height: 14, width: 120 }} />
                  <div className="skeleton" style={{ height: 12, width: 180, marginTop: 2 }} />
                </div>
              </div>
              <div className="follow-modal-user">
                <div className="skeleton skeleton-avatar skeleton-round" style={{ width: 36, height: 36 }} />
                <div className="follow-modal-user-info">
                  <div className="skeleton" style={{ height: 14, width: 120 }} />
                  <div className="skeleton" style={{ height: 12, width: 180, marginTop: 2 }} />
                </div>
              </div>
              <div className="follow-modal-user">
                <div className="skeleton skeleton-avatar skeleton-round" style={{ width: 36, height: 36 }} />
                <div className="follow-modal-user-info">
                  <div className="skeleton" style={{ height: 14, width: 120 }} />
                  <div className="skeleton" style={{ height: 12, width: 180, marginTop: 2 }} />
                </div>
              </div>
            </>
          ) : users.length === 0 ? (
            <p className="follow-modal-empty">No {type} yet</p>
          ) : (
            users.map((u) => (
              <Link to={`/profile/${u.id}`} key={u.id} className="follow-modal-user" onClick={onClose}>
                <div className="follow-modal-avatar">
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div className="follow-modal-user-info">
                  <span className="follow-modal-user-name">{u.name}</span>
                  {u.bio && <span className="follow-modal-user-bio">{u.bio}</span>}
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const Profile = () => {
  const { id } = useParams();
  const { user: currentUser, refreshUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [followModal, setFollowModal] = useState(null);
  const [showEditProfile, setShowEditProfile] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      setError('');
      const { data } = await usersAPI.getProfile(id);
      setProfile(data.user);
      setPosts(data.posts);
      setIsFollowing(data.isFollowing);
      setIsPrivate(data.isPrivate || false);
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handlePostDeleted = (postId) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    refreshUser();
  };

  const handleFollow = async () => {
    try {
      const { data } = await usersAPI.follow(id);
      setIsFollowing(data.following);
      if (data.following) {
        setIsPrivate(false);
        fetchProfile();
      } else {
        setProfile((prev) => ({
          ...prev,
          followers: prev.followers.filter((f) => f !== currentUser.id)
        }));
      }
    } catch (err) {
      console.error('Failed to follow/unfollow:', err);
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="skeleton-profile-card">
          <div className="skeleton skeleton-profile-avatar skeleton-round" />
          <div className="skeleton-profile-info">
            <div className="skeleton skeleton-profile-name" />
            <div className="skeleton skeleton-profile-email" />
            <div className="skeleton skeleton-profile-stats" />
          </div>
        </div>
        <div className="posts-list">
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
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-page">
        <div className="feed-error">
          <p>{error}</p>
          <button className="btn-retry" onClick={() => { setLoading(true); fetchProfile(); }}>Retry</button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <div className="loading-text">User not found</div>;
  }

  const isOwn = currentUser?.id === id;

  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="profile-card-inner">
          <div className="profile-avatar">
            {profile.avatar ? (
              <img src={profile.avatar} alt="" className="profile-avatar-img" />
            ) : (
              profile.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="profile-info">
            <h1 className="profile-name">{profile.name}</h1>
            <p className="profile-email">{profile.email}</p>
            {profile.isPrivate && (
              <span className="profile-private-badge">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                Private
              </span>
            )}
            {profile.bio && <p className="profile-bio">{profile.bio}</p>}
            <div className="profile-details">
              {profile.contact && (
                <span className="profile-detail">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  {profile.contact}
                </span>
              )}
              {profile.location && (
                <span className="profile-detail">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="10" r="3"/><path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"/></svg>
                  {profile.location}
                </span>
              )}
              {profile.dateOfBirth && (
                <span className="profile-detail">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  {new Date(profile.dateOfBirth).toLocaleDateString()}
                </span>
              )}
            </div>
            {profile.hobbies && profile.hobbies.length > 0 && (
              <div className="profile-hobbies">
                {profile.hobbies.map((hobby) => (
                  <span key={hobby} className="profile-hobby-tag">{hobby}</span>
                ))}
              </div>
            )}
            <div className="profile-stats">
              <span
                className="profile-stat-link"
                onClick={() => setFollowModal('followers')}
              >
                <strong>{profile.followers.length}</strong> followers
              </span>
              <span
                className="profile-stat-link"
                onClick={() => setFollowModal('following')}
              >
                <strong>{profile.following.length}</strong> following
              </span>
              <span><strong>{posts.length}</strong> posts</span>
            </div>
          </div>
          {isOwn ? (
            <button className="btn-edit-profile" onClick={() => setShowEditProfile(true)}>
              Edit Profile
            </button>
          ) : (
            <button
              onClick={handleFollow}
              className={`btn-follow ${isFollowing ? 'following' : 'not-following'}`}
            >
              {isFollowing ? 'Unfollow' : 'Follow'}
            </button>
          )}
        </div>
      </div>

      {isPrivate && !isOwn && !isFollowing ? (
        <div className="private-notice">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <p>This account is private</p>
          <span>Follow this account to see their posts and followers</span>
        </div>
      ) : (
        <div className="posts-list">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onDeleted={handlePostDeleted} />
          ))}
          {posts.length === 0 && (
            <p className="empty-text">No posts yet</p>
          )}
        </div>
      )}

      {followModal && (
        <FollowModal type={followModal} userId={id} onClose={() => setFollowModal(null)} />
      )}

      {showEditProfile && (
        <EditProfile profile={profile} onClose={() => { setShowEditProfile(false); fetchProfile(); }} />
      )}
    </div>
  );
};

export default Profile;