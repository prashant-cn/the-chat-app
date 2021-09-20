const path = require('path')
const http = require('http')
const socketio = require('socket.io')
const express = require('express')
require('./db/mongoose')
const userRouter = require('./routers/user')
const taskRouter = require('./routers/task')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

//Define paths for Express configs
const basePath = path.join(__dirname, '../public')
//seting base path (top priority is given to the static files from public folder for root)
app.use(express.static(basePath))

app.use(express.json()) // to recognise incoming request Object as a JSon Object

app.use(userRouter) // Call in User Router
app.use(taskRouter) // call in Task Router


module.exports = app