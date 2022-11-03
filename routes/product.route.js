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

// Get latest series
router.get('/latestSeries', controller.getLatestSeries)

// Get latest product
router.get('/latestProduct', controller.getLatestProduct)

router.get('/genres', controller.getAllGenres)

module.exports = router