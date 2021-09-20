// self modifications
const { users } = require('./users')

const getRoomsList = () => {
    //get rooms according to active users - dublicate room name
    const rooms = users.map((user) => {
        return user.room
    })
    //get unique room name
    const uniqueRooms = [...new Set(rooms)]
    //get unique room name with active user counts
    const roomsAndUserCount = []
    uniqueRooms.filter((room) => {
        const count = users.filter((user) => {
            return user.room === room
        })
        const total = count.length

        roomsAndUserCount.push({room, total})
    })


    return roomsAndUserCount
}

module.exports = {
    getRoomsList
}