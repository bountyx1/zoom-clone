import express from "express";
import http from "http";
import WebSocket from "ws";

const app = express();

// Set template rendering engine
app.set("view engine", "pug");
app.set("views", __dirname + "/views" );

// Static file serving
app.use('/public', express.static(__dirname+ "/public"));

app.get('/', (req, res) => res.render("home"));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const sockets = [];

wss.on("connection", (socket, req) => {
    socket.id = req.headers['sec-websocket-key'];
    socket.nickname = "Anon";

    sockets.push(socket);

    socket.on("message", (message) => {

        sockets.forEach(sock => {
            const parse = JSON.parse(message);
            if (parse.type == "nickname")
            {
                socket.nickname = parse.payload;
            }

            parse.type == "message" ? sock.send(`${socket.nickname}: ${parse.payload}`): null;
            
        });
    });

});

server.listen("3000")
