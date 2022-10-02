const express = require('express')
const app = express()
const mongoUtil = require('./config/database')
const auth = require('./routes/auth.router')
const img = require('./routes/img.router')

app.use(express.json())
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Request-With, Content-Type, Accept, Authorization')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE')
    next()
})

// [ connect to database ]
mongoUtil.connectToServer(function(err, client){
    if (err) console.log(err);
})

app.get('/', (req, res) => {
    res.status(200).json({
        status: 200,
        message: "Server is running"
    })
})

app.get('/testAPI', (req,res) => {
    res.status(200).json({
        status: 200,
        website: "Bookstore backend",
        admin: "Shinoo",
        admin2: "Seres"
    })
})

// [ authorization system ]
app.use('/auth', auth)

module.exports = app;