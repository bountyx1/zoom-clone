const socket = io();
let allRooms = [];


/* Helpers */
function createElement(element, props = {}) {
    let elem = document.createElement(element);
    Object.keys(props).forEach(key => elem.setAttribute(key, props[key]));

    return elem;
}


/* Profile */
const generateUniqueId = () => {
    return Math.floor(100000 + Math.random() * 900000);
};

const getUserProfile = () => {
    const stored = localStorage.getItem("user");
    if (stored) {
        return JSON.parse(stored);
    }
    const uniqueId = generateUniqueId();
    return {
        username: `anon${uniqueId}`,
        aboutme: "nothing",
        avatar: "https://juststickers.in/wp-content/uploads/2016/05/pikachu-badge.png"
    };
};

const user = getUserProfile();
if (!localStorage.getItem("user")) {
    localStorage.setItem("user", JSON.stringify(user));
}

const changeProfile = (change, btn) => {
    const element = document.getElementById(change);

    if (btn.innerText === "edit") {
        element.removeAttribute("disabled");
        element.focus();
        btn.innerText = "done";

    } else {
        element.setAttribute("disabled", true);
        btn.innerText = "edit";

        if (change === "username") {
            user.username = element.value.toLowerCase().trim();
            localStorage.setItem("user", JSON.stringify(user));
            return;
        }

        user.aboutme = element.value.toLowerCase().trim();
        localStorage.setItem("user", JSON.stringify(user));
    }

};

/* Sidebar */

const addRoom = ({ name, message, image, time }) => {
    let room = createElement("div", { "class": "list-item" });
    let rooms = document.getElementsByClassName("list-item");

    room.setAttribute("onClick", "handleJoinRoom(this)");
    room.setAttribute("data-room", name);

    const thumbnail = document.createElement("div");
    thumbnail.className = "thumbnail";
    const img = document.createElement("img");
    img.src = image;
    thumbnail.appendChild(img);

    const content = document.createElement("div");
    content.className = "content";

    const section = document.createElement("section");

    const title = document.createElement("div");
    title.className = "title";
    title.textContent = name;

    const description = document.createElement("div");
    description.className = "description";
    description.textContent = message;

    section.appendChild(title);
    section.appendChild(description);

    const rightItem = document.createElement("div");
    rightItem.className = "right__item";
    rightItem.textContent = time;

    content.appendChild(section);
    content.appendChild(rightItem);

    room.appendChild(thumbnail);
    room.appendChild(content);

    let childNodes = room.querySelectorAll("div, img");
    childNodes.forEach((elem) => elem.setAttribute("data-room-id", name));
    conversation_container.insertBefore(room, rooms[0]);
}

const actionRoom = (room, action = "join") => {
    // Join or Leave a room.
    if (room.name !== user.currentRoom && action === "join") {
        // Remove messages
        Array.from(document.getElementsByClassName("message"))
            .forEach(message => message.remove());
        user.currentRoom = room.name;
        socket.emit("room", { room, action, user });
        return;
    }
}

const handleJoinRoom = (element) => {
    let name = element.dataset["room"];
    const room = allRooms.filter(r => r.name === name)[0];

    if (!room) {
        console.error('Room not found:', name);
        return;
    }

    actionRoom(room);

    // Show chat on mobile
    const isMobile = window.innerWidth <= 1023;
    if (isMobile) {
        const chatElement = document.getElementById("chat");
        if (chatElement) {
            chatElement.classList.add("active");
            chatElement.style.width = "100%";
        }
    }
};

const handleRoomSubmit = () => {
    let name = document.getElementById("room_name").value;
    let image = document.getElementById("room_image").value;
    let message = "You created this room";
    let time = new Date();
    time = time
        .toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });

    let room = { name, image, message, time };
    addRoom(room);
    actionRoom(room);
    handleModal("close");
}

document.getElementById("room_submit").addEventListener("click", handleRoomSubmit);

// Video Call Button
const videoCallBtn = document.getElementById("join-video-call");
if (videoCallBtn) {
    videoCallBtn.addEventListener("click", () => {
        if (user.currentRoom) {
            window.location.href = `/video/${encodeURIComponent(user.currentRoom)}`;
        } else {
            alert("Please join a room first to start a video call");
        }
    });
}



