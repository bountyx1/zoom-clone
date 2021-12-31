import express from "express";
import http from "http";
import SocketIO from "socket.io";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views" );
app.use('/public', express.static(__dirname+ "/public"));

app.get('/', (req, res) => res.render("home"));

const server = http.createServer(app);
const wsServer = SocketIO(server);


const roomAction = (socket) => {
    // Join and leave a room 
    socket.on("room", ({name, action, username}) => {
        console.log(name, action, username);

        if (action === "join") {
            let message = `${username} has joinned the chatroom`
            socket.join(name)
            socket.to(name).emit("bot", message);
            socket.emit("rooms", allRooms().publicRooms);
        }
        else{
            let message = `${username} has left the chatroom`
            console.log(message)
            socket.leave(name);
            socket.to(name).emit("bot", message);
        }
    });
}

const inActive = (socket) => {
    socket.on("disconnecting", () => {
        socket.rooms.forEach(room => {
            socket.to(room).emit("inactive");
        });
    })
}

const message = (socket) => {
    socket.on("message", ({msg, room}) => {
        socket.to(room).emit("message", msg);
    })
}


const allRooms = () => {
    const sids = wsServer.sockets.adapter.sids;
    const rooms = wsServer.sockets.adapter.rooms;
    const publicRooms = [];
    const privateRooms = [];
    rooms.forEach((_, key) => {
        sids.get(key) === undefined ? publicRooms.push(key) : privateRooms.push(key);
    });

    return {publicRooms, privateRooms};
}

wsServer.on("connection", (socket) => {

    roomAction(socket);
    message(socket);
    inActive(socket);
    socket.emit("rooms", allRooms().publicRooms);
})

server.listen("3000")
