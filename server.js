const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
// Note: We'll import socket server dynamically to handle TypeScript compilation
let initializeSocket;

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;
const socketPort = process.env.SOCKET_PORT || 3001;

console.log(`🚀 Starting server in ${dev ? 'DEVELOPMENT' : 'PRODUCTION'} mode`);
if (dev) {
  console.log('📊 Using PostgreSQL database + local storage (bucket folder)');
}

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

  // Create separate HTTP server for Socket.io
  const socketServer = createServer();
  
  // Dynamically import and initialize socket server
  try {
    const socketModule = require('./dist/src/lib/socket-server.js');
    initializeSocket = socketModule.initializeSocket;
    const io = initializeSocket(socketServer);
  } catch (error) {
    console.log('Socket server will be available after build. Running without real-time features for now.');
  }

  // Start servers
  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Next.js ready on http://${hostname}:${port}`);
  });

  socketServer.listen(socketPort, (err) => {
    if (err) throw err;
    console.log(`> Socket.io server ready on http://${hostname}:${socketPort}`);
  });
});
