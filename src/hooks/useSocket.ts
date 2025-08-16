'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '@/lib/socket-server';

type SocketType = Socket<ServerToClientEvents, ClientToServerEvents>;

export function useSocket(userId?: string, userName?: string) {
  const socketRef = useRef<SocketType | null>(null);

  useEffect(() => {
    if (!userId || !userName) return;

    // Initialize socket connection
    const socket: SocketType = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000');
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to socket server');
      socket.emit('joinRoom', { userId, userName });
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from socket server');
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId, userName]);

  return socketRef.current;
}
