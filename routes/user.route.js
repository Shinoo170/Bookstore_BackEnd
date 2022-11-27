const express = require('express')
const router = express.Router()
const authJwt = require('../middleware/authJwt')

const controller  = require('../controllers/user.controller')

router.get('/', authJwt.verifyToken, controller.getUserData)

router.patch('/updateUserData', authJwt.verifyToken, controller.updateUserData)

router.patch('/updateUserProfile', authJwt.verifyToken, controller.updateUserProfile)

router.post('/createUserDataAddress', authJwt.verifyToken, controller.createUserDataAddress)

router.patch('/updateUserAddress', authJwt.verifyToken, controller.updateUserAddress)

router.patch('/deleteUserDataAddress', authJwt.verifyToken, controller.deleteUserDataAddress)

router.get('/getUserAddress', authJwt.verifyToken, controller.getUserAddress)

// Get cart
router.get('/cart', authJwt.verifyToken, controller.getCart)

// Add product to cart
router.put('/cart', authJwt.verifyToken, controller.addToCart)

// Delete product in cart
router.patch('/cart', authJwt.verifyToken, controller.deleteItem)

// Place order, create omise customer and charges
router.post('/placeOrder', authJwt.verifyToken, controller.placeOrder)

router.get('/getOrder', authJwt.verifyToken, controller.getOrder)

router.get('/getOrderDetails', authJwt.verifyToken, controller.getOrderDetails)

// subscribe and wishlists
router.get('/getSubscribes', authJwt.verifyToken, controller.getSubscribes)

router.get('/getWishlists', authJwt.verifyToken, controller.getWishlists)


module.exports = router