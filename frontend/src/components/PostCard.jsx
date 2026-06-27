import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { postsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ImageViewer from './ImageViewer';

const PostCard = ({ post, onDeleted }) => {
  const { user } = useAuth();
  const [liked, setLiked] = useState(post.likes?.includes(user?.id));
  const [likesCount, setLikesCount] = useState(post.likes?.length || 0);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState(post.comments || []);
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareText, setShareText] = useState('');
  const [sharesCount, setSharesCount] = useState(post.shares?.length || 0);
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState('');
  const [viewerImg, setViewerImg] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const alreadyShared = post.shares?.includes(user?.id);

  const isAuthor = user?.id === post.author?.id;

  const handleLike = async () => {
    try {
      const { data } = await postsAPI.like(post.id);
      setLiked(data.liked);
      setLikesCount((prev) => data.liked ? prev + 1 : prev - 1);
    } catch (err) {
      console.error('Failed to like post:', err);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      const { data } = await postsAPI.comment(post.id, commentText);
      setComments(data.comments || []);
      setCommentText('');
    } catch (err) {
      console.error('Failed to comment:', err);
    }
  };

  const handleReply = async (commentId) => {
    if (!replyText.trim()) return;
    try {
      const { data } = await postsAPI.reply(post.id, commentId, replyText);
      setComments(data.comments || []);
      setReplyText('');
      setReplyTo(null);
    } catch (err) {
      console.error('Failed to reply:', err);
    }
  };

  const handleOpenShare = () => {
    if (alreadyShared) return;
    setShareError('');
    setShowShareModal(true);
  };

  const handleSubmitShare = async () => {
    if (sharing) return;
    setSharing(true);
    setShareError('');
    try {
      await postsAPI.share(post.id, shareText);
      setSharesCount((prev) => prev + 1);
      setShowShareModal(false);
      setShareText('');
    } catch (err) {
      setShareError(err.response?.data?.message || 'Failed to share post');
    } finally {
      setSharing(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      await postsAPI.delete(post.id);
      if (onDeleted) onDeleted(post.id);
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Failed to delete post');
      setDeleting(false);
    }
  };

  const timeAgo = (date) => {
    if (!date) return '';
    const diff = Date.now() - new Date(date).getTime();
    if (isNaN(diff)) return '';
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  const renderSharedPost = (shared) => {
    if (!shared) return null;
    return (
      <div className="shared-post-embed">
        <Link to={`/profile/${shared.author?.id}`} className="shared-post-author">
          <div className="shared-post-avatar">
            {shared.author?.name?.charAt(0).toUpperCase()}
          </div>
          <span className="shared-post-name">@{shared.author?.name}</span>
          <span className="shared-post-time">{timeAgo(shared.createdAt)}</span>
        </Link>
        <p className="shared-post-content">{shared.content}</p>
        {shared.image && (shared.mediaType === 'video' || shared.image.startsWith('data:video')) ? (
          <video src={shared.image} controls className="shared-post-image" />
        ) : shared.image && (
          <img src={shared.image} alt="" className="shared-post-image" onClick={() => setViewerImg(shared.image)} />
        )}
      </div>
    );
  };

  return (
    <div className="post-card">
      {post.sharedFrom && (
        <div className="post-shared-label">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          {post.author?.name} shared a post
        </div>
      )}
      <div className="post-card-header">
        <Link to={`/profile/${post.author?.id}`} className="post-card-author">
          <div className="post-card-avatar">
            {post.author?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="post-card-name">{post.author?.name}</p>
            <p className="post-card-time">{timeAgo(post.createdAt)}</p>
          </div>
        </Link>
        {isAuthor && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <button onClick={handleDelete} disabled={deleting} className="post-card-delete">
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
            {deleteError && (
              <span style={{ fontSize: '11px', color: '#e74c3c', marginTop: '2px' }}>{deleteError}</span>
            )}
          </div>
        )}
      </div>
      {post.content && <p className="post-card-content">{post.content}</p>}
      {post.sharedFrom && renderSharedPost(post.sharedFrom)}
        {post.image && (post.mediaType === 'video' || post.image.startsWith('data:video')) ? (
          <video src={post.image} controls className="post-card-image" />
        ) : post.image && (
          <img src={post.image} alt="" className="post-card-image" onClick={() => setViewerImg(post.image)} />
        )}
      <div className="post-card-actions">
        <button
          onClick={handleLike}
          className={`post-card-action ${liked ? 'liked' : ''}`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg> {likesCount}
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="post-card-action"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg> {comments.length}
        </button>
        <button onClick={handleOpenShare} className={`post-card-action${alreadyShared ? ' shared' : ''}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill={alreadyShared ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg> {sharesCount}
        </button>
      </div>
      {showComments && (
        <div className="comment-section">
          <form onSubmit={handleComment} className="comment-form">
            <input
              type="text"
              placeholder="Write a comment..."
              className="comment-input"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <button type="submit" className="btn-comment">Post</button>
          </form>
          <div>
            {comments.map((c, i) => (
              <div key={c.id || i} className="comment-item">
                <div className="comment-avatar">
                  {c.user?.name?.charAt(0).toUpperCase() || c.author?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="comment-body">
                  <div className="comment-author-name">{c.user?.name || c.author?.name}</div>
                  <p className="comment-content">{c.content}</p>
                  <div className="comment-footer">
                    <span className="comment-time">{timeAgo(c.createdAt)}</span>
                    <button className="comment-reply-btn" onClick={() => setReplyTo(replyTo === (c.id || i) ? null : (c.id || i))}>
                      Reply
                    </button>
                  </div>
                  {replyTo === (c.id || i) && (
                    <div className="reply-form">
                      <input
                        type="text"
                        placeholder={`Reply to ${c.user?.name || c.author?.name}...`}
                        className="comment-input"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleReply(c.id || i); } }}
                      />
                      <button className="btn-comment" onClick={() => handleReply(c.id || i)}>Reply</button>
                    </div>
                  )}
                  {c.replies && c.replies.length > 0 && (
                    <div className="replies-list">
                      {c.replies.map((r, ri) => (
                        <div key={r.id || ri} className="reply-item">
                          <div className="comment-avatar reply-avatar">
                            {r.user?.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="comment-author-name">{r.user?.name}</div>
                            <p className="comment-content">{r.content}</p>
                            <span className="comment-time">{timeAgo(r.createdAt)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {viewerImg && (
        <ImageViewer src={viewerImg} onClose={() => setViewerImg(null)} />
      )}
      {showShareModal && (
        <div className="share-modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="share-modal" onClick={(e) => e.stopPropagation()}>
            <div className="share-modal-header">
              <h3>Share this post</h3>
              <button className="share-modal-close" onClick={() => setShowShareModal(false)}>&times;</button>
            </div>
            <div className="share-modal-body">
              <textarea
                className="share-modal-input"
                placeholder="Say something about this..."
                value={shareText}
                onChange={(e) => setShareText(e.target.value)}
                maxLength={500}
              />
              <div className="share-modal-preview">
                <div className="share-preview-header">
                  <div className="share-preview-avatar">
                    {post.author?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="share-preview-name">{post.author?.name}</p>
                    <p className="share-preview-time">{timeAgo(post.createdAt)}</p>
                  </div>
                </div>
                <p className="share-preview-content">{post.content}</p>
              </div>
            </div>
            {shareError && <p className="share-modal-error">{shareError}</p>}
            <div className="share-modal-footer">
              <button className="share-modal-cancel" onClick={() => setShowShareModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSubmitShare} disabled={sharing}>
                {sharing ? 'Sharing...' : 'Share now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCard;