let io = null;

const setIO = (instance) => { io = instance; };

const sendNotification = (userId, notification) => {
  if (!io) return;
  io.to(userId.toString()).emit('newNotification', notification);
};

module.exports = { setIO, sendNotification };
