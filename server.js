import { createServer } from 'node:http';
import next from 'next';
import { Server } from 'socket.io';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;
// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);

  const io = new Server(httpServer);

  io.on('connection', (socket) => {
    console.log('New socket connection', socket.id);

    socket.on('wave', (msg) => {
      console.log('wave', msg);
      socket.to(msg.socketId).emit('wave_response', {
        senderId: msg.senderId,
        senderName: msg.senderName,
        receiverId: msg.receiverId,
      });
    });
    // 有用户更新自己的状态，发送给所有人
    socket.on('update_user_status', () => {
      socket.broadcast.emit('user_status_updated');
    });
    // 鼠标位置移动
    socket.on('mouse_move', (msg) => {
      // socket.to(msg.receSocketId).emit('mouse_move_response', msg);
      socket.broadcast.emit('mouse_move_response', msg);
    });
    socket.on('mouse_remove', (msg) => {
      socket.broadcast.emit('mouse_move_response', msg);
    });
  });

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
