const express = require('express');
const admin = require('firebase-admin');
const auth = require('../middleware/auth');
const { sendNotification } = require('../socket/notify');
const { uploadBase64ToStorage, getUsersByIds } = require('../config/Firebase');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const db = admin.firestore();

    const following = [...(req.user.following || []), req.user.id];

    const postsSnap = await db.collection('posts')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();
    const allPosts = [];
    const authorIds = new Set();
    const sharedFromIds = new Set();

    for (const doc of postsSnap.docs) {
      const data = { id: doc.id, ...doc.data() };
      if (data.createdAt?.toDate) data.createdAt = data.createdAt.toDate().toISOString();
      if (following.includes(data.authorId)) {
        allPosts.push(data);
        if (data.authorId) authorIds.add(data.authorId);
        if (data.sharedFromId) sharedFromIds.add(data.sharedFromId);
        if (Array.isArray(data.comments)) {
          data.comments.forEach(c => {
            if (c.userId) authorIds.add(c.userId);
            if (Array.isArray(c.replies)) c.replies.forEach(r => {
              if (r.userId) authorIds.add(r.userId);
            });
          });
        }
      }
    }

    const total = allPosts.length;
    const paginatedPosts = allPosts.slice((page - 1) * limit, page * limit);

    const authorDocs = await getUsersByIds([...authorIds, ...sharedFromIds]);
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

    const enrichedPosts = paginatedPosts.map(p => ({
      ...p,
      author: p.authorId ? authorDocs[p.authorId] || null : null,
      sharedFrom: p.sharedFromId && sharedDocs[p.sharedFromId]
        ? { ...sharedDocs[p.sharedFromId], author: sharedAuthorMap[sharedDocs[p.sharedFromId].authorId] || null }
        : null,
      comments: (p.comments || []).map(c => ({
        ...c,
        user: c.userId ? authorDocs[c.userId] || null : null,
        replies: (c.replies || []).map(r => ({
          ...r,
          user: r.userId ? authorDocs[r.userId] || null : null
        }))
      }))
    }));

    res.json({ posts: enrichedPosts, page, pages: Math.ceil(total / limit), total });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/trending', auth, async (req, res) => {
  try {
    const db = admin.firestore();
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const recentSnap = await db.collection('posts')
      .where('createdAt', '>=', weekAgo)
      .get();

    const tagCounts = {};
    recentSnap.docs.forEach(doc => {
      const content = doc.data().content || '';
      const hashtags = content.match(/#\w+/g);
      if (hashtags) {
        hashtags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });

    const trending = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag, count]) => ({ tag, count }));

    if (trending.length === 0) {
      return res.json([
        { tag: '#ReactJS', count: 12400 },
        { tag: '#DesignSystems', count: 8700 },
        { tag: '#RemoteWork', count: 6200 },
        { tag: '#TypeScript', count: 5100 }
      ]);
    }

    res.json(trending);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { content, image } = req.body;

    if ((!content || !content.trim()) && !image) {
      return res.status(400).json({ message: 'Content or media is required' });
    }

    const db = admin.firestore();

    let imageUrl = image || '';
    let mediaType = '';
    if (image && image.startsWith('data:')) {
      const mimeMatch = image.match(/^data:([^;]+);/);
      const contentType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      const subtype = contentType.split('/')[1] || 'jpg';
      const ext = subtype === 'jpeg' ? 'jpg' : subtype;
      const dest = `posts/${req.user.id}/${Date.now()}.${ext}`;
      imageUrl = await uploadBase64ToStorage(image, dest);
      mediaType = contentType.startsWith('video/') ? 'video' : 'image';
    }

    const postData = {
      content: content || '',
      image: imageUrl,
      mediaType,
      authorId: req.user.id,
      likes: [],
      shares: [],
      sharedFromId: null,
      comments: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const postRef = await db.collection('posts').add(postData);
    const createdDoc = await postRef.get();
    const createdData = { id: createdDoc.id, ...createdDoc.data() };
    if (createdData.createdAt?.toDate) createdData.createdAt = createdData.createdAt.toDate().toISOString();
    const post = { ...createdData, author: { id: req.user.id, name: req.user.name, avatar: req.user.avatar } };

    const followers = req.user.followers || [];
    for (const followerId of followers) {
      const notifRef = await db.collection('notifications').add({
        recipientId: followerId,
        senderId: req.user.id,
        type: 'post',
        postId: postRef.id,
        isRead: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      const notifSnap = await notifRef.get();
      sendNotification(followerId, { id: notifRef.id, ...notifSnap.data() });
    }

    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const db = admin.firestore();
    const postDoc = await db.collection('posts').doc(req.params.id).get();
    if (!postDoc.exists) {
      return res.status(404).json({ message: 'Post not found' });
    }
    const post = postDoc.data();
    if (post.authorId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (post.sharedFromId) {
      const sharedDoc = await db.collection('posts').doc(post.sharedFromId).get();
      if (sharedDoc.exists) {
        await sharedDoc.ref.update({
          shares: admin.firestore.FieldValue.arrayRemove(req.user.id)
        });
      }
    }

    await postDoc.ref.delete();

    db.collection('notifications').where('postId', '==', req.params.id).get()
      .then(snap => {
        const batch = db.batch();
        snap.docs.forEach(doc => batch.delete(doc.ref));
        batch.commit();
      })
      .catch(() => {});

    res.json({ message: 'Post deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/:id/like', auth, async (req, res) => {
  try {
    const db = admin.firestore();
    const postRef = db.collection('posts').doc(req.params.id);
    const postDoc = await postRef.get();
    if (!postDoc.exists) return res.status(404).json({ message: 'Post not found' });

    const post = postDoc.data();
    const likes = post.likes || [];
    const alreadyLiked = likes.includes(req.user.id);

    if (alreadyLiked) {
      await postRef.update({ likes: admin.firestore.FieldValue.arrayRemove(req.user.id) });
      return res.json({ liked: false });
    }

    await postRef.update({ likes: admin.firestore.FieldValue.arrayUnion(req.user.id) });

    if (post.authorId !== req.user.id) {
      const notifRef = await db.collection('notifications').add({
        recipientId: post.authorId,
        senderId: req.user.id,
        type: 'like',
        postId: req.params.id,
        isRead: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      const notifSnap = await notifRef.get();
      sendNotification(post.authorId, { id: notifRef.id, ...notifSnap.data() });
    }

    res.json({ liked: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/:id/share', auth, async (req, res) => {
  try {
    const { content } = req.body;
    const db = admin.firestore();
    const originalDoc = await db.collection('posts').doc(req.params.id).get();
    if (!originalDoc.exists) return res.status(404).json({ message: 'Post not found' });

    const existingShare = await db.collection('posts')
      .where('authorId', '==', req.user.id)
      .where('sharedFromId', '==', req.params.id)
      .get();

    if (!existingShare.empty) {
      return res.status(400).json({ message: 'Already shared this post' });
    }

    const shareData = {
      content: content || '',
      authorId: req.user.id,
      sharedFromId: req.params.id,
      likes: [],
      shares: [],
      comments: [],
      image: '',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const shareRef = await db.collection('posts').add(shareData);
    await db.collection('posts').doc(req.params.id).update({
      shares: admin.firestore.FieldValue.arrayUnion(req.user.id)
    });

    const shareDoc = await shareRef.get();
    const sharedPost = { id: shareDoc.id, ...shareDoc.data() };
    if (sharedPost.createdAt?.toDate) sharedPost.createdAt = sharedPost.createdAt.toDate().toISOString();

    const original = originalDoc.data();
    if (original.createdAt?.toDate) original.createdAt = original.createdAt.toDate().toISOString();
    if (original.authorId !== req.user.id) {
      const notifRef = await db.collection('notifications').add({
        recipientId: original.authorId,
        senderId: req.user.id,
        type: 'share',
        postId: req.params.id,
        isRead: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      const notifSnap = await notifRef.get();
      sendNotification(original.authorId, { id: notifRef.id, ...notifSnap.data() });
    }

    const authorDoc = await db.collection('users').doc(req.user.id).get();
    const author = { id: authorDoc.id, ...authorDoc.data() };
    const originalAuthorDoc = await db.collection('users').doc(original.authorId).get();
    const originalAuthor = { id: originalAuthorDoc.id, ...originalAuthorDoc.data() };

    sharedPost.author = author;
    sharedPost.sharedFrom = { ...original, author: originalAuthor, id: req.params.id };

    res.status(201).json(sharedPost);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/:id/comment', auth, async (req, res) => {
  try {
    const { content } = req.body;
    const db = admin.firestore();
    const postRef = db.collection('posts').doc(req.params.id);
    const postDoc = await postRef.get();
    if (!postDoc.exists) return res.status(404).json({ message: 'Post not found' });

    const comment = {
      userId: req.user.id,
      content,
      createdAt: new Date().toISOString(),
      replies: []
    };

    await postRef.update({
      comments: admin.firestore.FieldValue.arrayUnion(comment)
    });

    const post = postDoc.data();
    if (post.authorId !== req.user.id) {
      const notifRef = await db.collection('notifications').add({
        recipientId: post.authorId,
        senderId: req.user.id,
        type: 'comment',
        postId: req.params.id,
        isRead: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      const notifSnap = await notifRef.get();
      sendNotification(post.authorId, { id: notifRef.id, ...notifSnap.data() });
    }

    const updatedDoc = await postRef.get();
    const updated = { id: updatedDoc.id, ...updatedDoc.data() };
    const authorDoc = await db.collection('users').doc(req.user.id).get();
    const author = { id: authorDoc.id, ...authorDoc.data() };
    updated.author = author;

    const userIds = new Set();
    (updated.comments || []).forEach(c => { userIds.add(c.userId); (c.replies || []).forEach(r => userIds.add(r.userId)); });
    if (userIds.size > 0) {
      const userMap = await getUsersByIds([...userIds]);
      updated.comments = (updated.comments || []).map(c => ({
        ...c,
        user: userMap[c.userId] || null,
        replies: (c.replies || []).map(r => ({ ...r, user: userMap[r.userId] || null }))
      }));
    }

    res.status(201).json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/:id/comment/:commentId/reply', auth, async (req, res) => {
  try {
    const { content } = req.body;
    const db = admin.firestore();
    const postRef = db.collection('posts').doc(req.params.id);
    const postDoc = await postRef.get();
    if (!postDoc.exists) return res.status(404).json({ message: 'Post not found' });

    const post = postDoc.data();
    const comments = post.comments || [];
    const commentIndex = comments.findIndex(c => c.createdAt === req.params.commentId);
    if (commentIndex === -1) return res.status(404).json({ message: 'Comment not found' });

    const reply = { userId: req.user.id, content, createdAt: new Date().toISOString() };
    comments[commentIndex].replies.push(reply);

    await postRef.update({ comments });

    const comment = comments[commentIndex];
    if (comment.userId !== req.user.id) {
      const notifRef = await db.collection('notifications').add({
        recipientId: comment.userId,
        senderId: req.user.id,
        type: 'comment',
        postId: req.params.id,
        isRead: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      const notifSnap = await notifRef.get();
      sendNotification(comment.userId, { id: notifRef.id, ...notifSnap.data() });
    }

    const updatedDoc = await postRef.get();
    const updated = { id: updatedDoc.id, ...updatedDoc.data() };

    const userIds = new Set();
    (updated.comments || []).forEach(c => { userIds.add(c.userId); (c.replies || []).forEach(r => userIds.add(r.userId)); });
    if (userIds.size > 0) {
      const userMap = await getUsersByIds([...userIds]);
      updated.comments = (updated.comments || []).map(c => ({
        ...c,
        user: userMap[c.userId] || null,
        replies: (c.replies || []).map(r => ({ ...r, user: userMap[r.userId] || null }))
      }));
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const db = admin.firestore();
    const postDoc = await db.collection('posts').doc(req.params.id).get();
    if (!postDoc.exists) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const post = { id: postDoc.id, ...postDoc.data() };
    if (post.createdAt?.toDate) post.createdAt = post.createdAt.toDate().toISOString();
    const authorDoc = await db.collection('users').doc(post.authorId).get();
    post.author = { id: authorDoc.id, ...authorDoc.data() };

    if (post.sharedFromId) {
      const sharedDoc = await db.collection('posts').doc(post.sharedFromId).get();
      if (sharedDoc.exists) {
        const sharedAuthorDoc = await db.collection('users').doc(sharedDoc.data().authorId).get();
        post.sharedFrom = { id: sharedDoc.id, ...sharedDoc.data(), author: { id: sharedAuthorDoc.id, ...sharedAuthorDoc.data() } };
        if (post.sharedFrom.createdAt?.toDate) post.sharedFrom.createdAt = post.sharedFrom.createdAt.toDate().toISOString();
      }
    }

    const userIds = new Set();
    (post.comments || []).forEach(c => {
      if (c.userId) userIds.add(c.userId);
      (c.replies || []).forEach(r => { if (r.userId) userIds.add(r.userId); });
    });
    if (userIds.size > 0) {
      const userMap = await getUsersByIds([...userIds]);
      post.comments = post.comments.map(c => ({
        ...c,
        user: userMap[c.userId] || null,
        replies: (c.replies || []).map(r => ({ ...r, user: userMap[r.userId] || null }))
      }));
    }

    res.json(post);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
