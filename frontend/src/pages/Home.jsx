import React, { useState, useEffect, useRef } from 'react';
import { postsAPI, usersAPI } from '../services/api';
import PostCard from '../components/PostCard';
import CreatePost from '../components/CreatePost';
import { useAuth } from '../context/AuthContext';

const PostCardSkeleton = () => (
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
);

const Home = () => {
  const { user, refreshUser } = useAuth();
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [trendingTopics, setTrendingTopics] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [stats, setStats] = useState({ followers: 0, following: 0, postCount: 0 });
  const [error, setError] = useState('');
  const fetchingRef = useRef(false);

  useEffect(() => {
    if (user) {
      setStats({
        followers: user.followers?.length || 0,
        following: user.following?.length || 0,
        postCount: user.postCount || 0
      });
    }
  }, [user]);

  useEffect(() => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    const fetchPosts = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await postsAPI.getFeed(page);
        setPosts((prev) => [...prev, ...data.posts]);
        setHasMore(page < data.pages);
      } catch (err) {
        console.error('Failed to fetch posts:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load feed');
      } finally {
        setLoading(false);
        fetchingRef.current = false;
      }
    };
    fetchPosts();
  }, [page]);

  useEffect(() => {
    if (!user) return;
    const fetchSideData = async () => {
      try {
        const [trendingRes, suggestedRes] = await Promise.all([
          postsAPI.getTrending(),
          usersAPI.getSuggested()
        ]);
        setTrendingTopics(trendingRes.data);
        setSuggestedUsers(suggestedRes.data);
      } catch (err) {
        console.error('Failed to fetch sidebar data:', err);
      }
    };
    fetchSideData();
  }, [user]);

  const handleFollow = async (userId) => {
    try {
      await usersAPI.follow(userId);
      setSuggestedUsers((prev) => prev.filter(u => u.id !== userId));
      setStats((prev) => ({ ...prev, following: prev.following + 1 }));
      refreshUser();
    } catch (err) {
      console.error('Failed to follow user:', err);
    }
  };

  const handlePostCreated = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
    setStats((prev) => ({ ...prev, postCount: prev.postCount + 1 }));
    refreshUser();
  };

  const handlePostDeleted = (postId) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    setStats((prev) => ({ ...prev, postCount: Math.max(0, prev.postCount - 1) }));
  };

  return (
    <div className="home-layout">
      <main className="feed">
        <CreatePost onPostCreated={handlePostCreated} />
        {loading && posts.length === 0 ? (
          <>
            <PostCardSkeleton />
            <PostCardSkeleton />
            <PostCardSkeleton />
          </>
        ) : (
          posts.map((post) => (
            <PostCard key={post.id} post={post} onDeleted={handlePostDeleted} />
          ))
        )}
        {hasMore && (
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={loading}
            className="btn-load-more"
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        )}
        {!hasMore && posts.length > 0 && (
          <p className="feed-end">No more posts</p>
        )}
        {error && (
          <div className="feed-error">
            <p>{error}</p>
            <button className="btn-retry" onClick={() => { setPage(1); setPosts([]); }}>Retry</button>
          </div>
        )}
        {!loading && !error && posts.length === 0 && (
          <p className="feed-empty">No posts yet. Follow users to see their posts!</p>
        )}
      </main>

      <aside className="right-panel">
        {user && (
          <div className="panel-card profile-widget">
            <div className="pw-avatar">{user.name.charAt(0).toUpperCase()}</div>
            <div className="pw-name">{user.name}</div>
            <div className="pw-role">@{user.email?.split('@')[0]}</div>
            <div className="pw-stats">
              <div>
                <div className="pw-stat-number">{stats.followers}</div>
                <div className="pw-stat-label">Followers</div>
              </div>
              <div>
                <div className="pw-stat-number">{stats.following}</div>
                <div className="pw-stat-label">Following</div>
              </div>
              <div>
                <div className="pw-stat-number">{stats.postCount}</div>
                <div className="pw-stat-label">Posts</div>
              </div>
            </div>
          </div>
        )}

        <div className="panel-card">
          <div className="section-label">Trending</div>
          {trendingTopics.map((topic, index) => (
            <div className="trend-item" key={topic.tag}>
              <span className="trend-rank">{index + 1}</span>
              <div className="trend-info">
                <div className="trend-name">{topic.tag}</div>
                <div className="trend-count">{topic.count >= 1000 ? (topic.count/1000).toFixed(1) + 'k' : topic.count} posts</div>
              </div>
              <i className={`ti ti-trending-${index % 3 === 2 ? 'down' : 'up'} trend-icon ${index % 3 === 2 ? 'down' : 'up'}`}></i>
            </div>
          ))}
        </div>

        <div className="panel-card">
          <div className="section-label">People to follow</div>
          {suggestedUsers.map((su) => (
            <div className="suggest-item" key={su.id}>
              <div className={`suggest-avatar ${['gold', 'coral', 'blue', 'green'][Math.floor(Math.random() * 4)]}`}>
                {su.avatar ? <img src={su.avatar} alt={su.name} /> : su.name.charAt(0).toUpperCase()}
              </div>
              <div className="suggest-info">
                <div className="suggest-name">{su.name}</div>
                <div className="suggest-role">@{su.email?.split('@')[0] || su.name.toLowerCase().replace(/\s+/g, '')}</div>
              </div>
              <button className="suggest-follow" onClick={() => handleFollow(su.id)}>+ Follow</button>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
};

export default Home;
