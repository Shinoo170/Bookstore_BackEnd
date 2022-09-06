const express = require('express')
const app = express()


app.use(express.json())

app.get('/', (req, res) => {
    res.status(200).json({
        status: 200,
        message: "Server is running"
    })
})

module.exports = app;