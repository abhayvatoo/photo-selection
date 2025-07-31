import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { prisma } from './db';

export interface SocketData {
  userId?: string;
  userName?: string;
}

export interface ServerToClientEvents {
  photoSelected: (data: { photoId: string; userId: string; userName: string; selected: boolean }) => void;
  photoUploaded: (data: { photo: any }) => void;
  userConnected: (data: { userId: string; userName: string }) => void;
  userDisconnected: (data: { userId: string }) => void;
}

export interface ClientToServerEvents {
  joinRoom: (data: { userId: string; userName: string }) => void;
  selectPhoto: (data: { photoId: string; userId: string }) => void;
  uploadPhoto: (data: { photo: any }) => void;
}

export function initializeSocket(httpServer: HTTPServer) {
  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents, {}, SocketData>(
    httpServer,
    {
      cors: {
        origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:3000'],
        methods: ['GET', 'POST'],
      },
    }
  );

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('joinRoom', async ({ userId, userName }) => {
      socket.data.userId = userId;
      socket.data.userName = userName;
      
      // Join a general room for all users
      await socket.join('photo-selection');
      
      // Broadcast user connection to others
      socket.to('photo-selection').emit('userConnected', { userId, userName });
      
      console.log(`User ${userName} (${userId}) joined the room`);
    });

    socket.on('selectPhoto', async ({ photoId, userId }) => {
      try {
        // Check if selection already exists
        const existingSelection = await prisma.photoSelection.findUnique({
          where: {
            photoId_userId: {
              photoId,
              userId,
            },
          },
        });

        let selected = false;
        
        if (existingSelection) {
          // Remove selection
          await prisma.photoSelection.delete({
            where: { id: existingSelection.id },
          });
          selected = false;
        } else {
          // Add selection
          await prisma.photoSelection.create({
            data: {
              photoId,
              userId,
            },
          });
          selected = true;
        }

        // Broadcast the selection change to all users
        io.to('photo-selection').emit('photoSelected', {
          photoId,
          userId,
          userName: socket.data.userName || 'Unknown',
          selected,
        });

        console.log(`Photo ${photoId} ${selected ? 'selected' : 'deselected'} by ${socket.data.userName}`);
      } catch (error) {
        console.error('Error handling photo selection:', error);
      }
    });

    socket.on('uploadPhoto', (data) => {
      // Broadcast new photo to all users
      socket.to('photo-selection').emit('photoUploaded', data);
    });

    socket.on('disconnect', () => {
      if (socket.data.userId) {
        socket.to('photo-selection').emit('userDisconnected', { 
          userId: socket.data.userId 
        });
      }
      console.log('User disconnected:', socket.id);
    });
  });

  return io;
}
