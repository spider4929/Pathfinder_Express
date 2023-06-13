require('dotenv').config()

const express = require('express')
const mongoose = require('mongoose')
const preferenceRoutes = require('./routes/preferences')
const userRoutes = require('./routes/user')
const reportRoutes = require('./routes/report')
const { initializeSocketIO } = require('./controllers/reportController')

// express app
const app = express()

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
    // listen for requests
    const server = app.listen(process.env.PORT, ()  => {
        console.log('connected to db & listening on port', process.env.PORT)
    })

    // Initialize Socket.IO
    initializeSocketIO(server)
}).catch((error) => {
    console.log(error)
})