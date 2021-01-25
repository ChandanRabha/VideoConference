const socket = io('/')
const videoGrid = document.getElementById('video-grid')
const myCam = document.getElementById('myCam')
//  const peer_id=`user${Math.floor(Math.random() * 10)}`
//the counter variable is just for knowing if screen sharing is running or not
let counter = false;
const peer_id = localStorage.getItem("user_id")
const myPeer = new Peer(peer_id, {
    host: 'adbu-peer-server.herokuapp.com',
    path: '/',
    port: 443,
    secure: true
})
// const myPeer = new Peer(peer_id, {
//   host: 'localhost',
//   port: 9000,
//   path: '/'
// })

//myStream is the div which shows the sharescreen 
const myStream = document.getElementById("streamView")
//at start the div is hidden because not streaming when connected to the room 
myStream.style.display = "none"
//muting to prevent echoing
myStream.muted = true;
const myVideo = document.createElement('video')
myVideo.muted = true
myVideo.id = peer_id
const peers = {}
let tracks = []
let roomMembers = []
var screen = false;

let toastVar = document.getElementById('toastDiv')


//checks if website is opened in phone and hides the sharescreen button
var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
if (isMobile) {
    document.getElementById('btnScreen').style.display = "none"
}



//getting webcam access here
navigator.mediaDevices.getUserMedia({
    video: true,
    echoCancellation: true,
    noiseSuppression: true,
    audio: {
        echoCancellation: true,
        noiseSuppression: true
    }
}).then(stream => {
    selfVideo(myVideo, stream)

    const button2 = document.querySelector("#btnScreen")
    button2.addEventListener('click', () => {
        var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (isMobile) {
            alert("Screensharing disabled for phones")
        } else {
            if (!counter) {
                screenSharing()

            } else
                alert("You are already sharing your screen")
        }
    })

    const inpt = document.querySelector("#myMessage")
    const button = document.querySelector("#send")
    button.addEventListener('click', () => {
        if (inpt.value != "") {
            let message = inpt.value;
            message = {
                'id': localStorage.getItem("user_id"),
                "message": message
            }
            socket.emit('Sendmessage', message)
            inpt.value = "";
        }
    })
    socket.on('sent', (a) => {

        let divi = document.querySelector("#messages")
        if (a.id == localStorage.getItem("user_id")) {
            divi.innerHTML += `<div style='text-align:right;font-weight:600'><b style='font-weight:100'>${a.id}</b>: ${a.message}</div>`
        } else {
            divi.innerHTML += `<div  style='font-weight:600'><b  style='font-weight:100'>${a.id}</b>: ${a.message}</div>`
        }

    })

    myPeer.on('call', call => {
        peers[call.peer] = call
        call.answer(stream)
        const video = document.createElement('video')
        video.id = call.peer
        // video.setAttribute("mediaCOnt")
        call.on('stream', userVideoStream => {
            addVideoStream(video, userVideoStream)
        })
        call.on('close', () => {
            video.remove()
        })
    })

    socket.on('user-connected', userId => {

        if (userId != localStorage.getItem("user_id")) {
            roomMembers.push(userId)
            connectToNewUser(userId, stream)
        }
    })

});


socket.on('user-disconnected', userId => {
    //alert(userId)
    peers[userId].close()
    joinLeave(0)
    toastVar.getElementsByTagName('label')[0].innerText = userId + " has left the room"
    toastVar.classList.add('showToast')

    setTimeout(function() {
        toastVar.classList.remove('showToast')
    }, 2000)
})

myPeer.on('open', id => {
    socket.emit('join-room', ROOM_ID, id)
    // socket.emit('message', 'Sending from client')
})

function connectToNewUser(userId, stream) {
    console.log(stream)
    const call = myPeer.call(userId, stream)
    const video = document.createElement('video')
    video.controls = true;
    video.setAttribute('disablepictureinpicture', '')
    //// video.muted = true;
    video.setAttribute("controls", "true")
    console.log(userId)
    video.id = userId;

    toastVar.getElementsByTagName('label')[0].innerText = userId + " has joined the room"
    joinLeave(1)
    toastVar.classList.add('showToast')

    setTimeout(function() {
        toastVar.classList.remove('showToast')
    }, 2000)

    call.on('stream', userVideoStream => {

        addVideoStream(video, userVideoStream)
    })
    call.on('close', () => {
        video.remove()
    })

    peers[userId] = call
}

function addVideoStream(video, stream) {
    video.srcObject = stream
    video.controls = true;

    video.setAttribute("controls", "true")
    video.setAttribute('disablepictureinpicture', '')
    video.addEventListener('loadedmetadata', () => {
        video.play()
    })
    video.style.border = "4px solid " + getRandomColor() + ""
    videoGrid.append(video)
}

