const express = require('express')
const app = express()
const cors = require('cors')

// [ import all routes ]
const mongoUtil = require('./config/database')
const auth = require('./routes/auth.router')

const corsOptions = {
    origin: '*',
    Credential: true
}

app.use(express.json())
app.use(cors(corsOptions))

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