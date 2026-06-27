const { db } = require('../config/Firebase');

const getCol = (conversationId) => db.collection('conversations').doc(conversationId).collection('messages');

const findById = async (conversationId, messageId) => {
  const doc = await getCol(conversationId).doc(messageId).get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
};

module.exports = { getCol, findById };
