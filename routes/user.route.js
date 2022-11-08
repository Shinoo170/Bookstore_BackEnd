const express = require('express')
const router = express.Router()
const authJwt = require('../middleware/authJwt')

const controller  = require('../controllers/user.controller')

// Get cart
router.get('/cart', authJwt.verifyToken, controller.getCart)

// Add product to cart
router.put('/cart', authJwt.verifyToken, controller.addToCart)

// Delete product in cart
router.patch('/cart', authJwt.verifyToken, controller.deleteItem)

// Place order, create omise customer and charges
router.post('/placeOrder', authJwt.verifyToken, controller.placeOrder)

module.exports = router