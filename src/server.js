import express from "express";
import http from "http";
import SocketIO from "socket.io";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.locals.basedir = app.get('views');
app.use('/public', express.static(__dirname + "/public"));
app.get('/', (req, res) => res.render("index"));
app.get('/video/:roomId', (req, res) => res.render("video_call", { roomId: req.params.roomId }));

export const server = http.createServer(app);
export const wsServer = SocketIO(server);


/*utils */
const users = [];
let publicRooms = [];

function userJoin(id, profile, room) {
    users.push({ id, profile, room });
}

function userLeave(id) {
    const index = users.findIndex(user => user.id === id);
    if (index !== -1) {
        return users.splice(index, 1)[0];
    }
    return null;
}

function getCurrentUser(id) {
    return users.find(user => user.id === id) || null;
}

function messageFormat(message, user) {
    let time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return { message, time, user };
}


/*Room*/
const filterRoom = (room) => {
    let roomExists = publicRooms.filter(item => item.name === room.name);
    if (!roomExists[0]) {
        console.log("room Doesn't exists", room)
        publicRooms.unshift(room);
    };
}

const roomAction = (socket) => {
    socket.on("room", ({ room, action, user }) => {
        if (["join", "leave"].includes(action)) {
            filterRoom(room);
            socket[action](room.name);
            let msg = `${user.username} has ${action} the chatroom`;
            socket.to(room.name).emit("message", { "message": messageFormat(msg), "room": room.name });
        }
    });
};

function rooms(wsServer) {
    let privateRooms = [];
    let tempublicRooms = [];

    const { sids, rooms } = wsServer.sockets.adapter;

    rooms.forEach((_, key) => {
        sids.get(key) === undefined ? tempublicRooms.push(key) : privateRooms.push(key);
    });

    publicRooms = publicRooms.filter((item) => tempublicRooms.includes(item.name));

    return { publicRooms, privateRooms };
}

/* Message*/

const message = (socket) => {
    socket.on("message", ({ msg, room, username, avatar }) => {
        socket.to(room).emit("message", {
            "message": messageFormat(msg),
            "room": room,
            "username": username,
            "avatar": avatar
        });
    });
}

/*Video Call*/
const videoRooms = new Map(); // roomId -> Set of socket IDs

wsServer.on("connection", (socket) => {
    roomAction(socket);
    message(socket);
    socket.emit("rooms", rooms(wsServer));

    // Video call events
    socket.on('join-video-room', (roomId) => {
        socket.join(roomId);

        if (!videoRooms.has(roomId)) {
            videoRooms.set(roomId, new Set());
        }
        videoRooms.get(roomId).add(socket.id);

        // Notify others in the room
        socket.to(roomId).emit('user-connected', socket.id);

        // Send participant count to everyone in the room
        const participantCount = videoRooms.get(roomId).size;
        wsServer.to(roomId).emit('participant-count', participantCount);
    });

    socket.on('leave-video-room', (roomId) => {
        socket.leave(roomId);

        if (videoRooms.has(roomId)) {
            videoRooms.get(roomId).delete(socket.id);
            if (videoRooms.get(roomId).size === 0) {
                videoRooms.delete(roomId);
            } else {
                const participantCount = videoRooms.get(roomId).size;
                wsServer.to(roomId).emit('participant-count', participantCount);
            }
        }

        socket.to(roomId).emit('user-disconnected', socket.id);
    });

    socket.on('video-chat-message', ({ roomId, message, sender, timestamp }) => {
        socket.to(roomId).emit('video-chat-message', { sender, message, timestamp });
    });

    socket.on('toggle-audio', ({ roomId, muted }) => {
        socket.to(roomId).emit('user-toggle-audio', { userId: socket.id, muted });
    });

    socket.on('toggle-video', ({ roomId, cameraOff }) => {
        socket.to(roomId).emit('user-toggle-video', { userId: socket.id, cameraOff });
    });

    // WebRTC Signaling
    socket.on('offer', ({ roomId, offer, to }) => {
        socket.to(to).emit('offer', { from: socket.id, offer });
    });

    socket.on('answer', ({ roomId, answer, to }) => {
        socket.to(to).emit('answer', { from: socket.id, answer });
    });

    socket.on('ice-candidate', ({ roomId, candidate, to }) => {
        socket.to(to).emit('ice-candidate', { from: socket.id, candidate });
    });

    socket.on('disconnect', () => {
        // Clean up video rooms
        videoRooms.forEach((participants, roomId) => {
            if (participants.has(socket.id)) {
                participants.delete(socket.id);
                socket.to(roomId).emit('user-disconnected', socket.id);

                if (participants.size === 0) {
                    videoRooms.delete(roomId);
                } else {
                    wsServer.to(roomId).emit('participant-count', participants.size);
                }
            }
        });
    });
});

// For local development
if (process.env.NODE_ENV !== 'production') {
    server.listen(3000, () => {
        console.log('✅ Server running on http://localhost:3000');
    });
}

// Export for Vercel (but WebSockets won't work on Vercel)
export default app;
