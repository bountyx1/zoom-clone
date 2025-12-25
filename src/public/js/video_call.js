// Video Call Page JavaScript with WebRTC

const socket = io();

// Get room ID from URL
const roomId = window.location.pathname.split('/')[2];

// DOM Elements
const videoGrid = document.getElementById('video-grid');
const localVideo = document.getElementById('local-video');
const muteBtn = document.getElementById('mute-btn');
const cameraBtn = document.getElementById('camera-btn');
const screenshareBtn = document.getElementById('screenshare-btn');
const leaveBtn = document.getElementById('leave-btn');
const chatBtn = document.getElementById('chat-btn');
const participantsBtn = document.getElementById('participants-btn');
const chatPanel = document.getElementById('chat-panel');
const participantsPanel = document.getElementById('participants-panel');
const closeChatBtn = document.getElementById('close-chat');
const closeParticipantsBtn = document.getElementById('close-participants');
const chatInput = document.getElementById('chat-input');
const sendMessageBtn = document.getElementById('send-message');
const chatMessages = document.getElementById('chat-messages');
const participantCountEl = document.getElementById('participant-count');
const meetingTimeEl = document.getElementById('meeting-time');

// WebRTC Configuration with STUN/TURN servers
const iceServers = {
    iceServers: [
        // Google's public STUN servers
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },

        // Free public TURN servers (for when STUN isn't enough)
        {
            urls: 'turn:openrelay.metered.ca:80',
            username: 'openrelayproject',
            credential: 'openrelayproject'
        },
        {
            urls: 'turn:openrelay.metered.ca:443',
            username: 'openrelayproject',
            credential: 'openrelayproject'
        },
        {
            urls: 'turn:openrelay.metered.ca:443?transport=tcp',
            username: 'openrelayproject',
            credential: 'openrelayproject'
        }
    ],
    iceCandidatePoolSize: 10
};

// State
let myStream;
let muted = false;
let cameraOff = false;
let peers = {}; // userId -> RTCPeerConnection
let startTime = Date.now();

// Initialize
async function init() {
    try {
        myStream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                frameRate: { ideal: 30 }
            },
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }
        });

        localVideo.srcObject = myStream;

        // Join room
        socket.emit('join-video-room', roomId);

        // Start meeting timer
        startMeetingTimer();

        console.log('✅ Media devices initialized');

    } catch (error) {
        console.error('❌ Error accessing media devices:', error);
        alert('Could not access camera/microphone. Please check permissions.');
    }
}

// Meeting Timer
function startMeetingTimer() {
    setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        meetingTimeEl.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }, 1000);
}

// WebRTC: Create peer connection
function createPeerConnection(userId) {
    const peerConnection = new RTCPeerConnection(iceServers);

    // Add local stream tracks to peer connection
    myStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, myStream);
    });

    // Handle incoming stream
    peerConnection.ontrack = (event) => {
        console.log('📹 Received remote track from', userId);
        const remoteStream = event.streams[0];
        addVideoStream(userId, remoteStream);
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('ice-candidate', {
                roomId,
                candidate: event.candidate,
                to: userId
            });
        }
    };

    // Monitor connection state
    peerConnection.onconnectionstatechange = () => {
        console.log(`🔗 Connection state with ${userId}:`, peerConnection.connectionState);

        if (peerConnection.connectionState === 'disconnected' ||
            peerConnection.connectionState === 'failed') {
            removeVideoStream(userId);
        }
    };

    return peerConnection;
}

// WebRTC: Create and send offer
async function createOffer(userId) {
    try {
        const peerConnection = createPeerConnection(userId);
        peers[userId] = peerConnection;

        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);

        socket.emit('offer', {
            roomId,
            offer,
            to: userId
        });

        console.log('📤 Sent offer to', userId);
    } catch (error) {
        console.error('❌ Error creating offer:', error);
    }
}

// WebRTC: Handle incoming offer
async function handleOffer(userId, offer) {
    try {
        const peerConnection = createPeerConnection(userId);
        peers[userId] = peerConnection;

        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        socket.emit('answer', {
            roomId,
            answer,
            to: userId
        });

        console.log('📤 Sent answer to', userId);
    } catch (error) {
        console.error('❌ Error handling offer:', error);
    }
}

// WebRTC: Handle incoming answer
async function handleAnswer(userId, answer) {
    try {
        const peerConnection = peers[userId];
        if (peerConnection) {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
            console.log('✅ Set remote description for', userId);
        }
    } catch (error) {
        console.error('❌ Error handling answer:', error);
    }
}

// WebRTC: Handle ICE candidate
async function handleIceCandidate(userId, candidate) {
    try {
        const peerConnection = peers[userId];
        if (peerConnection) {
            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        }
    } catch (error) {
        console.error('❌ Error adding ICE candidate:', error);
    }
}

// Control Buttons
muteBtn.addEventListener('click', () => {
    muted = !muted;
    myStream.getAudioTracks().forEach(track => track.enabled = !muted);

    const icon = muteBtn.querySelector('.material-icons');
    icon.textContent = muted ? 'mic_off' : 'mic';
    muteBtn.classList.toggle('active', muted);

    socket.emit('toggle-audio', { roomId, muted });
});

