const socket = io();

//let username = prompt("Enter username");


localStorage.setItem("username" , username);

document.getElementsByClassName("chat__messages")[0].style.height = "200px"

/*
Sends and listen for messages of 
bot and other users
*/

function createElement(element, props={}) {
    let elem = document.createElement(element);
    Object.keys(props).forEach(key => elem.setAttribute(key, props[key]));

    return elem;
}

const addMessage = (message, classname="self-message") => {
    let div = createElement("div", {"class": `message ${classname}`})
    let p = createElement("p")
    p.innerText = message;
    div.appendChild(p);
    messages.appendChild(div);

    // auto scroll 
    messages.scrollTop = messages.scrollHeight;
    
}

const sendMsg = (event) => {
    event.preventDefault();
    if (event.code === "Enter" && msgInput.value !== "" ) {
    msg = msgInput.value;
    room = localStorage.getItem("currentRoom");
    addMessage(msg);
    socket.emit("message", {msg, room});
    msgInput.value = ""
    return;
    }
    if(event.key !== "" && event.key !== "Enter") {
        msgInput.value += event.key;
    }
    
}

socket.on("message", (message) => {
    addMessage(message, "other-message")
})

socket.on("bot", (message) => {
    addMessage(message, "other-message")
});

let msgId = document.getElementById("msgInput");
msgId.addEventListener("keypress", sendMsg);


/* emit socket event to Join a room */

const roomExists = (room) => {
    let rooms = document.getElementsByClassName("room");
    rooms = Array.from(rooms).map((e)=> e.innerText);
    return rooms.includes(room)
}

const addRoom = (name, image) => {
    /* Adds a room in sidebar */
    if (roomExists(name)){
        return;
    }

    let img = createElement("img", {"src":image, "class": "room-icon"});
    let p = createElement("p", {"class": "room-name"});
    let room = createElement("div", {"class":"room"});
    p.innerText = name
    room.appendChild(img);
    room.appendChild(p);
    globalRooms.appendChild(room)

}

const joinRoom = (name, action) => {
    if (name !== localStorage.getItem("currentRoom")) {
        let data = messages.querySelector("div")
        if(data) {
            data.remove()
            document.getElementsByClassName("chat-header-container")[0].innerText = name
        }
    }

    localStorage.setItem("currentRoom", name);
    socket.emit("room", {name, action, username});
}


/* Renders Globals room on sidebar and onclick joins that room */

socket.on("rooms", (rooms) => {
    rooms.forEach((name) => {
        addRoom(name);
    })
});

let globalRooms = document.getElementById("globalRooms");

globalRooms.addEventListener("click", (event) => {
    let currentRoom = event.target.innerText;
    joinRoom(currentRoom, "join")
});



/* Create leave room */


let modal = document.getElementById("add-room-modal");

document.getElementById("addRoom").addEventListener("click", (event) => {
    modal.style.display = "block";

})

document.getElementById("submitRoom").addEventListener("click", (event) => {
    event.preventDefault();
    let name = modal.querySelector("input").value;
    joinRoom(name, "join");
    modal.style.display = "none";
})