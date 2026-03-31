/**
 * Socket.io event handlers
 * Real-time sync: task events broadcast to all connected clients
 */
const setupSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`⚡ Socket connected: ${socket.id}`);

    socket.on('joinRoom', ({ userId }) => {
      socket.join(`user:${userId}`);
    });

    socket.on('joinTask', ({ taskId }) => {
      socket.join(`task:${taskId}`);
    });

    socket.on('leaveTask', ({ taskId }) => {
      socket.leave(`task:${taskId}`);
    });

    socket.on('joinProject', ({ projectId }) => {
      if (!projectId) return;
      socket.join(`project:${projectId}`);
    });

    socket.on('leaveProject', ({ projectId }) => {
      if (!projectId) return;
      socket.leave(`project:${projectId}`);
    });

    socket.on('dragStart', (data) => {
      socket.broadcast.emit('dragStarted', data);
    });

    socket.on('disconnect', () => {
      console.log(`⚡ Socket disconnected: ${socket.id}`);
    });
  });
};

module.exports = setupSocket;