/* Chat */

const addMessage = ({ message, time, username, avatar }, classname = "self") => {
    let div = createElement("div", { "class": `message ${classname}` });
    let messages = document.querySelectorAll("section.content")[0];

    if (classname === "other" && username) {
        const userInfo = document.createElement("div");
        userInfo.className = "message-user-info";

        const avatarImg = document.createElement("img");
        avatarImg.src = avatar || "https://juststickers.in/wp-content/uploads/2016/05/pikachu-badge.png";
        avatarImg.className = "message-avatar";

        userInfo.appendChild(avatarImg);
        div.appendChild(userInfo);
    }

    const messageContent = document.createElement("div");
    messageContent.className = "message-content";

    if (classname === "other" && username) {
        const usernameSpan = document.createElement("span");
        usernameSpan.className = "message-username";
        usernameSpan.textContent = username;
        messageContent.appendChild(usernameSpan);
    }

    const messageText = document.createElement("div");
    messageText.className = "message-text";
    messageText.textContent = message;

    const timeDiv = document.createElement("div");
    timeDiv.className = "time";
    timeDiv.textContent = time;

    messageContent.appendChild(messageText);
    messageContent.appendChild(timeDiv);
    div.appendChild(messageContent);

    messages.insertBefore(div, messages.childNodes[0]);
    messages.scrollTop = messages.scrollHeight;
}

const messageFormat = (message) => {
    let time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    return { message, time }
}

const sendMsg = (event) => {
    let msg = event.target.value.trim();
    let room = user.currentRoom;
    let username = user.username;
    let avatar = user.avatar;
    if (msg && event.key === "Enter") {
        socket.emit("message", { msg, room, username, avatar });
        event.target.value = "".trim();
        addMessage({ ...messageFormat(msg), username, avatar });
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
            if (currentCamera.label === camera.label) {
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
        video: { deviceId: { exact: deviceId } },
    };

    try {
        myStream = await navigator.mediaDevices.getUserMedia(
            deviceId ? camConstraints : initialConstraints);
        userMe.srcObject = myStream;

        if (!deviceId) {
            await getCameras()
        }

    }
    catch (e) {
        console.log(e);
    }
}

const onClickMute = (event) => {
    myStream.getAudioTracks().forEach((track) => (track.enabled = !track.enabled));
    mute.innerText = muted ? "volume_up" : "volume_off";
    muted = !muted;
}

const onClickCam = (event) => {
    myStream.getVideoTracks().forEach((track) => (track.enabled = !track.enabled));
    camera.innerText = camOff ? "videocam_on" : "videocam_off";
    camOff = !camOff;
}

const hanldeCamChange = async (event) => {
    getMedia(event.value)
}

async function startMedia() {
    await getMedia();
}

function getPeerCon() {
    myPeerCon = new RTCPeerConnection();

    // Adds my streams to connections

    myStream
        .getTracks()
        .forEach((track) => myPeerCon.addTrack(track, myStream))

}

/* Drawer & Modal */
handleModal = (action = "open") => {
    let elem = document.getElementById("modal_container");
    if (action === "open") {
        elem.style.display = "flex";
        return;
    }

    elem.style.display = "none";
}

const handleProfileDrawer = (action) => {
    let profileContainer = document.getElementsByClassName("profile-container")[0];

    if (action == "open") {
        profile_bar.style.display = "flex";
        profile_bar.style.width = "100%";
        profileContainer.style.display = "flex"
        return;
    }

    profile_bar.style.display = "hidden";
    profile_bar.style.width = "0";
    profileContainer.style.display = "none"
}

/* Main */

startMedia()

socket.on("rooms", (rooms) => {
    allRooms = rooms.publicRooms.reverse();
    allRooms.forEach((item) => addRoom(item))
});

socket.on("message", ({ message, room, username, avatar }) => {
    if (room == user.currentRoom) {
        addMessage({ ...message, username, avatar }, "other");
        return;
    }

    let qs = document.querySelector(`div[data-room="${room}"]`);
    qs.getElementsByClassName("description")[0].innerText = message.message;
    qs.getElementsByClassName("right__item")[0].innerText = message.time;
});

handleMsg();

/*
document.addEventListener('swiped-left', function(event) {
    document.getElementById("chat").style.width = 0;
});
*/