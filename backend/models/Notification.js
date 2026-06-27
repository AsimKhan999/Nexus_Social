const { db } = require('../config/Firebase');

const collection = 'notifications';
const getCol = () => db.collection(collection);

module.exports = { collection, getCol };
