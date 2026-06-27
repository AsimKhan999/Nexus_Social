import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersAPI } from '../services/api';

const Search = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSearch = useCallback(async (q) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const { data } = await usersAPI.search(q);
      setResults(data);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="search-page">
      <input
        type="text"
        placeholder="Search users by name or email..."
        className="search-input"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          handleSearch(e.target.value);
        }}
      />
      {loading && (
        <div className="search-results">
          <div className="skeleton-search-item">
            <div className="skeleton skeleton-search-avatar skeleton-round" />
            <div className="skeleton-search-content">
              <div className="skeleton skeleton-search-name" />
              <div className="skeleton skeleton-search-bio" />
            </div>
          </div>
          <div className="skeleton-search-item">
            <div className="skeleton skeleton-search-avatar skeleton-round" />
            <div className="skeleton-search-content">
              <div className="skeleton skeleton-search-name" />
              <div className="skeleton skeleton-search-bio" />
            </div>
          </div>
          <div className="skeleton-search-item">
            <div className="skeleton skeleton-search-avatar skeleton-round" />
            <div className="skeleton-search-content">
              <div className="skeleton skeleton-search-name" />
              <div className="skeleton skeleton-search-bio" />
            </div>
          </div>
        </div>
      )}
      {!loading && results.length === 0 && query && (
        <p className="search-status">No users found</p>
      )}
      {!loading && results.length > 0 && (
        <div className="search-results">
          {results.map((user) => (
            <div
              key={user.id}
              className="search-result-item"
              onClick={() => navigate(`/profile/${user.id}`)}
            >
              <div className="search-result-avatar">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="search-result-name">{user.name}</p>
                {user.bio && <p className="search-result-bio">{user.bio}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Search;
