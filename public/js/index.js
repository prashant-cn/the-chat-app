// self modifications
const socket = io()

socket.on(('roomsList'), (getRoomsList) => {
    console.log(getRoomsList)
})