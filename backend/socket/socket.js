const admin = require('firebase-admin');

const connectedUsers = new Map();

const setupSocket = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }
      const decoded = await admin.auth().verifyIdToken(token);
      socket.userId = decoded.uid;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    connectedUsers.set(socket.userId, socket.id);
    io.emit('userOnline', socket.userId);

    socket.join(socket.userId);

    socket.on('disconnect', () => {
      connectedUsers.delete(socket.userId);
      io.emit('userOffline', socket.userId);
    });
  });
};

const getSocketId = (userId) => connectedUsers.get(userId);

module.exports = { setupSocket, getSocketId };
