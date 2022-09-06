const express = require('express')
const app = express()


app.use(express.json())

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

module.exports = app;