const express = require('express')
const app = express()
const mongoUtil = require('./config/database')
const auth = require('./routes/auth.router')

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

// [ authorization system ]
app.use('/auth', auth)


module.exports = app;