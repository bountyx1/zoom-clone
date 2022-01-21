import {createElement} from '../utils/utils.js'
import { user } from './profile.js';
import {socket} from '../socket.js';

export const addRoom = ({name,message,image, time}) => {
    let room = createElement("div", {"class":"list-item"});
    room.innerHTML = `
    <div class="thumbnail">
        <img src="${image}">
    </div>
    <div class="content">
        <section>
            <div class="title"> ${name} </div>
            <div class="description"> ${message} </div>
        </section>
        <div class="right__item"> ${time} </div>
    </div>`;

    let childNodes = room.querySelectorAll("div, img")
    childNodes.forEach((elem) => elem.setAttribute("data-room-id", name));
    conversation_container.appendChild(room)
}

export const actionRoom = (room, action="join" ) => {
    // Join or Leave a room.
    if(room !== user.currentRoom && action === "join") {
        user.currentRoom = room;
        socket.emit("room", {room, action, user});
        return;
    }
}

export const globalRooms = () => {
    let rooms = Array.from(document.querySelectorAll("#conversation_container .list-item"));
    return rooms;
}

export const handleJoinRoom = () => {
    let rooms = globalRooms()
    rooms.forEach((room) => {
        room.addEventListener("click", (event) => {
            let room = event.target.dataset.roomId;
            actionRoom(room);

            let isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            if(isMobile) {
                document.body.requestFullscreen()
                document.getElementById("chat").style.width ="100%";
            }
            
        });
    });

}

export const renderFakeRooms = (rooms) => {
    rooms.forEach((item) => addRoom(item))
}

