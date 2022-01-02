import {createElement} from './utils.js'
import { user } from './users.js';
import {socket} from './socket.js';

export const addRoom = ({name,message,image, time}) => {
    let roomContainer = createElement("div", {"class":"group__container"});
    let imageContainer = createElement("div", {"class":"group__icon"});
    let img = createElement("img")
    img.src = image;
    imageContainer.appendChild(img);

    let groupContainer = createElement("div", {"class":"group__content"});
    let section = createElement("section");
    let groupName = createElement("div", {"class":"group__name"});
    let messageContainer = createElement("div",  {"class":"message"});
    groupName.innerText = name
    messageContainer.innerText = message
    section.appendChild(groupName);
    section.appendChild(messageContainer);

    let timeContainer = createElement("div", {"class":"time"})
    timeContainer.innerText = time
    groupContainer.appendChild(section)
    groupContainer.appendChild(timeContainer)

    roomContainer.appendChild(imageContainer);
    roomContainer.appendChild(groupContainer)
    group__conversation.appendChild(roomContainer);

    let childNodes = roomContainer.querySelectorAll("div, img")
    childNodes.forEach((elem) => elem.setAttribute("data-room-id", name))


}

export const actionRoom = (room, action="join" ) => {
    // Join or Leave a room.
    let username = user.username;

    if(room !== user.currentRoom && action === "join") {
        user.currentRoom = room;
        socket.emit("room", {room, action, username});
        return;
    }
}

export const globalRooms = () => {
    let rooms = Array.from(document.getElementsByClassName("group__container"));
    return rooms;
}

export const handleJoinRoom = () => {
    let rooms = globalRooms()
    rooms.forEach((room) => {
        room.addEventListener("click", (event) => {
            let room = event.target.dataset.roomId;
            actionRoom(room)
        });
    });

}

export const renderFakeRooms = (rooms) => {
    rooms.forEach((item) => addRoom(item))
}