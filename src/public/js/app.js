const socket = new WebSocket(`ws://${location.host}`);

const messageForm = document.getElementById("message");
const nicknameForm = document.getElementById("nickname");

const messages = document.querySelector("ul");


socket.addEventListener("message", (message) => {
    const li = document.createElement("li");
    li.innerText = message.data;
    messages.append(li)
});

const makeMsg = (type, payload) => JSON.stringify({type, payload});

const handleNickname = (event) => {
    event.preventDefault();
    const input = nicknameForm.querySelector("input");
    socket.send(makeMsg("nickname", input.value));
}

const sendMsg = (event) => {
    event.preventDefault();
    const input = messageForm.querySelector("input");
    socket.send(makeMsg("message", input.value));
}


messageForm.addEventListener("submit", sendMsg);
nicknameForm.addEventListener("submit", handleNickname);