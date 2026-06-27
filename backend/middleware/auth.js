const admin = require('firebase-admin');

const auth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const idToken = header.split(' ')[1];
    const decoded = await admin.auth().verifyIdToken(idToken);

    const db = admin.firestore();
    const userDoc = await db.collection('users').doc(decoded.uid).get();
    if (!userDoc.exists) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = { id: userDoc.id, ...userDoc.data() };
    req.firebaseUid = decoded.uid;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Not authorized', error: error.message });
  }
};

module.exports = auth;
