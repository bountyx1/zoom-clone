const socket = io();
let allRooms = [];


/* Helpers */
function createElement(element, props={}) {
    let elem = document.createElement(element);
    Object.keys(props).forEach(key => elem.setAttribute(key, props[key]));

    return elem;
}


/* Profile */
const user = localStorage.getItem("user") || {"username":"anon", "aboutme":"nothing"};

const changeProfile = (change, btn) => {
    element = document.getElementById(change);

    if(btn.innerText === "edit") {
        element.removeAttribute("disabled");
        element.focus();
        btn.innerText = "done";
        
    } else {
        element.setAttribute("disabled", true)
        btn.innerText = "edit";

        if(change==="username") {
            user.username = element.value.toLowerCase().trim();
            localStorage.setItem(user, user);
            return;
        };

       user.aboutme = element.value.toLowerCase().trim();
       localStorage.setItem(user, user);
    }

};

/* Sidebar */

const addRoom = ({name, message, image, time}) => {
    let room = createElement("div", {"class":"list-item"});
    let rooms = document.getElementsByClassName("list-item");

    room.setAttribute("onClick", "handleJoinRoom(this)");
    room.setAttribute("data-room", name);

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
    conversation_container.insertBefore(room, rooms[0]);
}

const actionRoom = (room, action="join") => {
    // Join or Leave a room.
    if(room.name !== user.currentRoom && action === "join") {
        // Remove messages
        Array.from(document.getElementsByClassName("message"))
            .forEach(message => message.remove());
        user.currentRoom = room.name;
        socket.emit("room", {room, action, user});
        return;
    }
}

const handleJoinRoom = (element) => {
    let name = element.dataset["room"];
    room = allRooms.filter(room => room.name === name)[0];
    actionRoom(room);

    let isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if(isMobile) {
        document.body.requestFullscreen()
        document.getElementById("chat").style.width ="100%";
    }
};

const handleRoomSubmit = () => {
    let name = document.getElementById("room_name").value;
    let image = document.getElementById("room_image").value;
    let message = "You created this room";
    let time = new  Date();
    time = time
        .toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });

    let room = {name, image, message, time};
    addRoom(room);
    actionRoom(room);
    handleModal("close");
}

document.getElementById("room_submit").addEventListener("click", handleRoomSubmit);


/* Chat */

const addMessage = ({message, time}, classname="self") => {
    let div = createElement("div", {"class": `message ${classname}`})
    let messages = document.querySelectorAll("section.content")[0];
    
    let messageHtml = `
        ${message}
        <div class="${time}">
        ${time}`;

    div.innerHTML = messageHtml;
    messages.insertBefore(div, messages.childNodes[0]);
    messages.scrollTop = messages.scrollHeight;
}

const messageFormat = (message) => {
    let time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    return {message, time}
}

const sendMsg = (event) => {
    let msg = event.target.value.trim();
    let room = user.currentRoom;
    let username = user.username;
    if(msg && event.key === "Enter") {
        socket.emit("message", {msg, room, username})
        event.target.value = "".trim();
        addMessage(messageFormat(msg))
    }
}

const handleMsg = () => {
    document.querySelectorAll(".text__input textarea")[0].addEventListener("keypress", sendMsg)
}

/* Video */

let userMe = document.getElementById("me");
let myStream;
let muted = false;
let camOff = false;
let myPeerCon = "";

async function getCameras() {
    try {
        let devices = await navigator.mediaDevices.enumerateDevices();
        let cameras = devices.filter(item => item.kind === `videoinput`);
        let currentCamera = myStream.getVideoTracks()[0];

        let options = cameras.forEach(camera => {
            const option = document.createElement("option");
            option.value = camera.deviceId;
            option.innerText = camera.label;
            if(currentCamera.label === camera.label) {
                option.selected = true;
            }
            mycams.appendChild(option)
        })
        
    } catch (e) {
        console.log(e);
    }
};

async function getMedia(deviceId) {
    const initialConstraints = {
        audio: true,
        video: true,
    };

    const camConstraints = {
        audio: true,
        video : { deviceId: { exact: deviceId }},
    };

    try {
        myStream = await navigator.mediaDevices.getUserMedia(
            deviceId ? camConstraints: initialConstraints);
        userMe.srcObject = myStream;

        if(!deviceId){
            await getCameras()
        }
        
    }
    catch (e) {
        console.log(e);
    }
}
 
const onClickMute = (event) =>{
    myStream.getAudioTracks().forEach((track) => (track.enabled =!track.enabled));
    mute.innerText = muted ? "volume_up" : "volume_off";
    muted = !muted;
}

const onClickCam = (event) => {
    myStream.getVideoTracks().forEach((track) => (track.enabled =!track.enabled));
    camera.innerText = camOff ? "videocam_on": "videocam_off" ;
    camOff = !camOff;
}

const hanldeCamChange = async (event) => {
    getMedia(event.value)
}

async function startMedia() {
    await getMedia();
}

function getPeerCon() {
    myPeerCon =  new RTCPeerConnection();

    // Adds my streams to connections

    myStream
       .getTracks()
       .forEach((track) => myPeerCon.addTrack(track, myStream))

}

/* Drawer & Modal */
handleModal = (action="open") => {
    let elem = document.getElementById("modal_container");
    if(action==="open") {
        elem.style.display = "flex";
        return;
    }

    elem.style.display = "none";
}

const handleProfileDrawer = (action) => {
    let profileContainer = document.getElementsByClassName("profile-container")[0];

    if(action=="open") {
        profile_bar.style.display="flex";
        profile_bar.style.width="100%";
        profileContainer.style.display= "flex"
        return;
    }
    
    profile_bar.style.display="hidden";
    profile_bar.style.width="0";
    profileContainer.style.display= "none"
}

/* Main */

//startMedia()

socket.on("rooms", (rooms) => {
    allRooms = rooms.publicRooms.reverse();
    allRooms.forEach((item) => addRoom(item))
});

socket.on("message", ({message, room}) => {
    if(room == user.currentRoom ) {
        addMessage(message, "other",);
        return;
    }
    
    let qs = document.querySelector(`div[data-room="${room}"]`)
    qs.getElementsByClassName("description")[0].innerText = message.message;
    qs.getElementsByClassName("right__item")[0].innerText = message.time;
});

handleMsg();

/*
document.addEventListener('swiped-left', function(event) {
    document.getElementById("chat").style.width = 0;
});
*/