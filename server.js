import { createServer } from 'node:http';
import next from 'next';
import { Server } from 'socket.io';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import express from 'express';

// const dev = process.env.NODE_ENV !== 'production';
const dev = false;
const hostname = 'localhost';
const port = 3001;
const basePath = '/dev'; // 添加 basePath 配置
// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 文件存储路径
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

app.prepare().then(() => {
  const server = express();
  server.use(`${basePath}/uploads`, express.static(path.join(__dirname, 'uploads')));

  server.use((req, res) => {
    return handler(req, res);
  });
  const httpServer = createServer(server);

  const io = new Server(httpServer);

  io.on('connection', (socket) => {
    socket.on('wave', (msg) => {
      socket.to(msg.socketId).emit('wave_response', {
        room: msg.room,
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
      socket.broadcast.emit('mouse_remove_response', msg);
    });

    socket.on('chat_msg', (msg) => {
      socket.broadcast.emit('chat_msg_response', msg);
    });
    socket.on('chat_file', async (msg) => {
      try {
        const { file, sender, roomName } = msg;
        const fileId = Date.now().toString();
        const fileExt = path.extname(file.name);
        const fileName = `${fileId}${fileExt}`;
        const dirPath = path.join(uploadDir, roomName);
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }

        const filePath = path.join(uploadDir, roomName, fileName);
        console.log('filePath', filePath);
        // 处理文件数据
        let fileData;
        if (file.data.startsWith('data:')) {
          // 处理 base64 数据
          const base64Data = file.data.split(',')[1];
          fileData = Buffer.from(base64Data, 'base64');
        } else {
          // 处理二进制数据
          fileData = Buffer.from(file.data);
        }

        // 保存文件
        fs.writeFileSync(filePath, fileData);

        // 文件URL (根据实际部署情况调整)
        const fileUrl = `${basePath}/uploads/${roomName}/${fileName}`;

        // 广播文件消息
        const fileMessage = {
          id: fileId,
          sender: {
            id: sender.id,
            name: sender.name,
          },
          roomName,
          message: `文件: ${file.name}`,
          timestamp: Date.now(),
          type: 'file',
          file: {
            name: file.name,
            size: file.size,
            type: file.type,
            url: fileUrl,
          },
        };

        io.emit('chat_file_response', fileMessage);
      } catch (error) {
        console.error('文件处理失败', error);
        socket.emit('error', { message: '文件处理失败' });
      }
    });

    socket.on("reload_virtual", (msg) => {
      socket.broadcast.emit("reload_virtual_response", msg);
    });

    socket.on('clear_room_resources', async (msg) => {
      const { roomName } = msg;
      // 删除uploads下的对应roomName的文件夹
      const roomDir = path.join(uploadDir, roomName);
      if (fs.existsSync(roomDir)) {
        fs.rmdirSync(roomDir, { recursive: true });
      }
    });

    socket.on('new_user_status', (msg) => {
      io.emit('new_user_status_response', msg);
    });

    socket.on('disconnect', (msg) => {
      console.log('Socket disconnected', socket.id);
    });
  });

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}${basePath}`);
    });
});
