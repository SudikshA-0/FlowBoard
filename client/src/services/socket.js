import { io } from 'socket.io-client';

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(window.location.origin, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
};

export const connectSocket = (userId) => {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
    s.on('connect', () => {
      s.emit('joinRoom', { userId });
    });
  }
  return s;
};

export const joinProject = (projectId) => {
  const s = getSocket();
  if (!projectId) return;
  if (!s.connected) return;
  s.emit('joinProject', { projectId });
};

export const leaveProject = (projectId) => {
  const s = getSocket();
  if (!projectId) return;
  if (!s.connected) return;
  s.emit('leaveProject', { projectId });
};

export const disconnectSocket = () => {
  if (socket?.connected) socket.disconnect();
};
