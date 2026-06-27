const { db } = require('../config/Firebase');

const collection = 'conversations';
const getCol = () => db.collection(collection);

const findById = async (id) => {
  const doc = await getCol().doc(id).get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
};

module.exports = { collection, getCol, findById };
