const socketIo = require('socket.io');

let io;
// Map to track user_id -> socket.id
const userSockets = new Map();

const init = (server) => {
  io = socketIo(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "*",
      methods: ["GET", "POST", "PUT", "DELETE"]
    }
  });

  io.on('connection', (socket) => {
    // Lắng nghe sự kiện đăng ký User_ID từ Client
    socket.on('register', (userId) => {
      if (userId) {
        userSockets.set(userId, socket.id);
        console.log(`User ${userId} registered to socket ${socket.id}`);
      }
    });

    socket.on('disconnect', () => {
      // Tìm và xóa khỏi userSockets map
      for (const [userId, socketId] of userSockets.entries()) {
        if (socketId === socket.id) {
          userSockets.delete(userId);
          console.log(`User ${userId} disconnected`);
          break;
        }
      }
    });

    // --- CHAT REAL-TIME ---
    socket.on('SEND_PRIVATE_MESSAGE', async ({ senderId, receiverId, content }) => {
      try {
        const pool = require('../config/db');
        const result = await pool.query(
          "INSERT INTO messages (sender_id, receiver_id, content) VALUES ($1, $2, $3) RETURNING *",
          [senderId, receiverId, content]
        );
        const newMessage = result.rows[0];

        // Gửi tới người nhận
        const receiverSocketId = userSockets.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('RECEIVE_PRIVATE_MESSAGE', newMessage);
        }

        // Gửi xác nhận lại cho người gửi (để update UI mượt)
        socket.emit('MESSAGE_SENT', newMessage);
      } catch (err) {
        console.error("Socket error SEND_PRIVATE_MESSAGE:", err);
      }
    });

    socket.on('TYPING_STATUS', ({ senderId, receiverId, isTyping }) => {
      const receiverSocketId = userSockets.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('TYPING_STATUS', { senderId, isTyping });
      }
    });
  });

  return io;
};

const getIo = () => {
  if (!io) {
    throw new Error('Socket.io chưa được khởi tạo!');
  }
  return io;
};

// Hàm bắn thông báo real-time tới 1 user cụ thể
const emitToUser = (userId, eventName, data) => {
  if (!io) return;
  const socketId = userSockets.get(userId);
  if (socketId) {
    io.to(socketId).emit(eventName, data);
  }
};

module.exports = {
  init,
  getIo,
  emitToUser
};
