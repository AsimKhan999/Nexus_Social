const express = require('express');
const multer = require('multer');
const admin = require('firebase-admin');
const auth = require('../middleware/auth');
const { sendNotification } = require('../socket/notify');
const { uploadToStorage, getUsersByIds } = require('../config/Firebase');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|svg|mp4|webm|pdf|doc|docx|xls|xlsx|txt|zip|mp3|wav|ogg/;
    const ext = allowed.test(file.originalname.split('.').pop().toLowerCase());
    const mime = allowed.test(file.mimetype.split('/')[1]);
    if (ext || mime) cb(null, true);
    else cb(new Error('File type not allowed'));
  }
});

const router = express.Router();

router.get('/conversations', auth, async (req, res) => {
  try {
    const db = admin.firestore();
    let convSnap;
    try {
      convSnap = await db.collection('conversations')
        .where('participants', 'array-contains', req.user.id)
        .orderBy('updatedAt', 'desc')
        .get();
    } catch {
      convSnap = await db.collection('conversations')
        .where('participants', 'array-contains', req.user.id)
        .get();
    }

    const conversations = [];
    const participantIds = new Set();

    convSnap.docs.forEach(doc => {
      const data = doc.data();
      if ((data.deletedBy || []).includes(req.user.id)) return;
      if (data.createdAt?.toDate) data.createdAt = data.createdAt.toDate().toISOString();
      if (data.updatedAt?.toDate) data.updatedAt = data.updatedAt.toDate().toISOString();
      const cleared = (data.clearedBy || []).includes(req.user.id);
      conversations.push({ id: doc.id, ...data, lastMessage: cleared ? null : data.lastMessage, unreadCount: cleared ? { ...data.unreadCount, [req.user.id]: 0 } : data.unreadCount });
      (data.participants || []).forEach(p => participantIds.add(p));
      if (data.lastMessage && !cleared && data.lastMessage.senderId) {
        participantIds.add(data.lastMessage.senderId);
      }
    });

    if (participantIds.size > 0) {
      const userMap = await getUsersByIds([...participantIds]);
      conversations.forEach(c => {
        c.participants = (c.participants || []).map(pId => userMap[pId] || { id: pId });
        if (c.lastMessage && c.lastMessage.senderId) {
          c.lastMessage.sender = userMap[c.lastMessage.senderId] || { id: c.lastMessage.senderId };
        }
      });
    }

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/unread-count', auth, async (req, res) => {
  try {
    const db = admin.firestore();
    const convSnap = await db.collection('conversations')
      .where('participants', 'array-contains', req.user.id)
      .get();

    let total = 0;
    convSnap.docs.forEach(doc => {
      const data = doc.data();
      if ((data.deletedBy || []).includes(req.user.id)) return;
      const unread = data.unreadCount || {};
      total += unread[req.user.id] || 0;
    });

    res.json({ count: total });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/conversations', auth, async (req, res) => {
  try {
    const { participantId } = req.body;
    if (!participantId) return res.status(400).json({ message: 'Participant ID is required' });
    if (participantId === req.user.id) return res.status(400).json({ message: 'Cannot message yourself' });

    const db = admin.firestore();
    const convSnap = await db.collection('conversations')
      .where('participants', 'array-contains', req.user.id)
      .get();

    let conversation = null;
    convSnap.docs.forEach(doc => {
      const data = doc.data();
      if (data.participants && data.participants.includes(participantId) && data.participants.length === 2) {
        conversation = { id: doc.id, ...data };
      }
    });

    if (!conversation) {
      const convRef = await db.collection('conversations').add({
        participants: [req.user.id, participantId],
        lastMessage: null,
        unreadCount: {},
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      conversation = { id: convRef.id, participants: [req.user.id, participantId], lastMessage: null, unreadCount: {} };
    } else {
      await db.collection('conversations').doc(conversation.id).update({
        deletedBy: admin.firestore.FieldValue.arrayRemove(req.user.id),
        clearedBy: admin.firestore.FieldValue.arrayRemove(req.user.id)
      });
    }

    const userMap = await getUsersByIds([req.user.id, participantId]);
    conversation.participants = (conversation.participants || []).map(pId => userMap[pId] || { id: pId });

    res.json(conversation);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/conversations/:id', auth, async (req, res) => {
  try {
    const db = admin.firestore();
    const convDoc = await db.collection('conversations').doc(req.params.id).get();
    if (!convDoc.exists) return res.status(404).json({ message: 'Conversation not found' });

    const convData = convDoc.data();
    const isParticipant = (convData.participants || []).includes(req.user.id);
    if (!isParticipant) return res.status(403).json({ message: 'Not authorized' });

    if ((convData.deletedBy || []).includes(req.user.id)) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const unreadCount = convData.unreadCount || {};
    unreadCount[req.user.id] = 0;
    await convDoc.ref.update({ unreadCount });

    const cleared = (convData.clearedBy || []).includes(req.user.id);

    const messages = [];
    const userIds = new Set();

    if (!cleared) {
      const msgSnap = await db.collection('conversations').doc(req.params.id).collection('messages')
        .orderBy('createdAt', 'asc')
        .get();

      msgSnap.docs.forEach(doc => {
        const msg = doc.data();
        if (msg.createdAt?.toDate) msg.createdAt = msg.createdAt.toDate().toISOString();
        if (msg.deleted || (msg.deletedFor && msg.deletedFor.includes(req.user.id))) return;
        messages.push({ id: doc.id, ...msg });
        if (msg.senderId) userIds.add(msg.senderId);
        if (msg.replyTo) userIds.add(msg.senderId);
      });
    }

    const userMap = userIds.size > 0 ? await getUsersByIds([...userIds]) : {};

    messages.forEach(msg => {
      msg.sender = userMap[msg.senderId] || { id: msg.senderId };
    });

    const participantUsers = await getUsersByIds(convData.participants || []);

    const conversation = { id: convDoc.id, ...convData };
    if (conversation.createdAt?.toDate) conversation.createdAt = conversation.createdAt.toDate().toISOString();
    if (conversation.updatedAt?.toDate) conversation.updatedAt = conversation.updatedAt.toDate().toISOString();
    conversation.participants = (convData.participants || []).map(pId => participantUsers[pId] || { id: pId });

    res.json({ conversation, messages });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/conversations/:id/upload', auth, upload.array('files', 5), async (req, res) => {
  try {
    const db = admin.firestore();
    const convDoc = await db.collection('conversations').doc(req.params.id).get();
    if (!convDoc.exists) return res.status(404).json({ message: 'Conversation not found' });

    const convData = convDoc.data();
    const isParticipant = (convData.participants || []).some(p => p === req.user.id);
    if (!isParticipant) return res.status(403).json({ message: 'Not authorized' });

    const files = await Promise.all(req.files.map(async (f, i) => {
      const dest = `messages/${req.params.id}/${Date.now()}-${i}-${f.originalname}`;
      const url = await uploadToStorage(f.buffer, dest, f.mimetype);
      return { url, type: f.mimetype, name: f.originalname };
    }));

    res.json(files);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/conversations/:id/messages', auth, async (req, res) => {
  try {
    const { content, replyTo, attachments } = req.body;
    if ((!content || !content.trim()) && (!attachments || !attachments.length)) {
      return res.status(400).json({ message: 'Content or attachment is required' });
    }

    const db = admin.firestore();
    const convRef = db.collection('conversations').doc(req.params.id);
    const convDoc = await convRef.get();
    if (!convDoc.exists) return res.status(404).json({ message: 'Conversation not found' });

    const convData = convDoc.data();
    const isParticipant = (convData.participants || []).includes(req.user.id);
    if (!isParticipant) return res.status(403).json({ message: 'Not authorized' });

    const msgData = {
      senderId: req.user.id,
      content: content || '',
      attachments: attachments || [],
      replyTo: replyTo || null,
      deleted: false,
      deletedFor: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const msgRef = await db.collection('conversations').doc(req.params.id).collection('messages').add(msgData);
    const msgSnap = await msgRef.get();
    const msg = { id: msgRef.id, ...msgSnap.data() };
    if (msg.createdAt?.toDate) msg.createdAt = msg.createdAt.toDate().toISOString();

    const recipientId = (convData.participants || []).find(p => p !== req.user.id);
    const unreadCount = convData.unreadCount || {};
    unreadCount[recipientId] = (unreadCount[recipientId] || 0) + 1;

    await convRef.update({
      lastMessage: { content, senderId: req.user.id, createdAt: new Date() },
      unreadCount,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      clearedBy: admin.firestore.FieldValue.arrayRemove(req.user.id),
      deletedBy: admin.firestore.FieldValue.arrayRemove(req.user.id)
    });

    const userDoc = await db.collection('users').doc(req.user.id).get();
    msg.sender = { id: userDoc.id, ...userDoc.data() };

    res.status(201).json(msg);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.delete('/conversations/:id/messages', auth, async (req, res) => {
  try {
    const db = admin.firestore();
    const convRef = db.collection('conversations').doc(req.params.id);
    const convDoc = await convRef.get();
    if (!convDoc.exists) return res.status(404).json({ message: 'Conversation not found' });

    const convData = convDoc.data();
    const isParticipant = (convData.participants || []).includes(req.user.id);
    if (!isParticipant) return res.status(403).json({ message: 'Not authorized' });

    const unreadCount = convData.unreadCount || {};
    unreadCount[req.user.id] = 0;
    await convRef.update({
      clearedBy: admin.firestore.FieldValue.arrayUnion(req.user.id),
      lastMessage: null,
      unreadCount
    });

    res.json({ message: 'Chat cleared' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.delete('/conversations/:id', auth, async (req, res) => {
  try {
    const db = admin.firestore();
    const convRef = db.collection('conversations').doc(req.params.id);
    const convDoc = await convRef.get();
    if (!convDoc.exists) return res.status(404).json({ message: 'Conversation not found' });

    const convData = convDoc.data();
    const isParticipant = (convData.participants || []).includes(req.user.id);
    if (!isParticipant) return res.status(403).json({ message: 'Not authorized' });

    await convRef.update({
      deletedBy: admin.firestore.FieldValue.arrayUnion(req.user.id)
    });

    res.json({ message: 'Conversation deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/conversations/:id/mute', auth, async (req, res) => {
  try {
    const db = admin.firestore();
    const convRef = db.collection('conversations').doc(req.params.id);
    const convDoc = await convRef.get();
    if (!convDoc.exists) return res.status(404).json({ message: 'Conversation not found' });

    const convData = convDoc.data();
    const isParticipant = (convData.participants || []).includes(req.user.id);
    if (!isParticipant) return res.status(403).json({ message: 'Not authorized' });

    const mutedBy = convData.mutedBy || [];
    const isMuted = mutedBy.includes(req.user.id);

    if (isMuted) {
      await convRef.update({ mutedBy: admin.firestore.FieldValue.arrayRemove(req.user.id) });
      res.json({ muted: false });
    } else {
      await convRef.update({ mutedBy: admin.firestore.FieldValue.arrayUnion(req.user.id) });
      res.json({ muted: true });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.delete('/conversations/:convId/messages/:msgId', auth, async (req, res) => {
  try {
    const { scope } = req.query;
    const db = admin.firestore();

    const convDoc = await db.collection('conversations').doc(req.params.convId).get();
    if (!convDoc.exists) return res.status(404).json({ message: 'Conversation not found' });

    const convData = convDoc.data();
    const isParticipant = (convData.participants || []).includes(req.user.id);
    if (!isParticipant) return res.status(403).json({ message: 'Not authorized' });

    const msgRef = db.collection('conversations').doc(req.params.convId).collection('messages').doc(req.params.msgId);
    const msgDoc = await msgRef.get();
    if (!msgDoc.exists) return res.status(404).json({ message: 'Message not found' });

    const msgData = msgDoc.data();

    if (scope === 'everyone') {
      if (msgData.senderId !== req.user.id) {
        return res.status(403).json({ message: 'Only the sender can delete for everyone' });
      }
      await msgRef.update({ deleted: true });
    } else {
      await msgRef.update({ deletedFor: admin.firestore.FieldValue.arrayUnion(req.user.id) });
    }

    res.json({ message: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
