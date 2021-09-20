const path = require('path')
const http = require('http')
const socketio = require('socket.io')
const Filter = require('bad-words')
const express = require('express')
require('./db/mongoose')

const { generateMSG, generateLocationMSG } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')
const { getRoomsList } = require('./utils/rooms')
const userRouter = require('./routers/user')


const port = process.env.PORT || 3000

const app = express()
const server = http.createServer(app)
const io = socketio(server)

//Define paths for Express configs
const basePath = path.join(__dirname, '../public')
//seting base path (top priority is given to the static files from public folder for root)
app.use(express.static(basePath))

app.use(express.json()) // to recognise incoming request Object as a JSon Object

app.use(userRouter) // Call in User Router


io.on('connection', (socket) => {
    console.log('New WebSocket Connection!')
    let currentuser

    socket.on('chatRoom', ({ chatWith, currentroom }, callback) => { 
        console.log('startchat', chatWith)
        const { user,users, roomtouse, error } = addUser({ id: socket.id, chatWith, currentroom }) 
        if(error){
            return callback(error)
        }
        socket.join(roomtouse.currentroom)
        //console.log(roomUsers, 'pppp')
        //console.log(users, 'users')
        //console.log(roomtouse.currentroom, 'roomtouse')
        socket.emit('welcomeMessage', generateMSG(user.chatWith, `Welcome To Chat App`)) //emit to current connection
        socket.broadcast.to(roomtouse.currentroom).emit('sendToChat', generateMSG(user.chatInitiator, `${user.chatInitiator} Has Joined`)) //emit to all connection except current

        callback()
    })

    socket.on('sendToChat', ({msg, currentuser}, callback) => {
        currentuser = currentuser
        const user = getUser(currentuser) 
        // console.log(msg,'msg')
        // console.log(user)
        const filter = new Filter()
        if(filter.isProfane(msg)){
            return callback('Profanity is not allowed')
        }
        io.to(user.roomtouse.currentroom).emit('sendToChat', generateMSG(user.chatInitiator, msg)) //emit to all connection
        callback()
    })

    socket.on('sendLocation', (data, callback) => { 
        const user = getUser(data.currentuser)
        io.to(user.roomtouse.currentroom).emit('locationMessage', generateLocationMSG(user.chatInitiator, `http://maps.google.com/maps?q=${data.latitude},${data.longitude}`))
        callback()
    })

    socket.on('sendImage', (data) => {
        const user = getUser(data.currentuser)
        io.to(user.roomtouse.currentroom).emit('imageMessage', generateMSG(user.chatInitiator, data.base64data))
    })

    socket.on('disconnect', () => { //event on current connection gets disconnected
        console.log('dis')
        const user = removeUser(currentuser)
        if(user){
            socket.broadcast.to(user.roomtouse.currentroom).emit('sendToChat', generateMSG(`${user.chatInitiator} has left!`))
        }
    })
})



server.listen(port, () => {
    console.log('Server is started on port ' + port)
})
