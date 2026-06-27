const { db } = require('../config/Firebase');
const Post = require('./Post');

const findByPost = async (postId) => {
  const post = await Post.findById(postId);
  return post ? (post.comments || []) : [];
};

module.exports = { findByPost };