cameraBtn.addEventListener('click', () => {
    cameraOff = !cameraOff;
    myStream.getVideoTracks().forEach(track => track.enabled = !cameraOff);

    const icon = cameraBtn.querySelector('.material-icons');
    icon.textContent = cameraOff ? 'videocam_off' : 'videocam';
    cameraBtn.classList.toggle('active', cameraOff);

    socket.emit('toggle-video', { roomId, cameraOff });
});

screenshareBtn.addEventListener('click', async () => {
    try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: { cursor: 'always' },
            audio: false
        });

        const screenTrack = screenStream.getVideoTracks()[0];

        // Replace video track in all peer connections
        Object.values(peers).forEach(peerConnection => {
            const sender = peerConnection.getSenders().find(s => s.track.kind === 'video');
            if (sender) {
                sender.replaceTrack(screenTrack);
            }
        });

        // Update local video
        const videoTrack = myStream.getVideoTracks()[0];
        localVideo.srcObject = screenStream;
        screenshareBtn.classList.add('active');

        // When screen sharing stops
        screenTrack.onended = () => {
            // Restore camera
            Object.values(peers).forEach(peerConnection => {
                const sender = peerConnection.getSenders().find(s => s.track.kind === 'video');
                if (sender) {
                    sender.replaceTrack(videoTrack);
                }
            });

            localVideo.srcObject = myStream;
            screenshareBtn.classList.remove('active');
        };

    } catch (error) {
        console.error('❌ Error sharing screen:', error);
    }
});

leaveBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to leave the call?')) {
        // Close all peer connections
        Object.values(peers).forEach(pc => pc.close());
        peers = {};

        socket.emit('leave-video-room', roomId);
        myStream.getTracks().forEach(track => track.stop());
        window.location.href = '/';
    }
});

// Panel Toggles
chatBtn.addEventListener('click', () => {
    chatPanel.classList.toggle('open');
    participantsPanel.classList.remove('open');
});

participantsBtn.addEventListener('click', () => {
    participantsPanel.classList.toggle('open');
    chatPanel.classList.remove('open');
});

closeChatBtn.addEventListener('click', () => {
    chatPanel.classList.remove('open');
});

closeParticipantsBtn.addEventListener('click', () => {
    participantsPanel.classList.remove('open');
});

// Chat
sendMessageBtn.addEventListener('click', sendChatMessage);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendChatMessage();
});

function sendChatMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    socket.emit('video-chat-message', {
        roomId,
        message,
        sender: 'You',
        timestamp
    });

    addChatMessage('You', message, timestamp);
    chatInput.value = '';
}

function addChatMessage(sender, message, time) {
    const messageEl = document.createElement('div');
    messageEl.className = 'chat-message';
    messageEl.innerHTML = `
        <div class="message-header">
            <span class="sender-name">${sender}</span>
            <span class="message-time">${time}</span>
        </div>
        <div class="message-text">${message}</div>
    `;
    chatMessages.appendChild(messageEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Socket Events - WebRTC Signaling
socket.on('user-connected', (userId) => {
    console.log('👤 User connected:', userId);
    // Create offer for new user
    createOffer(userId);
    updateParticipantCount();
});

socket.on('user-disconnected', (userId) => {
    console.log('👋 User disconnected:', userId);
    if (peers[userId]) {
        peers[userId].close();
        delete peers[userId];
    }
    removeVideoStream(userId);
    updateParticipantCount();
});

socket.on('offer', ({ from, offer }) => {
    console.log('📥 Received offer from', from);
    handleOffer(from, offer);
});

socket.on('answer', ({ from, answer }) => {
    console.log('📥 Received answer from', from);
    handleAnswer(from, answer);
});

socket.on('ice-candidate', ({ from, candidate }) => {
    handleIceCandidate(from, candidate);
});

socket.on('video-chat-message', ({ sender, message, timestamp }) => {
    addChatMessage(sender, message, timestamp);
});

socket.on('participant-count', (count) => {
    participantCountEl.textContent = count;
});

socket.on('user-toggle-audio', ({ userId, muted }) => {
    const videoWrapper = document.getElementById(`video-${userId}`);
    if (videoWrapper) {
        const micIcon = videoWrapper.querySelector('.mic-status');
        if (micIcon) {
            micIcon.textContent = muted ? 'mic_off' : 'mic';
            micIcon.classList.toggle('active', !muted);
        }
    }
});

function updateParticipantCount() {
    const count = Object.keys(peers).length + 1; // +1 for self
    participantCountEl.textContent = count;
}

// Add remote video stream
function addVideoStream(userId, stream) {
    // Remove existing video if any
    removeVideoStream(userId);

    const videoWrapper = document.createElement('div');
    videoWrapper.className = 'video-wrapper';
    videoWrapper.id = `video-${userId}`;

    const video = document.createElement('video');
    video.srcObject = stream;
    video.autoplay = true;
    video.playsinline = true;

    const overlay = document.createElement('div');
    overlay.className = 'video-overlay';
    overlay.innerHTML = `
        <span class="participant-name">User ${userId.substring(0, 6)}</span>
        <span class="mic-status material-icons active">mic</span>
    `;

    videoWrapper.appendChild(video);
    videoWrapper.appendChild(overlay);
    videoGrid.appendChild(videoWrapper);

    console.log('✅ Added video stream for', userId);
}

// Remove video stream
function removeVideoStream(userId) {
    const videoWrapper = document.getElementById(`video-${userId}`);
    if (videoWrapper) {
        videoWrapper.remove();
        console.log('🗑️ Removed video stream for', userId);
    }
}

// Initialize on page load
init();
