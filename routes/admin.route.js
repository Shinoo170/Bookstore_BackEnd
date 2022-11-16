const express = require('express')
const router = express.Router()

const middleware = require('../middleware/adminProcess')
const jwt_middleware = require('../middleware/authJwt')
const controller = require('../controllers/adminRoute.controller')
// jwt_middleware.adminVerify

router.post('/addProduct', middleware.checkProduct, controller.addProduct )

router.post('/addSeries', middleware.checkSeries, controller.addSeries )

router.get('/reCalculateCos', controller.reCalculateCos)

router.post('/addGenres', controller.addGenres)

module.exports = router