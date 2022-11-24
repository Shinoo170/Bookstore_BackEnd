const express = require('express')
const router = express.Router()

const authJwt = require('../middleware/authJwt')
const controller = require('../controllers/product.controller')

// Get all series
router.get('/allSeries', controller.getAllSeries)

// Get specific series details
router.get('/series/:seriesId', controller.getSeriesDetails)

// Get all product in series
router.get('/productInSeries', controller.getProductInSeries)

// Get specific product
router.get('/productDetail/:productURL', controller.getProduct)

router.get('/productDetailLessData/:productURL', controller.getProductLessData)

// Get latest series
router.get('/latestSeries', controller.getLatestSeries)

// Get latest product
router.get('/latestProduct', controller.getLatestProduct)

// Get most sold product
router.get('/mostSoldProduct', controller.getMostSoldProduct)

router.get('/genres', controller.getAllGenres)

// Get review
router.get('/review', controller.getReview)

// User add new review
router.post('/review', authJwt.verifyToken, controller.review)

// Delete review
router.delete('/review', authJwt.verifyToken, controller.deleteReview)

// Subscribe 
router.get('/subscribe', authJwt.verifyToken , controller.isUserSubscribe)
router.put('/subscribe', authJwt.verifyToken, controller.addSubscriber)
router.delete('/subscribe', authJwt.verifyToken, controller.removeSubscriber)

// wishlist
router.get('/wishlist', authJwt.verifyToken , controller.isUserWishlist)
router.put('/wishlist', authJwt.verifyToken, controller.addWishlist)
router.delete('/wishlist', authJwt.verifyToken, controller.removeWishlist)

module.exports = router