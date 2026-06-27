const { db } = require('../config/Firebase');

const collection = 'users';
const getCol = () => db.collection(collection);

const findById = async (id) => {
  const doc = await getCol().doc(id).get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
};

const findByEmail = async (email) => {
  const snap = await getCol().where('email', '==', email).get();
  return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
};

module.exports = { collection, getCol, findById, findByEmail };
