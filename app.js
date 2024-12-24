const express = require("express");
const app = express();
const indexRouter = require("./routes/index");
const path = require("path");
const http = require("http");
const socketIo = require("socket.io");

const server = http.createServer(app);
const io = socketIo(server);

let waitingUsers = [];
let rooms = {};

io.on("connection", function (socket) {
  socket.on("joinroom", () => {
    if (waitingUsers.length > 0) {
      let partner = waitingUsers.shift();
      const roomname = `${socket.id}-${partner.id}`;
      socket.join(roomname);
      partner.join(roomname);

      io.to(roomname).emit("joined", roomname);
    } else {
      waitingUsers.push(socket);
    }
  });

  socket.on("message", (data) => {
    socket.broadcast.to(data.room).emit("message", data.message);
  });

  socket.on("disconnect", () => {
    let index = waitingUsers.findIndex(
      (waitingUser) => waitingUser.id === socket.id
    );
    waitingUsers.splice(index, 1);
  });
});

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);

server.listen(3000);
