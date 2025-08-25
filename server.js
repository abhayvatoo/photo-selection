const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

console.log(`🚀 Starting server in ${dev ? 'DEVELOPMENT' : 'PRODUCTION'} mode`);

// Initialize Next.js app

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Create HTTP server for Next.js
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Initialize Socket.IO on the same server
  let io;
  try {
    const { Server } = require('socket.io');
    const { PrismaClient } = require('@prisma/client');

    const prisma = new PrismaClient();

    io = new Server(server, {
      cors: {
        origin:
          process.env.NODE_ENV === 'production'
            ? false
            : ['http://localhost:3000'],
        methods: ['GET', 'POST'],
      },
    });

    io.on('connection', (socket) => {
      socket.on('joinRoom', async ({ userId, userName }) => {
        socket.data.userId = userId;
        socket.data.userName = userName;

        // Join a general room for all users
        await socket.join('photo-selection');

        // Broadcast user connection to others
        socket
          .to('photo-selection')
          .emit('userConnected', { userId, userName });
      });

      socket.on('selectPhoto', async ({ photoId, userId }) => {
        try {
          // Convert photoId to number since Photo model uses Int
          const photoIdInt = parseInt(photoId);

          // Check if selection already exists
          const existingSelection = await prisma.photoSelection.findUnique({
            where: {
              photoId_userId: {
                photoId: photoIdInt,
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
                photoId: photoIdInt,
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
        } catch (error) {
          console.error('Error handling photo selection:', error);
        }
      });

      socket.on('uploadPhoto', (data) => {
        // Broadcast new photo upload notification to all users
        socket.to('photo-selection').emit('photoUploaded', {
          workspaceId: data.workspaceId,
          message: data.message,
        });
      });

      socket.on('disconnect', () => {
        if (socket.data.userId) {
          socket.to('photo-selection').emit('userDisconnected', {
            userId: socket.data.userId,
          });
        }
      });
    });

    console.log('✅ Socket.IO initialized successfully');
  } catch (error) {
    console.log('⚠️ Socket.IO initialization failed:', error.message);
    console.log('Server will run without real-time features.');
  }

  // Start server
  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Next.js ready on http://${hostname}:${port}`);
    if (io) {
      console.log(`> Socket.io ready on http://${hostname}:${port}/socket.io`);
    }
  });
});
