import { io } from 'socket.io-client';

const getBackendUrl = () => {
  const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  // Socket.io client requires a protocol (http/https), if not provided it might fail or connect locally
  if (url && !url.startsWith('http')) {
    // Treat localhost as http and remote URLs as https
    return url.includes('localhost') ? `http://${url}` : `https://${url}`;
  }
  return url;
};

const socket = io(getBackendUrl(), {
  autoConnect: false,
});

socket.on('connect', () => console.log('✅ Socket connected', socket.id));
socket.on('disconnect', (reason) => console.error('❌ Socket disconnected:', reason));
socket.on('connect_error', (err) => console.error('❌ Connect error:', err.message));
socket.io.on('reconnect', (attempt) => console.log('🔄 Reconnected after', attempt, 'attempts'));
socket.io.on('reconnect_failed', () => console.error('💀 Reconnect failed permanently'));


export default socket;
