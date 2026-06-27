const express = require('express');
const admin = require('firebase-admin');
const auth = require('../middleware/auth');
const { getUsersByIds, getPostsByIds } = require('../config/Firebase');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const db = admin.firestore();
    let notifSnap;
    try {
      notifSnap = await db.collection('notifications')
        .where('recipientId', '==', req.user.id)
        .orderBy('createdAt', 'desc')
        .limit(20)
        .get();
    } catch {
      notifSnap = await db.collection('notifications')
        .where('recipientId', '==', req.user.id)
        .limit(20)
        .get();
    }

    const notifications = [];
    const userIds = new Set();
    const postIds = new Set();

    notifSnap.docs.forEach(doc => {
      const data = doc.data();
      if (data.createdAt?.toDate) data.createdAt = data.createdAt.toDate().toISOString();
      notifications.push({ id: doc.id, ...data });
      if (data.senderId) userIds.add(data.senderId);
      if (data.postId) postIds.add(data.postId);
    });

    const userMap = userIds.size > 0 ? await getUsersByIds([...userIds]) : {};
    const postMap = postIds.size > 0 ? await getPostsByIds([...postIds]) : {};

    notifications.forEach(n => {
      n.sender = userMap[n.senderId] || { id: n.senderId };
      n.post = postMap[n.postId] || null;
    });

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/unread-count', auth, async (req, res) => {
  try {
    const db = admin.firestore();
    const notifSnap = await db.collection('notifications')
      .where('recipientId', '==', req.user.id)
      .where('isRead', '==', false)
      .get();

    res.json({ count: notifSnap.size });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/:id/read', auth, async (req, res) => {
  try {
    const db = admin.firestore();
    const notifRef = db.collection('notifications').doc(req.params.id);
    const notifDoc = await notifRef.get();

    if (!notifDoc.exists || notifDoc.data().recipientId !== req.user.id) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    await notifRef.update({ isRead: true });
    const updated = await notifRef.get();
    res.json({ id: updated.id, ...updated.data() });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/mark-all-read', auth, async (req, res) => {
  try {
    const db = admin.firestore();
    const notifSnap = await db.collection('notifications')
      .where('recipientId', '==', req.user.id)
      .where('isRead', '==', false)
      .get();

    const batch = db.batch();
    notifSnap.docs.forEach(doc => batch.update(doc.ref, { isRead: true }));
    await batch.commit();

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.delete('/clear-all', auth, async (req, res) => {
  try {
    const db = admin.firestore();
    const notifSnap = await db.collection('notifications')
      .where('recipientId', '==', req.user.id)
      .get();

    const batch = db.batch();
    notifSnap.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    res.json({ message: 'All notifications cleared' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const db = admin.firestore();
    const notifRef = db.collection('notifications').doc(req.params.id);
    const notifDoc = await notifRef.get();

    if (!notifDoc.exists || notifDoc.data().recipientId !== req.user.id) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    await notifRef.delete();
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
