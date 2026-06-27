const express = require('express');
const admin = require('firebase-admin');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { name, idToken } = req.body;
    if (!idToken || !name) {
      return res.status(400).json({ message: 'Name and ID token are required' });
    }

    const decoded = await admin.auth().verifyIdToken(idToken);
    const { uid, email } = decoded;
    const db = admin.firestore();

    const existingDoc = await db.collection('users').doc(uid).get();
    if (existingDoc.exists) {
      return res.status(400).json({ message: 'User already registered' });
    }

    const userData = {
      name,
      email: email || '',
      avatar: '',
      bio: '',
      followers: [],
      following: [],
      isPrivate: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('users').doc(uid).set(userData);
    const user = { id: uid, ...userData, postCount: 0 };

    res.status(201).json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ message: 'ID token is required' });
    }

    const decoded = await admin.auth().verifyIdToken(idToken);
    const db = admin.firestore();
    const userDoc = await db.collection('users').doc(decoded.uid).get();

    if (!userDoc.exists) {
      const userRecord = await admin.auth().getUser(decoded.uid);
      const userData = {
        name: userRecord.displayName || decoded.name || (decoded.email || '').split('@')[0],
        email: decoded.email || '',
        avatar: '',
        bio: '',
        followers: [],
        following: [],
        isPrivate: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };
      await db.collection('users').doc(decoded.uid).set(userData);
      const newUser = { id: decoded.uid, ...userData, postCount: 0 };
      return res.json({ user: newUser });
    }

    const postsSnap = await db.collection('posts').where('authorId', '==', decoded.uid).get();
    const user = { id: userDoc.id, ...userDoc.data(), postCount: postsSnap.size };

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/me', auth, async (req, res) => {
  const db = admin.firestore();
  const userDoc = await db.collection('users').doc(req.user.id).get();
  const userData = userDoc.data();
  if (userData.createdAt?.toDate) userData.createdAt = userData.createdAt.toDate().toISOString();
  const postsSnap = await db.collection('posts').where('authorId', '==', req.user.id).get();
  const user = { id: req.user.id, ...userData, postCount: postsSnap.size };
  res.json({ user });
});

module.exports = router;
