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

wss.on("connection", (socket) => {
    console.log("Connected to browser");
    socket.send("Hi there how you doing ?");
    socket.on("close", () => console.log("Disconnected to browser"));

    socket.on("message", (message) => console.log(message.toString()));
});

server.listen("3000")
