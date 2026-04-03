require("dotenv").config();
const http = require("http");
const app = require("./src/app");
const { init } = require("./src/utils/socket");

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

// Khởi tạo Socket.io
init(server);

server.listen(PORT, () => {
  console.log(`Server & Socket.io đang chạy tại http://localhost:${PORT}`);
});
