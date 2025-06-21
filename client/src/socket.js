// client/src/socket.js
// ----------------------------------
// Purpose: Initialize and export a singleton Socket.io client
//          for real-time events in React app.

import { io } from 'socket.io-client';

// The URL of the Socket.io server; override with VITE_SOCKET_URL in .env if needed
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

// Create the socket instance (we’ll manually connect after importing)
export const socket = io(SOCKET_URL, {
  autoConnect: false,
});

// Immediately connect
socket.connect();

