import { socket } from '../socket.js';
import {user} from '../sidebar/profile.js';

export const addMessage = ({message, time}, classname="self") => {
    let messages = document.querySelectorAll("section.content")[0];
    let messageHtml = `
    <div class="message ${classname}">
        ${message}
        <div class="${time}">
        ${time}
    </div>`;

    messages.insertBefore(div, messages.childNodes[0]);
    messages.scrollTop = messages.scrollHeight;
}

const messageFormat = (message) => {
    let time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    return {message, time}
}

export const sendMsg = (event) => {
    let msg = event.target.value.trim();
    let room = user.currentRoom;
    let username = user.username;
    if(msg && event.key === "Enter") {
        socket.emit("message", {msg, room, username})
        event.target.value = "".trim();
        addMessage(messageFormat(msg))
    }
}

export const handleMsg = () => {
    document.querySelectorAll(".text__input textarea")[0].addEventListener("keypress", sendMsg)
}

export const messageListener = () => {
    socket.on("message", (message) => {
        addMessage(message, "other");
    });

    socket.on("bot", (message) => {
        addMessage(message, "other");
    })
}
