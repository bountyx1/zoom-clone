let userMe = document.getElementById("me");

let streamMe;
let muted = false;
let camOff = false;

async function getMedia() {
    try {
        streamMe = await navigator.mediaDevices.getUserMedia({audio:true,video:true})
        userMe.srcObject = streamMe
    }
    catch (e) {
        console.log(e);
    }
}


getMedia()

const handleMute = (event) =>{
    streamMe.getAudioTracks().forEach((track) => (track.enabled =!track.enabled));

    if(!muted) {
        mute.innerText = "volume_up";
        muted = true;
    }
    else {
        mute.innerText = "volume_up";
        muted = false;
    }
}

const hanldeCam = (event) => {
    streamMe.getVideoTracks().forEach((track) => (track.enabled =!track.enabled));
    if(camOff) {
        camera.innerText = "videocam_off";
        camOff = false;
    }
    else {
        camera.innerText = "videocam";
        camOff = true;
    }
}

mute.addEventListener("click",handleMute);
camera.addEventListener("click", hanldeCam);