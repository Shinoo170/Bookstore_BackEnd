const express = require('express')
const router = express.Router()
const verifySignUp = require('../middleware/verifySignUp')
const controller = require('../controllers/auth.controller')
const authJwt = require('../middleware/authJwt')

router.post('/signin', controller.signin)

router.post('/signup', verifySignUp.checkEmail, controller.signup )

router.post('/signout', async (req, res) => {
    res.status(200).send({ message: "Log out successfully "})
})

router.post('/test', authJwt.verifyToken, (req, res) => {
    res.status(200).send('Allow to access')
})

module.exports = router