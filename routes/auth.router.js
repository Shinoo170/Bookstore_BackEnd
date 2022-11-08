const express = require('express')
const router = express.Router()
const verify = require('../middleware/userVerify')
const controller = require('../controllers/auth.controller')
const authJwt = require('../middleware/authJwt')

router.post('/signIn', controller.signIn)

router.post('/signup', verify.checkEmail, controller.signup )

router.post('/test', authJwt.verifyToken, (req, res) => {
    res.status(200).send('Allow to access')
})

module.exports = router