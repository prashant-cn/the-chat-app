
const users = []
const rooms = []

const addUser = ({id, chatWith, currentroom}) => {
    //Clean the data
    chatWith = chatWith.trim().toLowerCase()
    currentroom = currentroom.trim().toLowerCase()
    const roomUsers = currentroom.split('+')
    const chatInitiator = roomUsers[0]

    let roomtouse = { id, chatWith, currentroom }
    

    //validate the data
    if(!currentroom){
        return {
            error: 'Select user to chat with.'
        }
    }
    //check if room exists for two users
    if(Array.isArray(rooms) && rooms.length){
        let existingRoom = rooms.filter((room, i) => {
            const splitSingleRoom = room.currentroom.toString().split('+')
            if(roomUsers.sort().join(',')=== splitSingleRoom.sort().join(',')){
                const roomtouse = room
                return { roomtouse }
            }
        })
        roomtouse = existingRoom[0]
        let user = { id, chatWith, roomtouse, chatInitiator }
        users.push(user)
        return { user, roomtouse, users }
    }

    rooms.push(roomtouse)
    //return { roomtouse }

    //Check for existing user
    const existingUser = users.find((user) => {
        return user.chatWith === chatWith && user.room === room
    })
    //Validate username
    if(existingUser){
        return {
            error: 'Username in Use!'
        }
    }
    //Store user
    let user = { id, chatWith, roomtouse, chatInitiator }
    users.push(user)
    return { user, roomtouse, users }
}

const removeUser = (currentUser) => {
    const index = users.findIndex((user) => {
        return user.chatInitiator === currentUser
    })
    if(index !== -1){
        return users.splice(index, 1)[0]
    }
}


const getUser = (currentUser) => {
    const user = users.find((user) => {
        return user.chatInitiator === currentUser
    })
    return user
}

const getUsersInRoom = (room) => {
    room = room.trim().toLowerCase()
    const userList = users.filter((user) => {
        return user.room === room
    })
    return userList
}

module.exports = {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom,
    users //export users array to create active room list
}