import express from "express";
import http from "http";
import SocketIO from "socket.io";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views" );
app.locals.basedir =  app.get('views');

app.use('/public', express.static(__dirname+"/public"));

app.get('/', (req, res) => res.render("index"));

export const server = http.createServer(app);


export const wsServer = SocketIO(server);

/*
wsServer.on("connection", (socket) => {
    roomAction(socket);
    message(socket);
    inActive(socket);
    socket.emit("rooms", allRooms().publicRooms);
})

*/
server.listen("3000")
