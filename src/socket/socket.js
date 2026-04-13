import { io } from 'socket.io-client';
require('dotenv').config();

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

export default socket;
