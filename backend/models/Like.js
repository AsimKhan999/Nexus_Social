const { db } = require('../config/Firebase');

const findByUserAndPost = async (userId, postId) => {
  const snap = await db.collection('posts').doc(postId).get();
  if (!snap.exists) return null;
  const likes = snap.data().likes || [];
  return likes.includes(userId) ? { userId, postId } : null;
};

module.exports = { findByUserAndPost };
