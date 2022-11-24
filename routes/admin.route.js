const express = require('express')
const router = express.Router()

const middleware = require('../middleware/adminProcess')
const jwt_middleware = require('../middleware/authJwt')
const controller = require('../controllers/adminRoute.controller')
// jwt_middleware.adminVerify

router.post('/addProduct', [jwt_middleware.isAdmin, middleware.checkProduct], controller.addProduct )

router.patch('/product', [jwt_middleware.isAdmin, middleware.checkProductNameChange], controller.changeProductData)

router.post('/addSeries', [jwt_middleware.isAdmin, middleware.checkSeries], controller.addSeries )

router.patch('/series', [jwt_middleware.isAdmin, middleware.checkSeriesNameChange], controller.changeSeriesData)

router.get('/reCalculateCos', jwt_middleware.isAdmin, controller.reCalculateCos)

router.get('/getOrders', jwt_middleware.isAdmin, controller.getOrders)

router.get('/getAllOrders', jwt_middleware.isAdmin, controller.getAllOrders)

router.get('/getPaidOrder', jwt_middleware.isAdmin, controller.getPaidOrder)

router.patch('/updateOrder', jwt_middleware.isAdmin, controller.updateOrder)

router.get('/getOrderDetails', jwt_middleware.isAdmin, controller.getOrderDetails)

router.post('/addGenres', jwt_middleware.isAdmin, controller.addGenres)

module.exports = router