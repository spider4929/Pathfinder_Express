require('dotenv').config()

const express = require('express')
const mongoose = require('mongoose')
const preferenceRoutes = require('./routes/preferences')
const userRoutes = require('./routes/user')
const reportRoutes = require('./routes/report')
const { getReport } = require('./controllers/reportController')

// Socket.IO
const http = require('http')
const socketIO = require('socket.io')
const { Server } = require('socket.io')

// express app
const app = express()
const server = http.createServer(app)
const io = new Server(server)

// middleware
app.use(express.json())

app.use((req, res, next) => {
    console.log(req.path, req.method)
    next()
})

// routes
app.use('/api/preferences', preferenceRoutes)
app.use('/api/user', userRoutes)
app.use('/api/report', reportRoutes)

// connect to db
mongoose.connect(process.env.MONGO_URI).then(() => {
    // Socket.IO event listener
    io.on('connection', (socket) => {
        console.log('A client connected.')

        socket.on('newReport', (reportData) => {
            // Handle the 'newReport' event
            console.log('Received new report:', reportData.source);
        
            // Broadcast the report data to all connected clients
            io.emit('reportUpdate', reportData);
          });

        socket.on('voteUpReport', (reportId) => {
            //handle the 'voteUpReport' event
            console.log('Upvoted report: ', reportId);

            //Broadcast the upvoted report to connected clients
            io.emit('reportCountUp', reportId);
        })
        socket.on('voteDownReport', (reportId) => {
            //handle the 'voteDownReport' event
            console.log('Downvoted report: ', reportId);

            //Broadcast the downvoted report to connected clients
            io.emit('reportCountDown', reportId);
        })
        socket.on('disconnect', () => {
            console.log('A client disconnected.')
        })
    })
    // listen for requests
    server.listen(process.env.PORT, ()  => {
        console.log('connected to db & listening on port', process.env.PORT)
    })
}).catch((error) => {
    console.log(error)
})