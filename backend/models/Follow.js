const { db } = require('../config/Firebase');

const isFollowing = async (followerId, followingId) => {
  const userDoc = await db.collection('users').doc(followingId).get();
  if (!userDoc.exists) return false;
  const followers = userDoc.data().followers || [];
  return followers.includes(followerId);
};

module.exports = { isFollowing };
