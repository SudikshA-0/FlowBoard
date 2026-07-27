/**
 * Frontend-only no-op Socket layer.
 *
 * Kept to avoid changing UI/component imports; real-time is disabled when running without a backend.
 */

const createNoopSocket = () => {
  const handlers = new Map();
  return {
    connected: false,
    connect() { this.connected = true; },
    disconnect() { this.connected = false; handlers.clear(); },
    emit() {},
    on(event, fn) {
      const arr = handlers.get(event) || [];
      arr.push(fn);
      handlers.set(event, arr);
    },
    off(event, fn) {
      const arr = handlers.get(event) || [];
      handlers.set(event, fn ? arr.filter((x) => x !== fn) : []);
    },
  };
};

let socket = null;

export const getSocket = () => {
  if (!socket) socket = createNoopSocket();
  return socket;
};

export const connectSocket = (_userId) => {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
};

export const joinProject = (_projectId) => {};
export const leaveProject = (_projectId) => {};

export const disconnectSocket = () => {
  if (socket) socket.disconnect();
};
