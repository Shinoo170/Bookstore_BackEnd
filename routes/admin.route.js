const express = require('express')
const router = express.Router()

const middleware = require('../middleware/adminProcess')
const jwt_middleware = require('../middleware/authJwt')
const controller = require('../controllers/adminRoute.controller')
// jwt_middleware.adminVerify
router.post('/addProduct', controller.addProduct )

router.post('/addSeries', controller.addSeries )

router.post('/reCalculateCos', controller.reCalculateCos)

module.exports = router