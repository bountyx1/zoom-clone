export const message = (socket) => {
    socket.on("message", ({msg, room, username}) => {
        socket.to(room).emit("message", messageFormat(msg));
    })
}