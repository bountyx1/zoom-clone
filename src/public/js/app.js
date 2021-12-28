const socket = new WebSocket(`ws://${location.host}`);

socket.addEventListener("open", ()=>{
    console.log("Connected to server");
});

socket.addEventListener("message", (message) => {
    console.log(`Message recieved from server ${message.data}`);
});

socket.addEventListener("open", ()=>{
    console.log("disconnected to server");
});