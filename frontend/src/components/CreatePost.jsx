import React, { useState, useRef } from 'react';
import { postsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const CreatePost = ({ onPostCreated }) => {
  const [content, setContent] = useState('');
  const [media, setMedia] = useState(null);
  const [mediaType, setMediaType] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [sizeError, setSizeError] = useState('');
  const fileRef = useRef(null);
  const { user, loadUser } = useAuth();

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const maxSize = 15 * 1024 * 1024;
    if (file.size > maxSize) {
      setSizeError('File too large. Max 15MB.');
      setShowSizeModal(true);
      if (fileRef.current) fileRef.current.value = '';
      return;
    }
    const type = file.type.startsWith('video') ? 'video' : 'image';
    setMediaType(type);
    const reader = new FileReader();
    reader.onload = () => setMedia(reader.result);
    reader.readAsDataURL(file);
  };

  const handleRemoveMedia = () => {
    setMedia(null);
    setMediaType('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !media) return;
    setSubmitting(true);
    try {
      const { data } = await postsAPI.create({ content, image: media || '' });
      setContent('');
      setMedia(null);
      setMediaType('');
      if (fileRef.current) fileRef.current.value = '';
      if (onPostCreated) onPostCreated(data);
      loadUser();
    } catch (err) {
      console.error('Failed to create post:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <>
      {showSizeModal && (
        <div className="share-modal-overlay" onClick={() => setShowSizeModal(false)}>
          <div className="share-modal" onClick={(e) => e.stopPropagation()}>
            <div className="share-modal-header">
              <h3>File Too Large</h3>
              <button className="share-modal-close" onClick={() => setShowSizeModal(false)}>&times;</button>
            </div>
            <div className="share-modal-body">
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>{sizeError}</p>
            </div>
            <div className="share-modal-footer" style={{ justifyContent: 'center' }}>
              <button className="btn-primary" onClick={() => setShowSizeModal(false)}>OK</button>
            </div>
          </div>
        </div>
      )}
      <div className="compose-box">
        <div className="compose-box-inner">
          <div className="compose-avatar">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <form onSubmit={handleSubmit} className="compose-form">
            <textarea
              placeholder="What's on your mind?"
              maxLength={500}
              className="compose-textarea"
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            {media && (
              <div className="compose-media-preview">
                {mediaType === 'video' ? (
                  <video src={media} controls className="compose-media-preview-el" />
                ) : (
                  <img src={media} alt="Preview" className="compose-media-preview-el" />
                )}
                <button type="button" className="compose-media-remove" onClick={handleRemoveMedia}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            )}
            <div className="compose-actions">
              <button type="button" className="compose-media-btn" onClick={() => fileRef.current?.click()}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
                </svg>
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,video/*"
                className="compose-file-input"
                onChange={handleFileChange}
              />
              <button
                type="submit"
                disabled={submitting || (!content.trim() && !media)}
                className="btn-primary"
              >
                {submitting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default CreatePost;