function selfVideo(video, stream) {
    video.style.width = "100%"
    video.srcObject = stream
    // video.controls = true;
    // video.muted = true;
    video.setAttribute('disablepictureinpicture', '')
    video.addEventListener('loadedmetadata', () => {
        video.play()
    })
    myCam.append(video)

    document.getElementById("nameLabel").innerText = localStorage.getItem("user_id")

    // canvas()




}
async function screenSharing() {
    //LINES BELOW FOR SCREENSHARE AS SAME PEER
    await navigator.mediaDevices.getDisplayMedia({
        video: true,
        echoCancellation: true,
        noiseSuppression: true,
        audio: {
            echoCancellation: true,
            noiseSuppression: true
        }
    }).then(stream => {

        //setting counter to true due to ongoing share screen
        counter = true;
        document.getElementById("btnRecord").style.display = "flex"

        document.getElementById('btnScreen').getElementsByTagName('i')[0].style.color = "red"
        document.getElementById('btnScreen').getElementsByTagName('span')[0].innerText = "Sharing Screen"

        //showing the sharescreen in the div id=mystream

        myStream.srcObject = stream;
        myStream.play()
        myStream.style.display = "block";

        for (let key of myPeer._connections.keys()) {
            myPeer._connections.get(key)[0].peerConnection.getSenders()[1].replaceTrack(stream.getTracks()[0])
            //  document.getElementById('myCam').getElementsByTagName('video')[0].srcObject=stream;

        }
        //the code below checks whether the user has stopped sharing their screen and changes video track to their webcam
        stream.getTracks()[0].onended = () => {
            let myFace = document.getElementById(peer_id).captureStream()
            for (let key of myPeer._connections.keys()) {
                myPeer._connections.get(key)[0].peerConnection.getSenders()[1].replaceTrack(myFace.getVideoTracks()[0])

            }

            document.getElementById("btnRecord").style.display = "none"

            //screen share closed so hiding the div 
            myStream.style.display = "none";
            myStream.pause()
            //changing counter to false as screen share is closed
            counter = false;
            document.getElementById('btnScreen').getElementsByTagName('i')[0].style.color = "black"
            document.getElementById('btnScreen').getElementsByTagName('span')[0].innerText = "Share Screen"
        }
    })

}

const setUnmuteButton = () => {
    const html = `
    <i class="unmute fas fa-microphone-slash fa-3x" style="color:red !important"></i>
    <span>Unmute</span>
  `

    document.querySelector('.muteButton').innerHTML = html;
}

const setStopVideo = () => {
    const html = `<i class="fas fa-video fa-3x "></i>
            <span>Stop Video</span>`
    document.querySelector('.videoButton').innerHTML = html;
}

const setPlayVideo = () => {
    const html = `
  <i class="stop fas fa-video-slash fa-3x" style="color:red !important"></i>
    <span>Play Video</span>
  `
    document.querySelector('.videoButton').innerHTML = html;
}
const setMuteButton = () => {
    const html = `
    <i class="fas fa-microphone fa-3x" ></i>
    <span>Mute</span>
  `
    document.querySelector('.muteButton').innerHTML = html;
}

const muteUnmute = () => {
    const enabled = myVideo.srcObject.getAudioTracks()[0].enabled;
    if (enabled) {
        myVideo.srcObject.getAudioTracks()[0].enabled = false;
        setUnmuteButton();
    } else {
        setMuteButton();
        myVideo.srcObject.getAudioTracks()[0].enabled = true;
    }
}
const playStop = () => {
    console.log('object')
    let enabled = myVideo.srcObject.getVideoTracks()[0].enabled;
    if (enabled) {
        myVideo.style.backgroundColor = "grey";
        myVideo.srcObject.getVideoTracks()[0].enabled = false;
        setPlayVideo()
    } else {
        setStopVideo()

        myVideo.srcObject.getVideoTracks()[0].enabled = true;
    }




}

//this function just generates random color so as for unique border colors
function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

document.getElementById('myMessage').addEventListener("keyup", function(event) {
    // Number 13 is the "Enter" key on the keyboard
    if (event.keyCode === 13) {
        // Cancel the default action, if needed
        event.preventDefault();
        // Trigger the button element with a click
        document.getElementById("send").click();
    }
});


setTimeout(() => {
    document.querySelector('body').style.overflow = "auto"
}, 3000)


const chatColl = document.querySelector('.chatCollapse')

//responsive chatbox start
chatColl.addEventListener('click', () => {
    let chatDiv = document.getElementById('chat')
    if (chatDiv.classList.contains('Collapse')) {
        chatDiv.classList.remove('Collapse')
    } else {
        chatDiv.classList.add('Collapse')
    }

})

const chatClose = document.querySelector('.chatClose')
chatClose.addEventListener('click', () => {
    let chatDiv = document.getElementById('chat')
    if (chatDiv.classList.contains('Collapse')) {
        chatDiv.classList.remove('Collapse')
    } else {
        chatDiv.classList.add('Collapse')
    }

})
//responsive chatbox end



//audio queues for join and leave
function joinLeave(door) {
    if (door == 1) {
        var audio = new Audio("/external_sfx/in.mp3");
        audio.play();
    } else {
        var audio = new Audio("/external_sfx/out.mp3");
        audio.play();
    }
}