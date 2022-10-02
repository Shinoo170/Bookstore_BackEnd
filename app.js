const express = require('express')
const app = express()
const mongoUtil = require('./config/database')
const auth = require('./routes/auth.router')

app.use(express.json())
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Request-With, Content-Type, Accept, Authorization')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE')
    next()
})

const corsOptions = {
    origin: '*',
    Credential: true
}
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