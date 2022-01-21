export const roomAction = (socket) => {
    socket.on("room", ({room, action, username}) => {
        if (action in ["join","leave"]) {
            socket[action](room);
            socket.to(room).emit("bot", messageFormat(`${username} has ${action} the chatroom`));
        };
    });
};


export const rooms = (wsServer) => {
    const publicRooms, privateRooms= [];
    const {sids, rooms} = wsServer.sockets.adapter;

    rooms.forEach((_, key) => {
        sids.get(key) === undefined ? publicRooms.push(key) : privateRooms.push(key);
    });

    return {publicRooms, privateRooms};
}
