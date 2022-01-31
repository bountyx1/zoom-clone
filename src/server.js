import express from "express";
import http from "http";
import SocketIO from "socket.io";
import { defaultRooms } from "./rooms";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views" );
app.locals.basedir =  app.get('views');
app.use('/public', express.static(__dirname+"/public"));
app.get('/', (req, res) => res.render("index"));

export const server = http.createServer(app);
export const wsServer = SocketIO(server);


/*utils */
const users = [];
let publicRooms = defaultRooms
const user = {
    join: function(id, profile, room) {
        users.push({id, profile, room});
    },
    leave: function(id) {
        
    }
}

function userJoin() {
    const user = users.find(user => user.id === id);
    if (index !== -1) {
        return users.splice(index, 1)[0];
      }
}

function getCurrentUser(id) {
    return 
}

function messageFormat(message, user) {
    let time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    return {message, time, user};
}


/*Room*/
const filterRoom = (room) => {
    let roomExists = publicRooms.filter(item => item.name === room.name);
    if(!roomExists[0]) {
        console.log("room Doesn't exists", room)
        publicRooms.unshift(room);
    };
}

const roomAction = (socket) => {
    socket.on("room", ({room, action, user}) => {
        if (action in ["join","leave"]) {
            filterRoom(room);
            socket[action](room.name);
            let msg = `${user.username} has ${action} the chatroom`
            socket.to(room.name).emit("message", {"message":messageFormat(msg), "room":room.name});
        };
    });
};

function rooms(wsServer) {
    let privateRooms = [];
    let tempublicRooms = ['noona', 'abhishek', 'developer', 'kakao friends', 
                       'python coding', 'Rakesh', 'games buddy', 'dramas', 
                       'coding', 'Test', 'opsec', 'devops', 'free trick', 'india'];

    const {sids, rooms} = wsServer.sockets.adapter;

    rooms.forEach((_, key) => {
        sids.get(key) === undefined ? tempublicRooms.push(key) : privateRooms.push(key);
    });

    publicRooms = publicRooms.filter((item) => tempublicRooms.includes(item.name));

    return {publicRooms, privateRooms};
}

/* Message*/

const message = (socket) => {
    socket.on("message", ({msg, room, username}) => {
        socket.to(room).emit("message", {"message":messageFormat(msg), "room":room});
    })
}

/*Video*/

wsServer.on("connection", (socket) => {
    roomAction(socket);
    message(socket);
    socket.emit("rooms", rooms(wsServer));
    //inActive(socket);
    
})

server.listen("3000")
