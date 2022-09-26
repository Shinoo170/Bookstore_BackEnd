const express = require('express')
const app = express()
const mongoUtil = require('./config/database')
const auth = require('./routes/auth.router')
const img = require('./router/img.router')
app.use(express.json())

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
// [ get && upload image ]
app.use('/img', img)

module.exports = app;