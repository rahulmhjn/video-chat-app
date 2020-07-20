const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

const PORT = process.env.PORT || 3000;

var activeSockets = [];

app.use(express.static(__dirname + "/public"));

app.get("/", (req, res) => {
  res.sendFile("/index.html");
});

io.on("connection", (socket) => {
  console.log("Socket Connected", socket.id);
  const existingSocket = activeSockets.find(
    (existingSocket) => existingSocket === socket.id
  );

  if (!existingSocket) {
    activeSockets.push(socket.id);
    socket.emit("update-user-list", {
      users: activeSockets.filter(
        (existingSocket) => existingSocket !== socket.id
      ),
    });
    socket.broadcast.emit("update-user-list", {
      users: [socket.id],
    });
  }

  socket.on("call-user", (data) => {
    socket.to(data.to).emit("call-made", {
      offer: data.offer,
      socket: socket.id,
    });
  });

  socket.on("make-answer", (data) => {
    socket.to(data.to).emit("answer-made", {
      socket: socket.id,
      answer: data.answer,
    });
  });

  socket.on("disconnect", () => {
    activeSockets = activeSockets.filter(
      (existingSocket) => existingSocket !== socket.id
    );
    socket.broadcast.emit("remove-user", {
      socketId: socket.id,
    });
  });
});

http.listen(PORT, () => {
  console.log(`Server connected at port: ${PORT}`);
});
