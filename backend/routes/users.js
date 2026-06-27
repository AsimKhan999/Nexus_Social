const express = require('express');
const admin = require('firebase-admin');
const auth = require('../middleware/auth');
const { sendNotification } = require('../socket/notify');
const { uploadBase64ToStorage, getUsersByIds } = require('../config/Firebase');

const router = express.Router();

router.get('/search', auth, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    const followingIds = req.user.following || [];

    if (followingIds.length === 0) return res.json([]);

    const userMap = await getUsersByIds(followingIds);
    const results = [];
    const lowerQ = q.toLowerCase();

    for (const id of followingIds) {
      const data = userMap[id];
      if (!data) continue;
      if ((data.name && data.name.toLowerCase().includes(lowerQ)) ||
          (data.email && data.email.toLowerCase().includes(lowerQ))) {
        results.push({ id, name: data.name, avatar: data.avatar, bio: data.bio });
      }
    }

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/suggested', auth, async (req, res) => {
  try {
    const db = admin.firestore();
    const following = req.user.following || [];
    const excludedIds = new Set([...following, req.user.id]);

    const usersSnap = await db.collection('users').get();
    const suggested = [];

    usersSnap.docs.forEach(doc => {
      if (!excludedIds.has(doc.id)) {
        const data = doc.data();
        suggested.push({ id: doc.id, name: data.name, avatar: data.avatar, bio: data.bio });
      }
    });

    res.json(suggested.slice(0, 5));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const db = admin.firestore();
    const userDoc = await db.collection('users').doc(req.params.id).get();
    if (!userDoc.exists) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = { id: userDoc.id, ...userDoc.data() };
    if (user.createdAt?.toDate) user.createdAt = user.createdAt.toDate().toISOString();
    const isOwn = req.user.id === user.id;
    const isFollowing = (user.followers || []).includes(req.user.id);

    if (user.isPrivate && !isOwn && !isFollowing) {
      return res.json({
        user: {
          id: user.id, name: user.name, email: user.email,
          avatar: user.avatar, bio: user.bio,
          followers: [], following: [], isPrivate: true
        },
        posts: [],
        isFollowing: false,
        isPrivate: true
      });
    }

    const postsSnap = await db.collection('posts')
      .where('authorId', '==', req.params.id)
      .get();

    const rawPosts = [];
    const userIds = new Set();
    const sharedFromIds = new Set();

    postsSnap.docs.forEach(doc => {
      const p = { id: doc.id, ...doc.data() };
      if (p.createdAt?.toDate) p.createdAt = p.createdAt.toDate().toISOString();
      rawPosts.push(p);
      if (p.authorId) userIds.add(p.authorId);
      if (p.sharedFromId) sharedFromIds.add(p.sharedFromId);
      if (Array.isArray(p.comments)) {
        p.comments.forEach(c => {
          if (c.userId) userIds.add(c.userId);
          if (Array.isArray(c.replies)) c.replies.forEach(r => {
            if (r.userId) userIds.add(r.userId);
          });
        });
      }
    });

    rawPosts.sort((a, b) => {
      const aTime = new Date(a.createdAt || 0).getTime();
      const bTime = new Date(b.createdAt || 0).getTime();
      return bTime - aTime;
    });

    const authorMap = await getUsersByIds([...userIds, ...sharedFromIds]);
    const sharedAuthorIds = new Set();
    const sharedDocs = {};
    for (const sid of sharedFromIds) {
      if (sid) {
        const sDoc = await db.collection('posts').doc(sid).get();
        if (sDoc.exists) {
          sharedDocs[sid] = { id: sDoc.id, ...sDoc.data() };
          if (sharedDocs[sid].createdAt?.toDate) sharedDocs[sid].createdAt = sharedDocs[sid].createdAt.toDate().toISOString();
          if (sDoc.data().authorId) sharedAuthorIds.add(sDoc.data().authorId);
        }
      }
    }
    const sharedAuthorMap = await getUsersByIds([...sharedAuthorIds]);

    const posts = rawPosts.map(p => ({
      ...p,
      author: authorMap[p.authorId] || null,
      sharedFrom: p.sharedFromId && sharedDocs[p.sharedFromId]
        ? { ...sharedDocs[p.sharedFromId], author: sharedAuthorMap[sharedDocs[p.sharedFromId].authorId] || null }
        : null,
      comments: (p.comments || []).map(c => ({
        ...c,
        user: c.userId ? authorMap[c.userId] || null : null,
        replies: (c.replies || []).map(r => ({
          ...r,
          user: r.userId ? authorMap[r.userId] || null : null
        }))
      }))
    }));

    res.json({ user, posts, isFollowing });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/:id/follow', auth, async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: 'Cannot follow yourself' });
    }

    const db = admin.firestore();
    const targetRef = db.collection('users').doc(req.params.id);
    const userRef = db.collection('users').doc(req.user.id);

    const targetDoc = await targetRef.get();
    if (!targetDoc.exists) {
      return res.status(404).json({ message: 'User not found' });
    }

    const target = targetDoc.data();
    const targetFollowers = target.followers || [];
    const alreadyFollowing = targetFollowers.includes(req.user.id);

    if (alreadyFollowing) {
      await targetRef.update({ followers: admin.firestore.FieldValue.arrayRemove(req.user.id) });
      await userRef.update({ following: admin.firestore.FieldValue.arrayRemove(req.params.id) });
      return res.json({ following: false });
    }

    await targetRef.update({ followers: admin.firestore.FieldValue.arrayUnion(req.user.id) });
    await userRef.update({ following: admin.firestore.FieldValue.arrayUnion(req.params.id) });

    const notifRef = await db.collection('notifications').add({
      recipientId: req.params.id,
      senderId: req.user.id,
      type: 'follow',
      isRead: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    const notifSnap = await notifRef.get();
    sendNotification(req.params.id, { id: notifRef.id, ...notifSnap.data() });

    res.json({ following: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/:id/followers', auth, async (req, res) => {
  try {
    const db = admin.firestore();
    const userDoc = await db.collection('users').doc(req.params.id).get();
    if (!userDoc.exists) return res.status(404).json({ message: 'User not found' });

    const user = userDoc.data();
    const isOwn = req.user.id === req.params.id;
    const isFollowing = (user.followers || []).includes(req.user.id);

    if (user.isPrivate && !isOwn && !isFollowing) {
      return res.status(403).json({ message: 'This account is private', isPrivate: true });
    }

    const followerIds = user.followers || [];
    if (followerIds.length === 0) return res.json([]);

    const userMap = await getUsersByIds(followerIds);
    const followers = followerIds.map(id => userMap[id]).filter(Boolean);

    res.json(followers);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/:id/following', auth, async (req, res) => {
  try {
    const db = admin.firestore();
    const userDoc = await db.collection('users').doc(req.params.id).get();
    if (!userDoc.exists) return res.status(404).json({ message: 'User not found' });

    const user = userDoc.data();
    const isOwn = req.user.id === req.params.id;
    const isFollowing = (user.followers || []).includes(req.user.id);

    if (user.isPrivate && !isOwn && !isFollowing) {
      return res.status(403).json({ message: 'This account is private', isPrivate: true });
    }

    const followingIds = user.following || [];
    if (followingIds.length === 0) return res.json([]);

    const userMap = await getUsersByIds(followingIds);
    const following = followingIds.map(id => userMap[id]).filter(Boolean);

    res.json(following);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/profile', auth, async (req, res) => {
  try {
    const { name, bio, hobbies, avatar, contact, location, dateOfBirth } = req.body;
    const db = admin.firestore();
    const updates = {};

    if (name !== undefined) updates.name = name;
    if (bio !== undefined) updates.bio = bio;
    if (hobbies !== undefined) updates.hobbies = hobbies;
    if (contact !== undefined) updates.contact = contact;
    if (location !== undefined) updates.location = location;
    if (dateOfBirth !== undefined) updates.dateOfBirth = dateOfBirth;

    if (avatar && avatar.startsWith('data:')) {
      const dest = `avatars/${req.user.id}/${Date.now()}.jpg`;
      const avatarUrl = await uploadBase64ToStorage(avatar, dest);
      updates.avatar = avatarUrl;
    } else if (avatar !== undefined) {
      updates.avatar = avatar;
    }

    if (Object.keys(updates).length > 0) {
      await db.collection('users').doc(req.user.id).update(updates);
    }

    const userDoc = await db.collection('users').doc(req.user.id).get();
    const user = { id: userDoc.id, ...userDoc.data() };
    if (user.createdAt?.toDate) user.createdAt = user.createdAt.toDate().toISOString();
    const postsSnap = await db.collection('posts').where('authorId', '==', req.user.id).get();
    user.postCount = postsSnap.size;

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/settings', auth, async (req, res) => {
  try {
    const { isPrivate } = req.body;
    const db = admin.firestore();
    await db.collection('users').doc(req.user.id).update({ isPrivate });
    const userDoc = await db.collection('users').doc(req.user.id).get();
    const user = { id: userDoc.id, ...userDoc.data() };
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/:id/block', auth, async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: 'Cannot block yourself' });
    }

    const db = admin.firestore();
    const targetRef = db.collection('users').doc(req.params.id);
    const userRef = db.collection('users').doc(req.user.id);

    const targetDoc = await targetRef.get();
    if (!targetDoc.exists) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userDoc = await userRef.get();
    const userData = userDoc.data();
    const blocked = userData.blocked || [];
    const isBlocked = blocked.includes(req.params.id);

    if (isBlocked) {
      await userRef.update({ blocked: admin.firestore.FieldValue.arrayRemove(req.params.id) });
      return res.json({ blocked: false });
    }

    await userRef.update({ blocked: admin.firestore.FieldValue.arrayUnion(req.params.id) });
    res.json({ blocked: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
